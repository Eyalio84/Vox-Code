# CLAUDE.md -- A(Us) Studio

This file provides guidance to Claude Code when working with this codebase.

## What This Is

Vox Code (A(Us) Studio) is a **dual-model full-stack code generation platform** with a React frontend, FastAPI backend, and real-time voice assistant (VOX). It turns natural language into complete React + FastAPI applications through a 6-phase pipeline, with live Sandpack preview, project import/export, and 158 developer tools.

**Name origin**: A(Us) -- not AI, Us. Collaborative intelligence.

## Project Structure

```
aus-studio/
├── aus/                         # SDK core (pip-installable package)
│   ├── client.py                # Studio class — public API entry point
│   ├── models.py                # 15 Pydantic v2 models (Project, Spec, etc.)
│   ├── cli.py                   # CLI tool with Rich output
│   ├── pipeline/
│   │   ├── orchestrator.py      # 6-phase engine with retry logic
│   │   └── router.py            # Phase-level multi-model selection
│   ├── generators/
│   │   ├── llm.py               # Gemini + Claude wrappers (streaming, RECITATION handling)
│   │   └── parser.py            # File extraction from LLM output (regex-based)
│   ├── prompts/                 # 6 generation prompts (~24K chars total)
│   └── specs/templates.py       # 3 pre-built specs (todo, dashboard, saas)
├── server/
│   ├── app.py                   # FastAPI server (10 routers, CORS, lifespan)
│   ├── routers/
│   │   ├── studio.py            # SSE streaming generation endpoint
│   │   ├── welcome.py           # Welcome flow + theme assignment
│   │   ├── recommend.py         # AI tool recommendations (semantic pre-filter)
│   │   ├── synthesize.py        # Feature interview → generation prompt
│   │   ├── vox_live.py          # WebSocket VOX Live endpoint
│   │   ├── project.py           # Import/export endpoints
│   │   ├── templates.py         # Template + blueprint API
│   │   ├── studio_projects.py   # SQLite project persistence + versioning
│   │   ├── awareness.py         # VOX awareness context API
│   │   └── tts.py               # Gemini Cloud TTS + Kokoro local TTS
│   ├── services/
│   │   ├── tts_service.py       # Kokoro ONNX text-to-speech (local)
│   │   ├── gemini_tts.py        # Gemini Cloud TTS (30 voices, style control)
│   │   ├── tool_embeddings.py   # Semantic tool search (gemini-embedding-001)
│   │   ├── vox_session.py       # Gemini Live API session wrapper
│   │   ├── vox_tools.py         # 8 VOX function call handlers
│   │   ├── project_importer.py  # Folder/ZIP → AusProject conversion
│   │   ├── project_exporter.py  # AusProject → ready-to-run ZIP
│   │   ├── project_store.py     # SQLite project persistence
│   │   └── awareness_store.py   # SQLite VOX awareness (3 tables)
│   ├── scripts/
│   │   └── build_tool_embeddings.py  # One-time embedding generation
│   ├── templates/               # 11 project template JSON files
│   ├── blueprints/              # 5 component blueprint JSON files
│   ├── tool_catalog.json        # 186 tools for VOX search
│   └── tool_embeddings.json     # Pre-computed 768-dim embeddings
├── frontend/
│   ├── src/
│   │   ├── pages/               # WelcomePage, StudioPage, SettingsPage
│   │   ├── components/          # 15+ components (ChatPanel, PreviewPanel, etc.)
│   │   ├── context/             # ThemeContext, VoxContext, VoxModelContext, VoxLiveContext
│   │   ├── hooks/               # useStudioStream, useTypewriter, useAutoAnimate
│   │   ├── themes/              # 8 ThemePacks with GSAP transitions
│   │   ├── tools/               # 158 tools: registry + 8 domain files
│   │   └── animations/          # GSAP shell transition configs
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── docs/
│   ├── api-endpoints.md         # Full API reference
│   └── plans/                   # Design + implementation plan docs
├── pyproject.toml
└── e2e_test.py
```

## Key Patterns

### Artifact Format

Generated code uses `### FILE:` / `### END FILE` markers:

