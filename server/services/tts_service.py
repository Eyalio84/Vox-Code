"""Kokoro-82M TTS service — direct ONNX inference with JSON voices.

Provides both sync methods (for CLI/scripts) and async wrappers
(for FastAPI) using asyncio.to_thread() to avoid blocking the event loop.
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import os
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Tokenizer, SAMPLE_RATE

log = logging.getLogger("aus.tts")

MODEL_DIR = os.environ.get(
    "KOKORO_MODEL_DIR",
    "/storage/emulated/0/models/kokoro-82m-onnx",
)
CACHE_DIR = Path(__file__).parent.parent / "tts_cache"

VOX_VOICE = "af_bella"

THEME_VOICES: dict[str, str] = {
    "expert": "bm_george",
    "sharp": "am_adam",
    "warm": "af_bella",
    "casual": "af_sarah",
    "future": "am_michael",
    "minimal": "bf_emma",
    "retro": "bm_lewis",
    "creative": "af_nicole",
}

CACHED_LINES: list[tuple[str, str, str]] = [
    ("greeting", VOX_VOICE, "Welcome to Vox Code. I'm Vox, your creative partner."),
    ("q1_intro", VOX_VOICE, "First, tell me about your style. How do you like to work?"),
    ("q3_intro", VOX_VOICE, "Last one. What mood suits you best?"),
    ("reveal_expert", "bm_george", "Expert Pro. Precision engineering at its finest."),
    ("reveal_sharp", "am_adam", "Sharp Edge. Clean lines, bold decisions."),
    ("reveal_warm", "af_bella", "Warm Glow. Welcome home."),
    ("reveal_casual", "af_sarah", "Casual Flow. Let's keep it easy."),
    ("reveal_future", "am_michael", "Futuristic. The future is now."),
    ("reveal_minimal", "bf_emma", "Minimal Clean. Less is everything."),
    ("reveal_retro", "bm_lewis", "Retro Terminal. Old school never dies."),
    ("reveal_creative", "af_nicole", "Creative Burst. Let's make something wild."),
    ("outro", VOX_VOICE, "Let me reshape your workspace for you."),
    ("model_question", VOX_VOICE, "One more thing. Which model would you like to power me?"),
    ("action_question", VOX_VOICE, "Welcome to Vox Code. What would you like to do?"),
    # Interview transitions
    ("interview_start", VOX_VOICE, "Great, let's figure out what we're building. I'll ask you some questions."),
    ("interview_section2", VOX_VOICE, "Now let's talk about how it should look and feel."),
    ("interview_synthesizing", VOX_VOICE, "Let me put that together."),
    ("interview_confirm", VOX_VOICE, "Here's what I understood. Sound right?"),
    ("interview_generating", VOX_VOICE, "Alright, let's build it."),
    # Boot screen
    ("boot_initializing", VOX_VOICE, "Initializing Vox Code."),
    ("boot_loading_voice", VOX_VOICE, "Loading voice library."),
    ("boot_ready", VOX_VOICE, "Ready."),
]


class TTSService:
    def __init__(self) -> None:
        self.sess: ort.InferenceSession | None = None
        self.voices: dict[str, np.ndarray] = {}
        self.tokenizer: Tokenizer | None = None
        self._loaded = False

    def load(self) -> None:
        if self._loaded:
            return
        model_path = os.path.join(MODEL_DIR, "model.onnx")
        voices_path = os.path.join(MODEL_DIR, "voices.json")

        log.info("Loading Kokoro model from %s", MODEL_DIR)
        self.sess = ort.InferenceSession(
            model_path, providers=["CPUExecutionProvider"]
        )
        with open(voices_path) as f:
            raw = json.load(f)
        self.voices = {
            name: np.array(data, dtype=np.float32).squeeze(1)
            for name, data in raw.items()
        }
        self.tokenizer = Tokenizer()
        self._loaded = True
        log.info("Kokoro loaded: %d voices", len(self.voices))

    def speak(
        self, text: str, voice: str = VOX_VOICE, speed: float = 1.0
    ) -> tuple[np.ndarray, int]:
        assert self._loaded, "Call load() first"
        assert voice in self.voices, f"Unknown voice: {voice}"

        phonemes = self.tokenizer.phonemize(text, "en-us")
        tokens = self.tokenizer.tokenize(phonemes)

        voice_style = self.voices[voice]
        style = voice_style[len(tokens)].reshape(1, 256)
        input_ids = np.array([[0] + tokens + [0]], dtype=np.int64)
        speed_arr = np.array([speed], dtype=np.float32)

        result = self.sess.run(
            None, {"tokens": input_ids, "style": style, "speed": speed_arr}
        )
        return result[0], SAMPLE_RATE

    def speak_to_wav_bytes(
        self, text: str, voice: str = VOX_VOICE, speed: float = 1.0
    ) -> bytes:
        samples, sr = self.speak(text, voice, speed)
        buf = io.BytesIO()
        sf.write(buf, samples, sr, format="WAV", subtype="PCM_16")
        buf.seek(0)
        return buf.read()

    def precache(self) -> int:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        count = 0
        for filename, voice, text in CACHED_LINES:
            wav_path = CACHE_DIR / f"{filename}.wav"
            if wav_path.exists():
                log.debug("Cache hit: %s", filename)
                count += 1
                continue
            log.info("Generating %s (%s): %s", filename, voice, text[:40])
            samples, sr = self.speak(text, voice)
            sf.write(str(wav_path), samples, sr)
            count += 1
        log.info("TTS cache ready: %d files in %s", count, CACHE_DIR)
        return count

    def get_cached_path(self, filename: str) -> Path | None:
        path = CACHE_DIR / f"{filename}.wav"
        return path if path.exists() else None

    # ------------------------------------------------------------------
    # Async wrappers — non-blocking for FastAPI event loop
    # ------------------------------------------------------------------

    async def aload(self) -> None:
        await asyncio.to_thread(self.load)

    async def aspeak(
        self, text: str, voice: str = VOX_VOICE, speed: float = 1.0
    ) -> tuple[np.ndarray, int]:
        return await asyncio.to_thread(self.speak, text, voice, speed)

    async def aspeak_to_wav_bytes(
        self, text: str, voice: str = VOX_VOICE, speed: float = 1.0
    ) -> bytes:
        return await asyncio.to_thread(self.speak_to_wav_bytes, text, voice, speed)

    async def aprecache(self) -> int:
        return await asyncio.to_thread(self.precache)


tts = TTSService()
