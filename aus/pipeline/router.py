"""Model router — selects the optimal LLM for each pipeline phase.

This is where multi-model intelligence lives. Different phases have
different requirements:
- ANALYZE: fast, cheap (classify complexity) → Gemini Flash / Haiku
- PLAN: reasoning-heavy → Claude Sonnet / Gemini Pro
- GENERATE: code quality, no recitation filter → Claude Sonnet / Gemini Flash
- VALIDATE: no LLM needed (structural checks)
- ITERATE: context-heavy (existing code) → Gemini Pro (1M context)

Note: Gemini Pro triggers RECITATION blocks on common boilerplate code
(React + FastAPI patterns). Claude is preferred for GENERATE to avoid this.
Gemini Flash is the fallback — it has a less aggressive filter than Pro.
"""

from aus.models import Phase


# Default model preferences per phase
# Format: (provider, model_id)
PHASE_MODELS: dict[Phase, list[tuple[str, str]]] = {
    Phase.ANALYZE: [
        ("gemini", "gemini-3-flash-preview"),
        ("claude", "claude-haiku-4-5-20251001"),
    ],
    Phase.SPEC: [],  # No LLM call — derived from analysis
    Phase.PLAN: [
        ("claude", "claude-sonnet-4-6"),
        ("gemini", "gemini-3-pro-preview"),
    ],
    Phase.GENERATE: [
        # Claude preferred: Gemini Pro triggers RECITATION on boilerplate code
        ("claude", "claude-sonnet-4-6"),
        ("gemini", "gemini-3-flash-preview"),
    ],
    Phase.VALIDATE: [],  # No LLM call — structural checks
    Phase.ITERATE: [
        ("gemini", "gemini-3-pro-preview"),  # 1M context for existing code
        ("claude", "claude-sonnet-4-6"),
    ],
}


def select_model(phase: Phase, gemini_key: str = "", anthropic_key: str = "") -> str:
    """Select the best available model for a pipeline phase.

    Returns the model ID string. Falls back through preferences
    based on available API keys.
    """
    preferences = PHASE_MODELS.get(phase, [])

    for provider, model_id in preferences:
        if provider == "gemini" and gemini_key:
            return model_id
        if provider == "claude" and anthropic_key:
            return model_id

    # Ultimate fallback: use whatever key we have
    if gemini_key:
        return "gemini-3-flash-preview"
    if anthropic_key:
        return "claude-sonnet-4-6"

    return "gemini-3-flash-preview"  # Default even without keys (will fail at call time)
