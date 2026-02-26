# Phase 7: Project Hub + Live Preview + ZIP Export — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable importing React projects (folder or ZIP), exporting as ready-to-run ZIP, and loading templates/blueprints — all rendering live in the existing Sandpack preview.

**Architecture:** Backend endpoints handle import (parse folder/ZIP → AusProject), export (AusProject → ZIP bytes), and template/blueprint serving. Frontend adds an import modal, download button, template gallery on Welcome page, and a `loadProject()` function on useStudioStream that populates files/project state without SSE.

**Tech Stack:** Python zipfile + io.BytesIO (backend), existing Sandpack preview (frontend), JSON template files (server/templates/)

---

### Task 1: Backend — Project Importer Service

**Context:** This service converts a folder path or ZIP bytes into an AusProject. It walks the file tree, reads text files, parses package.json for deps, infers the stack, and returns a structured project. All other import flows (endpoint, template loading) depend on this.

**Files:**
- Create: `server/services/project_importer.py`

**Step 1: Create the importer module**

```python
"""Project importer — converts folders and ZIP files into AusProject dicts.

Walks a file tree, reads text files, detects stack from package.json,
and returns a dict matching the AusProject schema.
"""

from __future__ import annotations

import io
import json
import logging
import os
import uuid
import zipfile
from pathlib import Path
from typing import Any

log = logging.getLogger("aus.importer")

# Directories to skip during import
SKIP_DIRS = {
    "node_modules", "dist", "build", ".git", "__pycache__",
    ".next", ".vite", ".cache", "coverage", ".turbo",
}

# File extensions to treat as text
TEXT_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".html", ".css",
    ".md", ".txt", ".yaml", ".yml", ".toml", ".sql", ".sh",
    ".env", ".gitignore", ".prettierrc", ".eslintrc",
    ".svg", ".xml",
}

# Max file size to import (500KB)
MAX_FILE_SIZE = 500_000

# Role detection by file path patterns
ROLE_MAP: list[tuple[str, str]] = [
    ("App.tsx", "ENTRY"),
    ("main.tsx", "ENTRY"),
    ("main.py", "ENTRY"),
    ("index.tsx", "ENTRY"),
    ("index.ts", "ENTRY"),
    ("vite.config", "CONFIG"),
    ("tsconfig", "CONFIG"),
    ("package.json", "CONFIG"),
    ("pyproject.toml", "CONFIG"),
    ("tailwind.config", "CONFIG"),
    ("postcss.config", "CONFIG"),
    (".css", "STYLE"),
    (".sql", "SCHEMA"),
    ("test", "TEST"),
    ("spec", "TEST"),
    ("types.ts", "TYPE"),
    ("types/", "TYPE"),
    ("hooks/", "HOOK"),
    ("hook", "HOOK"),
    ("store", "SERVICE"),
    ("service", "SERVICE"),
    ("api", "SERVICE"),
    ("util", "UTIL"),
    ("model", "MODEL"),
    ("schema", "SCHEMA"),
]


def _detect_role(path: str) -> str:
    """Detect file role from path patterns."""
    lower = path.lower()
    for pattern, role in ROLE_MAP:
        if pattern in lower:
            return role
    return "COMPONENT"


def _detect_language(path: str) -> str:
    """Detect language from file extension."""
    ext = Path(path).suffix.lower()
    lang_map = {
        ".ts": "typescript", ".tsx": "typescript",
        ".js": "javascript", ".jsx": "javascript",
        ".py": "python", ".json": "json", ".html": "html",
        ".css": "css", ".md": "markdown", ".sql": "sql",
        ".yaml": "yaml", ".yml": "yaml", ".toml": "toml",
        ".sh": "bash", ".svg": "xml",
    }
    return lang_map.get(ext, "text")


def _should_skip_dir(name: str) -> bool:
    return name in SKIP_DIRS or name.startswith(".")


def _should_include_file(path: str, size: int) -> bool:
    if size > MAX_FILE_SIZE:
        return False
    ext = Path(path).suffix.lower()
    name = Path(path).name
    if ext in TEXT_EXTENSIONS or name in {".env.local", ".gitignore"}:
        return True
    # Include extensionless config files
    if not ext and name in {"Makefile", "Dockerfile", "Procfile"}:
        return True
    return False


def _parse_package_json(content: str) -> tuple[dict[str, str], dict[str, str]]:
    """Parse package.json and return (dependencies, devDependencies)."""
    try:
        pkg = json.loads(content)
        deps = pkg.get("dependencies", {})
        dev_deps = pkg.get("devDependencies", {})
        return deps, dev_deps
    except (json.JSONDecodeError, TypeError):
        return {}, {}


def _detect_stack(files: list[dict], deps: dict[str, str]) -> str:
    """Detect project stack from files and dependencies."""
    has_react = "react" in deps
    has_python = any(f["path"].endswith(".py") for f in files)
    has_fastapi = any(
        "fastapi" in f.get("content", "")
        for f in files
        if f["path"].endswith(".py")
    )
    if has_react and (has_python or has_fastapi):
        return "react-fastapi"
    if has_react:
        return "react-only"
    if has_python:
        return "fastapi-only"
    return "react-only"


def import_from_folder(folder_path: str) -> dict[str, Any]:
    """Import a project from a folder on disk.

    Returns a dict matching the AusProject schema.
    """
    root = Path(folder_path)
    if not root.is_dir():
        raise FileNotFoundError(f"Directory not found: {folder_path}")

    files: list[dict[str, Any]] = []
    pkg_content = ""
    order = 0

    for dirpath, dirnames, filenames in os.walk(root):
        # Filter out skip directories in-place
        dirnames[:] = [d for d in dirnames if not _should_skip_dir(d)]

        for filename in sorted(filenames):
            filepath = Path(dirpath) / filename
            rel_path = str(filepath.relative_to(root))
            stat = filepath.stat()

            if not _should_include_file(rel_path, stat.st_size):
                continue

            try:
                content = filepath.read_text(encoding="utf-8")
            except (UnicodeDecodeError, PermissionError, OSError):
                continue

            if filename == "package.json" and dirpath == str(root):
                pkg_content = content

            files.append({
                "path": rel_path,
                "content": content,
                "role": _detect_role(rel_path),
                "language": _detect_language(rel_path),
                "size": len(content),
                "order": order,
            })
            order += 1

    deps, _ = _parse_package_json(pkg_content) if pkg_content else ({}, {})
    stack = _detect_stack(files, deps)
    name = root.name

    # Try to get name from package.json
    if pkg_content:
        try:
            name = json.loads(pkg_content).get("name", root.name)
        except (json.JSONDecodeError, TypeError):
            pass

    log.info("Imported %d files from %s (stack=%s)", len(files), folder_path, stack)

    return {
        "id": uuid.uuid4().hex[:12],
        "name": name,
        "description": f"Imported from {root.name}",
        "stack": stack,
        "complexity": "STANDARD",
        "files": files,
        "frontend_deps": deps,
        "backend_deps": {},
        "created_at": str(int(__import__("time").time())),
        "version": 1,
    }


def import_from_zip(zip_bytes: bytes) -> dict[str, Any]:
    """Import a project from ZIP file bytes.

    Returns a dict matching the AusProject schema.
    """
    files: list[dict[str, Any]] = []
    pkg_content = ""
    order = 0

    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        # Detect common root directory (many ZIPs have a single root folder)
        names = zf.namelist()
        common_prefix = ""
        if names:
            parts = names[0].split("/")
            if len(parts) > 1:
                candidate = parts[0] + "/"
                if all(n.startswith(candidate) or n == candidate.rstrip("/") for n in names):
                    common_prefix = candidate

        for info in zf.infolist():
            if info.is_dir():
                continue

            path = info.filename
            if common_prefix and path.startswith(common_prefix):
                path = path[len(common_prefix):]
            if not path:
                continue

            # Skip unwanted directories
            parts = path.split("/")
            if any(_should_skip_dir(p) for p in parts[:-1]):
                continue

            if not _should_include_file(path, info.file_size):
                continue

            try:
                content = zf.read(info.filename).decode("utf-8")
            except (UnicodeDecodeError, KeyError):
                continue

            if Path(path).name == "package.json" and "/" not in path:
                pkg_content = content

            files.append({
                "path": path,
                "content": content,
                "role": _detect_role(path),
                "language": _detect_language(path),
                "size": len(content),
                "order": order,
            })
            order += 1

    deps, _ = _parse_package_json(pkg_content) if pkg_content else ({}, {})
    stack = _detect_stack(files, deps)

    name = "imported-project"
    if pkg_content:
        try:
            name = json.loads(pkg_content).get("name", name)
        except (json.JSONDecodeError, TypeError):
            pass

    log.info("Imported %d files from ZIP (stack=%s)", len(files), stack)

    return {
        "id": uuid.uuid4().hex[:12],
        "name": name,
        "description": "Imported from ZIP",
        "stack": stack,
        "complexity": "STANDARD",
        "files": files,
        "frontend_deps": deps,
        "backend_deps": {},
        "created_at": str(int(__import__("time").time())),
        "version": 1,
    }
```

