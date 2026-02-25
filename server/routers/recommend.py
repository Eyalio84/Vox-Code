"""Tool recommendation router — Gemini Flash powered."""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/studio", tags=["tools"])
log = logging.getLogger("aus.server.recommend")

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")

AVAILABLE_TOOLS = [
    "langchain-js",
    "vercel-ai-sdk",
    "transformers-js",
    "chroma",
    "qdrant",
    "d3-js",
    "plotly-js",
    "echarts",
    "cytoscape",
    "sqlalchemy-2",
    "alembic",
    "redis",
    "pycasbin",
    "docker",
    "github-actions",
    "dotenvx",
    "ag-grid",
    "codemirror-6",
    "skill-rag-pipeline",
    "skill-auth-rbac",
    "skill-cicd",
]


class RecommendRequest(BaseModel):
    spec_summary: str
    file_paths: list[str] = []
    theme: str = "expert"
    existing_deps: dict[str, dict[str, str]] = {}


class ToolRecommendation(BaseModel):
    toolId: str
    reason: str
    priority: int


class RecommendResponse(BaseModel):
    recommendations: list[ToolRecommendation] = []


def _build_prompt(req: RecommendRequest) -> str:
    """Build the recommendation prompt with project context."""
    tools_list = ", ".join(AVAILABLE_TOOLS)
    parts = [
        "You are an expert developer tool recommender.",
        f"Given the following project context, recommend relevant tools from this list: {tools_list}",
        "",
        f"Project summary: {req.spec_summary}",
    ]
    if req.file_paths:
        parts.append(f"File paths: {', '.join(req.file_paths)}")
    if req.existing_deps:
        parts.append(f"Existing dependencies: {json.dumps(req.existing_deps)}")
    parts.append(f"Theme: {req.theme}")
    parts.append("")
    parts.append(
        "Return a JSON array of objects with keys: toolId, reason, priority (1=highest)."
    )
    parts.append("Only recommend tools that are genuinely useful for this project.")
    parts.append("Return ONLY the JSON array, no markdown fences or extra text.")
    return "\n".join(parts)


def _parse_recommendations(text: str) -> list[ToolRecommendation]:
    """Parse Gemini response text into validated ToolRecommendation list."""
    # Strip markdown fences if present
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Remove opening fence (with optional language tag)
        first_newline = cleaned.index("\n")
        cleaned = cleaned[first_newline + 1 :]
    if cleaned.endswith("```"):
        cleaned = cleaned[: -3]
    cleaned = cleaned.strip()

    items = json.loads(cleaned)
    if not isinstance(items, list):
        return []

    recommendations: list[ToolRecommendation] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        if "toolId" not in item or "reason" not in item or "priority" not in item:
            continue
        recommendations.append(
            ToolRecommendation(
                toolId=str(item["toolId"]),
                reason=str(item["reason"]),
                priority=int(item["priority"]),
            )
        )
    return recommendations


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_tools(req: RecommendRequest) -> RecommendResponse:
    """Recommend tools for a project using Gemini Flash."""
    if not GEMINI_KEY:
        log.warning("GEMINI_API_KEY not set, returning empty recommendations")
        return RecommendResponse()

    prompt = _build_prompt(req)

    try:
        # Lazy import — heavy SDK
        from google import genai

        client = genai.Client(api_key=GEMINI_KEY)

        raw = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.0-flash",
                contents=prompt,
            ),
            timeout=3.0,
        )

        text = raw.text or ""
        if not text.strip():
            log.warning("Empty response from Gemini Flash")
            return RecommendResponse()

        recommendations = _parse_recommendations(text)
        return RecommendResponse(recommendations=recommendations)

    except asyncio.TimeoutError:
        log.warning("Gemini Flash recommendation timed out (3s)")
        return RecommendResponse()
    except Exception:
        log.exception("Recommendation failed")
        return RecommendResponse()
