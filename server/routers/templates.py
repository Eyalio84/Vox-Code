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
