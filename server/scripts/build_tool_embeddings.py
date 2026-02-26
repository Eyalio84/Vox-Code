"""Build tool embeddings index — run once, output to server/tool_embeddings.json.

Usage: GEMINI_API_KEY=... python3.13 -m server.scripts.build_tool_embeddings
"""

from __future__ import annotations

import asyncio
import json
import os

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "tool_catalog.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "tool_embeddings.json")
BATCH_SIZE = 20


async def main() -> None:
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        print("ERROR: Set GEMINI_API_KEY")
        return

    client = genai.Client(api_key=api_key)

    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    print(f"Embedding {len(catalog)} tools...")

    results: list[dict] = []
    for i in range(0, len(catalog), BATCH_SIZE):
        batch = catalog[i:i + BATCH_SIZE]
        texts = [f"{t['name']}: {t['description']}" for t in batch]

        response = await client.aio.models.embed_content(
            model="gemini-embedding-001",
            contents=texts,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=768,
            ),
        )

        for tool, emb in zip(batch, response.embeddings):
            results.append({
                "id": tool["id"],
                "name": tool["name"],
                "description": tool["description"],
                "domains": tool.get("domains", []),
                "category": tool.get("category", "library"),
                "embedding": [round(v, 6) for v in emb.values],
            })

        print(f"  {min(i + BATCH_SIZE, len(catalog))}/{len(catalog)} tools embedded")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f)

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"Saved {len(results)} embeddings to {OUTPUT_PATH} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    asyncio.run(main())
