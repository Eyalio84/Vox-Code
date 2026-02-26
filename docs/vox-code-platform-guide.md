# Vox Code Platform Guide

> Master reference for the Vox Code platform — architecture, models, services, and capabilities.

## What is Vox Code?

Vox Code (A(Us) Studio) is a dual-model full-stack code generation platform. It turns natural language into complete React + FastAPI applications through a 6-phase pipeline, with live Sandpack preview, real-time voice interaction (VOX), 158 developer tools, and 8 adaptive themes.

**A(Us)** — "Not AI, Us." Collaborative intelligence between developer and AI.

**Author:** Eyal Nof

---

## The React App Builder

### 6-Phase Pipeline

```
ANALYZE → SPEC → PLAN → GENERATE → VALIDATE → ITERATE
```

| Phase | Model | Purpose |
|-------|-------|---------|
| ANALYZE | gemini-3-flash-preview | Classify complexity, stack, features |
| SPEC | (derived) | Build specification from analysis output |
| PLAN | claude-sonnet-4-6 | Architecture plan, component design, data flow |
| GENERATE | claude-sonnet-4-6 | Generate all code files (~45 files, 2K+ lines) |
| VALIDATE | (structural) | Check entry points, empty files, placeholders |
| ITERATE | gemini-3-pro-preview | Refine existing code with 1M token context |

### Multi-Model Routing

Models are selected **per pipeline phase**. When both API keys are configured, the platform uses optimal routing — Gemini for speed, Claude for code quality.

- With only `GEMINI_API_KEY`: all phases use Gemini models
- With only `ANTHROPIC_API_KEY`: all phases use Claude models
- With both: optimal routing as shown above

**RECITATION handling:** Gemini Pro's safety filter blocks common boilerplate code (React + FastAPI patterns). The GENERATE phase always prefers Claude. If Claude is unavailable, it falls back to Gemini 3 Flash (not Pro) to avoid RECITATION blocks.

### SSE Streaming

The studio uses Server-Sent Events for real-time generation feedback:

| Event | Data | Description |
|-------|------|-------------|
| `token` | `{content}` | Streaming text chunk |
| `phase` | `{phase, status, model}` | Phase progress |
| `studio_plan` | `{content}` | Architecture plan text |
| `studio_file` | `{path, content, role}` | Generated file |
| `studio_deps` | `{frontend, backend}` | Dependency updates |
| `done` | `{project}` | Generation complete |
| `error` | `{message}` | Error occurred |

### Live Sandpack Preview

Generated apps render immediately in an in-browser Sandpack (CodeSandbox) panel. Key constraints for generated code:

- **Inline styles only** — Sandpack cannot run Tailwind CSS
- **No markdown code fences** in generated files
- Dependencies are injected via `studio_deps` SSE events

### Project Templates

11 real-world React apps converted to templates:

| Template | Category | Files |
|----------|----------|-------|
| expenceflow | SaaS | 13 |
| team-todo | SaaS | 55 |
| greenleafcoffee | Landing | 35 |
| kitchen | AI Demo | 31 |
| gemini-ai-translator | AI Tool | 13 |
| type-motion | AI Tool | 14 |
| ontology | Tool | 20 |
| knowledge-graph-factory | Tool | 20 |
| laser-tag | Game | 21 |
| snake | Game | 17 |
| metropolis | Game | 17 |

### Component Blueprints

5 reusable patterns: Zustand store, React Flow canvas, Recharts dashboard, Zod form, Gemini service.

---

## VOX — The AI Voice Assistant

### What is VOX?

VOX is the AI creative partner for the Vox Code platform. Not a passive assistant — VOX actively participates in the creative process through voice interaction, studio control, and contextual awareness.

### Dual Voice Model

| Mode | Model | Capabilities |
|------|-------|-------------|
| Gemini (Jarvis) | gemini-2.5-flash-native-audio | Real-time bidirectional voice, 8 function tools, Google Search |
| Claude | claude-haiku/sonnet + Kokoro ONNX | Text reasoning + local TTS |

### Jarvis Mode

Named after Iron Man's J.A.R.V.I.S. — VOX controls the entire studio through voice commands.

**Architecture:**
```
Browser → WebSocket → FastAPI → Gemini Live API
         (PCM audio)  (proxy)   (bidirectional)
```

**8 Function Tools:**
1. `recommend_tools` — AI-powered tool recommendations
2. `generate_app` — Trigger app generation
3. `add_tool` — Add tool to current project
4. `navigate_ui` — Navigate Studio pages
5. `get_project_status` — Current project state
6. `search_tools` — Semantic search 158-tool catalog
7. `load_template` — Load a project template
8. `add_blueprint` — Add component blueprint

