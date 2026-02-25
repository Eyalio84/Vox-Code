# Gemini Live API "Jarvis Mode" — Design Doc

**Date**: 2026-02-25
**Status**: Approved
**Author**: Eyal Nof

## Goal

Replace VOX's pre-recorded WAV + Kokoro TTS with real-time bidirectional voice conversation via Gemini Live API. VOX becomes a true AI assistant that can have natural voice conversations, invoke tools from the 158-tool registry, drive app generation, and control the Studio UI — all through voice.

## Architecture: Backend-Proxied WebSocket

**Chosen approach**: Full backend proxy (Browser ↔ WS ↔ FastAPI ↔ Gemini Live API)

**Why**: API keys stay server-side, function calling has full access to 158-tool registry + recommendation engine + SDK pipeline. Matches existing architecture where all LLM calls route through FastAPI.

**Rejected alternatives**:
- Frontend-direct WebSocket: API key exposed in browser, function calling limited to frontend data
- Hybrid split (audio direct, functions via backend): Split state management, Gemini Live API doesn't cleanly separate audio from function calling

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│                                                  │
│  WebAudio API ──► MediaRecorder (PCM 16-bit)    │
│       ▲                    │                     │
│       │                    ▼                     │
│  AudioContext         WebSocket Client           │
│  (playback)          /api/vox/live              │
│       ▲                    │                     │
│       │                    ▼                     │
│  VOX UI Panel ◄── VoxLiveContext (React)        │
│  (transcript,                                    │
│   tool cards,                                    │
│   waveform)                                      │
└──────────────┬────────────────────┬──────────────┘
               │  WebSocket (binary │
               │  audio + JSON      │
               │  control frames)   │
               ▼                    ▼
┌─────────────────────────────────────────────────┐
│              FastAPI Backend                      │
│                                                  │
│  WebSocket Endpoint: /api/vox/live              │
│       │                                          │
│       ▼                                          │
│  VoxLiveSession (manages one Gemini session)    │
│       │                                          │
│       ├──► Gemini Live API (WebSocket)          │
│       │    model: gemini-2.5-flash-native-audio │
│       │    config: voice + tools + system prompt │
│       │                                          │
│       ├──► Function Call Dispatcher              │
│       │    ├── recommend_tools(project_context)  │
│       │    ├── generate_app(prompt)              │
│       │    ├── add_tool(tool_id)                 │
│       │    ├── navigate_ui(target)               │
│       │    ├── get_project_status()              │
│       │    └── search_tools(query, domain)       │
│       │                                          │
│       └──► Audio Relay (PCM pass-through)       │
└─────────────────────────────────────────────────┘
```

## VOX Function Calling Tools

Gemini Live API function declarations — actions VOX can take mid-conversation:

| Tool | Description | Behavior | Scheduling |
|------|-------------|----------|------------|
| `recommend_tools` | Get tool recommendations for current project | NON_BLOCKING | WHEN_IDLE |
| `generate_app` | Start app generation from a prompt | NON_BLOCKING | WHEN_IDLE |
| `add_tool` | Integrate a specific tool by ID | NON_BLOCKING | WHEN_IDLE |
| `navigate_ui` | Navigate to a page/panel | NON_BLOCKING | SILENT |
| `get_project_status` | Get current project state | NON_BLOCKING | WHEN_IDLE |
| `search_tools` | Search tool registry by query/domain | NON_BLOCKING | WHEN_IDLE |

## Session Lifecycle

```
User taps "Talk to VOX" button
    │
    ▼
Frontend: Open WebSocket to /api/vox/live
    │
    ▼
Backend: Open Gemini Live API session
    Config: {
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      voice: { name: theme-mapped voice },
      tools: [ ...6 function declarations ],
      system_instruction: VOX personality + project context
    }
    │
    ▼
Session active (max 15 min, auto-compress at limits)
    │
    ├── User speaks → PCM audio → WS → Backend → Gemini
    ├── Gemini responds → Audio → Backend → WS → Browser speaker
    ├── Gemini calls function → Backend executes → Result → Gemini
    ├── Backend sends control frames → UI updates (tool cards, nav)
    │
    ▼
