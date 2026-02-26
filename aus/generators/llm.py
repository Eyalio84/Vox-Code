"""LLM provider wrappers — unified interface for Gemini and Claude.

Both providers are called through the same LLMRequest/LLMResponse interface.
The pipeline orchestrator uses these via the llm_call function passed to Pipeline.

Provides two calling modes:
  - call_gemini / call_claude — batch (returns LLMResponse when done)
  - stream_gemini / stream_claude — yields token dicts as they arrive
"""

from __future__ import annotations

import time
import logging
from typing import Any, AsyncIterator

from aus.models import LLMRequest, LLMResponse

log = logging.getLogger("aus.llm")


async def call_gemini(request: LLMRequest, api_key: str) -> LLMResponse:
    """Call Google Gemini via the google-genai SDK (truly async).

    Uses client.aio for non-blocking HTTP calls.
    Handles RECITATION blocks by returning empty content with a warning
    so the caller can retry with a different model.
    """
    from google import genai

    client = genai.Client(api_key=api_key)

    # Build contents from messages
    system_instruction = None
    contents = []

    for msg in request.messages:
        if msg.role == "system":
            system_instruction = msg.content
        else:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

    model = request.model or "gemini-3-flash-preview"
    start = time.time()

    response = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config={
            "system_instruction": system_instruction,
            "temperature": request.temperature,
            "max_output_tokens": request.max_tokens,
        },
    )

    duration = int((time.time() - start) * 1000)

    # Check for RECITATION block
    if response.candidates and hasattr(response.candidates[0], "finish_reason"):
        finish = str(response.candidates[0].finish_reason)
        if "RECITATION" in finish:
            log.warning(f"Gemini {model} returned RECITATION block — content suppressed")
            return LLMResponse(
                content="",
                model=model,
                tokens_in=getattr(response.usage_metadata, "prompt_token_count", 0) or 0,
                tokens_out=0,
                duration_ms=duration,
            )

    # Extract token counts
    tokens_in = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
    tokens_out = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

    return LLMResponse(
        content=response.text or "",
        model=model,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        duration_ms=duration,
    )


async def call_claude(request: LLMRequest, api_key: str) -> LLMResponse:
    """Call Anthropic Claude via the anthropic SDK (truly async).

    Uses AsyncAnthropic for non-blocking HTTP calls.
    Uses async streaming for large max_tokens to avoid SDK timeout errors.
    """
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)

    # Separate system from conversation messages
    system_content = ""
    messages = []

    for msg in request.messages:
        if msg.role == "system":
            system_content += msg.content + "\n"
        else:
            messages.append({"role": msg.role, "content": msg.content})

    model = request.model or "claude-sonnet-4-6"
    start = time.time()

    # Use streaming for large outputs to avoid SDK 10-minute timeout
    if request.max_tokens > 8000:
        content = ""
        tokens_in = 0
        tokens_out = 0

        async with client.messages.stream(
            model=model,
            max_tokens=request.max_tokens,
            system=system_content.strip() if system_content else "",
            messages=messages,
            temperature=request.temperature,
        ) as stream:
            async for text in stream.text_stream:
                content += text

            # Get final message for usage stats
            final = await stream.get_final_message()
            tokens_in = final.usage.input_tokens
            tokens_out = final.usage.output_tokens
    else:
        response = await client.messages.create(
            model=model,
            max_tokens=request.max_tokens,
            system=system_content.strip() if system_content else "",
            messages=messages,
            temperature=request.temperature,
        )

        content = ""
        for block in response.content:
            if hasattr(block, "text"):
                content += block.text
        tokens_in = response.usage.input_tokens
        tokens_out = response.usage.output_tokens

    duration = int((time.time() - start) * 1000)

    return LLMResponse(
        content=content,
        model=model,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        duration_ms=duration,
    )


# ---------------------------------------------------------------------------
# Streaming generators — yield tokens as they arrive
# ---------------------------------------------------------------------------