**Google Search Grounding:** VOX can answer questions about current events, latest documentation, library versions — anything on the web. Enabled via `types.Tool(google_search=types.GoogleSearch())`.

**Audio Transcription:** Both input and output audio are transcribed automatically, enabling text-based interaction alongside voice.

**Session Resumption:** Automatic reconnection support via `SessionResumptionConfig`.

### VOX Awareness

SQLite-backed context tracking that makes VOX aware of what the user is doing:

| Table | Tracks | Purpose |
|-------|--------|---------|
| page_visits | Page name, timestamp, duration | Know where user is |
| error_log | Error message, component, timestamp | Know what went wrong |
| session_context | Key-value metadata | Active project, theme, etc. |

Awareness context is injected into VOX's system instruction at every session start, giving VOX full context about the user's current state.

### Theme-Matched Voices

Each of the 8 themes maps to a unique Gemini Live voice:

| Theme | Voice | Style |
|-------|-------|-------|
| Expert | Orus | Firm, authoritative |
| Sharp | Fenrir | Excitable, precise |
| Warm | Sulafat | Warm, encouraging |
| Casual | Zubenelgenubi | Casual, relaxed |
| Future | Puck | Upbeat, energetic |
| Minimal | Zephyr | Bright, clean |
| Retro | Charon | Informative, classic |
| Creative | Leda | Youthful, creative |

---

## Project Hub

Default landing page at `/studio`:

- **New Project** — Start generation from description
- **Templates** — Browse 11 real-world React app templates
- **Import** — Import from folder path or ZIP upload
- **Recent Projects** — SQLite-persisted project history

### Persistence

Projects are stored in SQLite with versioning:
- Auto-save on generation complete
- Version snapshots on each refinement
- Export to ready-to-run ZIP with scaffolding

---

## Developer Tools

### 158 Tools Across 8 Domains

| Domain | Example Tools |
|--------|---------------|
| UI Components | shadcn/ui, Radix, Headless UI |
| State Management | Zustand, Redux, Jotai, Recoil |
| Data Visualization | Recharts, D3, Nivo, Victory |
| Forms & Validation | React Hook Form, Zod, Formik |
| Animation | Framer Motion, GSAP, Lottie |
| API & Data | TanStack Query, Axios, tRPC |
| Routing & Navigation | React Router, TanStack Router |
| Testing | Vitest, Playwright, Testing Library |

### Semantic Search

Tool search uses a two-tier approach:

1. **Semantic search** (primary): Query is embedded via `gemini-embedding-001` (768-dim), compared against pre-computed tool embeddings using cosine similarity
2. **Keyword fallback**: Substring matching on tool ID, name, and description

Pre-computed embeddings are stored in `server/tool_embeddings.json`, generated once by `server/scripts/build_tool_embeddings.py`.

### AI-Powered Recommendations

The `/api/recommend` endpoint uses semantic pre-filtering (top 30 candidates from embeddings) followed by LLM ranking via `gemini-3-flash-preview` to suggest tools based on project context.

---

## 8 Adaptive Themes

Each theme is a complete visual identity with CSS custom properties, GSAP transitions, and a VOX voice personality:

| Theme | Visual | VOX Voice |
|-------|--------|-----------|
| Expert | Navy + gold accents | Orus (Firm) |
| Sharp | High-contrast monochrome | Fenrir (Excitable) |
| Warm | Amber + soft gradients | Sulafat (Warm) |
| Casual | Muted pastels | Zubenelgenubi (Casual) |
| Future | Neon cyan + dark | Puck (Upbeat) |
| Minimal | Sparse, clean white | Zephyr (Bright) |
| Retro | Terminal green + CRT | Charon (Informative) |
| Creative | Colorful, playful | Leda (Youthful) |

---

## AI Models Used

### Gemini 3 (Generation)

| Model | ID | Role |
|-------|-----|------|
| Gemini 3 Flash | `gemini-3-flash-preview` | ANALYZE phase, backend utilities, generation fallback |
| Gemini 3 Pro | `gemini-3-pro-preview` | PLAN fallback, ITERATE phase (1M context) |

### Gemini 2.5 (Specialized)

| Model | ID | Role |
|-------|-----|------|
| Live Audio | `gemini-2.5-flash-native-audio-preview-12-2025` | VOX real-time bidirectional voice |
| Flash TTS | `gemini-2.5-flash-preview-tts` | Cloud text-to-speech (30 voices) |

### Gemini Specialized

| Model | ID | Role |
|-------|-----|------|
| Embeddings | `gemini-embedding-001` | Semantic tool search (768-dim) |

### Claude (Anthropic)

