"""A(Us) Studio FastAPI server.

Thin wrapper that exposes the SDK via HTTP endpoints.
Run with: uvicorn server.app:app --reload
"""

from __future__ import annotations

import os
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from aus import Studio
from aus.models import Project, Spec, GenerationResult
from server.routers.welcome import router as welcome_router
from server.routers.studio import router as studio_router
from server.routers.recommend import router as recommend_router
from server.routers.synthesize import router as synthesize_router
from server.routers.vox_live import router as vox_live_router
from server.services.tts_service import tts

log = logging.getLogger("aus.server")


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.studio = Studio(gemini_key=GEMINI_KEY, anthropic_key=ANTHROPIC_KEY)
    app.state.tts_ready = False
    app.state.boot_status = "Initializing..."
    log.info("Loading TTS service...")
    app.state.boot_status = "Loading voice library..."
    await tts.aload()
    app.state.boot_status = "Pre-caching voices..."
    await tts.aprecache()
    app.state.tts_ready = True
    app.state.boot_status = "Ready"
    log.info("A(Us) Studio server started (TTS ready)")
    yield


app = FastAPI(
    title="A(Us) Studio",
    description="Collaborative full-stack app generation. Not AI, Us.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(welcome_router)
app.include_router(studio_router)
app.include_router(recommend_router)
app.include_router(synthesize_router)
app.include_router(vox_live_router)


def get_studio() -> Studio:
    return app.state.studio


# ---------------------------------------------------------------------------
# Request/Response schemas
# ---------------------------------------------------------------------------


class CreateRequest(BaseModel):
    request: str
    spec: Spec | None = None


class RefineRequest(BaseModel):
    project: Project
    request: str


class ExportRequest(BaseModel):
    project: Project
    output_dir: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "0.1.0",
        "name": "Vox Code",
        "ready": getattr(app.state, "tts_ready", False),
        "boot_status": getattr(app.state, "boot_status", "Initializing..."),
        "providers": {
            "gemini": bool(GEMINI_KEY),
            "claude": bool(ANTHROPIC_KEY),
        },
    }


@app.post("/api/create", response_model=GenerationResult)
async def create_project(req: CreateRequest):
    """Generate a new full-stack application."""
    try:
        result = await get_studio().create(req.request, req.spec)
        return result
    except Exception as e:
        log.exception("Generation failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/refine", response_model=GenerationResult)
async def refine_project(req: RefineRequest):
    """Refine an existing project."""
    try:
        result = await get_studio().refine(req.project, req.request)
        return result
    except Exception as e:
        log.exception("Refinement failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export")
async def export_project(req: ExportRequest):
    """Export project files to disk."""
    try:
        path = get_studio().export(req.project, req.output_dir)
        return {"path": str(path), "file_count": req.project.file_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stacks")
async def list_stacks():
    """List available tech stacks."""
    return {
        "stacks": [
            {
                "id": "react-fastapi",
                "name": "React + FastAPI",
                "description": "Full-stack: React 19 + TypeScript + Vite + Tailwind + FastAPI + SQLModel",
            },
            {
                "id": "react-only",
                "name": "React Only",
                "description": "Frontend only: React 19 + TypeScript + Vite + Tailwind",
            },
            {
                "id": "fastapi-only",
                "name": "FastAPI Only",
                "description": "Backend only: FastAPI + Pydantic v2 + SQLModel",
            },
        ]
    }
