"""Gemini Cloud TTS — 30 voices with natural language style control.

Uses gemini-2.5-flash-preview-tts for high-quality controllable speech.
Complements Kokoro (local ONNX) — Gemini TTS for premium quality,
Kokoro for offline/pre-cached audio.
"""

from __future__ import annotations

import logging
import os

log = logging.getLogger("aus.gemini_tts")

TTS_MODEL = "gemini-2.5-flash-preview-tts"
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")

# All 30 Gemini TTS voices with style descriptors
VOICES: dict[str, str] = {
    "Zephyr": "Bright", "Puck": "Upbeat", "Charon": "Informative",
    "Kore": "Firm", "Fenrir": "Excitable", "Leda": "Youthful",
    "Orus": "Firm", "Aoede": "Breezy", "Callirrhoe": "Easy-going",
    "Autonoe": "Bright", "Enceladus": "Breathy", "Iapetus": "Clear",
    "Umbriel": "Easy-going", "Algieba": "Smooth", "Despina": "Smooth",
    "Erinome": "Clear", "Algenib": "Gravelly", "Rasalgethi": "Informative",
    "Laomedeia": "Upbeat", "Achernar": "Soft", "Alnilam": "Firm",
    "Schedar": "Even", "Gacrux": "Mature", "Pulcherrima": "Forward",
    "Achird": "Friendly", "Zubenelgenubi": "Casual", "Vindemiatrix": "Gentle",
    "Sadachbia": "Lively", "Sadaltager": "Knowledgeable", "Sulafat": "Warm",
}

# Theme → Premium Gemini TTS voice mapping
THEME_VOICES: dict[str, str] = {
    "expert": "Orus",
    "sharp": "Fenrir",
    "warm": "Sulafat",
    "casual": "Zubenelgenubi",
    "future": "Puck",
    "minimal": "Zephyr",
    "retro": "Charon",
    "creative": "Leda",
}


async def speak(
    text: str,
    voice: str = "Kore",
    style: str = "",
) -> bytes:
    """Generate speech audio from text using Gemini TTS.

    Returns raw PCM audio bytes (24kHz, 16-bit, mono).
    """
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_KEY)

    if style:
        prompt = f"{style}:\n\"{text}\""
    else:
        prompt = text

    response = await client.aio.models.generate_content(
        model=TTS_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice,
                    )
                )
            ),
        ),
    )

    data = response.candidates[0].content.parts[0].inline_data.data
    return data


async def speak_for_theme(text: str, theme: str = "expert", style: str = "") -> bytes:
    """Speak text using the theme-appropriate voice."""
    voice = THEME_VOICES.get(theme, "Kore")
    return await speak(text, voice=voice, style=style)
