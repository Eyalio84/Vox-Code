# Feature Interview + VOX Redesign — Design Document

**Author:** Eyal Nof
**Date:** 2026-02-25
**Status:** Design

---

## Vision

Replace the single "Build a todo app..." text prompt with a VOX-guided structured interview that extracts 10x richer context before generation. VOX is the Jarvis of Vox Code — a voice-first AI assistant that conducts conversations, executes commands, and builds applications through natural dialogue.

The platform name is **Vox Code**. The philosophy is **A(Us)** — not AI, Us. Collaborative intelligence.

---

## 1. Loading / Boot Screen

### Problem
When servers start, TTS pre-caching takes 5-7 seconds. The user sees a blank white screen.

### Solution
A `BootScreen` component shown while the backend initializes.

**UI:**
- Centered VOX avatar (pulsing ring animation, same as VoxGreeting)
- Below: status text that updates as initialization progresses
- Sequence: "Initializing Vox Code..." → "Loading voice library..." → "Ready"
- Once ready: smooth fade-out transition into the welcome flow

**Implementation:**
- Frontend polls `GET /api/health` (new endpoint) which returns `{ ready: bool, status: string }`
- Backend reports ready only after TTS pre-cache completes
- BootScreen renders immediately (no backend dependency) with CSS-only animation
- On `ready: true`, BootScreen fades out (300ms opacity transition), welcome flow begins

---

## 2. Welcome Flow Redesign

### Current Flow
greeting → style question → density question → mood question → theme reveal → Enter Studio

### New Flow
greeting → style question → mood question → theme reveal → **model selection** → **action menu** → route to chosen action

### Changes
- **Remove** density/layout question (one layout for now)
- **Add** model selection: "Which model would you like to power me?" → Gemini / Claude
- **Add** action menu: "What would you like to do?"

### Model Selection Question

After theme reveal and dissolve-rebuild animation:

VOX says: "One more thing — which model would you like to power me?"

**Options (WelcomeQuestion radio cards):**

| Option | Label | Description |
|--------|-------|-------------|
| gemini | Gemini | Real-time voice conversation. I can listen and talk naturally using Google's Live API. Full Jarvis mode. |
| claude | Claude | Fast and precise reasoning with local voice. Powered by Anthropic's models + Kokoro speech. |

**What this sets:**
- Stores `activeModel: 'gemini' | 'claude'` in a new `VoxModelContext`
- Configures which TTS pipeline VOX uses for all subsequent speech
- Configures which LLM handles reasoning (interview questions, synthesis, generation, voice commands)

### Action Menu

After model selection, VOX says: "Welcome to Vox Code. What would you like to do?"

**Options:**

| Option | Label | Description | Status |
|--------|-------|-------------|--------|
| new-build | Start New Build | I'll interview you about what to build, then generate a complete app | Phase 6.5 — build now |
| load-project | Load Project | Resume where you left off on a previous build | Future (Phase 7) |
| guided-tour | Guided Tour | I'll walk you through everything Vox Code can do | Future |
| voice-mode | Voice Mode | Skip the interview — just talk to me and we'll build together | Future (requires Gemini Live API) |

**Future behaviors (not built now):**
- **Load Project**: VOX loads saved project → shows live preview → speaks recap of what was built → starts feature interview for continuing
- **Guided Tour**: VOX goes page by page, highlighting what it's talking about — the studio, chat, preview, file tree, tool drawer, domains, agents. Full walkthrough for first-time users. Mix of pre-recorded narration + live explanations.
- **Voice Mode**: Direct Jarvis experience. No wizard. Just talk.

---

## 3. Feature Interview System

### Architecture: Approach B — Frontend Templates + Backend Synthesis

**Frontend** owns:
- Interview UI (InterviewWizard component)
- Question templates (static JSON per domain)
- Question display, user input (text + radio cards), progress tracking
- VOX voice playback (pre-recorded intros + live TTS for dynamic lines)

**Backend** owns:
- Synthesis endpoint: `POST /api/studio/synthesize`
- Takes raw interview answers + domain, uses active LLM to generate PRD + Design Brief
- Returns structured context that feeds into the generation pipeline

### Story Arc Structure (from playbook)

**Section 1 — The Problem Story** (~10 questions)
What are you building, who's it for, what problem does it solve, what exists today and why it fails, what's the ONE thing it must do well.

