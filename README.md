# Vox Code

**Not AI, Us — collaborative full-stack app generation with voice.**

Vox Code is a dual-model AI platform that turns natural language into complete React + FastAPI applications. It combines a 6-phase generation pipeline, real-time voice interaction (VOX), 158 developer tools, and a live Sandpack preview — all in a themed, adaptive interface.

## Features

### Generation Pipeline
- 6-phase engine: ANALYZE → SPEC → PLAN → GENERATE → VALIDATE → ITERATE
- Dual-model routing: Gemini for analysis, Claude for code generation
- SSE streaming: watch code generate in real-time

### VOX — AI Creative Partner
- **Gemini mode**: Real-time bidirectional voice via Gemini Live API (full Jarvis mode)
- **Claude mode**: Claude reasoning + Kokoro local TTS (ONNX)
- 8 function tools: recommend, generate, add tools, navigate, status, search, load templates, add blueprints
- Google Search grounding for real-time web answers
- Theme-matched voices (8 themes → 8 Gemini voices)
- Cloud TTS with 30 Gemini voices + style control

### Project Hub
- Import projects from folder path or ZIP upload (Google AI Studio exports work)
- Export as ready-to-run ZIP with scaffolding (package.json, vite.config, tsconfig)
- 11 project templates from real-world React apps
- 5 component blueprints (Zustand stores, React Flow, Recharts, Zod forms, Gemini service)

### Studio Interface
- Live Sandpack preview (in-browser React bundler)
- File tree with syntax-highlighted code view
- Chat panel with SSE streaming
- Adaptive tool drawer with 158 tools across 8 domains
- Semantic tool search via Gemini embeddings (768-dim vectors)
- 8 theme packs with GSAP transitions

### Welcome Flow
- VOX-guided personality interview (style + mood questions)
- Automatic theme assignment based on preferences
- Model selection (Gemini vs Claude)
- Feature interview wizard (20 questions → generation prompt)

## Quick Start

### Run the Platform

```bash
# Backend
export GEMINI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"  # recommended
uvicorn server.app:app --host 0.0.0.0 --port 8001

# Frontend (separate terminal)
cd frontend && npm install && npx vite
```

Open http://localhost:5173 in your browser.

### As a Python SDK

```python
from aus import Studio

studio = Studio(gemini_key="...", anthropic_key="...")
result = await studio.create("Build a task management app")
studio.export(result.project, "./my-app")
```

### As a CLI

```bash
aus create "Build a bookmark manager with search"
aus create --template todo
aus refine ./my-app "Add dark mode"
```

## Architecture

