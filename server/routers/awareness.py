from __future__ import annotations

import logging
from fastapi import APIRouter
from pydantic import BaseModel

from server.services.vox_awareness import vox_awareness

logger = logging.getLogger("aus.routers.awareness")
router = APIRouter(prefix="/api/awareness", tags=["awareness"])


class PageVisitBody(BaseModel):
    page: str
    metadata: dict | None = None


class ErrorLogBody(BaseModel):
    error_type: str
    message: str
    page: str = ""


class ContextBody(BaseModel):
    key: str
    value: str


@router.post("/page")
def api_log_page(body: PageVisitBody):
    vox_awareness.log_page_visit(body.page, body.metadata)
    return {"ok": True}


@router.post("/error")
def api_log_error(body: ErrorLogBody):
    vox_awareness.log_error(body.error_type, body.message, body.page)
    return {"ok": True}


@router.post("/context")
def api_set_context(body: ContextBody):
    vox_awareness.set_context(body.key, body.value)
    return {"ok": True}


@router.get("")
def api_get_awareness():
    return vox_awareness.get_snapshot()