**Step 2: Verify**

Run: `python3 -c "import ast; ast.parse(open('server/services/project_importer.py').read()); print('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add server/services/project_importer.py
git commit -m "feat: add project importer service — folder + ZIP to AusProject"
```

---

### Task 2: Backend — ZIP Export Service

**Context:** This service takes an AusProject dict and produces a ready-to-run ZIP file in memory. It includes all project files plus scaffolding (package.json, vite.config, tsconfig, index.html) if they're missing.

**Files:**
- Create: `server/services/project_exporter.py`

**Step 1: Create the exporter module**

```python
"""Project exporter — converts AusProject to a downloadable ZIP.

Produces a ready-to-run project with scaffolding (package.json,
vite.config.ts, tsconfig.json, index.html) added if missing.
"""

from __future__ import annotations

import io
import json
import logging
import zipfile

log = logging.getLogger("aus.exporter")


# Scaffolding templates for missing files
PACKAGE_JSON_TEMPLATE = {
    "name": "{name}",
    "private": True,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
    },
    "dependencies": {
        "react": "^19.2.0",
        "react-dom": "^19.2.0",
    },
    "devDependencies": {
        "@types/node": "^22.14.0",
        "@types/react": "^19.2.0",
        "@types/react-dom": "^19.2.0",
        "@vitejs/plugin-react": "^5.0.0",
        "typescript": "~5.8.2",
        "vite": "^6.2.0",
    },
}

VITE_CONFIG = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
"""

TSCONFIG = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"]
}
"""

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""

POSTCSS_CONFIG = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""

TAILWIND_CONFIG = """/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
"""


def export_to_zip(project: dict) -> bytes:
    """Convert an AusProject dict to ZIP bytes.

    Returns bytes suitable for StreamingResponse.
    """
    buf = io.BytesIO()
    name = project.get("name", "project")
    files = project.get("files", [])
    frontend_deps = project.get("frontend_deps", {})
    file_paths = {f["path"] for f in files}

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Write all project files
        for f in files:
            zf.writestr(f"{name}/{f['path']}", f["content"])

        # Add scaffolding if missing
        if "package.json" not in file_paths:
            pkg = json.loads(json.dumps(PACKAGE_JSON_TEMPLATE))
            pkg["name"] = name
            # Merge frontend deps
            if frontend_deps:
                pkg["dependencies"].update(frontend_deps)
            zf.writestr(
                f"{name}/package.json",
                json.dumps(pkg, indent=2),
            )

        if "vite.config.ts" not in file_paths:
            zf.writestr(f"{name}/vite.config.ts", VITE_CONFIG)

        if "tsconfig.json" not in file_paths:
            zf.writestr(f"{name}/tsconfig.json", TSCONFIG)

        if "index.html" not in file_paths:
            zf.writestr(
                f"{name}/index.html",
                INDEX_HTML.replace("{name}", name),
            )

        # Add Tailwind config if tailwindcss is a dep
        has_tailwind = "tailwindcss" in frontend_deps or any(
            "tailwind" in f.get("content", "")
            for f in files
            if f["path"].endswith(".css")
        )
        if has_tailwind:
            if "tailwind.config.ts" not in file_paths and "tailwind.config.js" not in file_paths:
                zf.writestr(f"{name}/tailwind.config.ts", TAILWIND_CONFIG)
            if "postcss.config.cjs" not in file_paths and "postcss.config.js" not in file_paths:
                zf.writestr(f"{name}/postcss.config.js", POSTCSS_CONFIG)

        # Write .aus-project.json metadata
        meta = {
            "id": project.get("id", ""),
            "name": name,
            "stack": project.get("stack", "react-only"),
            "version": project.get("version", 1),
            "file_count": len(files),
        }
        zf.writestr(
            f"{name}/.aus-project.json",
            json.dumps(meta, indent=2),
        )

    log.info("Exported %d files to ZIP (%d bytes)", len(files), buf.tell())
    return buf.getvalue()
```

