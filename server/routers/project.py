"""Project import/export endpoints.

POST /api/project/import/folder — import from folder path
POST /api/project/import/zip    — import from ZIP upload
POST /api/project/export/zip    — export AusProject as downloadable ZIP
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, UploadFile, HTTPException
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
