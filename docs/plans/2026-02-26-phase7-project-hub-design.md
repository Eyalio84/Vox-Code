# Phase 7 Design: Project Hub + Live Preview + ZIP Export

**Date**: 2026-02-26
**Status**: APPROVED
**Scope**: Import system, Sandpack live preview, ZIP export, templates & blueprints

---

## Overview

Three capabilities, one system:

1. **Import** — Load projects from folder path or ZIP upload. Converts any React app (including Google AI Studio exports) into an `AusProject` with full file tree, deps detection, and metadata.
2. **Live Preview** — Replace syntax-only PreviewPanel with Sandpack (CodeSandbox in-browser bundler). Any project renders as a running React app. No server needed.
3. **Export** — ZIP download of a ready-to-run project. Later: JSON export for Claude Code handoff.
4. **Templates & Blueprints** — 12 real apps become a template/blueprint library. Templates = full starters. Blueprints = reusable component patterns composable into any project.

## Data Flow

```
Import (folder/ZIP) → parse into AusProject → FileTree + Sandpack Preview + Chat edit
Generate (pipeline) → AusProject → FileTree + Sandpack Preview + Chat refine
Export → AusProject → ZIP download (ready-to-run)
Template → pre-built AusProject → loaded into Studio → edit/extend
Blueprint → component files → injected into existing AusProject
```

---

## Section 1: Import System

### Backend Endpoint

`POST /api/project/import` — accepts either:
- `multipart/form-data` with a ZIP file
- JSON body with `{ "path": "/absolute/folder/path" }`

Both paths converge to the same logic: walk the file tree, read all text files, detect `package.json` for deps, infer stack, return an `AusProject`.

### Detection Heuristics

- Has `package.json` with `react` → frontend project
- Has `requirements.txt` or `pyproject.toml` → backend project
- Has both → full-stack
- Has `vite.config` → Vite-based (most AI Studio apps)
- Parses `package.json` dependencies into `frontend_deps`

### File Filtering

Skip: `node_modules/`, `dist/`, `.git/`, `__pycache__/`, binary files, files > 500KB.
Read everything else as UTF-8.

### Frontend UX

- "Import Project" button on Welcome page + "Import" option in Studio navbar
- ZIP: file input with drag-drop zone
- Folder path: text input (for Termux/local use)

### After Import

Project loads into Studio exactly as if generated — FileTree shows files, PreviewPanel renders live, ChatPanel lets user refine.

---

## Section 2: Sandpack Live Preview

### What Changes

Replace current `PreviewPanel` internals with `@codesandbox/sandpack-react`.

Sandpack runs a full Vite+React bundler in the browser via WebWorkers. No server needed. Takes a `files` object (path → content) and renders the app in an iframe.

### Implementation

- `PreviewPanel.tsx` gains dual mode: "Code" tab (syntax highlight) + "Preview" tab (Sandpack live app)
- Sandpack config: React 19, TypeScript, Tailwind CSS as defaults
- Dependencies from `AusProject.frontend_deps` passed to Sandpack's `customSetup.dependencies`
- File map: convert `AusFile[]` → Sandpack's `{ [path]: { code: string } }` format

### What Stays

Syntax-highlighted single-file view remains when user clicks a specific file in FileTree.

### Limitation

Sandpack runs frontend only. Backend (FastAPI) can't run in-browser. Future: proxy Sandpack API calls through A(Us) Studio backend.

---

## Section 3: ZIP Export

### Backend Endpoint

`POST /api/project/export/zip` — accepts an `AusProject`, returns ZIP as binary download.

### ZIP Contents

All project files from `AusProject.files` (preserving directory structure) plus auto-generated scaffolding if missing:
- `package.json` (from `frontend_deps` + standard React/Vite/TS scripts)
- `vite.config.ts` (standard Vite + React plugin config)
- `tsconfig.json` (standard React TS config)
- `index.html` (root div + script tag)
- `tailwind.config.ts` + `postcss.config.cjs` if Tailwind detected
- `.aus-project.json` metadata

### Implementation

Python `zipfile.ZipFile` in memory (`io.BytesIO`), returned as `StreamingResponse` with `application/zip`. No disk writes.

### Frontend UX