Session ends: user closes, timeout, or GoAway
```

## Frontend Components

### VoxLiveContext (React Context)
New context that manages the live voice session:
- WebSocket connection management (open, close, reconnect)
- Audio capture: MediaRecorder → PCM 16-bit 16kHz chunks
- Audio playback: AudioContext → PCM 24kHz from Gemini
- Transcript buffer (user + VOX turns)
- Tool call events → dispatched to Studio UI

### VoxLivePanel (Floating UI)
Appears when live session is active:
- Waveform/pulse visualization (speaking indicator)
- Mute/unmute toggle
- Live transcript (collapsible)
- "End conversation" button
- Tool action cards (when VOX recommends/adds a tool)

### useVoxLive Hook (Public API)
```typescript
interface VoxLiveAPI {
  startSession(): Promise<void>
  endSession(): void
  isMuted: boolean
  toggleMute(): void
  isConnected: boolean
  isVoxSpeaking: boolean
  transcript: TranscriptEntry[]
  lastToolAction: ToolAction | null
}
```

## Backend Components

### server/routers/vox_live.py — WebSocket Endpoint
- Handles `/api/vox/live` WebSocket upgrade
- Binary frames = raw PCM audio relay
- JSON frames = control messages (start, mute, end)
- Creates VoxLiveSession per connection

### server/services/vox_session.py — Gemini Session Wrapper
- Opens `client.aio.live.connect()` with full config
- Manages session lifecycle (connect, disconnect, GoAway, resume)
- Processes incoming audio from user, relays to Gemini
- Receives Gemini audio responses, relays to frontend
- Intercepts function calls, dispatches to vox_tools

### server/services/vox_tools.py — Function Call Dispatcher
Maps Gemini tool_call names to implementations:
- `recommend_tools()` → reuses existing recommendation logic from recommend.py
- `generate_app()` → triggers SDK pipeline via aus.client.Studio
- `add_tool()` → looks up tool in registry, builds integration prompt
- `navigate_ui()` → sends control frame to frontend
- `get_project_status()` → reads current project state
- `search_tools()` → filters TOOL_CATALOG by query/domain

## Voice Mapping (Theme → Gemini Voice)

| Theme | Kokoro Voice | Gemini Live Voice |
|-------|-------------|-------------------|
| expert | bm_george | Orus |
| sharp | am_adam | Fenrir |
| warm | af_bella | Aoede |
| casual | af_sarah | Kore |
| future | am_michael | Puck |
| minimal | bf_emma | Zephyr |
| retro | bm_lewis | Charon |
| creative | af_nicole | Leda |

## VOX System Instruction

```
You are VOX, the AI creative partner in Vox Code Studio. You help users
build web applications through natural conversation.

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

Current project context: {dynamic: injected at session start}
Current theme: {theme_id}
```

## WebSocket Protocol

**Binary frames**: Raw PCM audio
- Client → Server: 16-bit, 16kHz mono
- Server → Client: 16-bit, 24kHz mono (from Gemini)

**JSON control frames**:

```json
// Client → Server
{"type": "start", "theme": "expert", "projectContext": {...}}
{"type": "mute", "muted": true}
{"type": "end"}

// Server → Client
{"type": "ready", "sessionId": "..."}
{"type": "transcript", "role": "user"|"vox", "text": "..."}
{"type": "tool_call", "name": "recommend_tools", "args": {...}}
{"type": "tool_result", "name": "recommend_tools", "data": {...}}
{"type": "ui_action", "action": "navigate", "target": "studio"}
{"type": "error", "message": "..."}
{"type": "session_end", "reason": "timeout"|"user"|"error"}
```

## Dual-Model Coexistence

Existing Kokoro TTS stays as the Claude-powered VOX path. Gemini Live API is the Gemini-powered VOX path. Users choose during welcome flow (`model-select` step):

- **"Claude"** → Kokoro TTS for pre-recorded lines, Claude for generation, existing flow
- **"Gemini"** → Gemini Live API for real-time voice + function calling, Gemini for generation

Both paths share the same tool registry, recommendation engine, and Studio UI.

## Prerequisites / Bug Fixes

### Gemini Streaming Fix
`aus/generators/llm.py:195` has a bug where `generate_content_stream()` returns a coroutine that must be awaited:
```python
# Broken:
async for chunk in client.aio.models.generate_content_stream(...):

# Fixed:
stream = await client.aio.models.generate_content_stream(...)
async for chunk in stream:
```
This must be fixed before Jarvis Mode — it blocks all Gemini-powered generation.

## Implementation Order

1. Fix Gemini streaming bug (prerequisite — unblocks generation)
2. Backend: VoxLiveSession + Gemini Live API connection
3. Backend: Function call dispatcher (6 tools)
4. Backend: WebSocket endpoint (/api/vox/live)
5. Frontend: VoxLiveContext + audio capture/playback
6. Frontend: VoxLivePanel UI
7. Frontend: Wire into StudioPage + model-select gate
8. Integration test: full voice conversation with tool calling
9. Session management: timeout handling, GoAway, resume tokens

## Dependencies

| Package | Purpose | Side |
|---------|---------|------|
| google-genai >= 1.0 | Gemini Live API client | Backend (already installed) |
| fastapi[websockets] | WebSocket support | Backend (may need starlette ws) |
| No new frontend deps | WebAudio API is native | Frontend |

## Risks

- **Gemini Live API latency**: Extra backend hop adds ~50-100ms. Acceptable for conversation flow.
- **Session 15-min limit**: Auto-compress context or prompt user to restart. GoAway message gives warning.
- **Audio format mismatch**: Gemini outputs 24kHz, browser MediaRecorder captures at device sample rate. May need resampling.
- **Termux/PRoot networking**: WebSocket connections through PRoot may have quirks. Test early.
