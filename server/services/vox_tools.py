"""VOX function call dispatcher — implements the 8 tools VOX can invoke.

Each function receives args from Gemini and returns a dict result.
Results are sent back to Gemini as FunctionResponse.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any

log = logging.getLogger("aus.vox.tools")

# Tool catalog is loaded from a JSON snapshot (generated from frontend registry)
# This avoids importing TypeScript. We maintain a Python-side catalog.
TOOL_CATALOG: list[dict[str, Any]] = []
_catalog_loaded = False


def _ensure_catalog() -> None:
    """Load the tool catalog from the JSON snapshot on first use."""
    global _catalog_loaded, TOOL_CATALOG
    if _catalog_loaded:
        return
    catalog_path = os.path.join(
        os.path.dirname(__file__), "..", "tool_catalog.json"
    )
    try:
        with open(catalog_path) as f:
            TOOL_CATALOG = json.load(f)
        _catalog_loaded = True
        log.info("Loaded %d tools from catalog", len(TOOL_CATALOG))
    except FileNotFoundError:
        log.warning("tool_catalog.json not found — search_tools will return empty")
        _catalog_loaded = True


class VoxToolDispatcher:
    """Dispatches VOX function calls to their implementations."""

    def __init__(
        self,
        gemini_key: str = "",
        studio: Any = None,
        project_getter: Any = None,
        ui_action_sender: Any = None,
    ) -> None:
        self._gemini_key = gemini_key or os.environ.get("GEMINI_API_KEY", "")
        self._studio = studio
        self._get_project = project_getter
        self._send_ui_action = ui_action_sender

    async def dispatch(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        """Route a function call to the right handler."""
        handler = getattr(self, f"_tool_{name}", None)
        if not handler:
            return {"error": f"Unknown tool: {name}"}
        return await handler(args)

    async def _tool_recommend_tools(self, args: dict[str, Any]) -> dict[str, Any]:
        """Get AI-powered tool recommendations."""
        summary = args.get("project_summary", "")
        if not self._gemini_key:
            return {"recommendations": [], "error": "No API key"}

        try:
            from google import genai

            client = genai.Client(api_key=self._gemini_key)

            _ensure_catalog()
            tool_names = [t["id"] for t in TOOL_CATALOG[:50]]
            prompt = (
                f"You are an expert developer tool recommender. "
                f"Given this project: {summary}\n"
                f"Recommend 3-5 tools from: {', '.join(tool_names)}\n"
                f"Return JSON array: [{{\"toolId\": \"...\", \"reason\": \"...\"}}]"
            )

            raw = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model="gemini-2.0-flash", contents=prompt,
                ),
                timeout=5.0,
            )
            text = (raw.text or "").strip()
            # Strip markdown fences
            if text.startswith("```"):
                text = text[text.index("\n") + 1:]
            if text.endswith("```"):
                text = text[:-3].strip()

            recs = json.loads(text) if text else []
            return {"recommendations": recs[:5]}

        except Exception as e:
            log.exception("recommend_tools failed")
            return {"recommendations": [], "error": str(e)}

    async def _tool_generate_app(self, args: dict[str, Any]) -> dict[str, Any]:
        """Trigger app generation via the SDK pipeline."""
        prompt = args.get("prompt", "")
        if not prompt:
            return {"error": "No prompt provided"}
        if not self._studio:
            return {"error": "Studio not available"}

        # Fire-and-forget: generation runs in background, results flow via SSE
        # We notify the frontend to watch the studio stream
        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "generate",
                "prompt": prompt,
            })

        return {"status": "generation_started", "prompt": prompt}

    async def _tool_add_tool(self, args: dict[str, Any]) -> dict[str, Any]:
        """Add a tool to the current project."""
        tool_id = args.get("tool_id", "")
        if not tool_id:
            return {"error": "No tool_id provided"}

        _ensure_catalog()
        tool = next((t for t in TOOL_CATALOG if t["id"] == tool_id), None)
        if not tool:
            return {"error": f"Tool '{tool_id}' not found in catalog"}

        # Send UI action to trigger tool integration
        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "add_tool",
                "tool_id": tool_id,
                "tool_name": tool.get("name", tool_id),
                "integration_prompt": tool.get("integrationPrompt", ""),
            })

        return {
            "status": "tool_added",
            "tool_id": tool_id,
            "tool_name": tool.get("name", tool_id),
        }

    async def _tool_navigate_ui(self, args: dict[str, Any]) -> dict[str, Any]:
        """Navigate the Studio UI."""
        target = args.get("target", "studio")
        if self._send_ui_action:
            await self._send_ui_action({
                "type": "ui_action",
                "action": "navigate",
                "target": target,
            })
        return {"status": "navigated", "target": target}

    async def _tool_get_project_status(self, args: dict[str, Any]) -> dict[str, Any]:
        """Get current project state."""
        if not self._get_project:
            return {"status": "no_project", "files": 0}

        project = self._get_project()
        if not project:
            return {"status": "no_project", "files": 0}

        return {
            "status": "active",
            "name": project.get("name", "Untitled"),
            "files": len(project.get("files", [])),
            "stack": project.get("stack", "unknown"),
            "frontend_deps": list(project.get("frontend_deps", {}).keys()),
            "backend_deps": list(project.get("backend_deps", {}).keys()),
        }

    async def _tool_search_tools(self, args: dict[str, Any]) -> dict[str, Any]:
        """Search the tool catalog."""
        query = args.get("query", "").lower()
        domain = args.get("domain", "")

        _ensure_catalog()

        results = TOOL_CATALOG
        if domain:
            results = [t for t in results if domain in t.get("domains", [])]
        if query:
            results = [
                t for t in results
                if query in t.get("id", "").lower()
                or query in t.get("name", "").lower()
                or query in t.get("description", "").lower()
            ]

        # Return top 10
        return {
            "tools": [
                {
                    "id": t["id"],
                    "name": t["name"],
                    "description": t["description"][:100],
                    "category": t.get("category", "library"),
                    "domains": t.get("domains", []),
                }
                for t in results[:10]
            ],
            "total": len(results),
        }

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
