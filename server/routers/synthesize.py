"""Interview synthesis router — LLM-powered PRD + Design Brief generation."""

from __future__ import annotations

import asyncio
import json
import logging
import os

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/studio", tags=["interview"])
log = logging.getLogger("aus.server.synthesize")

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


class SynthesizeRequest(BaseModel):
    domain: str = "webapp"
    answers: dict[str, str] = {}
    model: str = "gemini"


class SynthesizeResponse(BaseModel):
    prd: str = ""
    design_brief: str = ""
    summary: str = ""
    generation_prompt: str = ""


SYNTHESIS_SYSTEM = """You are an expert product designer and software architect.
Given raw interview answers from a user about an app they want to build, generate:

1. A concise PRD (Product Requirements Document) — features, user stories, data model
2. A Design Brief — visual direction, mood, color guidance, layout, responsive approach
3. A 2-3 sentence summary of what you'll build
4. A detailed generation prompt that a code generation AI can use to build the complete app

The generation prompt should be comprehensive and specific — it will be the ONLY input
to a code generation system that produces React + FastAPI applications.

Return your response as JSON with keys: prd, design_brief, summary, generation_prompt
Return ONLY the JSON object, no markdown fences."""


def _build_synthesis_prompt(domain: str, answers: dict[str, str]) -> str:
    formatted = []
    for key, value in answers.items():
        if value and value != "(skipped)":
            formatted.append(f"- {key}: {value}")
    answers_text = "\n".join(formatted) if formatted else "No specific answers provided."
    return f"""Domain: {domain}

Interview Answers:
{answers_text}

Generate the PRD, Design Brief, Summary, and Generation Prompt as JSON."""


def _parse_synthesis(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        first_nl = cleaned.index("\n")
        cleaned = cleaned[first_nl + 1:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        data = json.loads(cleaned)
        return {
            "prd": str(data.get("prd", "")),
            "design_brief": str(data.get("design_brief", "")),
            "summary": str(data.get("summary", "")),
            "generation_prompt": str(data.get("generation_prompt", "")),
        }
    except (json.JSONDecodeError, AttributeError):
        log.warning("Failed to parse synthesis JSON, using raw text as prompt")
        return {
            "prd": "",
            "design_brief": "",
            "summary": "Here's what I understood from your answers.",
            "generation_prompt": cleaned,
        }


async def _synthesize_gemini(prompt: str) -> str:
    from google import genai

    client = genai.Client(api_key=GEMINI_KEY)
    response = await asyncio.wait_for(
        client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                {"role": "user", "parts": [{"text": SYNTHESIS_SYSTEM + "\n\n" + prompt}]}
            ],
        ),
        timeout=30.0,
    )
    return response.text or ""


async def _synthesize_claude(prompt: str) -> str:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_KEY)
    response = await asyncio.wait_for(
        client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4000,
            system=SYNTHESIS_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        ),
        timeout=30.0,
    )
    return response.content[0].text if response.content else ""


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_interview(req: SynthesizeRequest) -> SynthesizeResponse:
    prompt = _build_synthesis_prompt(req.domain, req.answers)
    try:
        if req.model == "claude" and ANTHROPIC_KEY:
            raw = await _synthesize_claude(prompt)
        elif GEMINI_KEY:
            raw = await _synthesize_gemini(prompt)
        elif ANTHROPIC_KEY:
            raw = await _synthesize_claude(prompt)
        else:
            log.error("No API keys configured for synthesis")
            return SynthesizeResponse(
                summary="I couldn't synthesize — no API keys configured.",
                generation_prompt=prompt,
            )
        parsed = _parse_synthesis(raw)
        return SynthesizeResponse(**parsed)
    except asyncio.TimeoutError:
        log.warning("Synthesis timed out (30s)")
        return SynthesizeResponse(
            summary="Synthesis timed out. Using your answers directly.",
            generation_prompt=prompt,
        )
    except Exception:
        log.exception("Synthesis failed")
        return SynthesizeResponse(
            summary="Something went wrong. Using your answers directly.",
            generation_prompt=prompt,
        )
