# Music Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: Music / Audio / Sound
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/music.md`

---

## Goal

Add 15 domain-specific tools (10 external libraries + 2 custom libraries + 3 agents) to the Expert drawer for music/audio/sound apps, organized by 5 capability groups with the same accordion UI, domain selector, and "Already Added" tracking established in the site-dev design.

## Architecture Decisions

All site-dev architectural decisions carry forward (domain file pattern, accordion, dedup, `group` field, `isAdded` tracking). Music-specific decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Merge dual-role tools | Tone.js and Elementary Audio appear as both library and framework in suggestions — one entry each, description covers both roles |
| 2 | 5 capability groups | Audio Engines, Playback & Streaming, Visualization, Music Theory & Notation, Audio Infrastructure |
| 3 | Strudel.js included via CDN | No npm package, integrationPrompt uses CDN/iframe embed, never marked "Already Added" |
| 4 | Custom tools as infrastructure group | Music custom tools are support infrastructure (resilience, orchestration), not core audio — grouped as "Audio Infrastructure" |
| 5 | 3 agents in Agents tab | Scaffold Generator, Full Stack Scaffolding, Boilerplate Generator — project setup utilities |
| 6 | Smaller domain (15 tools) | Music is heavily external-library-driven; custom tool collection has minimal audio-specific functionality |
| 7 | No dedup with expert.ts | Zero overlaps — all music libs are domain-specific (unlike RAG which overlaps on 5 tools) |

## File Structure

```
frontend/src/tools/domains/
├── site-dev.ts       # (already designed)
├── rag.ts            # (already designed)
└── music.ts          # 15 tools (12 in groups + 3 agents)
```

Registry imports `MUSIC_TOOLS` from `domains/music.ts` alongside other domain exports. Dedup handles overlaps (none expected).

## Tool Inventory — 12 Tools in 5 Capability Groups

### Audio Engines (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Tone.js** | `music-tone` | external | `npm: tone` | 1st (recommended) | Sets up Tone.js transport, creates synth + effects chain, adds start/stop controls with AudioContext resume |
| **Elementary Audio** | `music-elementary` | external | `npm: @elemaudio/core` | 2nd | Creates declarative DSP graph with web renderer, hot-reloadable audio processing |
| **Strudel.js** | `music-strudel` | external | — | 3rd | Embeds Strudel live coding editor via CDN/iframe, connects output to app's audio bus |

### Playback & Streaming (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Howler.js** | `music-howler` | external | `npm: howler` | 1st (recommended) | Creates audio player service with playlist management, sprite-based samples, format detection |
| **WebAudioFont** | `music-webaudiofont` | external | `npm: webaudiofont` | 2nd | Loads GM-compatible soundfont instruments, MIDI-to-audio playback engine |

### Visualization (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **wavesurfer.js** | `music-wavesurfer` | external | `npm: wavesurfer.js` | 1st (recommended) | Creates interactive waveform component with seek, zoom, regions plugin |
| **audioMotion-analyzer** | `music-audiomotion` | external | `npm: audiomotion-analyzer` | 2nd | Adds real-time FFT spectrum analyzer component with 240-band resolution |

### Music Theory & Notation (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Tonal.js** | `music-tonal` | external | `npm: tonal` | 1st (recommended) | Creates music theory service: chord detection, scale lookup, transposition, interval math |
| **VexFlow** | `music-vexflow` | external | `npm: vexflow` | 2nd | Adds sheet music notation renderer component (SVG), note/chord/measure rendering |
| **MidiWriterJS** | `music-midiwriter` | external | `npm: midi-writer-js` | 3rd | Adds MIDI file generation service with multi-track export, General MIDI events |

### Audio Infrastructure (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Production Resilience** | `music-resilience` | custom | — | 1st | Adds streaming audio error handling: reconnect logic, buffer underrun recovery, AudioContext suspend/resume |
| **Audio Orchestrator** | `music-orchestrator` | custom | — | 2nd | Creates multi-step audio processing pipeline with agent coordination (analyze -> transform -> render) |

## Tool Inventory — 3 Agents (Agents Tab)

| Agent | ID | What It Does |
|-------|----|--------------|
| **Scaffold Generator** | `music-agent-scaffold` | Generates music app project structure with audio-aware directories (synths/, effects/, samples/) |
| **Full Stack Scaffolding** | `music-agent-fullstack` | Plans music app architecture with audio-specific configurations (Web Audio API, MIDI, streaming) |
| **Boilerplate Generator** | `music-agent-boilerplate` | Injects audio design patterns: Observer for playback events, State for transport modes |

## Integration Prompt Structure

External tools follow the same pattern as site-dev with music-specific considerations:
```
Integrate [Tool] for [purpose].
- Install `[package]`.
- Create `[exact/file/path]` with [specific setup].
- IMPORTANT: Gate AudioContext.resume() behind a user gesture (click/tap).
- Wire into [existing component/endpoint].
- Use AudioWorklet for off-main-thread processing where supported.
```

Strudel.js has a unique pattern (no npm):
```
Integrate Strudel.js for live coding music patterns.
- Load Strudel via CDN: `<script src="...">`.
- Create `frontend/src/components/StrudelEditor.tsx` with:
  - Embedded code editor with Strudel pattern syntax
  - Audio output connected to the app's Web Audio graph
  - Play/stop controls gated behind user gesture
```

Custom tools reference existing tool patterns:
```
Integrate [Custom Tool] into the audio pipeline.
- Create `backend/app/audio/[module].py` adapting the [tool_name] pattern:
  - [Specific function/class]
  - [Configuration: buffer sizes, sample rates, etc.]
- Add endpoint if needed.
```

Agent prompts trigger project setup/analysis:
```
Run [Agent] on the current project.
- Analyze project for audio requirements.
- Generate [structure/patterns/config].
- Return results in the chat.
```

## Gap Analysis (Music-Specific)

| Gap | Resolution |
|-----|-----------|
| Domain detection | Handled by shared domain selector (site-dev design) |
| Already Added | External tools with packages: check deps. Strudel.js + custom tools: never marked "Added" |
| AudioContext user gesture | All audio tool integrationPrompts include the user gesture requirement |
| Dedup with expert.ts | No overlaps — all music IDs are `music-` prefixed |
| Theme assignment | `themes: ['expert']` |
| Ordering | Recommended-first per group |
| Mobile/Safari | Howler.js handles most edge cases; integrationPrompts note iOS testing |

## Success Criteria

1. Selecting 'Music / Audio' domain shows 5 collapsible capability groups
2. Each group contains the correct mix of external + custom tools
3. Strudel.js (no package) is never marked "Added"
4. Custom tools without packages are never marked "Added"
5. Agents tab shows 3 project setup utilities
6. All 15 tools have detailed two-level prompts (short description + full integrationPrompt)
7. All audio integrationPrompts include AudioContext user gesture gating
8. Accordion, search, and "Already Added" work identically to site-dev
