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