```
### FILE: backend/app/main.py
from fastapi import FastAPI
app = FastAPI()
### END FILE
```

The parser (`aus/generators/parser.py`) extracts files using regex. Fallback: fenced code blocks with file paths.

### Multi-Model Routing

Models are selected **per pipeline phase**, not per task:

| Phase | Primary | Fallback | Reason |
|-------|---------|----------|--------|
| ANALYZE | Gemini 3 Flash | Claude Haiku | Fast classification |
| PLAN | Claude Sonnet | Gemini 3 Pro | Better architectural reasoning |
| GENERATE | Claude Sonnet | Gemini 3 Flash | Gemini Pro triggers RECITATION |
| ITERATE | Gemini 3 Pro | Claude Sonnet | 1M context for existing code |

**Important**: Gemini Pro's RECITATION filter blocks common boilerplate code (React + FastAPI patterns). Always prefer Claude for the GENERATE phase.

### Gemini Models Used

| Model ID | Purpose | Location |
|----------|---------|----------|
| `gemini-3-flash-preview` | Fast classification, backend utilities, generation fallback | router.py, llm.py, recommend.py, synthesize.py, vox_tools.py |
| `gemini-3-pro-preview` | Complex reasoning, 1M context code review | router.py, llm.py |
| `gemini-2.5-flash-native-audio-preview-12-2025` | VOX real-time bidirectional voice | vox_session.py |
| `gemini-2.5-flash-preview-tts` | Cloud text-to-speech (30 voices) | gemini_tts.py |
| `gemini-embedding-001` | Semantic tool search (768-dim vectors) | tool_embeddings.py |

### Streaming

Claude's SDK requires streaming for `max_tokens > 8000`. The `call_claude()` function in `llm.py` automatically switches to `client.messages.stream()` when tokens exceed this threshold.

### Retry With Fallback

The GENERATE phase has built-in retry logic. If the primary model returns empty content (RECITATION block, safety filter, etc.), it automatically tries fallback models without failing the pipeline.

### Spec-Driven Generation

The `Spec` model (`models.py`) is the source of truth above code:
- `PageSpec` defines frontend routes and components
- `EndpointSpec` defines API endpoints
- `ModelSpec` defines database models
- The spec drives all generation decisions

### Project Lifecycle

```python
# Create
result = await studio.create("description")

# Refine (sends existing code + change request to ITERATE phase)
result = await studio.refine(result.project, "change request")

# Export to disk
studio.export(result.project, "./output")

# Load from disk
project = studio.load("./output")
```

## Common Tasks

### Adding a New Prompt

1. Create `aus/prompts/new_prompt.py` with a `NEW_PROMPT` string constant
2. Export from `aus/prompts/__init__.py`
3. Add to the appropriate phase in `orchestrator.py`

### Adding a New Template

1. Add a factory function to `aus/specs/templates.py`
2. Register in the `TEMPLATES` dict
3. The CLI and API automatically pick it up

### Adding a New Model

1. Add to `PHASE_MODELS` in `aus/pipeline/router.py`
2. Add provider wrapper in `aus/generators/llm.py` if new provider
3. Update routing logic in `create_llm_caller()`

### Adding a New Project Template

1. Put a React app folder in `docs/React/`
2. Run the importer: `PYTHONPATH=. python3 -c "from server.services.project_importer import import_from_folder; ..."`
3. Save the result as JSON in `server/templates/`
4. The `/api/templates` endpoint picks it up automatically

### Adding a New Blueprint

1. Create a JSON file in `server/blueprints/` with `name`, `description`, `category`, and `files` array
2. Each file entry: `{path, content, role, language, size, order}`
3. The `/api/blueprints` endpoint picks it up automatically

### Running End-to-End Tests

```bash
# Set API keys
export GEMINI_API_KEY="..."
export ANTHROPIC_API_KEY="..."

# Run test
cd aus-studio
python3 e2e_test.py
```

## Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| pydantic>=2.0 | Data models with validation | Yes |
| httpx>=0.27 | HTTP client | Yes |
| google-genai>=1.0 | Gemini API SDK (generation, embeddings, TTS, Live) | Yes (for Gemini) |
| anthropic>=0.40 | Claude API SDK | Recommended |
| rich>=13.0 | CLI output formatting | Yes (for CLI) |
| pyyaml>=6.0 | Config file support | Yes |
| fastapi>=0.115 | Server wrapper | Optional (server extra) |
| uvicorn>=0.32 | ASGI server | Optional (server extra) |
| aiosqlite>=0.20 | Async SQLite (projects, awareness) | Optional (server extra) |

## Server Configuration

### Running Locally

```bash
# Backend (port 8001)
export GEMINI_API_KEY="..."
export ANTHROPIC_API_KEY="..."
uvicorn server.app:app --host 0.0.0.0 --port 8001

# Frontend (separate terminal)
cd frontend && node node_modules/vite/bin/vite.js
```

### Key API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Server status |
| `/api/studio/stream` | POST | SSE generation |
| `/api/project/import/folder` | POST | Import from path |
| `/api/project/import/zip` | POST | Import from ZIP |
| `/api/project/export/zip` | POST | Export as ZIP |
| `/api/templates` | GET | List templates |
| `/api/blueprints` | GET | List blueprints |
| `/api/vox/live` | WS | VOX voice channel |
| `/api/tts/speak` | POST | Gemini Cloud / Kokoro TTS |
| `/api/tts/voices` | GET | List 30 Gemini TTS voices |
| `/api/projects` | GET | List saved projects |
| `/api/projects/{id}` | GET | Load project + files |
| `/api/awareness/context` | GET | VOX awareness context |

### Frontend Architecture

- **Sandpack** (`@codesandbox/sandpack-react`) for live preview -- already integrated in PreviewPanel
- **useStudioStream** hook manages SSE streaming, files, project state, `loadProject()`, `addBlueprint()`
- **ThemePack** system: 8 themes with CSS custom properties + GSAP transitions
- **VoxLiveContext** manages WebSocket + audio I/O for Gemini voice

## Code Conventions

- **Pydantic v2** for all data models
- **Async/await** for all LLM calls
- **Lazy imports** for heavy SDKs (google-genai, anthropic) -- imported inside functions, not at module level
- **Logging** via `logging.getLogger("aus.*")` hierarchy
- **Type hints** everywhere, `from __future__ import annotations` in all modules
- **Ruff** for linting (line-length 100, Python 3.10+)

## Known Limitations

1. **Validators are placeholder** -- only structural checks (entry points, empty files, placeholders)
2. **Single-shot generation** -- no incremental streaming of files during GENERATE
3. **No project persistence** -- `.aus-project.json` is metadata only, no database
4. **SDK templates are static** -- no dynamic spec generation (SPEC phase is a thin wrapper)
5. **Sandpack frontend-only** -- backend (FastAPI) can't run in-browser preview
6. **VOX Gemini mode requires API key** -- Gemini Live API with native audio model

## Validated Test Result

```
ANALYZE   gemini-3-flash-preview   816 tokens    4.7s
PLAN      claude-sonnet-4-6      1,567 tokens   16.3s
GENERATE  claude-sonnet-4-6     27,402 tokens  189.5s
VALIDATE  (structural)               0 tokens      0s
Total:                           29,785 tokens  210.5s
Output:   45 files, 2,086 lines, all checks passed
```

**Note:** Timings are from pre-Gemini 3 run. Model routing now uses `gemini-3-flash-preview` for ANALYZE.

## Session Continuity Protocol

When the user says **"we are reaching a context window limit"** (or similar phrasing about context/token limits), Claude MUST:

1. **Create a context preservation data packet** at `docs/context-packets/SESSION-YYYY-MM-DD_HH-MM.md` containing:
   - What was accomplished this session (tasks completed, commits)
   - Current task status table (all tasks with status)
   - Next action (exact task + specific changes needed)
   - Key files modified and to-be-modified
   - Architecture context and server config
   - User preferences
2. **Update memory** at `/root/.claude/projects/-storage-self-primary-Download-aus-studio/memory/MEMORY.md` with current state
3. **Pause and tell the user** the packet is ready so they can `/compact`

This enables seamless session continuation — the compacted context + packet + memory file effectively preserve the full session state across context windows.
