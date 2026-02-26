"""SQLite project persistence service with versioning.

Provides CRUD operations for studio projects and snapshot-based
version history.  The database file (studio_projects.db) is created
automatically next to the server package on first import.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "studio_projects.db"


# ---------------------------------------------------------------------------
# Connection helper
# ---------------------------------------------------------------------------

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# ---------------------------------------------------------------------------
# Schema bootstrap
# ---------------------------------------------------------------------------

def init_db():
    """Create tables if they don't exist."""
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS studio_projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT 'Untitled Project',
            description TEXT NOT NULL DEFAULT '',
            stack TEXT NOT NULL DEFAULT 'REACT_ONLY',
            complexity TEXT NOT NULL DEFAULT 'STANDARD',
            files TEXT NOT NULL DEFAULT '{}',
            frontend_deps TEXT NOT NULL DEFAULT '{}',
            backend_deps TEXT NOT NULL DEFAULT '{}',
            current_version INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS studio_versions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            files TEXT NOT NULL DEFAULT '{}',
            message TEXT NOT NULL DEFAULT '',
            timestamp TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES studio_projects(id) ON DELETE CASCADE
        );
    """)
    conn.close()


# ---------------------------------------------------------------------------
# Project CRUD
# ---------------------------------------------------------------------------

def create_project(
    name: str,
    description: str,
    stack: str,
    files: dict,
    frontend_deps: dict,
    backend_deps: dict,
) -> dict:
    """Create a new project and return it."""
    project_id = uuid.uuid4().hex[:12]
    now = datetime.utcnow().isoformat()
    conn = _get_conn()
    conn.execute(
        "INSERT INTO studio_projects "
        "(id, name, description, stack, files, frontend_deps, backend_deps, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            project_id,
            name,
            description,
            stack,
            json.dumps(files),
            json.dumps(frontend_deps),
            json.dumps(backend_deps),
            now,
            now,
        ),
    )
    conn.commit()
    conn.close()
    return get_project(project_id)


def list_projects() -> list[dict]:
    """List all projects (summaries only, no files)."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT id, name, description, stack, complexity, "
        "current_version, created_at, updated_at "
        "FROM studio_projects ORDER BY updated_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_project(project_id: str) -> dict | None:
    """Get full project with parsed JSON fields."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM studio_projects WHERE id = ?", (project_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["files"] = json.loads(d["files"])
    d["frontend_deps"] = json.loads(d["frontend_deps"])
    d["backend_deps"] = json.loads(d["backend_deps"])
    return d


def update_project(project_id: str, data: dict) -> bool:
    """Partial update of a project.

    Only the keys present in *data* that belong to the allowed set are
    applied.  Dict/list values are automatically JSON-serialised.
    """
    allowed = {
        "name", "description", "stack", "complexity",
        "files", "frontend_deps", "backend_deps",
    }
    updates: dict[str, str] = {}
    for k, v in data.items():
        if k in allowed:
            updates[k] = json.dumps(v) if isinstance(v, (dict, list)) else v
    if not updates:
        return False
    updates["updated_at"] = datetime.utcnow().isoformat()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [project_id]
    conn = _get_conn()
    cursor = conn.execute(
        f"UPDATE studio_projects SET {set_clause} WHERE id = ?", values
    )
    conn.commit()
    changed = cursor.rowcount > 0
    conn.close()
    return changed


def delete_project(project_id: str) -> bool:
    """Delete a project and all its versions (cascade)."""
    conn = _get_conn()
    cursor = conn.execute(
        "DELETE FROM studio_projects WHERE id = ?", (project_id,)
    )
    conn.commit()
    changed = cursor.rowcount > 0
    conn.close()
    return changed


# ---------------------------------------------------------------------------
# Version management
# ---------------------------------------------------------------------------

def save_version(project_id: str, message: str = "") -> dict | None:
    """Snapshot the current files as a new version."""
    project = get_project(project_id)
    if not project:
        return None
    version_num = project["current_version"] + 1
    version_id = uuid.uuid4().hex[:12]
    now = datetime.utcnow().isoformat()
    conn = _get_conn()
    conn.execute(
        "INSERT INTO studio_versions "
        "(id, project_id, version_number, files, message, timestamp) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            version_id,
            project_id,
            version_num,
            json.dumps(project["files"]),
            message,
            now,
        ),
    )
    conn.execute(
        "UPDATE studio_projects SET current_version = ?, updated_at = ? WHERE id = ?",
        (version_num, now, project_id),
    )
    conn.commit()
    conn.close()
    return {
        "id": version_id,
        "project_id": project_id,
        "version_number": version_num,
        "message": message,
        "timestamp": now,
    }


def list_versions(project_id: str) -> list[dict]:
    """List all versions for a project (newest first)."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT id, version_number, message, timestamp "
        "FROM studio_versions WHERE project_id = ? "
        "ORDER BY version_number DESC",
        (project_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def restore_version(project_id: str, version_number: int) -> dict | None:
    """Restore a previous version.

    Automatically saves the current state before overwriting files so
    the user never loses work.
    """
    conn = _get_conn()
    row = conn.execute(
        "SELECT files FROM studio_versions "
        "WHERE project_id = ? AND version_number = ?",
        (project_id, version_number),
    ).fetchone()
    if not row:
        conn.close()
        return None
    conn.close()

    # Auto-save current state before restore
    save_version(project_id, f"Auto-save before restore to v{version_number}")

    now = datetime.utcnow().isoformat()
    conn = _get_conn()
    conn.execute(
        "UPDATE studio_projects SET files = ?, updated_at = ? WHERE id = ?",
        (row["files"], now, project_id),
    )
    conn.commit()
    conn.close()
    return get_project(project_id)


# ---------------------------------------------------------------------------
# Auto-initialise on import
# ---------------------------------------------------------------------------
init_db()
