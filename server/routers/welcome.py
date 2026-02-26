"""Welcome flow + TTS cache endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from server.services.tts_service import tts, THEME_VOICES

log = logging.getLogger("aus.welcome")

router = APIRouter()

STYLE_OPTIONS = [
    {"value": "technical", "label": "Technical", "description": "I love code, efficiency, and precision"},
    {"value": "professional", "label": "Professional", "description": "Clean, structured, business-focused"},
    {"value": "casual", "label": "Casual", "description": "Relaxed and easy-going"},
    {"value": "creative", "label": "Creative", "description": "Expressive, colorful, artistic"},
]

DENSITY_OPTIONS = [
    {"value": "compact", "label": "Compact", "description": "Maximum information, minimum space"},
    {"value": "balanced", "label": "Balanced", "description": "A comfortable middle ground"},
    {"value": "spacious", "label": "Spacious", "description": "Room to breathe, generous whitespace"},
]

MOOD_OPTIONS = [
    {"value": "cool", "label": "Cool", "description": "Calm blues and neutral tones"},
    {"value": "warm", "label": "Warm", "description": "Ambers, oranges, cozy vibes"},
    {"value": "bold", "label": "Bold", "description": "Vivid, high-contrast, energetic"},
    {"value": "calm", "label": "Calm", "description": "Understated, serene, zen-like"},
]


def match_theme(style: str, density: str, mood: str) -> str:
    if style == "technical":
        if density == "compact":
            return "expert"
        if mood == "bold":
            return "future"
        return "expert"
    if style == "professional":
        if mood == "cool":
            return "sharp"
        if density == "spacious":
            return "minimal"
        return "sharp"
    if style == "creative":
        if mood == "bold":
            return "creative"
        if mood == "warm":
            return "warm"
        return "creative"
    if style == "casual":
        if mood == "warm":
            return "warm"
        if mood == "cool":
            return "retro"
        return "casual"
    return "casual"


class ProfileRequest(BaseModel):
    style: str
    density: str = "balanced"
    mood: str


class SpeakRequest(BaseModel):
    text: str
    voice: str = "af_bella"
    speed: float = 1.0


@router.get("/api/welcome/status")
async def welcome_status():
    return {"firstVisit": True, "profile": None}


@router.get("/api/welcome/questions")
async def welcome_questions():
    return {
        "questions": [
            {"id": "style", "question": "How do you like to work?", "options": STYLE_OPTIONS},
            {"id": "mood", "question": "What mood suits you best?", "options": MOOD_OPTIONS},
        ]
    }


@router.post("/api/welcome/profile")
async def welcome_profile(req: ProfileRequest):
    theme = match_theme(req.style, req.density, req.mood)
    voice = THEME_VOICES.get(theme, "af_bella")
    return {"theme": theme, "voice": voice}


@router.get("/api/tts/cache/{filename}")
async def tts_cache(filename: str):
    name = filename.replace(".wav", "")
    path = tts.get_cached_path(name)
    if not path:
        raise HTTPException(status_code=404, detail=f"Cached audio not found: {name}")
    return FileResponse(path, media_type="audio/wav")


@router.post("/api/welcome/speak")
async def tts_speak(req: SpeakRequest):
    try:
        wav_bytes = await tts.aspeak_to_wav_bytes(req.text, req.voice, req.speed)
        return Response(content=wav_bytes, media_type="audio/wav")
    except Exception as e:
        log.exception("TTS speak failed")
        raise HTTPException(status_code=500, detail=str(e))
