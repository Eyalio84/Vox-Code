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

from server.services.vox_awareness import vox_awareness

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
- Load a project template (11 real-world React apps as starters)
- Add component blueprints (Zustand stores, React Flow canvases, Recharts dashboards, etc.)

Current theme: {theme}
"""


def _build_tool_declarations() -> list[dict[str, Any]]:
    """Build the 8 function declarations for Gemini Live API."""
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
        {
            "name": "load_template",
            "description": "Load a project template by ID. Shows a pre-built project the user can customize.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {
                    "template_id": {
                        "type": "string",
                        "description": "The template ID to load (e.g. 'expenceflow', 'greenleafcoffee', 'laser-tag')",
                    },
                },
                "required": ["template_id"],
            },
        },
        {
            "name": "add_blueprint",
            "description": "Add a reusable component blueprint to the current project. Injects files like auth flows, chart dashboards, or graph editors.",
            "behavior": "NON_BLOCKING",
            "parameters": {
                "type": "object",
                "properties": {
                    "blueprint_id": {
                        "type": "string",
                        "description": "The blueprint ID to add (e.g. 'zustand-store', 'recharts-dashboard', 'react-flow-canvas')",
                    },
                },
                "required": ["blueprint_id"],
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

        awareness_context = vox_awareness.build_awareness_prompt()
        system_text = VOX_SYSTEM_INSTRUCTION.format(theme=self.theme) + f"\n\n[Workspace Context]\n{awareness_context}"
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
