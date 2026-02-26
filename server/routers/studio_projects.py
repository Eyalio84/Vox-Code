"""Project persistence REST API with versioning.

CRUD endpoints for studio projects and snapshot-based version history.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from server.services.studio_persistence import (
    create_project,
    list_projects,
    get_project,
    update_project,
    delete_project,
    save_version,
    list_versions,
    restore_version,
)

logger = logging.getLogger("aus.routers.studio_projects")
router = APIRouter(prefix="/api/projects", tags=["projects"])


class CreateProjectBody(BaseModel):
    name: str = "Untitled Project"
    description: str = ""
    stack: str = "REACT_ONLY"
    files: dict = {}
    frontend_deps: dict = {}
    backend_deps: dict = {}


class UpdateProjectBody(BaseModel):
    name: str | None = None
    description: str | None = None
    stack: str | None = None
    complexity: str | None = None
    files: dict | None = None
    frontend_deps: dict | None = None
    backend_deps: dict | None = None


class SaveVersionBody(BaseModel):
    message: str = ""


@router.post("")
def api_create_project(body: CreateProjectBody):
    return create_project(
        name=body.name,
        description=body.description,
        stack=body.stack,
        files=body.files,
        frontend_deps=body.frontend_deps,
        backend_deps=body.backend_deps,
    )


@router.get("")
def api_list_projects():
    return list_projects()


@router.get("/{project_id}")
def api_get_project(project_id: str):
    p = get_project(project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return p


@router.put("/{project_id}")
def api_update_project(project_id: str, body: UpdateProjectBody):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_project(project_id, data):
        raise HTTPException(404, "Project not found")
    return get_project(project_id)


@router.delete("/{project_id}")
def api_delete_project(project_id: str):
    if not delete_project(project_id):
        raise HTTPException(404, "Project not found")
    return {"ok": True}


@router.post("/{project_id}/save")
def api_save_version(project_id: str, body: SaveVersionBody):
    v = save_version(project_id, body.message)
    if not v:
        raise HTTPException(404, "Project not found")
    return v


@router.get("/{project_id}/versions")
def api_list_versions(project_id: str):
    return list_versions(project_id)


@router.post("/{project_id}/versions/{version_number}/restore")
def api_restore_version(project_id: str, version_number: int):
    p = restore_version(project_id, version_number)
    if not p:
        raise HTTPException(404, "Version not found")
    return p
