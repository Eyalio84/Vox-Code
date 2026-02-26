# A(Us) Studio API Reference

## Overview

The A(Us) Studio server exposes the SDK via HTTP endpoints. Run with:

```bash
pip install aus-studio[server]
uvicorn server.app:app --reload --port 8001
```

Base URL: `http://localhost:8001`

---

## Endpoints

### Health Check

```
GET /api/health
```

Returns server status and configured providers.

**Response**:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "name": "Vox Code",
  "providers": {
    "gemini": true,
    "claude": true
  }
}
```

---

### Create Project

```
POST /api/create
```

Generate a new full-stack application from a natural language description.

**Request Body**:
```json
{
  "request": "Build a bookmark manager app with categories and search",
  "spec": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request` | string | Yes | Natural language description of what to build |
| `spec` | Spec | No | Pre-built specification. If null, auto-generated from request |

**Response** (`GenerationResult`):
```json
{
  "project": {
    "id": "a1b2c3d4e5f6",
    "name": "Bookmark Manager",
    "description": "...",
    "stack": "react-fastapi",
    "complexity": "simple",
    "files": [
      {
        "path": "backend/app/main.py",
        "content": "from fastapi import FastAPI\n...",
        "role": "entry",
        "language": "python",
        "size": 870,
        "order": 0
      }
    ],
    "frontend_deps": [],
    "backend_deps": [],
    "version": 1,
    "file_count": 45,
    "total_lines": 2086
  },
  "phases": [
    {
      "phase": "analyze",
      "success": true,
      "output": {"complexity": "simple", "stack": "react-fastapi"},
      "duration_ms": 4750,
      "tokens_used": 816,
      "model": "gemini-3-flash-preview"
    },
    {
      "phase": "spec",
      "success": true,
      "duration_ms": 0,
      "tokens_used": 0
    },
    {
      "phase": "plan",
      "success": true,
      "output": "### PLAN\n...",
      "duration_ms": 16267,
      "tokens_used": 1567,
      "model": "claude-sonnet-4-6"
    },
    {
      "phase": "generate",
      "success": true,
      "output": {"file_count": 45, "total_lines": 2086},
      "duration_ms": 189524,
      "tokens_used": 27402,
      "model": "claude-sonnet-4-6"
    },
    {
      "phase": "validate",
      "success": true,
      "output": {"errors": [], "file_count": 45},
      "duration_ms": 0
    }
  ],
  "total_duration_ms": 210545,
  "total_tokens": 29785,
  "success": true,
  "errors": []
}
```

**Pipeline Phases Executed**:
1. ANALYZE (Gemini 3 Flash) -- classify complexity, stack, features
2. SPEC (derived) -- build specification from analysis
3. PLAN (Claude Sonnet) -- produce technical architecture plan
4. GENERATE (Claude Sonnet) -- generate all code files
5. VALIDATE (structural) -- check entry points, placeholders, empty files

**Error Response** (500):
```json
{
  "detail": "Generation failed: No API keys configured"
}
```

---

### Refine Project

```
POST /api/refine
```

Modify an existing project based on a change request. Sends existing code to the ITERATE phase which outputs only changed files.

**Request Body**:
```json
{
  "project": { "...full Project object from create response..." },
  "request": "Add dark mode toggle to the settings page"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project` | Project | Yes | The existing project object (from create or previous refine) |
| `request` | string | Yes | Description of desired changes |

**Response**: Same `GenerationResult` structure. `project.version` is incremented.

**Key Behavior**:
- Only changed files are regenerated (complete, not diffs)
- Unchanged files are preserved from the input project
- New files can be added, existing files replaced
- `### DELETE: path` markers remove files

---

### Export Project

```
POST /api/export
```

Write project files to disk.

**Request Body**:
```json
{
  "project": { "...full Project object..." },
  "output_dir": "/path/to/output"
}
```

**Response**:
```json
{
  "path": "/path/to/output",
  "file_count": 45
}
```

**Files Written**:
- All project files in their directory structure
- `.aus-project.json` metadata file

---

### List Stacks

```
GET /api/stacks
```

Returns available tech stack options.

**Response**:
```json
{
  "stacks": [
    {
      "id": "react-fastapi",
      "name": "React + FastAPI",
      "description": "Full-stack: React 19 + TypeScript + Vite + Tailwind + FastAPI + SQLModel"
    },
    {
      "id": "react-only",
      "name": "React Only",
      "description": "Frontend only: React 19 + TypeScript + Vite + Tailwind"
    },
    {
      "id": "fastapi-only",
      "name": "FastAPI Only",
      "description": "Backend only: FastAPI + Pydantic v2 + SQLModel"
    }
  ]
}
```

---

### Studio Stream

```
POST /api/studio/stream
```

Real-time SSE stream for project generation. Sends events as the pipeline runs.

**Request Body**:
```json
{
  "request": "Build a todo app with drag-drop",
  "mode": "create",
  "project": null,
  "spec": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request` | string | Yes | Natural language description |
| `mode` | enum | Yes | `create` or `refine` |
| `project` | AusProject | No | Existing project (for refine mode) |
| `spec` | Spec | No | Pre-built specification |

**SSE Events**:

| Event | Data | Description |
|-------|------|-------------|
| `token` | `{content: string}` | Streaming text chunk |
| `phase` | `{phase, status, model, duration_ms, tokens_used}` | Pipeline phase update |
| `studio_plan` | `{content: string}` | Architecture plan text |
| `studio_file` | `{path, content, role, language}` | Generated file |
| `studio_deps` | `{frontend: {}, backend: {}}` | Dependency updates |
| `done` | `{project: AusProject}` | Generation complete |
| `error` | `{message: string}` | Error occurred |

---

### Welcome Profile

```
POST /api/welcome/profile
```

Save user personality preferences from the welcome flow. Returns a theme assignment.

**Request Body**:
```json
{
  "style": "creative",
  "density": "balanced",
  "mood": "warm"
}
```

**Response**:
```json
{
  "theme": "creative",
  "message": "Theme assigned based on your preferences"
}
```

---

### TTS Cache

```
GET /api/tts/cache/{name}
```

Serve pre-cached TTS audio files for the welcome flow.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Audio clip name (e.g. `greeting`, `q1_intro`, `outro`) |

**Response**: Audio file (206 Partial Content supported for streaming)

---

### Tool Recommendations

```
POST /api/recommend
```

Get AI-powered tool recommendations based on project context and theme.

**Request Body**:
```json
{
  "description": "A task management app with Kanban boards",
  "theme": "expert"
}
```

**Response**:
```json
{
  "recommendations": [
    {"toolId": "dnd-kit", "reason": "Drag-drop for Kanban columns", "priority": "high"},
    {"toolId": "zustand", "reason": "Lightweight state management", "priority": "medium"}
  ]
}
```

---

### Interview Synthesis

```
POST /api/synthesize
```

Convert feature interview answers into an optimized generation prompt.

**Request Body**:
```json
{
  "answers": {
    "app_name": "TaskFlow",
    "core_purpose": "Team task management with Kanban boards",
    "target_users": "Remote teams",
    "key_features": ["drag-drop", "assignments", "deadlines"]
  }
}
```

**Response**:
```json
{
  "prompt": "Build a team task management app called TaskFlow..."
}
```

---

### Import from Folder

```
POST /api/project/import/folder
```

Import a project from a local folder path. Walks the file tree, reads text files, detects stack from package.json.

**Request Body**:
```json
{
  "path": "/path/to/react/project"
}
```

**Response**: Full `AusProject` object with detected files, stack, and dependencies.

**Filtering**:
- Skips: `node_modules/`, `dist/`, `.git/`, `__pycache__/`, binary files, files > 500KB
- Detects: React (from package.json), FastAPI (from Python imports), Vite config
- Infers roles: ENTRY, CONFIG, COMPONENT, STYLE, SERVICE, etc.

---

### Import from ZIP

```
POST /api/project/import/zip
```

Import a project from a ZIP file upload. Supports Google AI Studio exports.

**Request**: `multipart/form-data` with a `file` field containing the `.zip`

**Response**: Full `AusProject` object.

**Features**:
- Automatic common-prefix stripping (ZIPs with a single root folder)
- Same filtering and detection as folder import

---

### Export as ZIP

```
POST /api/project/export/zip
```

Export an AusProject as a downloadable ready-to-run ZIP file.

**Request Body**: Full `AusProject` object as JSON.

**Response**: Binary ZIP file with `Content-Disposition: attachment` header.

**Scaffolding** (added if missing):
- `package.json` with React 19 + Vite + TypeScript
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `tailwind.config.ts` + `postcss.config.js` (if Tailwind detected)
- `.aus-project.json` metadata

---

### List Templates

```
GET /api/templates
```

List all available project templates.

**Response**:
```json
{
  "templates": [
    {
      "id": "expenceflow",
      "name": "expenceflow",
      "description": "Personal expense tracker with auth, Recharts analytics, and CRUD operations",
      "category": "saas",
      "stack": "react-only",
      "file_count": 13
    }
  ]
}
```

---

### Get Template

```
GET /api/templates/{template_id}
```

Get a full template project by ID. Returns a complete AusProject ready to load into the Studio.

**Response**: Full `AusProject` object.

---

### List Blueprints

```
GET /api/blueprints
```

List all available component blueprints.

**Response**:
```json
{
  "blueprints": [
    {
      "id": "zustand-store",
      "name": "Zustand Store Pattern",
      "description": "State management with Zustand — store definition + typed selectors",
      "category": "state",
      "file_count": 2
    }
  ]
}
```

---

### Get Blueprint

```
GET /api/blueprints/{blueprint_id}
```

Get a blueprint by ID. Returns files that can be merged into an existing project.

**Response**: Blueprint object with `name`, `description`, `category`, and `files` array.

---

### VOX Live (WebSocket)

```
WS /api/vox/live
```

Bidirectional voice channel for VOX (Gemini Jarvis mode). Proxies audio between the browser and Gemini Live API.

**Protocol**:
- Binary frames = PCM audio (16kHz 16-bit from client, 24kHz 16-bit from server)
- Text frames = JSON control messages

**Client → Server messages**:
```json
{"type": "start", "theme": "expert"}
{"type": "text", "content": "Build me a todo app"}
{"type": "mute", "muted": true}
{"type": "end"}
```

**Server → Client messages**:
```json
{"type": "transcript", "speaker": "vox", "text": "Let me help you build that..."}
{"type": "tool_call", "name": "generate_app", "args": {"prompt": "..."}}
{"type": "tool_result", "name": "generate_app", "data": {"status": "started"}}
{"type": "turn_complete"}
{"type": "error", "message": "Session lost"}
```

**VOX Tools** (8 function tools available via voice):
1. `recommend_tools` — AI-powered tool recommendations
2. `generate_app` — Start app generation
3. `add_tool` — Add tool to project
4. `navigate_ui` — Navigate Studio UI
5. `get_project_status` — Current project state
6. `search_tools` — Semantic search 158-tool catalog (embedding-based + keyword fallback)
7. `load_template` — Load a project template
8. `add_blueprint` — Add component blueprint

**VOX Capabilities**:
- Google Search grounding — real-time web answers
- Audio transcription — input and output transcription enabled
- Session resumption — automatic reconnection support

---

### Text-to-Speech

```
POST /api/tts/speak
```

Generate speech audio using Gemini Cloud TTS or Kokoro local TTS.

**Request Body**:
```json
{
  "text": "Hello from VOX",
  "voice": "Puck",
  "style": "Speak with excitement",
  "engine": "gemini",
  "theme": ""
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Text to speak |
| `voice` | string | No | Voice name (default: `Kore`). See `/api/tts/voices` for options |
| `style` | string | No | Natural language style direction |
| `engine` | enum | No | `gemini` (cloud) or `kokoro` (local ONNX). Default: `gemini` |
| `theme` | string | No | If set, auto-selects theme-appropriate voice |

**Response**: WAV audio (mono, 16-bit, 24kHz)

---

### List TTS Voices

```
GET /api/tts/voices
```

List all available Gemini TTS voices and theme mappings.

**Response**:
```json
{
  "voices": [
    {"name": "Zephyr", "style": "Bright"},
    {"name": "Puck", "style": "Upbeat"},
    {"name": "Kore", "style": "Firm"}
  ],
  "theme_mapping": {
    "expert": "Orus",
    "sharp": "Fenrir",
    "warm": "Sulafat",
    "casual": "Zubenelgenubi",
    "future": "Puck",
    "minimal": "Zephyr",
    "retro": "Charon",
    "creative": "Leda"
  }
}
```

---

## Data Models

### Project

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 12-char hex UUID |
| `name` | string | Project name |
| `description` | string | Original request text |
| `stack` | enum | `react-fastapi`, `react-only`, `fastapi-only` |
| `complexity` | enum | `simple`, `standard`, `complex` |
| `files` | ProjectFile[] | All generated files |
| `frontend_deps` | Dependency[] | npm packages |
| `backend_deps` | Dependency[] | pip packages |
| `version` | int | Increments on each refinement |
| `created_at` | float | Unix timestamp |
| `spec_id` | string? | ID of the spec used |
| `plan_summary` | string | First 500 chars of the plan |

### ProjectFile

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Relative path (e.g. `frontend/src/App.tsx`) |
| `content` | string | Complete file content |
| `role` | enum | `entry`, `component`, `model`, `service`, `config`, `style`, `test`, `migration`, `static`, `schema`, `util`, `hook`, `type` |
| `language` | string | `tsx`, `typescript`, `python`, `json`, `css`, etc. |
| `size` | int | Content length in bytes |
| `order` | int | Generation order (lower = first) |

### Spec

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 8-char hex UUID |
| `name` | string | Spec name |
| `description` | string | What to build |
| `stack` | enum | Target stack |
| `complexity` | enum | Complexity level |
| `pages` | PageSpec[] | Frontend routes |
| `shared_components` | string[] | Reusable component names |
| `endpoints` | EndpointSpec[] | API endpoints |
| `models` | ModelSpec[] | Database models |
| `auth_strategy` | string | `jwt`, `session`, `none` |
| `database` | string | `sqlite`, `postgresql` |
| `seed_data` | bool | Generate seed data |

### PhaseResult

| Field | Type | Description |
|-------|------|-------------|
| `phase` | enum | `analyze`, `spec`, `plan`, `generate`, `validate`, `iterate` |
| `success` | bool | Phase completed without errors |
| `output` | any | Phase-specific output |
| `error` | string? | Error message if failed |
| `duration_ms` | int | Phase execution time |
| `tokens_used` | int | Total tokens (input + output) |
| `model` | string | Model ID used |

---

## SDK Methods

The server is a thin wrapper. The SDK (`aus.Studio`) provides the same functionality:

| SDK Method | HTTP Endpoint | Description |
|------------|---------------|-------------|
| `studio.create(request, spec)` | `POST /api/create` | Generate new project |
| `studio.refine(project, request)` | `POST /api/refine` | Modify existing project |
| `studio.export(project, dir)` | `POST /api/export` | Write to disk |
| `studio.load(dir)` | -- | Load from disk (SDK only) |
| `studio.create_sync(...)` | -- | Sync wrapper (SDK only) |
| `studio.refine_sync(...)` | -- | Sync wrapper (SDK only) |

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `aus create <request>` | Generate from description |
| `aus create --template <id>` | Generate from template (`todo`, `dashboard`, `saas`) |
| `aus refine <dir> <request>` | Modify existing project |
| `aus templates` | List available templates |
| `aus version` | Show version |

---

## Model Routing

The pipeline automatically selects models per phase:

```
ANALYZE  ──► gemini-3-flash-preview  (fast classification)
SPEC     ──► (no LLM call)          (derived from analysis)
PLAN     ──► claude-sonnet-4-6      (architectural reasoning)
GENERATE ──► claude-sonnet-4-6      (code quality, no RECITATION filter)
             └─► gemini-3-flash-preview (fallback if Claude unavailable)
VALIDATE ──► (no LLM call)          (structural checks)
ITERATE  ──► gemini-3-pro-preview   (1M context for existing code)
             └─► claude-sonnet-4-6   (fallback)
```

With only `GEMINI_API_KEY`: all phases use Gemini models.
With only `ANTHROPIC_API_KEY`: all phases use Claude models.
With both: optimal routing as shown above.
