# Gemini Live API "Jarvis Mode" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real-time bidirectional voice conversation between VOX and the user via Gemini Live API, with function calling to recommend tools, generate apps, and control the Studio UI.

**Architecture:** Browser captures mic audio via WebAudio API, sends PCM chunks over a WebSocket to FastAPI, which proxies them to Gemini Live API. Gemini responses (audio + function calls) flow back through the same path. Six server-side function tools let VOX take actions: recommend tools, generate apps, add tools, navigate UI, check project status, and search the tool catalog.

**Tech Stack:** google-genai (Gemini Live API), FastAPI WebSocket, WebAudio API (MediaRecorder + AudioContext), React context + hooks

---

### Task 1: Backend — VoxLiveSession (Gemini Live API wrapper)

**Context:** This is the core backend service that manages a single Gemini Live API session. It handles connection, audio relay, function call interception, and session lifecycle. All other backend components depend on this.

**Files:**
- Create: `server/services/vox_session.py`

**Step 1: Create the VoxLiveSession class**

```python
"""Gemini Live API session wrapper — manages one bidirectional voice session.

Connects to Gemini Live API, relays audio bidirectionally, intercepts
function calls and dispatches them to vox_tools.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from typing import Any, AsyncIterator, Callable, Awaitable

from google import genai
from google.genai import types

log = logging.getLogger("aus.vox.session")

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"

# Theme → Gemini voice mapping
THEME_VOICES: dict[str, str] = {
    "expert": "Orus",
    "sharp": "Fenrir",
    "warm": "Aoede",
    "casual": "Kore",
    "future": "Puck",
    "minimal": "Zephyr",
    "retro": "Charon",
    "creative": "Leda",
}

VOX_SYSTEM_INSTRUCTION = """You are VOX, the AI creative partner in Vox Code Studio. You help users build web applications through natural conversation.

Your personality:
- Confident but collaborative ("Not AI, Us" — A(Us) philosophy)
- Concise — prefer short, punchy responses over long explanations
- Action-oriented — use your tools proactively when relevant

Available actions:
- Recommend tools from our 158-tool registry across 8 domains
- Start app generation from a natural language description
- Add specific tools/libraries to an existing project
- Navigate the Studio UI
- Check project status
- Search for tools by name, domain, or keyword

Current theme: {theme}
"""


def _build_tool_declarations() -> list[dict[str, Any]]:
    """Build the 6 function declarations for Gemini Live API."""
    return [
        {
            "name": "recommend_tools",
            "description": "Get AI-powered tool recommendations based on the current project context. Returns a list of tool IDs with reasons and priorities.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_summary": {
                        "type": "string",
                        "description": "Brief description of what the project does",
                    },
                },
                "required": ["project_summary"],
            },
        },
        {
            "name": "generate_app",
            "description": "Start generating a full-stack web application from a natural language description. This triggers the A(Us) pipeline which creates React + FastAPI code.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "Natural language description of the app to build",
                    },
                },
                "required": ["prompt"],
            },
        },
        {
            "name": "add_tool",
            "description": "Add a specific tool or library to the current project by its ID. Triggers code generation to integrate the tool.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {
                    "tool_id": {
                        "type": "string",
                        "description": "The tool ID to add (e.g. 'langchain-js', 'd3-js', 'redis')",
                    },
                },
                "required": ["tool_id"],
            },
        },
        {
            "name": "navigate_ui",
            "description": "Navigate the Studio UI to a specific page or panel.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {
                    "target": {
                        "type": "string",
                        "enum": ["welcome", "studio", "settings", "files", "preview", "chat"],
                        "description": "The UI target to navigate to",
                    },
                },
                "required": ["target"],
            },
        },
        {
            "name": "get_project_status",
            "description": "Get the current project state including file count, dependencies, and generation status.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
        {
            "name": "search_tools",
            "description": "Search the 158-tool registry by keyword or domain. Returns matching tool names and descriptions.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query (tool name, keyword, or technology)",
                    },
                    "domain": {
                        "type": "string",
                        "enum": ["general", "saas", "ai-ml", "music", "gaming", "productivity", "social", "ecommerce", "data-viz", "web-dev", "documentation", "animations", "visuals"],
                        "description": "Optional domain filter",
                    },
                },
                "required": ["query"],
            },
        },
    ]


class VoxLiveSession:
    """Manages a single Gemini Live API session with bidirectional audio."""

    def __init__(
        self,
        theme: str = "expert",
        on_audio: Callable[[bytes], Awaitable[None]] | None = None,
        on_transcript: Callable[[str, str], Awaitable[None]] | None = None,
        on_tool_call: Callable[[str, dict], Awaitable[dict]] | None = None,
        on_control: Callable[[dict], Awaitable[None]] | None = None,
    ) -> None:
        self.theme = theme
        self._on_audio = on_audio
        self._on_transcript = on_transcript
        self._on_tool_call = on_tool_call
        self._on_control = on_control
        self._session: Any = None
        self._client: genai.Client | None = None
        self._receive_task: asyncio.Task | None = None
        self._connected = False
        self._resume_handle: str | None = None

    @property
    def connected(self) -> bool:
        return self._connected

    async def connect(self) -> None:
        """Open a Gemini Live API session."""
        if not GEMINI_KEY:
            raise RuntimeError("GEMINI_API_KEY not set")

        self._client = genai.Client(api_key=GEMINI_KEY)
        voice_name = THEME_VOICES.get(self.theme, "Kore")

        system_text = VOX_SYSTEM_INSTRUCTION.format(theme=self.theme)
        tool_decls = _build_tool_declarations()

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(
                parts=[types.Part(text=system_text)]
            ),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name,
                    )
                )
            ),
            tools=[{"function_declarations": tool_decls}],
            context_window_compression=types.ContextWindowCompressionConfig(
                sliding_window=types.SlidingWindow(),
            ),
        )

        # Add resume handle if reconnecting
        if self._resume_handle:
            config.session_resumption = types.SessionResumptionConfig(
                handle=self._resume_handle,
            )

        self._session = await self._client.aio.live.connect(
            model=LIVE_MODEL, config=config
        )
        self._connected = True
        self._receive_task = asyncio.create_task(self._receive_loop())
        log.info("VOX Live session connected (voice=%s)", voice_name)

    async def disconnect(self) -> None:
        """Close the Gemini Live API session."""
        self._connected = False
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
            self._receive_task = None
        if self._session:
            try:
                self._session.close()
            except Exception:
                pass
            self._session = None
        log.info("VOX Live session disconnected")

    async def send_audio(self, pcm_data: bytes) -> None:
        """Send PCM audio from the user's microphone to Gemini."""
        if not self._session or not self._connected:
            return
        try:
            encoded = base64.b64encode(pcm_data).decode("ascii")
            await self._session.send_realtime_input(
                audio=types.Blob(data=encoded, mime_type="audio/pcm;rate=16000")
            )
        except Exception:
            log.exception("Failed to send audio to Gemini")

    async def send_text(self, text: str) -> None:
        """Send a text message to Gemini (for text-based interaction)."""
        if not self._session or not self._connected:
            return
        await self._session.send_client_content(
            turns=types.Content(
                role="user", parts=[types.Part(text=text)]
            )
        )

    async def _receive_loop(self) -> None:
        """Background task: receive messages from Gemini and dispatch."""
        try:
            async for response in self._session.receive():
                # Audio data
                if response.data is not None:
                    if self._on_audio:
                        await self._on_audio(response.data)

                # Function calls
                if response.tool_call:
                    await self._handle_tool_calls(response.tool_call)

                # Transcript (text content from model)
                if response.server_content:
                    model_turn = response.server_content.model_turn
                    if model_turn:
                        for part in model_turn.parts:
                            if part.text and self._on_transcript:
                                await self._on_transcript("vox", part.text)

                    # Turn complete
                    if response.server_content.turn_complete:
                        if self._on_control:
                            await self._on_control({"type": "turn_complete"})

                # Session resumption updates
                if response.session_resumption_update:
                    update = response.session_resumption_update
                    if update.resumable and update.new_handle:
                        self._resume_handle = update.new_handle

                # GoAway — session ending soon
                if response.go_away is not None:
                    log.warning("Gemini GoAway: %s", response.go_away.time_left)
                    if self._on_control:
                        await self._on_control({
                            "type": "go_away",
                            "time_left": str(response.go_away.time_left),
                        })

        except asyncio.CancelledError:
            pass
        except Exception:
            log.exception("VOX receive loop error")
            if self._on_control:
                await self._on_control({"type": "error", "message": "Session lost"})
        finally:
            self._connected = False

    async def _handle_tool_calls(self, tool_call: Any) -> None:
        """Dispatch function calls from Gemini to the tool handler."""
        function_responses = []
        for fc in tool_call.function_calls:
            log.info("VOX tool_call: %s(%s)", fc.name, fc.args)

            if self._on_control:
                await self._on_control({
                    "type": "tool_call",
                    "name": fc.name,
                    "args": dict(fc.args) if fc.args else {},
                })

            result = {"result": "not_implemented"}
            if self._on_tool_call:
                try:
                    result = await self._on_tool_call(fc.name, dict(fc.args) if fc.args else {})
                except Exception:
                    log.exception("Tool call failed: %s", fc.name)
                    result = {"error": f"Tool {fc.name} failed"}

            # Determine scheduling based on tool
            scheduling = "WHEN_IDLE"
            if fc.name == "navigate_ui":
                scheduling = "SILENT"

            function_responses.append(
                types.FunctionResponse(
                    id=fc.id,
                    name=fc.name,
                    response={**result, "scheduling": scheduling},
                )
            )

            if self._on_control:
                await self._on_control({
                    "type": "tool_result",
                    "name": fc.name,
                    "data": result,
                })

        await self._session.send_tool_response(
            function_responses=function_responses
        )
```