**Step 2: Verify**

Run: `python3 -c "import ast; ast.parse(open('server/services/project_exporter.py').read()); print('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add server/services/project_exporter.py
git commit -m "feat: add project exporter service — AusProject to ready-to-run ZIP"
```

---

### Task 3: Backend — Import + Export API Endpoints

**Context:** Two new API endpoints: POST /api/project/import (folder path or ZIP upload) and POST /api/project/export/zip (AusProject → ZIP download). These use the services from Tasks 1-2.

**Files:**
- Create: `server/routers/project.py`
- Modify: `server/app.py` (add router import + include_router)

**Step 1: Create the project router**

```python
"""Project import/export endpoints.

POST /api/project/import   — import from folder path or ZIP upload
POST /api/project/export/zip — export AusProject as downloadable ZIP
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Any

from server.services.project_importer import import_from_folder, import_from_zip
from server.services.project_exporter import export_to_zip

router = APIRouter(prefix="/api/project", tags=["project"])
log = logging.getLogger("aus.project")


class FolderImportRequest(BaseModel):
    path: str


@router.post("/import/folder")
async def import_folder(req: FolderImportRequest):
    """Import a project from a local folder path."""
    try:
        project = import_from_folder(req.path)
        return project
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        log.exception("Import from folder failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/zip")
async def import_zip(file: UploadFile = File(...)):
    """Import a project from a ZIP file upload."""
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="File must be a .zip")
    try:
        content = await file.read()
        project = import_from_zip(content)
        return project
    except Exception as e:
        log.exception("Import from ZIP failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export/zip")
async def export_zip(project: dict[str, Any]):
    """Export a project as a downloadable ZIP file."""
    try:
        zip_bytes = export_to_zip(project)
        name = project.get("name", "project")
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{name}.zip"',
            },
        )
    except Exception as e:
        log.exception("Export to ZIP failed")
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 2: Register the router in server/app.py**

Add after the `vox_live_router` import (around line 25):

```python
from server.routers.project import router as project_router
```

Add after `app.include_router(vox_live_router)` (around line 75):

```python
app.include_router(project_router)
```

**Step 3: Verify**

```bash
python3 -c "import ast; ast.parse(open('server/routers/project.py').read()); print('OK')"
python3 -c "import ast; ast.parse(open('server/app.py').read()); print('OK')"
```
Expected: Both `OK`

**Step 4: Commit**

```bash
git add server/routers/project.py server/app.py
git commit -m "feat: add /api/project import + export endpoints — folder, ZIP upload, ZIP download"
```

---

### Task 4: Backend — Template & Blueprint System

**Context:** Templates are full AusProject JSON snapshots. Blueprints are smaller component bundles. Both are stored as JSON files in server/templates/ and server/blueprints/. API endpoints list them and serve them by ID.

**Files:**
- Create: `server/templates/` directory with template JSON files
- Create: `server/blueprints/` directory with blueprint JSON files
- Create: `server/routers/templates.py`
- Modify: `server/app.py` (add router)

**Step 1: Create the template/blueprint router**

```python
"""Template and blueprint endpoints.

GET  /api/templates              — list all templates
GET  /api/templates/{id}         — get full template project
GET  /api/blueprints             — list all blueprints
GET  /api/blueprints/{id}        — get blueprint files
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["templates"])
log = logging.getLogger("aus.templates")

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
BLUEPRINTS_DIR = Path(__file__).parent.parent / "blueprints"


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/api/templates")
async def list_templates():
    """List all available project templates."""
    templates = []
    if TEMPLATES_DIR.exists():
        for f in sorted(TEMPLATES_DIR.glob("*.json")):
            try:
                data = _load_json(f)
                templates.append({
                    "id": f.stem,
                    "name": data.get("name", f.stem),
                    "description": data.get("description", ""),
                    "category": data.get("category", "general"),
                    "stack": data.get("stack", "react-only"),
                    "file_count": len(data.get("files", [])),
                })
            except Exception:
                log.warning("Failed to load template: %s", f)
    return {"templates": templates}


@router.get("/api/templates/{template_id}")
async def get_template(template_id: str):
    """Get a full template project by ID."""
    path = TEMPLATES_DIR / f"{template_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    try:
        return _load_json(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/blueprints")
async def list_blueprints():
    """List all available component blueprints."""
    blueprints = []
    if BLUEPRINTS_DIR.exists():
        for f in sorted(BLUEPRINTS_DIR.glob("*.json")):
            try:
                data = _load_json(f)
                blueprints.append({
                    "id": f.stem,
                    "name": data.get("name", f.stem),
                    "description": data.get("description", ""),
                    "category": data.get("category", "component"),
                    "file_count": len(data.get("files", [])),
                })
            except Exception:
                log.warning("Failed to load blueprint: %s", f)
    return {"blueprints": blueprints}


@router.get("/api/blueprints/{blueprint_id}")
async def get_blueprint(blueprint_id: str):
    """Get a blueprint by ID."""
    path = BLUEPRINTS_DIR / f"{blueprint_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Blueprint '{blueprint_id}' not found")
    try:
        return _load_json(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 2: Register the router in server/app.py**

Add import:
```python
from server.routers.templates import router as templates_router
```

Add include:
```python
app.include_router(templates_router)
```

**Step 3: Create template/blueprint directories**

```bash
mkdir -p server/templates server/blueprints
```

**Step 4: Generate templates from the 12 React apps**

Run a script to convert each app folder into a template JSON file using the importer:

```bash
PYTHONPATH=. python3 -c "
import json
from pathlib import Path
from server.services.project_importer import import_from_folder

apps_dir = Path('docs/React')
templates_dir = Path('server/templates')
templates_dir.mkdir(exist_ok=True)

# Map app folders to template metadata
template_meta = {
    'expenceflow': {'category': 'saas', 'description': 'Personal expense tracker with auth, Recharts analytics, and CRUD operations'},
    'gemini-ai-translator': {'category': 'ai-tool', 'description': 'Real-time English/Russian translator powered by Gemini with speech input'},
    'greenleafcoffee': {'category': 'landing', 'description': 'Coffee shop landing page with routing, animations, gallery, and contact form'},
    'kitchen': {'category': 'ai-demo', 'description': 'Interactive cooking assistant with Gemini function calling and debug console'},
    'knowledge-graph-factory(2)': {'category': 'tool', 'description': 'Knowledge graph builder with React Flow, chat panel, and WebSocket sync'},
    'laser-tag': {'category': 'game', 'description': 'Real-time multiplayer 3D laser tag with Three.js and WebSocket'},
    'Metropolis': {'category': 'game', 'description': 'Isometric city builder with AI-generated goals and resource management'},
    'ontology': {'category': 'tool', 'description': 'Ontology/taxonomy graph editor with React Flow and inspector panel'},
    'snake': {'category': 'game', 'description': 'Multiplayer neon snake game with Three.js, bloom effects, and leaderboard'},
    'team-todo': {'category': 'saas', 'description': 'Team task manager with drag-drop, assignments, comments, and keyboard shortcuts'},
    'type-motion': {'category': 'ai-tool', 'description': 'Text animation studio with AI style suggestions and GIF/video export'},
}

# Skip memorylog — too large (688K LOC)
for folder_name, meta in template_meta.items():
    folder = apps_dir / folder_name
    if not folder.is_dir():
        print(f'SKIP: {folder_name} not found')
        continue
    try:
        project = import_from_folder(str(folder))
        project['category'] = meta['category']
        project['description'] = meta['description']
        # Clean the template ID
        template_id = folder_name.lower().replace('(', '').replace(')', '').replace(' ', '-')
        out_path = templates_dir / f'{template_id}.json'
        out_path.write_text(json.dumps(project, indent=2), encoding='utf-8')
        print(f'  OK: {template_id} ({len(project[\"files\"])} files)')
    except Exception as e:
        print(f'  FAIL: {folder_name}: {e}')

print('Done')
"
```

Expected: ~11 templates created (memorylog excluded).

**Step 5: Extract blueprints from key apps**

Create blueprint JSON files manually. Each blueprint is a JSON file with `name`, `description`, `category`, and `files` (array of `{path, content, role, language}`).

Run a script to extract key component patterns:

```bash
PYTHONPATH=. python3 -c "
import json
from pathlib import Path

blueprints_dir = Path('server/blueprints')
blueprints_dir.mkdir(exist_ok=True)

def read_file(path):
    try:
        return Path(path).read_text(encoding='utf-8')
    except:
        return ''

def make_blueprint(bp_id, name, desc, category, file_tuples):
    files = []
    for src_path, target_path, role, lang in file_tuples:
        content = read_file(src_path)
        if content:
            files.append({'path': target_path, 'content': content, 'role': role, 'language': lang, 'size': len(content), 'order': len(files)})
    if files:
        bp = {'name': name, 'description': desc, 'category': category, 'files': files}
        (blueprints_dir / f'{bp_id}.json').write_text(json.dumps(bp, indent=2), encoding='utf-8')
        print(f'  OK: {bp_id} ({len(files)} files)')
    else:
        print(f'  SKIP: {bp_id} (no files found)')

base = 'docs/React'

# Zustand store pattern
make_blueprint('zustand-store', 'Zustand Store Pattern', 'State management with Zustand — store definition + typed selectors', 'state',
    [(f'{base}/team-todo/src/store/useTaskStore.ts', 'src/store/useStore.ts', 'SERVICE', 'typescript'),
     (f'{base}/team-todo/src/store/useUIStore.ts', 'src/store/useUIStore.ts', 'SERVICE', 'typescript')])

# React Flow graph canvas
make_blueprint('react-flow-canvas', 'React Flow Graph Canvas', 'Interactive node-edge graph with React Flow + custom nodes + inspector', 'component',
    [(f'{base}/ontology/OntologyCanvas.tsx', 'src/components/GraphCanvas.tsx', 'COMPONENT', 'typescript'),
     (f'{base}/ontology/ClassNode.tsx', 'src/components/ClassNode.tsx', 'COMPONENT', 'typescript'),
     (f'{base}/ontology/InspectorPanel.tsx', 'src/components/InspectorPanel.tsx', 'COMPONENT', 'typescript'),
     (f'{base}/ontology/types.ts', 'src/types/graph.ts', 'TYPE', 'typescript'),
     (f'{base}/ontology/useOntologyStore.ts', 'src/store/useGraphStore.ts', 'SERVICE', 'typescript')])

# Recharts dashboard
make_blueprint('recharts-dashboard', 'Recharts Analytics Dashboard', 'Dashboard with pie charts, bar charts, and summary cards using Recharts', 'component',
    [(f'{base}/expenceflow/App.tsx', 'src/components/Dashboard.tsx', 'COMPONENT', 'typescript')])

# Form with Zod validation
make_blueprint('zod-form', 'Form with Zod Validation', 'Contact form using react-hook-form + Zod schema validation', 'component',
    [(f'{base}/greenleafcoffee/components/ContactForm.tsx', 'src/components/ContactForm.tsx', 'COMPONENT', 'typescript')])

# Gemini API service
make_blueprint('gemini-service', 'Gemini API Service', 'Google Gemini API integration with streaming and markdown fence stripping', 'service',
    [(f'{base}/gemini-ai-translator/services/geminiService.ts', 'src/services/geminiService.ts', 'SERVICE', 'typescript')])

print('Done')
"
```

**Step 6: Verify**

```bash
python3 -c "import ast; ast.parse(open('server/routers/templates.py').read()); print('Router OK')"
python3 -c "import ast; ast.parse(open('server/app.py').read()); print('App OK')"
ls server/templates/*.json | wc -l
ls server/blueprints/*.json | wc -l
```

**Step 7: Commit**

```bash
git add server/routers/templates.py server/app.py server/templates/ server/blueprints/
git commit -m "feat: add template + blueprint system — 11 project templates, 5 component blueprints"
```

---

### Task 5: Frontend — useStudioStream loadProject function

**Context:** The useStudioStream hook currently only populates files via SSE. We need a `loadProject()` function that takes an AusProject and directly populates the files/project state — used by import, templates, and blueprints.

**Files:**
- Modify: `frontend/src/hooks/useStudioStream.ts`

**Step 1: Add loadProject and addBlueprint to useStudioStream**

After the `reset` callback (around line 253), add:

```tsx
  const loadProject = useCallback((project: AusProject) => {
    const filesMap: Record<string, AusFile> = {}
    for (const f of project.files) {
      filesMap[f.path] = f
    }
    accTextRef.current = ''
    setState({
      messages: [{
        id: makeId(),
        role: 'system',
        content: `Loaded project "${project.name}" — ${project.files.length} files.`,
        timestamp: new Date().toISOString(),
      }],
      files: filesMap,
      phases: [],
      project,
      plan: '',
      streamingText: '',
      isStreaming: false,
      error: null,
    })
  }, [])

  const addBlueprint = useCallback((files: AusFile[]) => {
    setState((prev) => {
      const updated = { ...prev.files }
      for (const f of files) {
        updated[f.path] = f
      }
      return { ...prev, files: updated }
    })
  }, [])
```

Update the return statement to include both:

```tsx
  return { ...state, generate, stop, reset, addMessage, loadProject, addBlueprint }
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/hooks/useStudioStream.ts
git commit -m "feat: add loadProject + addBlueprint to useStudioStream — direct state population"
```

---

### Task 6: Frontend — Import Modal Component

**Context:** A modal dialog for importing projects. Two tabs: "Upload ZIP" (file drag-drop) and "Folder Path" (text input). Calls the backend endpoints and loads the result via `loadProject()`.

**Files:**
- Create: `frontend/src/components/ImportModal.tsx`

**Step 1: Create the ImportModal component**

```tsx
/**
 * ImportModal — dialog for importing projects from ZIP or folder path.
 *
 * Two tabs: Upload ZIP (file input) and Folder Path (text input).
 * Calls backend import endpoints, loads result via loadProject().
 */

import React, { useState, useCallback, useRef } from 'react'
import type { AusProject } from '../types/project'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (project: AusProject) => void
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [tab, setTab] = useState<'zip' | 'folder'>('zip')
  const [folderPath, setFolderPath] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleZipUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/project/import/zip', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Import failed' }))
        throw new Error(err.detail || 'Import failed')
      }
      const project = await res.json() as AusProject
      onImport(project)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [onImport, onClose])

  const handleFolderImport = useCallback(async () => {
    if (!folderPath.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/project/import/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Import failed' }))
        throw new Error(err.detail || 'Import failed')
      }
      const project = await res.json() as AusProject
      onImport(project)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [folderPath, onImport, onClose])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleZipUpload(file)
  }, [handleZipUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.zip')) handleZipUpload(file)
    else setError('Please drop a .zip file')
  }, [handleZipUpload])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--t-surface)',
          border: '1px solid var(--t-border)',
          borderRadius: 16,
          width: 420,
          maxWidth: '90vw',
          overflow: 'hidden',
          fontFamily: 'var(--t-font)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--t-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t-text)' }}>
            Import Project
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)' }}>
          {(['zip', 'folder'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: tab === t ? 'var(--t-primary)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--t-muted)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--t-font)',
              }}
            >
              {t === 'zip' ? 'Upload ZIP' : 'Folder Path'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {tab === 'zip' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: '2px dashed var(--t-border)',
                borderRadius: 12,
                padding: '32px 16px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <p style={{ color: 'var(--t-text)', fontSize: '0.85rem', marginBottom: 4 }}>
                {isLoading ? 'Importing...' : 'Drop a .zip file here or click to browse'}
              </p>
              <p style={{ color: 'var(--t-muted)', fontSize: '0.7rem' }}>
                Works with Google AI Studio exports
              </p>
            </div>
          )}

          {tab === 'folder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/path/to/react/project"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--t-border)',
                  background: 'var(--t-bg)',
                  color: 'var(--t-text)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--t-font)',
                  outline: 'none',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleFolderImport()}
              />
              <button
                onClick={handleFolderImport}
                disabled={isLoading || !folderPath.trim()}
                style={{
                  padding: '10px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--t-primary)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: folderPath.trim() ? 'pointer' : 'default',
                  opacity: folderPath.trim() ? 1 : 0.5,
                  fontFamily: 'var(--t-font)',
                }}
              >
                {isLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 12 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportModal
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/components/ImportModal.tsx
git commit -m "feat: add ImportModal — ZIP upload + folder path import with drag-drop"
```

---

### Task 7: Frontend — Template Gallery on Welcome Page

**Context:** Add a template gallery section to the Welcome page's action-menu step. When user selects "Load Project" they see template cards they can pick from, or import their own.

**Files:**
- Create: `frontend/src/components/TemplateGallery.tsx`

**Step 1: Create TemplateGallery component**

```tsx
/**
 * TemplateGallery — grid of project template cards.
 *
 * Fetches templates from /api/templates, displays as clickable cards.
 * Selecting a template fetches the full project and calls onSelect.
 */

import React, { useState, useEffect, useCallback } from 'react'
import type { AusProject } from '../types/project'

interface TemplateSummary {
  id: string
  name: string
  description: string
  category: string
  stack: string
  file_count: number
}

interface TemplateGalleryProps {
  onSelect: (project: AusProject) => void
  onImport: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  saas: '#3b82f6',
  game: '#ef4444',
  'ai-tool': '#8b5cf6',
  'ai-demo': '#8b5cf6',
  tool: '#10b981',
  landing: '#f59e0b',
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelect, onImport }) => {
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = useCallback(async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/templates/${id}`)
      if (!res.ok) throw new Error('Failed to load template')
      const project = await res.json() as AusProject
      onSelect(project)
    } catch {
      // ignore
    } finally {
      setLoadingId(null)
    }
  }, [onSelect])

  if (loading) {
    return (
      <p style={{ color: 'var(--t-muted)', fontSize: '0.75rem' }}>
        Loading templates...
      </p>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 600 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
        }}
      >
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            disabled={loadingId !== null}
            style={{
              background: 'var(--t-surface)',
              border: '1px solid var(--t-border)',
              borderRadius: 10,
              padding: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              opacity: loadingId && loadingId !== t.id ? 0.5 : 1,
              fontFamily: 'var(--t-font)',
              transition: 'all 150ms ease',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.6rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: 4,
                background: CATEGORY_COLORS[t.category] || 'var(--t-muted)',
                color: '#fff',
                marginBottom: 6,
              }}
            >
              {t.category}
            </span>
            <p style={{ color: 'var(--t-text)', fontSize: '0.8rem', fontWeight: 600, margin: '4px 0' }}>
              {loadingId === t.id ? 'Loading...' : t.name}
            </p>
            <p style={{ color: 'var(--t-muted)', fontSize: '0.65rem', margin: 0, lineHeight: 1.3 }}>
              {t.description.slice(0, 80)}
            </p>
            <p style={{ color: 'var(--t-muted)', fontSize: '0.6rem', marginTop: 6 }}>
              {t.file_count} files
            </p>
          </button>
        ))}

        {/* Import own project card */}
        <button
          onClick={onImport}
          style={{
            background: 'transparent',
            border: '2px dashed var(--t-border)',
            borderRadius: 10,
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontFamily: 'var(--t-font)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 100,
          }}
        >
          <span style={{ fontSize: '1.2rem', color: 'var(--t-muted)' }}>+</span>
          <p style={{ color: 'var(--t-muted)', fontSize: '0.7rem', marginTop: 4 }}>
            Import your own
          </p>
        </button>
      </div>
    </div>
  )
}

export default TemplateGallery
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/components/TemplateGallery.tsx
git commit -m "feat: add TemplateGallery — grid of project template cards with category badges"
```

---

### Task 8: Frontend — Wire Import, Export, Templates into Studio + Welcome

**Context:** This task wires everything together: adds Import button + Download ZIP button to StudioPage, connects the "Load Project" action on WelcomePage to the template gallery, and adds the `loadProject` flow end-to-end.

**Files:**
- Modify: `frontend/src/pages/StudioPage.tsx` (add Import + Export buttons, import modal)
- Modify: `frontend/src/pages/WelcomePage.tsx` (add template gallery to action-menu step)
- Modify: `frontend/src/App.tsx` (if needed for routing)

**Step 1: Update StudioPage.tsx**

Add imports at the top:

```tsx
import ImportModal from '../components/ImportModal'
```

Inside the StudioPage component, after the existing hooks, add:

```tsx
  const [showImport, setShowImport] = useState(false)
```

Note: `useStudioStream` should now also return `loadProject`. Destructure it:

```tsx
  const {
    messages, files, phases, project, streamingText, isStreaming, error,
    generate, stop, loadProject,
  } = useStudioStream()
```

Add the ZIP export handler:

```tsx
  const handleExportZip = useCallback(async () => {
    if (!project) return
    try {
      const res = await fetch('/api/project/export/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name || 'project'}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    }
  }, [project])
```

In the JSX, add the Import + Export buttons. Before the `<ToolDrawer` component, after the "Talk to VOX" button block, add:

```tsx
      {/* Import button — fixed bottom-left */}
      <button
        onClick={() => setShowImport(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          padding: '10px 16px',
          background: 'var(--t-surface)',
          color: 'var(--t-text)',
          border: '1px solid var(--t-border)',
          borderRadius: 10,
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'var(--t-font)',
          cursor: 'pointer',
          zIndex: 999,
        }}
      >
        Import
      </button>

      {/* Export ZIP button — fixed bottom-left, offset */}
      {project && (
        <button
          onClick={handleExportZip}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 100,
            padding: '10px 16px',
            background: 'var(--t-surface)',
            color: 'var(--t-text)',
            border: '1px solid var(--t-border)',
            borderRadius: 10,
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'var(--t-font)',
            cursor: 'pointer',
            zIndex: 999,
          }}
        >
          Download ZIP
        </button>
      )}

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={loadProject}
      />
```

**Step 2: Update WelcomePage.tsx**

Change the "Load Project" action option from "Coming soon" to functional. Update the `ACTION_OPTIONS`:

```tsx
const ACTION_OPTIONS = [
  { value: 'new-build', label: 'Start New Build', description: "I'll interview you about what to build, then generate a complete app." },
  { value: 'load-project', label: 'Load Project', description: 'Start from a template or import your own React app.' },
  { value: 'guided-tour', label: 'Guided Tour', description: "I'll walk you through everything Vox Code can do. (Coming soon)" },
]
```

Update `handleActionSelect` to navigate to `/studio?mode=load` for load-project:

```tsx
  const handleActionSelect = useCallback((value: string) => {
    setSelected(value)
    setTimeout(() => {
      if (value === 'new-build') {
        navigate('/studio?interview=true')
      } else if (value === 'load-project') {
        navigate('/studio?mode=load')
      } else {
        navigate('/studio')
      }
    }, 500)
  }, [navigate])
```

**Step 3: Add template gallery mode to StudioPage**

In StudioPage, after the `showInterview` line, add:

```tsx
  const showTemplates = searchParams.get('mode') === 'load' && !project
```

Add the template gallery imports:

```tsx
import TemplateGallery from '../components/TemplateGallery'
```

In the JSX, update the ChatPanel/InterviewWizard conditional to include the template mode:

```tsx
          {showInterview ? (
            <InterviewWizard
              onComplete={handleInterviewComplete}
              onSkip={handleInterviewSkip}
            />
          ) : showTemplates ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto" style={{ background: 'var(--t-bg)' }}>
              <h2 style={{ color: 'var(--t-text)', fontSize: '1rem', fontWeight: 600, marginBottom: 16, fontFamily: 'var(--t-font)' }}>
                Choose a template or import your project
              </h2>
              <TemplateGallery
                onSelect={(p) => { loadProject(p); setSearchParams({}, { replace: true }) }}
                onImport={() => setShowImport(true)}
              />
            </div>
          ) : (
            <ChatPanel ... />
          )}
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit`

**Step 5: Commit**

```bash
git add frontend/src/pages/StudioPage.tsx frontend/src/pages/WelcomePage.tsx
git commit -m "feat: wire import/export/templates — Import modal, Download ZIP, template gallery on Welcome"
```

---

### Task 9: Backend — VOX Tools Update (load_template + add_blueprint)

**Context:** Expand VOX's function tools from 6 to 8, adding `load_template` and `add_blueprint`. These let VOX load templates and add blueprints by voice command.

**Files:**
- Modify: `server/services/vox_session.py` (add 2 tool declarations)
- Modify: `server/services/vox_tools.py` (add 2 tool handlers)

**Step 1: Add tool declarations to vox_session.py**

In `_build_tool_declarations()`, add two more entries to the return list (after `search_tools`):

```python
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
```

**Step 2: Add tool handlers to vox_tools.py**

Add two new methods to `VoxToolDispatcher`:

```python
    async def _tool_load_template(self, args: dict[str, Any]) -> dict[str, Any]:
        """Load a project template."""
        template_id = args.get("template_id", "")
        if not template_id:
            return {"error": "No template_id provided"}

        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "load_template",
                "template_id": template_id,
            })

        return {"status": "template_loading", "template_id": template_id}

    async def _tool_add_blueprint(self, args: dict[str, Any]) -> dict[str, Any]:
        """Add a blueprint to the current project."""
        blueprint_id = args.get("blueprint_id", "")
        if not blueprint_id:
            return {"error": "No blueprint_id provided"}

        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "add_blueprint",
                "blueprint_id": blueprint_id,
            })

        return {"status": "blueprint_added", "blueprint_id": blueprint_id}
```

**Step 3: Verify**

```bash
python3 -c "import ast; ast.parse(open('server/services/vox_session.py').read()); print('OK')"
python3 -c "import ast; ast.parse(open('server/services/vox_tools.py').read()); print('OK')"
```

**Step 4: Commit**

```bash
git add server/services/vox_session.py server/services/vox_tools.py
git commit -m "feat: expand VOX tools to 8 — add load_template + add_blueprint voice commands"
```

---

### Task 10: Integration Verification

**Context:** Verify the complete system: all Python files parse, TypeScript compiles, imports resolve, templates load, endpoints respond.

**Files:** No files to create/modify.

**Step 1: Verify all Python files parse**

```bash
python3 -c "
import ast
files = [
    'server/services/project_importer.py',
    'server/services/project_exporter.py',
    'server/routers/project.py',
    'server/routers/templates.py',
    'server/services/vox_session.py',
    'server/services/vox_tools.py',
    'server/app.py',
]
for f in files:
    ast.parse(open(f).read())
    print(f'  OK: {f}')
print('All Python files parse successfully')
"
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && node node_modules/typescript/bin/tsc --noEmit`

**Step 3: Verify import chain**

```bash
PYTHONPATH=. python3 -c "
from server.services.project_importer import import_from_folder, import_from_zip
from server.services.project_exporter import export_to_zip
from server.routers.project import router as project_router
from server.routers.templates import router as templates_router
print('All imports OK')
"
```

**Step 4: Test importer with a real app**

```bash
PYTHONPATH=. python3 -c "
from server.services.project_importer import import_from_folder
p = import_from_folder('docs/React/snake')
print(f'Name: {p[\"name\"]}')
print(f'Stack: {p[\"stack\"]}')
print(f'Files: {len(p[\"files\"])}')
print(f'Deps: {list(p[\"frontend_deps\"].keys())[:5]}')
"
```

**Step 5: Test exporter round-trip**

```bash
PYTHONPATH=. python3 -c "
from server.services.project_importer import import_from_folder
from server.services.project_exporter import export_to_zip
p = import_from_folder('docs/React/gemini-ai-translator')
z = export_to_zip(p)
print(f'ZIP size: {len(z)} bytes')
import zipfile, io
with zipfile.ZipFile(io.BytesIO(z)) as zf:
    print(f'ZIP entries: {len(zf.namelist())}')
    for n in sorted(zf.namelist())[:10]:
        print(f'  {n}')
"
```

**Step 6: Verify templates exist**

```bash
ls -la server/templates/*.json | wc -l
ls -la server/blueprints/*.json | wc -l
```

**Step 7: Restart servers and manual smoke test**

Kill existing, restart backend on 8001 and frontend via vite. Test:

1. Welcome flow → "Load Project" → template gallery appears
2. Click a template → project loads in Studio → Sandpack renders it
3. Import button → ZIP upload → project loads
4. Import button → folder path → project loads
5. Download ZIP → saves a .zip file
6. VOX voice: "load the snake template" → template loads