**Section 2 — The Experience Story** (~10 questions)
How should it feel, what inspires you, what apps do you love the feel of, what should it NOT be, desktop or mobile first, how do you know it succeeded.

### Question Types (Golden Ratio)

| Type | Ratio | Purpose | UI |
|------|-------|---------|-----|
| Open Exploratory | 30% | Discover unknowns | Text input |
| Constrained Choice | 30% | Force decisions | WelcomeQuestion radio cards |
| Reference Anchoring | 20% | Ground in examples | Text input with hint |
| Negative Space | 10% | Define boundaries | Text input |
| Success Criteria | 10% | Define "done" | Text input |

### Domain-Aware Templates

The interview adapts based on detected or selected domain:

| Domain | Section Pattern | Key Differences |
|--------|----------------|-----------------|
| Web App | Problem + Experience | Default, general-purpose |
| SaaS | Problem + Business Model | Adds billing, auth, multi-tenancy questions |
| Game | Player + Mechanics | Emotions, core loop, session length, progression |
| API | Consumer + Contract | Who consumes, versioning, error handling |
| Data/ML | Data + Model | Data sources, bias, latency, monitoring |

**Domain detection**: After the first 2-3 open questions, the system detects which domain template to use. Or user can explicitly choose from a constrained choice question: "What kind of project is this?"

### Interview Flow (per question)

```
1. VOX speaks question (pre-recorded intro OR live TTS)
2. Typewriter text displays in sync with audio
3. User answers:
   - Constrained: WelcomeQuestion radio cards appear
   - Open: Text input field appears
4. Answer stored in interview state
5. Advance to next question
```

### Synthesis Step

After all questions are answered:

1. VOX says: "Let me put that together..." (pre-recorded)
2. `POST /api/studio/synthesize` with raw answers + domain
3. Backend LLM (Gemini Flash or Claude Haiku depending on active model) generates:
   - **PRD** (Product Requirements Document)
   - **Design Brief** (visual direction, mood, references, constraints)
4. VOX reads back a 2-3 sentence summary: "Here's what I'm going to build: [summary]. Sound right?"
5. User confirms or corrects
6. Synthesized PRD + Design Brief feeds into `generate()` as the prompt — dramatically richer than "Build a todo app"

### Synthesis Endpoint

```
POST /api/studio/synthesize
Request:
{
  "domain": "webapp",
  "answers": {
    "problem": "I forget tasks and miss deadlines",
    "persona": "Busy professionals juggling projects",
    "frustration": "Too many features, cognitive overload",
    "one_thing": "Simple task capture without guilt",
    "mood": "Calm, minimal, forgiving",
    "references": "Things 3, Todoist but simpler",
    "not_like": "Jira, Monday.com — too complex",
    "platform": "mobile-first",
    ...
  },
  "model": "gemini"  // which LLM to use for synthesis
}

Response:
{
  "prd": "# Product Requirements Document\n\n## Problem...",
  "design_brief": "# Design Brief\n\n## Visual Direction...",
  "summary": "A calm, minimal task app for overwhelmed professionals...",
  "generation_prompt": "Build a mobile-first task management app..."
}
```

---

## 4. VOX Voice Architecture — Hybrid

### Three Voice Tiers

**Tier 1: Pre-recorded WAVs** (stored at `docs/vox-wav/`)
- Welcome greeting, theme reveals, menu intros, common transitions
- Zero latency, works offline, model-independent
- Generated once using Kokoro, stored as WAV files
- Served via existing `GET /api/tts/cache/{filename}`

**Tier 2: Live Local TTS (Kokoro)**
- Claude's voice. Used when Claude is the active model.
- Claude generates text → Kokoro speaks it locally
- ~200ms latency for short phrases
- Used via existing `POST /api/tts/speak`
- Haiku for fast reasoning, Sonnet for complex tasks

**Tier 3: Live Cloud Voice (Gemini)**
- **Gemini TTS** (`gemini-2.5-flash-preview-tts`): One-directional. Text → audio. 30 voices, 100+ languages. Used for narration, summaries, one-shot speech.
- **Gemini Live API** (`gemini-2.5-flash-native-audio-preview`): Bidirectional real-time voice over WebSocket. User speaks, Gemini listens, processes, responds with voice. Supports function calling mid-conversation. Session persistence up to 15 min, context compression for longer. **This is Jarvis mode.**

### Model Selection Determines Voice Pipeline