async def stream_gemini(
    request: LLMRequest, api_key: str
) -> AsyncIterator[dict]:
    """Stream Gemini tokens as they arrive.

    Yields dicts: {"type": "token", "content": str}
    Final yield: {"type": "done", "model": str, "tokens_in": int, "tokens_out": int, "duration_ms": int}
    """
    from google import genai
    from google.genai import types as genai_types

    client = genai.Client(api_key=api_key)

    system_instruction = None
    contents = []
    for msg in request.messages:
        if msg.role == "system":
            system_instruction = msg.content
        else:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

    model = request.model or "gemini-3-flash-preview"
    start = time.time()

    config = genai_types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=request.temperature,
        max_output_tokens=request.max_tokens,
    )

    tokens_in = 0
    tokens_out = 0
    recitation = False

    stream = await client.aio.models.generate_content_stream(
        model=model, contents=contents, config=config,
    )
    async for chunk in stream:
        # Check for RECITATION
        if chunk.candidates:
            finish = str(getattr(chunk.candidates[0], "finish_reason", ""))
            if "RECITATION" in finish:
                recitation = True
                break

        text = chunk.text
        if text:
            yield {"type": "token", "content": text}

        # Accumulate usage from each chunk
        if chunk.usage_metadata:
            tokens_in = getattr(chunk.usage_metadata, "prompt_token_count", 0) or 0
            tokens_out = getattr(chunk.usage_metadata, "candidates_token_count", 0) or 0

    duration = int((time.time() - start) * 1000)

    if recitation:
        log.warning(f"Gemini {model} hit RECITATION during streaming")

    yield {
        "type": "done",
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "duration_ms": duration,
        "recitation": recitation,
    }


async def stream_claude(
    request: LLMRequest, api_key: str
) -> AsyncIterator[dict]:
    """Stream Claude tokens as they arrive.

    Yields dicts: {"type": "token", "content": str}
    Final yield: {"type": "done", "model": str, "tokens_in": int, "tokens_out": int, "duration_ms": int}
    """
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)

    system_content = ""
    messages = []
    for msg in request.messages:
        if msg.role == "system":
            system_content += msg.content + "\n"
        else:
            messages.append({"role": msg.role, "content": msg.content})

    model = request.model or "claude-sonnet-4-6"
    start = time.time()

    async with client.messages.stream(
        model=model,
        max_tokens=request.max_tokens,
        system=system_content.strip() if system_content else "",
        messages=messages,
        temperature=request.temperature,
    ) as stream:
        async for text in stream.text_stream:
            yield {"type": "token", "content": text}

        final = await stream.get_final_message()
        tokens_in = final.usage.input_tokens
        tokens_out = final.usage.output_tokens

    duration = int((time.time() - start) * 1000)
    yield {
        "type": "done",
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "duration_ms": duration,
        "recitation": False,
    }


def _has_anthropic() -> bool:
    """Check if anthropic SDK is importable."""
    try:
        import anthropic  # noqa: F401
        return True
    except ImportError:
        return False


def create_llm_caller(gemini_key: str = "", anthropic_key: str = ""):
    """Factory that returns an async llm_call function for the Pipeline.

    Routes to the appropriate provider based on the model ID in the request.
    Falls back to Gemini if Claude SDK isn't installed.
    """
    claude_available = anthropic_key and _has_anthropic()

    async def llm_call(request: LLMRequest) -> LLMResponse:
        model = request.model or ""

        # Route based on model name
        if model.startswith("gemini") and gemini_key:
            return await call_gemini(request, gemini_key)
        elif model.startswith("claude") and claude_available:
            return await call_claude(request, anthropic_key)
        elif model.startswith("claude") and gemini_key:
            # Claude requested but unavailable — fallback to Gemini
            log.info(f"Claude unavailable, falling back to Gemini for {model}")
            request.model = "gemini-3-pro-preview"
            return await call_gemini(request, gemini_key)
        elif gemini_key:
            request.model = request.model or "gemini-3-flash-preview"
            return await call_gemini(request, gemini_key)
        elif claude_available:
            request.model = request.model or "claude-sonnet-4-6"
            return await call_claude(request, anthropic_key)
        else:
            raise ValueError("No API keys configured or SDKs installed.")

    return llm_call


def create_streaming_caller(gemini_key: str = "", anthropic_key: str = ""):
    """Factory that returns an async streaming generator function for the Pipeline.

    Same routing logic as create_llm_caller but yields token chunks.
    """
    claude_available = anthropic_key and _has_anthropic()

    async def llm_stream(request: LLMRequest) -> AsyncIterator[dict]:
        model = request.model or ""

        if model.startswith("gemini") and gemini_key:
            async for chunk in stream_gemini(request, gemini_key):
                yield chunk
        elif model.startswith("claude") and claude_available:
            async for chunk in stream_claude(request, anthropic_key):
                yield chunk
        elif model.startswith("claude") and gemini_key:
            log.info(f"Claude unavailable for streaming, falling back to Gemini")
            request.model = "gemini-3-pro-preview"
            async for chunk in stream_gemini(request, gemini_key):
                yield chunk
        elif gemini_key:
            request.model = request.model or "gemini-3-flash-preview"
            async for chunk in stream_gemini(request, gemini_key):
                yield chunk
        elif claude_available:
            request.model = request.model or "claude-sonnet-4-6"
            async for chunk in stream_claude(request, anthropic_key):
                yield chunk
        else:
            raise ValueError("No API keys configured or SDKs installed.")

    return llm_stream
