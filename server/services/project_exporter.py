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