| Active Model | Reasoning | Voice Output | Voice Input |
|-------------|-----------|-------------|-------------|
| Claude | Claude Haiku/Sonnet | Kokoro (local ONNX) | Web Speech API STT (future) |
| Gemini | Gemini Flash/Pro | Gemini TTS or Live API | Gemini Live API (native, future) |

### "Vox, switch models please"

Voice command (future) that hot-swaps the active model:
- If currently Gemini → switch to Claude + Kokoro
- If currently Claude → switch to Gemini + Gemini TTS/Live
- VOX confirms: "Switching to [model]. Ready." (in the new voice)
- Stored in VoxModelContext, persisted to localStorage

---

## 5. InterviewWizard Component

### Location
New component: `frontend/src/components/InterviewWizard.tsx`

### Where It Appears
Replaces the empty state in ChatPanel when user chooses "Start New Build" from the action menu. After interview completes + synthesis, transitions to the normal ChatPanel with the generation running.

### UI Structure

```
┌─────────────────────────────────────┐
│         VOX Avatar (pulsing)         │
│                                      │
│   "What problem does this solve?"    │  ← typewriter text
│                                      │
│   ┌─────────────────────────────┐   │
│   │  [Text input field]         │   │  ← for open questions
│   └─────────────────────────────┘   │
│                                      │
│   OR                                 │
│                                      │
│   ┌─ Desktop-first ────────────┐    │
│   │  Build for larger screens  │    │  ← WelcomeQuestion cards
│   ├─ Mobile-first ─────────────┤    │     for constrained questions
│   │  Optimize for phones       │    │
│   ├─ Equal priority ───────────┤    │
│   │  Responsive from the start │    │
│   └────────────────────────────┘    │
│                                      │
│   Section 1 of 2 • Question 4 of 10 │  ← progress indicator
│                                      │
│   [Skip Interview]                   │  ← escape hatch
└─────────────────────────────────────┘
```

### State Machine

```
idle → speaking (VOX asks question)
     → waiting (user sees input/cards)
     → answered (user responds)
     → speaking (next question)
     → ... repeat ...
     → synthesizing (all questions done, calling backend)
     → confirming (VOX reads summary, user confirms)
     → generating (feeds into pipeline)
```

### Reuses Existing Components
- `VoxGreeting` — avatar with pulse animation
- `WelcomeQuestion` — radio card selection
- `useTypewriter` — text reveal synced to audio
- `VoxContext.playVoxLine()` — pre-recorded audio playback
- `/api/tts/speak` — live Kokoro TTS
- Gemini TTS/Live API — live cloud voice (new integration)

---

## 6. Question Templates

### Storage
`frontend/src/interview/templates/` — one JSON file per domain

### Format

```typescript
interface InterviewTemplate {
  domain: string
  sections: InterviewSection[]
}

interface InterviewSection {
  id: string
  name: string          // "The Problem Story"
  voxIntro: string      // What VOX says to introduce this section
  voxIntroWav?: string  // Pre-recorded WAV filename (optional)
  questions: InterviewQuestion[]
}

interface InterviewQuestion {
  id: string
  text: string           // The question text
  type: 'open' | 'constrained' | 'reference' | 'negative' | 'success'
  hint?: string          // Helper text for open questions
  options?: { value: string; label: string; description: string }[]
  required?: boolean
  voxWav?: string        // Pre-recorded WAV for this question (optional)
}
```

### Web App Template (default)

**Section 1 — The Problem Story:**
1. "What problem does this application solve?" (open)
2. "Who experiences this problem most?" (open)
3. "How do they solve it today?" (open)
4. "What kind of project is this?" (constrained: Web App / SaaS / Game / API / Data Tool / Other)
5. "What's frustrating about current solutions?" (negative)
6. "What is the ONE thing this app must do well?" (constrained-open)
7. "What data does this app work with?" (open)
8. "Are there hard constraints — budget, timeline, specific tech?" (open)
9. "What would make users abandon this app?" (negative)
10. "How will you know this succeeded?" (success)

**Section 2 — The Experience Story:**
1. "Describe the mood in 3 words" (open)
2. "Name 2-3 apps or sites you love the feel of" (reference)
3. "What colors come to mind? Any to avoid?" (open)
4. "Desktop-first, mobile-first, or equal priority?" (constrained)
5. "Minimal and clean, or feature-rich and dense?" (constrained)
6. "Dark mode, light mode, or both?" (constrained)
7. "What's the most important action a user takes?" (reference)
8. "What should this definitely NOT look or feel like?" (negative)
9. "Any branding elements to incorporate?" (open)
10. "Anything else I should know?" (open)