**Step 2: Verify the file was created correctly**

Run: `python3 -c "import ast; ast.parse(open('server/services/vox_session.py').read()); print('OK')"` from the project root.
Expected: `OK`

**Step 3: Commit**

```bash
git add server/services/vox_session.py
git commit -m "feat: add VoxLiveSession — Gemini Live API wrapper with audio relay + function calling"
```

---

### Task 2: Backend — Function Call Dispatcher (vox_tools.py)

**Context:** This module implements the 6 VOX function tools. When Gemini calls a function, VoxLiveSession dispatches to these handlers. They reuse existing server logic (recommendation engine, SDK pipeline, tool catalog).

**Files:**
- Create: `server/services/vox_tools.py`
- Create: `server/tool_catalog.json` (generated from frontend registry)

**Step 1: Create the dispatcher module**

```python
"""VOX function call dispatcher — implements the 6 tools VOX can invoke.

Each function receives args from Gemini and returns a dict result.
Results are sent back to Gemini as FunctionResponse.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any

log = logging.getLogger("aus.vox.tools")

# Tool catalog is loaded from a JSON snapshot (generated from frontend registry)
# This avoids importing TypeScript. We maintain a Python-side catalog.
TOOL_CATALOG: list[dict[str, Any]] = []
_catalog_loaded = False


def _ensure_catalog() -> None:
    """Load the tool catalog from the JSON snapshot on first use."""
    global _catalog_loaded, TOOL_CATALOG
    if _catalog_loaded:
        return
    catalog_path = os.path.join(
        os.path.dirname(__file__), "..", "tool_catalog.json"
    )
    try:
        with open(catalog_path) as f:
            TOOL_CATALOG = json.load(f)
        _catalog_loaded = True
        log.info("Loaded %d tools from catalog", len(TOOL_CATALOG))
    except FileNotFoundError:
        log.warning("tool_catalog.json not found — search_tools will return empty")
        _catalog_loaded = True


class VoxToolDispatcher:
    """Dispatches VOX function calls to their implementations."""

    def __init__(
        self,
        gemini_key: str = "",
        studio: Any = None,
        project_getter: Any = None,
        ui_action_sender: Any = None,
    ) -> None:
        self._gemini_key = gemini_key or os.environ.get("GEMINI_API_KEY", "")
        self._studio = studio
        self._get_project = project_getter
        self._send_ui_action = ui_action_sender

    async def dispatch(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        """Route a function call to the right handler."""
        handler = getattr(self, f"_tool_{name}", None)
        if not handler:
            return {"error": f"Unknown tool: {name}"}
        return await handler(args)

    async def _tool_recommend_tools(self, args: dict[str, Any]) -> dict[str, Any]:
        """Get AI-powered tool recommendations."""
        summary = args.get("project_summary", "")
        if not self._gemini_key:
            return {"recommendations": [], "error": "No API key"}

        try:
            from google import genai

            client = genai.Client(api_key=self._gemini_key)

            _ensure_catalog()
            tool_names = [t["id"] for t in TOOL_CATALOG[:50]]
            prompt = (
                f"You are an expert developer tool recommender. "
                f"Given this project: {summary}\n"
                f"Recommend 3-5 tools from: {', '.join(tool_names)}\n"
                f"Return JSON array: [{{\"toolId\": \"...\", \"reason\": \"...\"}}]"
            )

            raw = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model="gemini-2.0-flash", contents=prompt,
                ),
                timeout=5.0,
            )
            text = (raw.text or "").strip()
            # Strip markdown fences
            if text.startswith("```"):
                text = text[text.index("\n") + 1:]
            if text.endswith("```"):
                text = text[:-3].strip()

            recs = json.loads(text) if text else []
            return {"recommendations": recs[:5]}

        except Exception as e:
            log.exception("recommend_tools failed")
            return {"recommendations": [], "error": str(e)}

    async def _tool_generate_app(self, args: dict[str, Any]) -> dict[str, Any]:
        """Trigger app generation via the SDK pipeline."""
        prompt = args.get("prompt", "")
        if not prompt:
            return {"error": "No prompt provided"}
        if not self._studio:
            return {"error": "Studio not available"}

        # Fire-and-forget: generation runs in background, results flow via SSE
        # We notify the frontend to watch the studio stream
        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "generate",
                "prompt": prompt,
            })

        return {"status": "generation_started", "prompt": prompt}

    async def _tool_add_tool(self, args: dict[str, Any]) -> dict[str, Any]:
        """Add a tool to the current project."""
        tool_id = args.get("tool_id", "")
        if not tool_id:
            return {"error": "No tool_id provided"}

        _ensure_catalog()
        tool = next((t for t in TOOL_CATALOG if t["id"] == tool_id), None)
        if not tool:
            return {"error": f"Tool '{tool_id}' not found in catalog"}

        # Send UI action to trigger tool integration
        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "add_tool",
                "tool_id": tool_id,
                "tool_name": tool.get("name", tool_id),
                "integration_prompt": tool.get("integrationPrompt", ""),
            })

        return {
            "status": "tool_added",
            "tool_id": tool_id,
            "tool_name": tool.get("name", tool_id),
        }

    async def _tool_navigate_ui(self, args: dict[str, Any]) -> dict[str, Any]:
        """Navigate the Studio UI."""
        target = args.get("target", "studio")
        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "navigate",
                "target": target,
            })
        return {"status": "navigated", "target": target}

    async def _tool_get_project_status(self, args: dict[str, Any]) -> dict[str, Any]:
        """Get current project state."""
        if not self._get_project:
            return {"status": "no_project", "files": 0}

        project = self._get_project()
        if not project:
            return {"status": "no_project", "files": 0}

        return {
            "status": "active",
            "name": project.get("name", "Untitled"),
            "files": len(project.get("files", [])),
            "stack": project.get("stack", "unknown"),
            "frontend_deps": list(project.get("frontend_deps", {}).keys()),
            "backend_deps": list(project.get("backend_deps", {}).keys()),
        }

    async def _tool_search_tools(self, args: dict[str, Any]) -> dict[str, Any]:
        """Search the tool catalog."""
        query = args.get("query", "").lower()
        domain = args.get("domain", "")

        _ensure_catalog()

        results = TOOL_CATALOG
        if domain:
            results = [t for t in results if domain in t.get("domains", [])]
        if query:
            results = [
                t for t in results
                if query in t.get("id", "").lower()
                or query in t.get("name", "").lower()
                or query in t.get("description", "").lower()
            ]

        # Return top 10
        return {
            "tools": [
                {
                    "id": t["id"],
                    "name": t["name"],
                    "description": t["description"][:100],
                    "category": t.get("category", "library"),
                    "domains": t.get("domains", []),
                }
                for t in results[:10]
            ],
            "total": len(results),
        }
