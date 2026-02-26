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


async def _get_semantic_candidates(summary: str, top_k: int = 30) -> list[str]:
    """Pre-filter tools using semantic search before LLM ranking."""
    try:
        from server.services.tool_embeddings import search_tools_semantic
        results = await search_tools_semantic(summary, GEMINI_KEY, top_k=top_k)
        return [r["id"] for r in results]
    except Exception:
        return list(AVAILABLE_TOOLS)


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


def _build_prompt(req: RecommendRequest, tool_ids: list[str] | None = None) -> str:
    """Build the recommendation prompt with project context."""
    tools_list = ", ".join(tool_ids or AVAILABLE_TOOLS)
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

    candidates = await _get_semantic_candidates(req.spec_summary)
    prompt = _build_prompt(req, candidates)

    try:
        # Lazy import — heavy SDK
        from google import genai

        client = genai.Client(api_key=GEMINI_KEY)

        raw = await asyncio.wait_for(
            client.aio.models.generate_content(
                model="gemini-3-flash-preview",
                contents=prompt,
            ),
            timeout=5.0,
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