| Model | ID | Role |
|-------|-----|------|
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | PLAN + GENERATE primary, ITERATE fallback |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | ANALYZE fallback, interview synthesis |

### Local

| Model | ID | Role |
|-------|-----|------|
| Kokoro | 82M ONNX | Offline TTS for Claude mode |

---

## Cloud TTS

30 Gemini voices available via `POST /api/tts/speak`:

| Voice | Style | Voice | Style |
|-------|-------|-------|-------|
| Zephyr | Bright | Puck | Upbeat |
| Charon | Informative | Kore | Firm |
| Fenrir | Excitable | Leda | Youthful |
| Orus | Firm | Aoede | Breezy |
| Callirrhoe | Easy-going | Autonoe | Bright |
| Enceladus | Breathy | Iapetus | Clear |
| Umbriel | Easy-going | Algieba | Smooth |
| Despina | Smooth | Erinome | Clear |
| Algenib | Gravelly | Rasalgethi | Informative |
| Laomedeia | Upbeat | Achernar | Soft |
| Alnilam | Firm | Schedar | Even |
| Gacrux | Mature | Pulcherrima | Forward |
| Achird | Friendly | Zubenelgenubi | Casual |
| Vindemiatrix | Gentle | Sadachbia | Lively |
| Sadaltager | Knowledgeable | Sulafat | Warm |

**Style control:** Pass natural language style directions (e.g., "Speak with excitement and energy") to control delivery.

**Engine options:** `gemini` (cloud, 30 voices) or `kokoro` (local ONNX, offline).

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI + Pydantic v2 (Python 3.13) |
| Preview | @codesandbox/sandpack-react |
| Voice (Gemini) | Gemini Live API (bidirectional WebSocket) |
| Voice (Claude) | Kokoro ONNX TTS + local inference |
| Cloud TTS | Gemini TTS (30 voices, style control) |
| Search | Gemini Embeddings (semantic) + keyword fallback |
| Persistence | SQLite (projects, versions, awareness) |
| LLM Routing | Gemini 3 Flash/Pro + Claude Sonnet/Haiku |

### Backend: 10 Routers

| Router | Key Endpoints |
|--------|--------------|
| studio.py | `POST /api/studio/stream` |
| welcome.py | `POST /api/welcome/profile` |
| recommend.py | `POST /api/recommend` |
| synthesize.py | `POST /api/synthesize` |
| vox_live.py | `WS /api/vox/live` |
| project.py | `POST /api/project/import/*`, `/export/zip` |
| templates.py | `GET /api/templates/*`, `/api/blueprints/*` |
| studio_projects.py | `GET/POST /api/projects/*` |
| awareness.py | `GET/POST /api/awareness/*` |
| tts.py | `POST /api/tts/speak`, `GET /api/tts/voices` |

### Backend: 9 Services

| Service | Purpose |
|---------|---------|
| tts_service.py | Kokoro ONNX TTS with pre-caching |
| gemini_tts.py | Gemini Cloud TTS (30 voices, style control) |
| tool_embeddings.py | Semantic tool search (768-dim cosine similarity) |
| vox_session.py | Gemini Live API + Google Search grounding |
| vox_tools.py | 8 VOX function tool handlers |
| project_importer.py | Folder/ZIP to AusProject conversion |
| project_exporter.py | AusProject to ready-to-run ZIP |
| project_store.py | SQLite project persistence with versioning |
| awareness_store.py | SQLite VOX awareness (3 tables) |

---

## Running the Platform

```bash
# Backend (port 8001)
export GEMINI_API_KEY="..."
export ANTHROPIC_API_KEY="..."  # recommended
python3.13 -m uvicorn server.app:app --host 0.0.0.0 --port 8001

# Frontend (separate terminal)
cd frontend && node node_modules/vite/bin/vite.js
```

Open http://localhost:5173

---

## Development Phases

| Phase | Name | Status |
|-------|------|--------|
| 0-2 | Foundation + Themes + Animations | Done |
| 3 | VOX Welcome Flow + Kokoro TTS | Done |
| 4 | Studio Core (SSE, chat, preview) | Done |
| 4.5 | Theme & Transition Overhaul | Done |
| 5 | Adaptive Tool Drawer | Done |
| 6 | Domain Tools (158 tools, 8 domains) | Done |
| 6.5 | Feature Interview + VOX Redesign | Done |
| 7a | Gemini Jarvis Mode (Live API) | Done |
| 7b | Project Hub + Templates + Export | Done |
| 7c | Studio Core Fixes + Persistence | Done |
| 7d | Gemini 3 Upgrade + Semantic Search + Cloud TTS | Done |
| 8 | Visual Agent Builder | Planned |

---

*A(Us) — Not AI, Us.*