```

**Step 2: Generate the tool_catalog.json snapshot**

This step creates a JSON snapshot of the frontend tool registry so Python can search it without importing TypeScript. Run from the `frontend/` directory:

```bash
cd frontend && node -e "
const fs = require('fs');
const path = require('path');

function extractTools(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tools = [];
  const regex = /id:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)',\s*\n\s*description:\s*\n?\s*'([^']+)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    tools.push({ id: m[1], name: m[2], description: m[3].slice(0, 200) });
  }
  return tools;
}

const toolFiles = [
  'src/tools/expert.ts',
  ...fs.readdirSync('src/tools/domains').map(f => path.join('src/tools/domains', f)),
];

const allTools = [];
for (const file of toolFiles) {
  if (file.endsWith('.ts')) {
    const extracted = extractTools(file);
    allTools.push(...extracted);
  }
}

const unique = [...new Map(allTools.map(t => [t.id, t])).values()];
fs.writeFileSync('../server/tool_catalog.json', JSON.stringify(unique, null, 2));
console.log('Extracted ' + unique.length + ' tools to server/tool_catalog.json');
"
```

If the regex extraction misses tools, create a minimal placeholder with the tool IDs:

```bash
cd frontend && node -e "
const fs = require('fs');
const path = require('path');

const toolFiles = [
  'src/tools/expert.ts',
  ...fs.readdirSync('src/tools/domains').map(f => path.join('src/tools/domains', f)),
];