```
aus-studio/
├── aus/                    # SDK core (pip-installable)
│   ├── client.py           # Studio class — public API
│   ├── models.py           # 15 Pydantic v2 models
│   ├── pipeline/           # 6-phase orchestrator + model router
│   ├── generators/         # LLM wrappers (Gemini + Claude) + file parser
│   ├── prompts/            # 6 generation prompts (~24K chars)
│   └── specs/              # Pre-built spec templates
├── server/
│   ├── app.py              # FastAPI server (8 routers)
│   ├── routers/
│   │   ├── studio.py       # SSE streaming endpoint
│   │   ├── welcome.py      # Welcome profile + theme assignment
│   │   ├── recommend.py    # AI tool recommendations
│   │   ├── synthesize.py   # Feature interview synthesis
│   │   ├── vox_live.py     # WebSocket VOX Live endpoint
│   │   ├── project.py      # Import/export endpoints
│   │   └── templates.py    # Template + blueprint API
│   ├── services/
│   │   ├── tts_service.py  # Kokoro ONNX TTS (local)
│   │   ├── gemini_tts.py   # Gemini Cloud TTS (30 voices)
│   │   ├── tool_embeddings.py  # Semantic tool search
│   │   ├── vox_session.py  # Gemini Live API session
│   │   ├── vox_tools.py    # 8 VOX function tools
│   │   ├── project_importer.py  # Folder/ZIP → AusProject
│   │   └── project_exporter.py  # AusProject → ZIP
│   ├── templates/          # 11 project template JSONs
│   ├── blueprints/         # 5 component blueprint JSONs
│   └── tool_catalog.json   # 186 tools for VOX search
├── frontend/
│   ├── src/
│   │   ├── pages/          # WelcomePage, StudioPage, SettingsPage
│   │   ├── components/     # ChatPanel, PreviewPanel, FileTree, ToolDrawer, etc.
│   │   ├── context/        # ThemeContext, VoxContext, VoxModelContext, VoxLiveContext
│   │   ├── hooks/          # useStudioStream, useTypewriter, useAutoAnimate, etc.
│   │   ├── themes/         # 8 ThemePacks with GSAP transitions
│   │   ├── tools/          # 158 tools across 8 domains
│   │   └── animations/     # GSAP shell transitions
│   └── package.json
└── docs/
    ├── api-endpoints.md    # Full API reference
    ├── plans/              # Design + implementation plans
    └── React/              # 12 source apps (template extraction)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server status + provider availability |
| `/api/studio/stream` | POST | SSE generation stream |
| `/api/create` | POST | Generate new project |
| `/api/refine` | POST | Modify existing project |
| `/api/export` | POST | Write project to disk |
| `/api/stacks` | GET | List available stacks |
| `/api/welcome/profile` | POST | Save welcome preferences |
| `/api/tts/cache/{name}` | GET | Serve cached TTS audio |
| `/api/recommend` | POST | AI tool recommendations |
| `/api/synthesize` | POST | Interview → generation prompt |
| `/api/project/import/folder` | POST | Import from folder path |
| `/api/project/import/zip` | POST | Import from ZIP upload |
| `/api/project/export/zip` | POST | Export as ZIP download |
| `/api/templates` | GET | List project templates |
| `/api/templates/{id}` | GET | Get full template project |
| `/api/blueprints` | GET | List component blueprints |
| `/api/blueprints/{id}` | GET | Get blueprint files |
| `/api/vox/live` | WS | VOX bidirectional voice |
| `/api/tts/speak` | POST | Gemini Cloud / Kokoro TTS |
| `/api/tts/voices` | GET | List 30 Gemini TTS voices |

## Templates

11 real-world React apps converted to project templates:

| Template | Category | Files | Description |
|----------|----------|-------|-------------|
| expenceflow | SaaS | 13 | Expense tracker with auth + Recharts |
| team-todo | SaaS | 55 | Team task manager with DnD + Zustand |
| greenleafcoffee | Landing | 35 | Coffee shop with Router + Framer Motion |
| kitchen | AI Demo | 31 | Cooking assistant with Gemini function calling |
| gemini-ai-translator | AI Tool | 13 | Translator with Gemini + Web Speech |
| type-motion | AI Tool | 14 | Text animation with AI + GIF export |
| ontology | Tool | 20 | Ontology editor with React Flow |
| knowledge-graph-factory | Tool | 20 | KG builder with React Flow + WebSocket |
| laser-tag | Game | 21 | 3D multiplayer with Three.js |
| snake | Game | 17 | Neon snake with Three.js + bloom |
| metropolis | Game | 17 | City builder with Three.js + Gemini AI |

## Blueprints

5 reusable component patterns:

| Blueprint | Category | Files | Source |
|-----------|----------|-------|--------|
| zustand-store | State | 2 | team-todo |
| react-flow-canvas | Component | 5 | ontology |
| recharts-dashboard | Component | 1 | expenceflow |
| zod-form | Component | 1 | greenleafcoffee |
| gemini-service | Service | 1 | gemini-ai-translator |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI + Pydantic v2 |
| Voice (Gemini) | Gemini Live API (bidirectional audio) |
| Voice (Claude) | Kokoro ONNX TTS + local inference |
| Cloud TTS | Gemini TTS (30 voices, style control) |
| Embeddings | Gemini Embedding API (768-dim semantic search) |
| Preview | Sandpack (in-browser React bundler) |
| LLM | Gemini 3 Flash/Pro + Claude Sonnet/Haiku |
| Themes | 8 packs with CSS custom properties + GSAP |

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

## License

MIT

---

**A(Us) — Not AI, Us.**
