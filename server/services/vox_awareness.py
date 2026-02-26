"""VOX Awareness Service — tracks page visits, errors, and session context.

Provides a SQLite-backed awareness layer that VOX uses to understand
what the user is doing in the workspace. The build_awareness_prompt()
method generates a concise context string injected into VOX's system
instruction so it can give contextually relevant responses.
"""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "vox_awareness.db"


class VoxAwareness:
    def __init__(self):
        self._session_start = time.time()
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self._get_conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS page_visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page TEXT NOT NULL,
                timestamp REAL NOT NULL,
                duration REAL,
                metadata TEXT DEFAULT '{}'
            );
            CREATE TABLE IF NOT EXISTS error_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_type TEXT NOT NULL,
                message TEXT NOT NULL,
                page TEXT DEFAULT '',
                timestamp REAL NOT NULL,
                resolved INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS session_context (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at REAL NOT NULL
            );
        """)
        conn.close()

    def log_page_visit(self, page: str, metadata: dict | None = None):
        """Log a page visit. Also updates duration of previous visit."""
        now = time.time()
        conn = self._get_conn()
        # Update duration of last visit
        last = conn.execute(
            "SELECT id, timestamp FROM page_visits ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if last:
            conn.execute(
                "UPDATE page_visits SET duration = ? WHERE id = ?",
                (now - last["timestamp"], last["id"]),
            )
        conn.execute(
            "INSERT INTO page_visits (page, timestamp, metadata) VALUES (?, ?, ?)",
            (page, now, json.dumps(metadata or {})),
        )
        conn.commit()
        conn.close()

    def log_error(self, error_type: str, message: str, page: str = ""):
        """Log an error."""
        conn = self._get_conn()
        conn.execute(
            "INSERT INTO error_log (error_type, message, page, timestamp) VALUES (?, ?, ?, ?)",
            (error_type, message, page, time.time()),
        )
        conn.commit()
        conn.close()

    def resolve_error(self, error_id: int):
        """Mark an error as resolved."""
        conn = self._get_conn()
        conn.execute("UPDATE error_log SET resolved = 1 WHERE id = ?", (error_id,))
        conn.commit()
        conn.close()

    def set_context(self, key: str, value: str):
        """Set a session context value."""
        conn = self._get_conn()
        conn.execute(
            "INSERT OR REPLACE INTO session_context (key, value, updated_at) VALUES (?, ?, ?)",
            (key, value, time.time()),
        )
        conn.commit()
        conn.close()

    def get_context(self, key: str) -> str | None:
        """Get a session context value."""
        conn = self._get_conn()
        row = conn.execute(
            "SELECT value FROM session_context WHERE key = ?", (key,)
        ).fetchone()
        conn.close()
        return row["value"] if row else None

    def get_recent_pages(self, limit: int = 5) -> list[dict]:
        """Get recent page visits."""
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT page, timestamp, duration, metadata FROM page_visits ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_unresolved_errors(self, limit: int = 3) -> list[dict]:
        """Get unresolved errors."""
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT id, error_type, message, page, timestamp FROM error_log "
            "WHERE resolved = 0 ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_page_stats(self) -> dict[str, int]:
        """Get page visit counts, most visited first."""
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT page, COUNT(*) as cnt FROM page_visits GROUP BY page ORDER BY cnt DESC"
        ).fetchall()
        conn.close()
        return {r["page"]: r["cnt"] for r in rows}

    def build_awareness_prompt(self) -> str:
        """Build a context prompt summarizing workspace awareness for VOX."""
        parts = []
        # 1. Current page (with duration)
        recent = self.get_recent_pages(1)
        if recent:
            current = recent[0]
            duration = current.get("duration") or (time.time() - current["timestamp"])
            parts.append(f"Current page: {current['page']} (on page for {int(duration)}s)")
        # 2. Recent page history
        history = self.get_recent_pages(5)
        if len(history) > 1:
            pages = [h["page"] for h in history[1:]]
            parts.append(f"Recent pages: {' -> '.join(reversed(pages))}")
        # 3. Unresolved errors
        errors = self.get_unresolved_errors(3)
        if errors:
            parts.append(
                f"Errors ({len(errors)}): "
                + "; ".join(f"[{e['error_type']}] {e['message'][:80]}" for e in errors)
            )
        # 4. Active project context
        active_project = self.get_context("active_project")
        if active_project:
            parts.append(f"Active project: {active_project}")
        # 5. Session duration
        dur = int(time.time() - self._session_start)
        parts.append(f"Session: {dur // 60}m {dur % 60}s")
        # 6. Most visited
        stats = self.get_page_stats()
        if stats:
            top3 = list(stats.items())[:3]
            parts.append(f"Most visited: {', '.join(f'{p}({c})' for p, c in top3)}")
        return "\n".join(parts) if parts else "No context yet."

    def get_snapshot(self) -> dict:
        """Get full awareness snapshot for API."""
        conn = self._get_conn()
        context_rows = conn.execute("SELECT key, value FROM session_context").fetchall()
        conn.close()
        return {
            "prompt": self.build_awareness_prompt(),
            "recent_pages": self.get_recent_pages(5),
            "errors": self.get_unresolved_errors(5),
            "context": {row["key"]: row["value"] for row in context_rows},
        }


# Singleton
vox_awareness = VoxAwareness()