const idRegex = /id:\s*'([^']+)'/g;
const ids = new Set();
for (const file of toolFiles) {
  if (!file.endsWith('.ts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = idRegex.exec(content)) !== null) ids.add(m[1]);
}

const tools = [...ids].map(id => ({ id, name: id, description: id, domains: [], category: 'library' }));
fs.writeFileSync('../server/tool_catalog.json', JSON.stringify(tools, null, 2));
console.log('Extracted ' + tools.length + ' tool IDs to server/tool_catalog.json');
"
```

**Step 3: Verify**

Run from the project root:
```bash
python3 -c "import ast; ast.parse(open('server/services/vox_tools.py').read()); print('OK')"
```
Expected: `OK`

Run from the project root:
```bash
python3 -c "import json; data=json.load(open('server/tool_catalog.json')); print(str(len(data)) + ' tools loaded')"
```
Expected: Approximately 158 tools loaded

**Step 4: Commit**

```bash
git add server/services/vox_tools.py server/tool_catalog.json
git commit -m "feat: add VoxToolDispatcher — 6 function tools for VOX voice assistant"
```

---

### Task 3: Backend — WebSocket Endpoint (/api/vox/live)

**Context:** This is the FastAPI WebSocket endpoint that bridges the browser and the Gemini Live API. It accepts binary audio frames and JSON control frames from the frontend, creates a VoxLiveSession, and relays everything bidirectionally.

**Files:**
- Create: `server/routers/vox_live.py`
- Modify: `server/app.py:21-24` (add router import)
- Modify: `server/app.py:70-73` (register router)

**Step 1: Create the WebSocket router**

```python
"""VOX Live — WebSocket endpoint for real-time voice conversation.

Protocol:
  Binary frames: Raw PCM audio (16-bit, 16kHz mono from client; 24kHz from server)
  Text frames:   JSON control messages

Client -> Server JSON:
  {"type": "start", "theme": "expert"}
  {"type": "text", "content": "hello"}
  {"type": "mute", "muted": true}
  {"type": "end"}

Server -> Client JSON:
  {"type": "ready", "sessionId": "..."}
  {"type": "transcript", "role": "user"|"vox", "text": "..."}
  {"type": "tool_call", "name": "...", "args": {...}}
  {"type": "tool_result", "name": "...", "data": {...}}
  {"type": "ui_action", "action": "...", ...}
  {"type": "error", "message": "..."}
  {"type": "session_end", "reason": "..."}
"""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from server.services.vox_session import VoxLiveSession
from server.services.vox_tools import VoxToolDispatcher

router = APIRouter(tags=["vox-live"])
log = logging.getLogger("aus.vox.live")


@router.websocket("/api/vox/live")
async def vox_live_ws(ws: WebSocket):
    """Bidirectional voice WebSocket — bridges browser and Gemini Live API."""
    await ws.accept()
    session_id = str(uuid.uuid4())[:8]
    log.info("[%s] VOX Live WebSocket connected", session_id)

    session: VoxLiveSession | None = None
    muted = False

    async def on_audio(data: bytes) -> None:
        """Relay Gemini audio back to the browser."""
        try:
            await ws.send_bytes(data)
        except Exception:
            pass

    async def on_transcript(role: str, text: str) -> None:
        """Send transcript updates to the browser."""
        try:
            await ws.send_text(json.dumps({
                "type": "transcript", "role": role, "text": text,
            }))
        except Exception:
            pass

    async def on_tool_call(name: str, args: dict) -> dict:
        """Dispatch tool call and return result."""
        return await dispatcher.dispatch(name, args)

    async def on_control(msg: dict) -> None:
        """Forward control messages to the browser."""
        try:
            await ws.send_text(json.dumps(msg))
        except Exception:
            pass

    # Project getter: returns current project state from app
    def get_project():
        return getattr(ws.app.state, "current_project", None)

    dispatcher = VoxToolDispatcher(
        studio=getattr(ws.app.state, "studio", None),
        project_getter=get_project,
        ui_action_sender=on_control,
    )

    try:
        while True:
            message = await ws.receive()

            # Binary frame = PCM audio from microphone
            if "bytes" in message and message["bytes"]:
                if session and session.connected and not muted:
                    await session.send_audio(message["bytes"])

            # Text frame = JSON control message
            elif "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue

                msg_type = data.get("type", "")

                if msg_type == "start":
                    theme = data.get("theme", "expert")
                    session = VoxLiveSession(
                        theme=theme,
                        on_audio=on_audio,
                        on_transcript=on_transcript,
                        on_tool_call=on_tool_call,
                        on_control=on_control,
                    )
                    await session.connect()
                    await ws.send_text(json.dumps({
                        "type": "ready", "sessionId": session_id,
                    }))

                elif msg_type == "text" and session:
                    text = data.get("content", "")
                    if text:
                        await session.send_text(text)

                elif msg_type == "mute":
                    muted = data.get("muted", False)

                elif msg_type == "end":
                    if session:
                        await session.disconnect()
                    await ws.send_text(json.dumps({
                        "type": "session_end", "reason": "user",
                    }))
                    break

    except WebSocketDisconnect:
        log.info("[%s] VOX Live WebSocket disconnected", session_id)
    except Exception:
        log.exception("[%s] VOX Live WebSocket error", session_id)
    finally:
        if session:
            await session.disconnect()
        log.info("[%s] VOX Live session cleaned up", session_id)
```

**Step 2: Register the router in app.py**

Add this import at `server/app.py` after line 24 (the synthesize_router import):

```python
from server.routers.vox_live import router as vox_live_router
```

Add this line after the existing `app.include_router(synthesize_router)` call (around line 73):

```python
app.include_router(vox_live_router)
```

**Step 3: Verify**

Run from the project root:
```bash
python3 -c "import ast; ast.parse(open('server/routers/vox_live.py').read()); print('OK')"
```
Expected: `OK`

**Step 4: Commit**

```bash
git add server/routers/vox_live.py server/app.py
git commit -m "feat: add /api/vox/live WebSocket endpoint — bridges browser to Gemini Live API"
```

---

### Task 4: Frontend — VoxLiveContext (WebSocket + audio capture/playback)

**Context:** This React context manages the WebSocket connection to the backend and handles all audio I/O using the WebAudio API. It captures microphone audio as PCM 16-bit 16kHz, sends it to the server, and plays back Gemini's 24kHz PCM audio responses.

**Files:**
- Create: `frontend/src/context/VoxLiveContext.tsx`

**Step 1: Create the VoxLiveContext**

```tsx
/**
 * VoxLiveContext — manages Gemini Live API session via backend WebSocket.
 *
 * Handles: WebSocket lifecycle, mic capture (PCM 16-bit 16kHz),
 * audio playback (PCM 24kHz), transcript buffer, tool call events.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'

export interface TranscriptEntry {
  role: 'user' | 'vox'
  text: string
  timestamp: number
}

export interface ToolAction {
  type: 'tool_call' | 'tool_result' | 'ui_action'
  name: string
  args?: Record<string, unknown>
  data?: Record<string, unknown>
  timestamp: number
}

interface VoxLiveState {
  isConnected: boolean
  isVoxSpeaking: boolean
  isMuted: boolean
  transcript: TranscriptEntry[]
  lastToolAction: ToolAction | null
  error: string | null
}

interface VoxLiveContextType extends VoxLiveState {
  startSession: (theme?: string) => Promise<void>
  endSession: () => void
  toggleMute: () => void
  sendText: (text: string) => void
}

const VoxLiveContext = createContext<VoxLiveContextType | null>(null)

export function useVoxLive(): VoxLiveContextType {
  const ctx = useContext(VoxLiveContext)
  if (!ctx) throw new Error('useVoxLive must be used within VoxLiveProvider')
  return ctx
}

// Audio playback: queue PCM chunks and play them sequentially
class AudioPlayer {
  private ctx: AudioContext | null = null
  private queue: ArrayBuffer[] = []
  private playing = false
  onSpeakingChange?: (speaking: boolean) => void

  async play(pcmData: ArrayBuffer): Promise<void> {
    this.queue.push(pcmData)
    if (!this.playing) this.drain()
  }

  private async drain(): Promise<void> {
    if (!this.queue.length) {
      this.playing = false
      this.onSpeakingChange?.(false)
      return
    }

    this.playing = true
    this.onSpeakingChange?.(true)

    if (!this.ctx) this.ctx = new AudioContext({ sampleRate: 24000 })

    const chunk = this.queue.shift()!
    const int16 = new Int16Array(chunk)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }

    const buffer = this.ctx.createBuffer(1, float32.length, 24000)
    buffer.getChannelData(0).set(float32)

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.ctx.destination)

    return new Promise<void>((resolve) => {
      source.onended = () => {
        resolve()
        this.drain()
      }
      source.start()
    })
  }

  stop(): void {
    this.queue = []
    this.playing = false
    this.onSpeakingChange?.(false)
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

export const VoxLiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<VoxLiveState>({
    isConnected: false,
    isVoxSpeaking: false,
    isMuted: false,
    transcript: [],
    lastToolAction: null,
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const playerRef = useRef<AudioPlayer>(new AudioPlayer())
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const mutedRef = useRef(false)

  // Keep mutedRef in sync
  useEffect(() => { mutedRef.current = state.isMuted }, [state.isMuted])

  // Audio playback speaking callback
  useEffect(() => {
    playerRef.current.onSpeakingChange = (speaking) => {
      setState((prev) => ({ ...prev, isVoxSpeaking: speaking }))
    }
  }, [])

  const stopMic = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null
    micCtxRef.current?.close().catch(() => {})
    micCtxRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
    })
    streamRef.current = stream

    const ctx = new AudioContext({ sampleRate: 16000 })
    micCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)

    // ScriptProcessorNode for raw PCM access
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      if (mutedRef.current) return

      const float32 = e.inputBuffer.getChannelData(0)
      const int16 = new Int16Array(float32.length)
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      wsRef.current.send(int16.buffer)
    }

    source.connect(processor)
    processor.connect(ctx.destination)
  }, [])

  const startSession = useCallback(async (theme = 'expert') => {
    setState((prev) => ({ ...prev, error: null, transcript: [], lastToolAction: null }))

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/vox/live`)
    wsRef.current = ws

    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'start', theme }))
    }

    ws.onmessage = (event: MessageEvent) => {
      // Binary = audio from VOX
      if (event.data instanceof ArrayBuffer) {
        playerRef.current.play(event.data)
        return
      }

      // Text = JSON control
      try {
        const msg = JSON.parse(event.data as string)
        switch (msg.type) {
          case 'ready':
            setState((prev) => ({ ...prev, isConnected: true }))
            startMic()
            break

          case 'transcript':
            setState((prev) => ({
              ...prev,
              transcript: [
                ...prev.transcript,
                { role: msg.role, text: msg.text, timestamp: Date.now() },
              ],
            }))
            break

          case 'tool_call':
          case 'tool_result':
          case 'ui_action':
            setState((prev) => ({
              ...prev,
              lastToolAction: {
                type: msg.type,
                name: msg.name || msg.action || '',
                args: msg.args,
                data: msg.data || msg,
                timestamp: Date.now(),
              },
            }))
            break

          case 'error':
            setState((prev) => ({ ...prev, error: msg.message }))
            break

          case 'session_end':
            setState((prev) => ({ ...prev, isConnected: false }))
            stopMic()
            break
        }
      } catch {
        // ignore malformed
      }
    }

    ws.onerror = () => {
      setState((prev) => ({ ...prev, error: 'WebSocket connection failed', isConnected: false }))
    }

    ws.onclose = () => {
      setState((prev) => ({ ...prev, isConnected: false }))
      stopMic()
    }
  }, [startMic, stopMic])

  const endSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }))
    }
    wsRef.current?.close()
    wsRef.current = null
    playerRef.current.stop()
    stopMic()
    setState((prev) => ({ ...prev, isConnected: false, isVoxSpeaking: false }))
  }, [stopMic])

  const toggleMute = useCallback(() => {
    setState((prev) => {
      const muted = !prev.isMuted
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mute', muted }))
      }
      return { ...prev, isMuted: muted }
    })
  }, [])

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', content: text }))
      setState((prev) => ({
        ...prev,
        transcript: [
          ...prev.transcript,
          { role: 'user', text, timestamp: Date.now() },
        ],
      }))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close()
      playerRef.current.stop()
      stopMic()
    }
  }, [stopMic])

  return (
    <VoxLiveContext.Provider
      value={{ ...state, startSession, endSession, toggleMute, sendText }}
    >
      {children}
    </VoxLiveContext.Provider>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit 2>&1 | head -20`
Expected: No errors related to VoxLiveContext.tsx

**Step 3: Commit**

```bash
git add frontend/src/context/VoxLiveContext.tsx
git commit -m "feat: add VoxLiveContext — WebSocket + WebAudio mic capture + PCM playback"
```

---

### Task 5: Frontend — VoxLivePanel (floating voice panel UI)

**Context:** This is the floating UI panel that appears when a live VOX session is active. It shows a speaking indicator, mute toggle, live transcript, tool action cards, and an end button. It uses theme CSS variables for styling.

**Files:**
- Create: `frontend/src/components/VoxLivePanel.tsx`

**Step 1: Create the VoxLivePanel component**

```tsx
/**
 * VoxLivePanel — floating voice conversation panel.
 *
 * Appears when a Gemini Live API session is active.
 * Shows: speaking pulse, mute toggle, transcript, tool cards, end button.
 */

import React, { useRef, useEffect, useState } from 'react'
import { useVoxLive } from '../context/VoxLiveContext'

const VoxLivePanel: React.FC = () => {
  const {
    isConnected,
    isVoxSpeaking,
    isMuted,
    transcript,
    lastToolAction,
    error,
    endSession,
    toggleMute,
  } = useVoxLive()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  if (!isConnected) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 320,
        maxHeight: '70vh',
        background: 'var(--t-surface)',
        border: '1px solid var(--t-border)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--t-font)',
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--t-border)',
        }}
      >
        {/* Speaking pulse */}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isVoxSpeaking ? 'var(--t-primary)' : 'var(--t-muted)',
            animation: isVoxSpeaking ? 'vox-pulse 1.5s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--t-text)',
            letterSpacing: '0.04em',
          }}
        >
          {isVoxSpeaking ? 'VOX is speaking...' : 'VOX is listening...'}
        </span>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={{
            background: isMuted ? 'var(--t-primary)' : 'transparent',
            border: '1px solid ' + (isMuted ? 'var(--t-primary)' : 'var(--t-border)'),
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: '0.7rem',
            color: isMuted ? '#fff' : 'var(--t-muted)',
            cursor: 'pointer',
          }}
        >
          {isMuted ? 'MUTED' : 'MIC'}
        </button>

        {/* Transcript toggle */}
        <button
          onClick={() => setShowTranscript((p) => !p)}
          style={{
            background: 'transparent',
            border: '1px solid var(--t-border)',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: '0.65rem',
            color: 'var(--t-muted)',
            cursor: 'pointer',
          }}
        >
          {showTranscript ? 'HIDE' : 'LOG'}
        </button>
      </div>

      {/* Transcript */}
      {showTranscript && transcript.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px',
            maxHeight: 200,
          }}
        >
          {transcript.map((entry, i) => (
            <div
              key={i}
              style={{
                marginBottom: 6,
                fontSize: '0.7rem',
                color: entry.role === 'vox' ? 'var(--t-primary)' : 'var(--t-text)',
              }}
            >
              <strong>{entry.role === 'vox' ? 'VOX' : 'You'}:</strong>{' '}
              {entry.text}
            </div>
          ))}
        </div>
      )}

      {/* Last tool action */}
      {lastToolAction && lastToolAction.type === 'tool_call' && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--t-border)',
            fontSize: '0.7rem',
            color: 'var(--t-accent)',
          }}
        >
          VOX used: <strong>{lastToolAction.name}</strong>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            fontSize: '0.7rem',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {/* End button */}
      <div style={{ padding: '8px 16px 12px' }}>
        <button
          onClick={endSession}
          style={{
            width: '100%',
            padding: '8px 0',
            background: 'transparent',
            border: '1px solid var(--t-border)',
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--t-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--t-font)',
            transition: 'all 150ms ease',
          }}
        >
          End Conversation
        </button>
      </div>

      <style>{`
        @keyframes vox-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

export default VoxLivePanel
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/components/VoxLivePanel.tsx
git commit -m "feat: add VoxLivePanel — floating voice conversation UI with transcript + tool cards"
```

---

### Task 6: Frontend — Wire into App + StudioPage with model-select gate

**Context:** This task wires everything together: adds VoxLiveProvider to the app component tree, adds a "Talk to VOX" button on StudioPage that only shows when model is Gemini, and renders VoxLivePanel globally. It also handles UI actions dispatched from VOX (navigate, generate, add_tool).

**Files:**
- Modify: `frontend/src/App.tsx` (wrap with VoxLiveProvider, add VoxLivePanel)
- Modify: `frontend/src/pages/StudioPage.tsx` (add "Talk to VOX" button, handle VOX UI actions)

**Step 1: Update App.tsx**

At the top of `frontend/src/App.tsx`, add these imports (after the existing imports on lines 1-10):

```tsx
import { VoxLiveProvider } from './context/VoxLiveContext'
import VoxLivePanel from './components/VoxLivePanel'
```

Replace the `App` component function (lines 50-58) with:

```tsx
const App: React.FC = () => {
  return (
    <VoxModelProvider>
      <ThemeProvider>
        <VoxLiveProvider>
          <AppShell />
          <VoxLivePanel />
        </VoxLiveProvider>
      </ThemeProvider>
    </VoxModelProvider>
  )
}
```

**Step 2: Update StudioPage.tsx**

At the top of `frontend/src/pages/StudioPage.tsx`, add these imports (after existing imports):

```tsx
import { useVoxModel } from '../context/VoxModelContext'
import { useVoxLive } from '../context/VoxLiveContext'
```

Inside the `StudioPage` component, after the line `const { themeId } = useThemeContext()` (line 36), add:

```tsx
  const { activeModel } = useVoxModel()
  const { isConnected, startSession, lastToolAction } = useVoxLive()
```

After the line `const showInterview = searchParams.get('interview') === 'true' && !project` (line 39), add:

```tsx
  const handleTalkToVox = useCallback(() => {
    if (!isConnected) {
      startSession(themeId)
    }
  }, [isConnected, startSession, themeId])

  // Handle VOX UI actions (generate, add_tool from voice commands)
  useEffect(() => {
    if (!lastToolAction || lastToolAction.type !== 'ui_action') return
    const data = lastToolAction.data as Record<string, string> | undefined
    if (!data) return

    if (data.action === 'generate' && data.prompt) {
      generate(data.prompt, project ?? undefined)
    } else if (data.action === 'add_tool' && data.integration_prompt && project) {
      generate(data.integration_prompt, project)
    }
  }, [lastToolAction, generate, project])
```

Add the following import at the top (if not already present):

```tsx
import { useEffect } from 'react'
```

Just before the `<ToolDrawer` component in the JSX (line 143), add:

```tsx
      {activeModel === 'gemini' && !isConnected && (
        <button
          onClick={handleTalkToVox}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            padding: '12px 20px',
            background: 'var(--t-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'var(--t-font)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 999,
            transition: 'all 150ms ease',
          }}
        >
          Talk to VOX
        </button>
      )}
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/StudioPage.tsx
git commit -m "feat: wire VoxLive into app — Talk to VOX button (Gemini only) + VoxLivePanel global"
```

---

### Task 7: Integration Verification

**Context:** Verify the complete data flow: frontend WebSocket -> backend -> Gemini Live API -> function calls -> UI updates. Restart servers and do a manual smoke test.

**Files:** No files to create/modify. This is a verification task.

**Step 1: Verify all Python files parse**

Run from the project root:
```bash
python3 -c "
import ast
files = [
    'server/services/vox_session.py',
    'server/services/vox_tools.py',
    'server/routers/vox_live.py',
    'server/app.py',
]
for f in files:
    ast.parse(open(f).read())
    print(f'  OK: {f}')
print('All Python files parse successfully')
"
```
Expected: All OK

**Step 2: Verify all TypeScript files compile**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit`
Expected: Zero errors

**Step 3: Verify import chain**

Run from the project root:
```bash
python3 -c "
from server.services.vox_session import VoxLiveSession, THEME_VOICES
from server.services.vox_tools import VoxToolDispatcher
print('Backend imports OK')
print(f'  Voices: {list(THEME_VOICES.keys())}')
"
```
Expected: Imports succeed, prints 8 theme voices

**Step 4: Restart servers and test**

Kill existing servers, then start backend on port 8001 and frontend via vite.

**Step 5: Manual smoke test checklist**

Open the app in a browser and verify:

1. Welcome flow -> select Gemini as model -> navigate to Studio
2. "Talk to VOX" button appears (bottom-right, only for Gemini model)
3. Click "Talk to VOX" -> browser requests microphone permission
4. VoxLivePanel appears with "VOX is listening..." state
5. Speak to VOX -> audio is captured and sent
6. VOX responds with voice audio
7. Mute/unmute works
8. Transcript appears when LOG is clicked
9. End Conversation closes the session cleanly
10. Button reappears after session ends

**Step 6: Commit any fixes found during testing**

If any fixes are needed from the smoke test, fix and commit:

```bash
git add -p
git commit -m "fix: address issues found during VOX Live integration testing"
```