"Download ZIP" button in Studio toolbar. Only visible when project exists. Triggers fetch → blob → `<a download>` click.

---

## Section 4: Templates & Blueprints

### Templates

Full `AusProject` snapshots stored as JSON in `server/templates/`.

From the 12 apps, ~6 templates covering distinct categories:

| Template | Source App(s) | Category |
|----------|--------------|----------|
| SaaS Dashboard | expenceflow + team-todo | Business app with auth, charts, CRUD |
| Landing Page | greenleafcoffee | Multi-route marketing site with animations |
| 3D Game | laser-tag or snake | Three.js + game loop + multiplayer scaffold |
| AI Chat Tool | gemini-ai-translator + kitchen | Gemini API integration + conversational UI |
| Graph Editor | ontology + knowledge-graph-factory | React Flow + inspector panel |
| City Builder / Sim | Metropolis | Isometric game with AI-driven events |

### Blueprints

Reusable component snippets extracted from the apps. Stored as JSON arrays of `ProjectFile[]` with metadata.

Examples:
- Auth flow (login/register/context) — from expenceflow
- Recharts dashboard — from expenceflow
- React Flow canvas + inspector — from ontology
- Three.js scene + controls — from laser-tag/snake
- Gemini function calling setup — from kitchen
- Form with Zod validation — from greenleafcoffee
- Zustand store pattern — from team-todo

### API

- `GET /api/templates` — list all templates (id, name, category, description, file count)
- `GET /api/templates/{id}` — full `AusProject` for a template
- `GET /api/blueprints` — list all blueprints
- `POST /api/project/add-blueprint` — merge blueprint files into current project

### UX

- Welcome Page: template gallery with cards (name, category, preview thumbnail, file count)
- Studio: blueprints available in Tool Drawer or via VOX voice command
- VOX: add `load_template(template_id)` and `add_blueprint(blueprint_id)` tools (8 total, up from 6)

---

## Section 5: Frontend UX Changes

### Welcome Page

- Template gallery below the "describe your app" input
- Cards: template name, category, file count, one-line description
- Click → loads project into Studio

### Studio Page

- "Import" button (navbar) — modal with ZIP upload + folder path input
- "Download ZIP" button — visible when project exists
- PreviewPanel: "Code" tab + "Preview" tab (Sandpack)

### VOX Tools (expanded to 8)

1. `recommend_tools` (existing)
2. `generate_app` (existing)
3. `add_tool` (existing)
4. `navigate_ui` (existing)
5. `get_project_status` (existing)
6. `search_tools` (existing)
7. `load_template(template_id)` — NEW
8. `add_blueprint(blueprint_id)` — NEW

---

## Dependencies

| Package | Purpose | Side |
|---------|---------|------|
| `@codesandbox/sandpack-react` | In-browser React bundler/preview | Frontend |
| `zipfile` (stdlib) | ZIP creation | Backend |
| `python-multipart` | File upload handling | Backend (likely already installed) |

---

## Source Apps (for template extraction)

Location: `/storage/self/primary/Download/aus-studio/docs/React/`

| App | LOC | Complexity | Key Patterns |
|-----|-----|-----------|--------------|
| expenceflow | 688 | MEDIUM | Auth, Recharts, REST CRUD |
| gemini-ai-translator | 335 | SIMPLE | Gemini API, Web Speech |
| greenleafcoffee | 1,145 | MEDIUM | Router, Framer Motion, Forms |
| kitchen | 4,425 | LARGE | Gemini function calling, Zustand |
| knowledge-graph-factory | 736 | MEDIUM | React Flow, WebSocket |
| laser-tag | 2,017 | LARGE | Three.js, multiplayer |
| memorylog | 688K | LARGE | Multi-route SPA, WebSocket |
| Metropolis | 1,677 | LARGE | Three.js, Gemini AI |
| ontology | 542 | MEDIUM | React Flow, Zustand |
| snake | 921 | LARGE | Three.js, multiplayer |
| team-todo | 2,033 | LARGE | DnD, Zustand, REST |
| type-motion | 894 | MEDIUM | Gemini, GIF encoding |

---

## Future (not Phase 7)

- JSON export for Claude Code handoff
- Backend proxy for Sandpack API calls
- Phase 9: VOX SDK — portable voice interface layer
