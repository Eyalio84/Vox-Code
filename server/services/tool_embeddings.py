"""Semantic tool search using Gemini embeddings.

Pre-computed embeddings for tools (768-dim).
Query embedding computed on-the-fly via Gemini Embedding API.
Cosine similarity ranking — no numpy needed.
"""

from __future__ import annotations

import json
import math
import os
import logging
from typing import Any

log = logging.getLogger("aus.tool_embeddings")

EMBEDDINGS_PATH = os.path.join(os.path.dirname(__file__), "..", "tool_embeddings.json")
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768

# Lazy-loaded cache
_tool_embeddings: dict[str, list[float]] | None = None
_tool_metadata: dict[str, dict[str, Any]] | None = None


def _load_embeddings() -> None:
    """Load pre-computed embeddings on first use."""
    global _tool_embeddings, _tool_metadata
    if _tool_embeddings is not None:
        return
    try:
        with open(EMBEDDINGS_PATH) as f:
            data = json.load(f)
        _tool_embeddings = {item["id"]: item["embedding"] for item in data}
        _tool_metadata = {item["id"]: item for item in data}
        log.info("Loaded %d tool embeddings (%d-dim)", len(_tool_embeddings), EMBEDDING_DIM)
    except FileNotFoundError:
        log.warning("tool_embeddings.json not found — semantic search unavailable")
        _tool_embeddings = {}
        _tool_metadata = {}


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Pure-Python cosine similarity. No numpy needed."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


async def embed_query(query: str, api_key: str) -> list[float]:
    """Embed a search query using Gemini Embedding API."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    result = await client.aio.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=query,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=EMBEDDING_DIM,
        ),
    )
    return result.embeddings[0].values


async def search_tools_semantic(
    query: str, api_key: str, top_k: int = 10, domain: str = ""
) -> list[dict[str, Any]]:
    """Semantic search: embed query, rank tools by cosine similarity."""
    _load_embeddings()
    if not _tool_embeddings:
        return []

    query_embedding = await embed_query(query, api_key)

    scored = []
    for tool_id, tool_emb in _tool_embeddings.items():
        if domain and _tool_metadata:
            meta = _tool_metadata.get(tool_id, {})
            if domain not in meta.get("domains", []):
                continue
        score = _cosine_similarity(query_embedding, tool_emb)
        scored.append((tool_id, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    results = []
    for tool_id, score in scored[:top_k]:
        meta = (_tool_metadata or {}).get(tool_id, {})
        results.append({
            "id": tool_id,
            "name": meta.get("name", tool_id),
            "description": meta.get("description", "")[:100],
            "category": meta.get("category", "library"),
            "domains": meta.get("domains", []),
            "score": round(score, 4),
        })
    return results
