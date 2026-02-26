"""TTS API — serves Gemini Cloud TTS and Kokoro Local TTS."""

from __future__ import annotations

import io
import logging
import wave

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter(prefix="/api/tts", tags=["tts"])
log = logging.getLogger("aus.server.tts")


class TTSRequest(BaseModel):
    text: str
    voice: str = "Kore"
    style: str = ""
    engine: str = "gemini"  # "gemini" or "kokoro"
    theme: str = ""


@router.post("/speak")
async def tts_speak(req: TTSRequest) -> Response:
    """Generate speech audio. Returns WAV bytes."""
    if req.engine == "gemini":
        from server.services.gemini_tts import speak, speak_for_theme, GEMINI_KEY
        if not GEMINI_KEY:
            return Response(content=b"", status_code=503)
        try:
            if req.theme:
                pcm = await speak_for_theme(req.text, req.theme, req.style)
            else:
                pcm = await speak(req.text, req.voice, req.style)
        except Exception as e:
            log.exception("Gemini TTS failed")
            return Response(content=str(e).encode(), status_code=500)

        # Convert PCM to WAV
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            wf.writeframes(pcm)

        return Response(content=buf.getvalue(), media_type="audio/wav")
    else:
        # Kokoro fallback
        try:
            from server.services.tts_service import tts
            wav_bytes = await tts.aspeak_to_wav_bytes(req.text, req.voice)
            return Response(content=wav_bytes, media_type="audio/wav")
        except Exception as e:
            log.exception("Kokoro TTS failed")
            return Response(content=str(e).encode(), status_code=500)


@router.get("/voices")
async def list_voices():
    """List all available Gemini TTS voices."""
    from server.services.gemini_tts import VOICES, THEME_VOICES
    return {
        "voices": [{"name": name, "style": style} for name, style in VOICES.items()],
        "theme_mapping": THEME_VOICES,
    }