Question 4 in Section 1 triggers domain detection — if user picks Game, SaaS, API, or Data Tool, subsequent questions adapt to that domain's template.

---

## 7. Pre-recorded WAV Library

### Location
`/storage/emulated/0/Download/aus-studio/docs/vox-wav/`

### Initial Library (generated with Kokoro, af_bella voice)

**Boot/Loading:**
- `boot_initializing.wav` — "Initializing Vox Code..."
- `boot_loading_voice.wav` — "Loading voice library..."
- `boot_ready.wav` — "Ready."

**Welcome (existing, move from tts_cache):**
- `greeting.wav` — "Welcome to Vox Code. I'm Vox, your creative partner."
- `q1_intro.wav` — "First, tell me about your style. How do you like to work?"
- `q3_intro.wav` — "Last one. What mood suits you best?"
- 8x `reveal_*.wav` — theme reveal lines
- `outro.wav` — "Let me reshape your workspace for you."

**Model Selection:**
- `model_question.wav` — "One more thing. Which model would you like to power me?"

**Action Menu:**
- `action_question.wav` — "Welcome to Vox Code. What would you like to do?"

**Interview:**
- `interview_start.wav` — "Great, let's figure out what we're building. I'll ask you some questions."
- `interview_section2.wav` — "Now let's talk about how it should look and feel."
- `interview_synthesizing.wav` — "Let me put that together..."
- `interview_confirm.wav` — "Here's what I understood. Sound right?"
- `interview_generating.wav` — "Alright, let's build it."

**Individual question WAVs are optional** — if a WAV exists for a question ID, use it. Otherwise fall back to live TTS (Kokoro or Gemini depending on active model).

---

## 8. Backend Changes

### New Endpoints

**`GET /api/health`**
Returns `{ ready: bool, status: string }`. Ready = true only after TTS pre-cache completes.

**`POST /api/studio/synthesize`**
Takes interview answers + domain + active model. Returns PRD + Design Brief + generation prompt.
Uses Gemini Flash (if model=gemini) or Claude Haiku (if model=claude) for synthesis.

**`GET /api/interview/templates/{domain}`** (optional)
Returns question template JSON for a domain. Could also be purely frontend-side.

### Modified Endpoints

**`POST /api/tts/speak`** — already exists, no changes needed

**Welcome flow** — remove density question from `/api/welcome/questions`

---

## 9. What's Built Now vs Future

### Phase 6.5 — Build Now
- BootScreen component (loading screen)
- Welcome flow redesign (remove density, add model selection, add action menu)
- InterviewWizard component
- Web App interview template (default, 20 questions)
- SaaS interview template variant
- Game interview template variant
- Synthesis endpoint (`POST /api/studio/synthesize`)
- Health endpoint (`GET /api/health`)
- Pre-recorded WAV library (boot + welcome + interview transitions)
- "Start New Build" path works end-to-end: interview → synthesis → generate

### Future — Not Now
- Load Project (needs project persistence — Phase 7)
- Guided Tour (needs highlight overlay system)
- Voice Mode (needs Gemini Live API WebSocket integration)
- "Vox, switch models please" voice command (needs STT)
- Voice input for open questions (needs STT/Gemini Live)
- API and Data/ML interview templates
- Gemini Live API integration (separate design needed)
- Gemini embedding model for RAG (separate plan)

---

## 10. Data Flow — End to End

```
User arrives at /
  ↓
BootScreen polls /api/health
  ↓ (ready: true)
BootScreen fades out → Welcome Flow begins
  ↓
VOX greeting → style question → mood question → theme reveal
  ↓
Model selection → user picks Gemini or Claude
  ↓
Action menu → user picks "Start New Build"
  ↓
Navigate to /studio → InterviewWizard renders in ChatPanel
  ↓
VOX asks 20 questions (2 sections, voice + text/cards)
  ↓
POST /api/studio/synthesize (answers + domain + model)
  ↓
Backend LLM generates PRD + Design Brief + generation prompt
  ↓
VOX reads summary → user confirms
  ↓
InterviewWizard exits → ChatPanel switches to normal mode
  ↓
generate(synthesized_prompt) → SSE streaming → live preview updates
  ↓
User sees complete app in preview. Can refine via chat (or voice in future).
```
