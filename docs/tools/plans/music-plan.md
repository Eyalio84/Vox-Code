# Music Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 15 music/audio domain tools to the Expert drawer organized by 5 capability groups.

**Architecture:** Single domain file (`music.ts`) exports `MUSIC_TOOLS` array with 15 `ToolEntry` objects. Registry imports and dedup merges them. No type or component changes needed — infrastructure from site-dev plan Tasks 1-5 is prerequisite.

**Tech Stack:** TypeScript, existing ToolEntry type system, registry helpers

**Prerequisite:** site-dev plan Tasks 1-5 (types.ts `group` field, registry helpers, ToolCard `isAdded`, ToolDrawer accordion/domain selector, StudioPage wiring) must be implemented first.

---

### Task 1: Create `frontend/src/tools/domains/music.ts`

**Files:**
- Create: `frontend/src/tools/domains/music.ts`

**Step 1: Create the domain file with all 15 tool entries**

```typescript
// frontend/src/tools/domains/music.ts
import type { ToolEntry } from '../types'

export const MUSIC_TOOLS: ToolEntry[] = [
  // ── Audio Engines (3) ─────────────────────────────────────────
  {
    id: 'music-tone',
    name: 'Tone.js',
    description: 'Full DAW-style Web Audio framework with synths, effects, transport scheduling, and pattern sequencing. 13K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'tone' },
    group: 'Audio Engines',
    integrationPrompt: `Integrate Tone.js as the core audio engine.
- Install \`npm install tone\`.
- Create \`frontend/src/audio/engine.ts\` with:
  - Tone.js transport setup (BPM, time signature, loop points)
  - Synth factory: PolySynth, FMSynth, AMSynth with preset configurations
  - Effects chain: Reverb, Delay, Chorus, Compressor with wet/dry controls
  - Master output with limiter to prevent clipping
- Create \`frontend/src/components/TransportControls.tsx\` with:
  - Play/Stop/Record buttons that gate \`Tone.start()\` behind user click
  - BPM slider wired to \`Tone.Transport.bpm\`
  - Position display showing current beat/bar
- Create \`frontend/src/audio/scheduler.ts\` with:
  - Pattern sequencer using \`Tone.Sequence\` or \`Tone.Part\`
  - Quantized note scheduling with swing parameter
  - Loop region management
- CRITICAL: Always call \`await Tone.start()\` inside a click handler — browsers block AudioContext before user gesture.
- Use AudioWorklet-compatible patterns (Tone.js v14+ supports this natively).
- Use CSS variables from the active theme for all transport UI styling.`,
  },
  {
    id: 'music-elementary',
    name: 'Elementary Audio',
    description: 'Declarative/functional DSP graph construction — same mental model as React, but for audio signal processing.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: '@elemaudio/core' },
    group: 'Audio Engines',
    integrationPrompt: `Integrate Elementary Audio for declarative DSP processing.
- Install \`npm install @elemaudio/core @elemaudio/web-renderer\`.
- Create \`frontend/src/audio/dsp-engine.ts\` with:
  - WebRenderer initialization with AudioContext (gated behind user gesture)
  - Core DSP graph: el.cycle() oscillators, el.biquad() filters, el.compress() dynamics
  - Hot-reloadable render function that re-renders DSP graph on parameter changes
  - Gain staging with el.mul() and el.add() for signal mixing
- Create \`frontend/src/components/DSPControls.tsx\` with:
  - Frequency/resonance knobs that update DSP graph parameters in real-time
  - Waveform selector (sine, saw, square, triangle)
  - ADSR envelope controls
- Wire into existing audio output chain (connect to Tone.js master if both are used).
- CRITICAL: AudioContext must be resumed inside a user gesture handler.
- Use CSS variables from the active theme for knob/slider styling.`,
  },
  {
    id: 'music-strudel',
    name: 'Strudel.js',
    description: 'Live coding music pattern language inspired by TidalCycles — algorithmic composition directly in the browser.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    group: 'Audio Engines',
    integrationPrompt: `Integrate Strudel.js for live coding music patterns.
- Load Strudel via CDN (no npm package available):
  - Add \`<script src="https://strudel.cc/strudel.js">\` to index.html
  - Or use dynamic import: \`const strudel = await import('https://strudel.cc/strudel.mjs')\`
- Create \`frontend/src/components/StrudelEditor.tsx\` with:
  - Code editor textarea with Strudel pattern syntax highlighting
  - Evaluate button that compiles and plays the pattern (gated behind user gesture)
  - Stop button to halt playback
  - Example patterns dropdown (mininotation basics, chord progressions, drum patterns)
- Create \`frontend/src/audio/strudel-bridge.ts\` with:
  - Connection between Strudel's audio output and the app's Web Audio graph
  - Pattern state management (current pattern, history, undo)
  - Error handling for invalid pattern syntax with user-friendly messages
- CRITICAL: Audio playback must be initiated by user gesture.
- Note: Strudel.js has no npm package — cannot be detected by "Already Added" logic.
- Use CSS variables from the active theme for editor styling.`,
  },

  // ── Playback & Streaming (2) ──────────────────────────────────
  {
    id: 'music-howler',
    name: 'Howler.js',
    description: 'Cross-browser audio playback manager — 7KB gzipped, handles every browser/format edge case. 23K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'howler' },
    group: 'Playback & Streaming',
    integrationPrompt: `Integrate Howler.js for robust audio playback.
- Install \`npm install howler\` and \`npm install -D @types/howler\`.
- Create \`frontend/src/audio/player.ts\` with:
  - AudioPlayer class wrapping Howl instances
  - Playlist management: queue, next, previous, shuffle, repeat modes
  - Audio sprite support for sound effects (define sprite map with start/duration)
  - Format detection and fallback chain (webm -> mp3 -> ogg)
  - Volume, rate, and stereo pan controls
  - Fade in/out with configurable duration
- Create \`frontend/src/components/AudioPlayer.tsx\` with:
  - Play/Pause/Next/Previous transport buttons
  - Seekbar with current time / total duration display
  - Volume slider with mute toggle
  - Now-playing info display (wired to audio metadata)
- Create \`frontend/src/hooks/useAudioPlayer.ts\` with:
  - React hook wrapping the AudioPlayer service
  - State: isPlaying, currentTime, duration, volume, currentTrack
  - Auto-cleanup on component unmount (howl.unload())
- Howler.js handles iOS Safari autoplay restrictions automatically.
- Use CSS variables from the active theme for player UI styling.`,
  },
  {
    id: 'music-webaudiofont',
    name: 'WebAudioFont',
    description: '2000+ General MIDI-compatible wavetable soundfonts — instant instrument playback with no samples to load.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'webaudiofont' },
    group: 'Playback & Streaming',
    integrationPrompt: `Integrate WebAudioFont for MIDI instrument playback.
- Install \`npm install webaudiofont\`.
- Create \`frontend/src/audio/soundfont.ts\` with:
  - WebAudioFont player initialization with AudioContext (gated behind user gesture)
  - Instrument loader: load GM instruments by program number (0-127)
  - Percussion loader: load drum kit by key number
  - Note playback: queueWaveTable() with pitch, duration, velocity
  - Chord playback: multiple simultaneous notes
  - Instrument switching with preload for zero-latency changes
- Create \`frontend/src/components/InstrumentPicker.tsx\` with:
  - GM instrument category selector (Piano, Strings, Brass, etc.)
  - Instrument name list within category
  - Preview button to audition selected instrument
- Wire into MIDI input if available (Web MIDI API → WebAudioFont playback).
- CRITICAL: AudioContext must be resumed inside a user gesture handler.
- Use CSS variables from the active theme for picker styling.`,
  },

  // ── Visualization (2) ─────────────────────────────────────────
  {
    id: 'music-wavesurfer',
    name: 'wavesurfer.js',
    description: 'Interactive waveform rendering with synchronized playback — v7 with extensible plugin system. 8.5K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'wavesurfer.js' },
    group: 'Visualization',
    integrationPrompt: `Integrate wavesurfer.js for waveform visualization.
- Install \`npm install wavesurfer.js\`.
- Create \`frontend/src/components/Waveform.tsx\` with:
  - WaveSurfer instance creation with container ref
  - Waveform color using CSS variables (waveColor, progressColor from theme)
  - Click-to-seek behavior
  - Zoom controls (horizontal zoom via minPxPerSec)
  - Responsive resize handling
- Create \`frontend/src/audio/waveform-plugins.ts\` with:
  - Regions plugin for loop selection (start/end markers)
  - Timeline plugin for time ruler display
  - Minimap plugin for overview navigation on long tracks
  - Spectrogram plugin for frequency-domain view
- Create \`frontend/src/hooks/useWaveform.ts\` with:
  - React hook managing WaveSurfer lifecycle (create on mount, destroy on unmount)
  - State: isReady, isPlaying, currentTime, duration
  - Methods: play(), pause(), seekTo(), zoom()
  - Event forwarding: ready, play, pause, seek, finish
- CRITICAL: WaveSurfer creates its own AudioContext — coordinate with other audio engines to share context.
- Use CSS variables from the active theme for waveform colors.`,
  },
  {
    id: 'music-audiomotion',
    name: 'audioMotion-analyzer',
    description: 'Real-time FFT spectrum analyzer with 240-band resolution and ANSI-standard octave bands. Zero dependencies.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'audiomotion-analyzer' },
    group: 'Visualization',
    integrationPrompt: `Integrate audioMotion-analyzer for spectrum visualization.
- Install \`npm install audiomotion-analyzer\`.
- Create \`frontend/src/components/SpectrumAnalyzer.tsx\` with:
  - AudioMotionAnalyzer instance with container ref
  - Connect to existing AudioContext source node (from Tone.js, Howler, or WaveSurfer)
  - Visualization modes: discrete frequencies, 1/3 octave bands, full octave bands
  - Gradient configuration using theme CSS variables for colors
  - FPS display toggle, peak hold, LED effect options
- Create \`frontend/src/hooks/useSpectrum.ts\` with:
  - React hook managing analyzer lifecycle
  - Dynamic mode switching (bar, line, radial)
  - Sensitivity controls (minDecibels, maxDecibels)
  - Smoothing time constant for visual responsiveness
- Wire audio source: call \`analyzer.connectInput(sourceNode)\` after audio engine initializes.
- CRITICAL: Requires a connected AudioNode — ensure audio engine is initialized first.
- Use CSS variables from the active theme for gradient colors and background.`,
  },

  // ── Music Theory & Notation (3) ───────────────────────────────
  {
    id: 'music-tonal',
    name: 'Tonal.js',
    description: 'Music theory primitives — notes, chords, scales, intervals, progressions. Pure functional API, zero deps. 6K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'tonal' },
    group: 'Music Theory & Notation',
    integrationPrompt: `Integrate Tonal.js for music theory computation.
- Install \`npm install tonal\`.
- Create \`frontend/src/audio/theory.ts\` with:
  - Scale service: list scales, get scale notes, detect scale from note set
  - Chord service: parse chord symbols, get chord notes, detect chord from notes
  - Interval service: distance between notes, transpose by interval
  - Progression service: common progressions (I-IV-V-I, ii-V-I, etc.) in any key
  - Key service: key signature, relative major/minor, enharmonic equivalents
- Create \`frontend/src/components/TheoryExplorer.tsx\` with:
  - Key selector dropdown (C through B, major/minor)
  - Scale browser showing notes on a piano keyboard visualization
  - Chord browser showing chord tones and voicings
  - Interval calculator between two selected notes
- Create \`frontend/src/hooks/useTheory.ts\` with:
  - React hook wrapping the theory service
  - Memoized scale/chord lookups for performance
  - Current key/scale context for the entire app
- Tonal.js is pure computation — no audio. Wire output to Tone.js or WebAudioFont for audible playback.
- Use CSS variables from the active theme for theory UI styling.`,
  },
  {
    id: 'music-vexflow',
    name: 'VexFlow',
    description: 'Publication-quality sheet music notation rendering to SVG or Canvas. 3.7K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'vexflow' },
    group: 'Music Theory & Notation',
    integrationPrompt: `Integrate VexFlow for sheet music notation rendering.
- Install \`npm install vexflow\`.
- Create \`frontend/src/components/NotationRenderer.tsx\` with:
  - VexFlow Factory/Renderer setup targeting an SVG container
  - Staff (Stave) rendering with clef, key signature, time signature
  - Note rendering from a simple note data format: { pitch: 'c/4', duration: 'q' }
  - Multi-voice support (melody + harmony on one staff)
  - Grand staff (treble + bass) for piano notation
  - Beaming, ties, slurs, and dynamics markings
- Create \`frontend/src/audio/notation-data.ts\` with:
  - TypeScript types for notation data (Note, Measure, Staff, Score)
  - Converter from Tonal.js chord/scale data to VexFlow note format
  - Converter from MIDI note numbers to VexFlow pitch notation
- Create \`frontend/src/hooks/useNotation.ts\` with:
  - React hook managing VexFlow renderer lifecycle
  - Re-render on data change with debounce for performance
  - Zoom/scroll controls for long scores
- VexFlow renders static notation — for playback cursor, sync with Tone.js transport position.
- Use CSS variables from the active theme: note color, staff line color, background.`,
  },
  {
    id: 'music-midiwriter',
    name: 'MidiWriterJS',
    description: 'Programmatic MIDI file generation and export — full General MIDI event model with multi-track support.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    packages: { npm: 'midi-writer-js' },
    group: 'Music Theory & Notation',
    integrationPrompt: `Integrate MidiWriterJS for MIDI file generation.
- Install \`npm install midi-writer-js\`.
- Create \`frontend/src/audio/midi-export.ts\` with:
  - MidiWriter.Writer and Track setup
  - Note event creation from app's internal note representation
  - Multi-track export (melody, bass, drums on separate tracks)
  - Program change events for instrument selection (GM program numbers)
  - Tempo and time signature meta events
  - Export to Blob for download: \`new Blob([writer.buildFile()], {type: 'audio/midi'})\`
- Create \`frontend/src/components/MidiExportButton.tsx\` with:
  - Export button that generates MIDI from current project data
  - Track selection checkboxes (which tracks to include)
  - Download trigger using URL.createObjectURL()
  - Progress indicator for large exports
- Create \`frontend/src/audio/midi-import.ts\` (optional) with:
  - MIDI file parsing (MidiWriterJS is write-only — use a separate parser or the Web MIDI API)
  - Converter from parsed MIDI to app's internal note representation
- Wire into Tonal.js for theory-aware MIDI generation (e.g., export a chord progression as MIDI).
- Use CSS variables from the active theme for export UI styling.`,
  },

  // ── Audio Infrastructure (2 custom) ───────────────────────────
  {
    id: 'music-resilience',
    name: 'Production Resilience',
    description: 'Streaming audio error handling — reconnect logic, buffer underrun recovery, AudioContext suspend/resume.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    group: 'Audio Infrastructure',
    integrationPrompt: `Integrate Production Resilience patterns for audio streaming.
- Create \`frontend/src/audio/resilience.ts\` adapting the production_resilience pattern:
  - AudioContext state monitor: detect 'suspended', 'interrupted', 'closed' states
  - Auto-resume on user interaction after suspension (iOS background tab, phone call)
  - Streaming reconnect: exponential backoff for WebSocket/SSE audio streams
  - Buffer underrun detection: monitor AudioBuffer scheduling gaps
  - Recovery strategy: re-queue buffered audio, crossfade to avoid clicks
  - Graceful degradation: fall back to lower quality audio if network is poor
- Create \`frontend/src/hooks/useAudioResilience.ts\` with:
  - React hook that wraps AudioContext with resilience monitoring
  - State: contextState, isRecovering, lastError
  - Auto-recovery on context interruption
  - Error event forwarding for UI notification
- Wire into all audio engines (Tone.js, Elementary, Howler) as a shared resilience layer.
- Test on iOS Safari (most restrictive audio policies) and Chrome Android.`,
  },
  {
    id: 'music-orchestrator',
    name: 'Audio Orchestrator',
    description: 'Multi-step audio processing pipeline with agent coordination — analyze, transform, render in sequence.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['music'],
    themes: ['expert'],
    group: 'Audio Infrastructure',
    integrationPrompt: `Integrate Audio Orchestrator for multi-step audio processing.
- Create \`backend/app/audio/orchestrator.py\` adapting the agent_orchestrator pattern:
  - Pipeline definition: ordered list of processing steps (analyze -> transform -> render)
  - Step types: AudioAnalysis (FFT, onset detection, key detection), AudioTransform (pitch shift, time stretch, filter), AudioRender (mix, export, stream)
  - Step execution with intermediate result passing
  - Error handling: skip failed steps, report partial results
  - Timeout management per step (audio processing can be slow)
- Create \`backend/app/audio/analyzers.py\` with:
  - BPM detection from audio buffer
  - Key/scale detection using pitch class histogram
  - Onset detection for beat alignment
- Add endpoint \`POST /api/audio/process\` in backend routes:
  - Accepts audio file upload + pipeline configuration
  - Returns processing results (analysis data, transformed audio URL)
  - Supports streaming progress updates via SSE
- Wire into the generation pipeline for AI-assisted audio manipulation.`,
  },

  // ── Agents (3) ────────────────────────────────────────────────
  {
    id: 'music-agent-scaffold',
    name: 'Scaffold Generator',
    description: 'Generates music app project structure with audio-aware directories (synths/, effects/, samples/).',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['music'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Scaffold Generator for a music application.
- Analyze project for audio requirements (playback, synthesis, visualization, theory).
- Generate audio-aware directory structure:
  - frontend/src/audio/ — engine, player, DSP, MIDI modules
  - frontend/src/components/audio/ — waveform, spectrum, transport, piano UI
  - frontend/src/hooks/ — useAudioPlayer, useWaveform, useTheory hooks
  - backend/app/audio/ — processing, analysis, orchestration
  - public/samples/ — audio sample assets
  - public/soundfonts/ — soundfont instrument files
- Include starter files with AudioContext initialization pattern.
- Return structured report with directory tree and file descriptions.`,
  },
  {
    id: 'music-agent-fullstack',
    name: 'Full Stack Scaffolding',
    description: 'Plans music app architecture with audio-specific configurations (Web Audio API, MIDI, streaming).',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['music'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Full Stack Scaffolding for a music application.
- Analyze the project description for audio feature requirements.
- Plan architecture with audio-specific considerations:
  - Frontend: Web Audio API setup, AudioWorklet support, MIDI integration
  - Backend: Audio file handling (upload, processing, streaming), WebSocket for real-time
  - Storage: Audio file storage strategy (local, S3, CDN)
  - Performance: Audio buffer sizes, sample rates, latency targets
- Estimate resource requirements and API costs.
- Return structured architecture plan with component diagram.`,
  },
  {
    id: 'music-agent-boilerplate',
    name: 'Boilerplate Generator',
    description: 'Injects audio design patterns — Observer for playback events, State for transport modes.',
    category: 'agent',
    level: 'expert',
    side: 'frontend',
    domains: ['music'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Boilerplate Generator for audio design patterns.
- Analyze existing code for audio state management needs.
- Generate appropriate patterns:
  - Observer pattern for playback events (play, pause, seek, end, error)
  - State pattern for transport modes (stopped, playing, recording, paused)
  - Command pattern for undo/redo of audio edits (cut, paste, volume changes)
  - Mediator pattern for coordinating multiple audio sources
- Insert patterns into existing code structure.
- Return summary of injected patterns with usage examples.`,
  },
]
```

**Step 2: Verify the file has no TypeScript errors**

Run: `cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to music.ts (other pre-existing errors may appear)

**Step 3: Commit**

```bash
git add frontend/src/tools/domains/music.ts
git commit -m "feat(tools): add music domain with 15 expert tools in 5 capability groups"
```

---

### Task 2: Register Music Tools in Registry

**Files:**
- Modify: `frontend/src/tools/registry.ts`

**Step 1: Add import and spread**

Add to the imports section of `registry.ts`:
```typescript
import { MUSIC_TOOLS } from './domains/music'
```

Add to the `TOOL_CATALOG` array (after existing domain spreads):
```typescript
export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,  // if already added
  ...RAG_TOOLS,       // if already added
  ...MUSIC_TOOLS,     // domain tools listed AFTER so they override
])
```

**Step 2: Verify no duplicate IDs**

All music tool IDs use `music-` prefix. No overlaps with expert.ts expected. Verify:
```bash
cd /storage/self/primary/Download/aus-studio/frontend && grep -c "music-" src/tools/domains/music.ts
```
Expected: 15 (one per tool)

**Step 3: Commit**

```bash
git add frontend/src/tools/registry.ts
git commit -m "feat(tools): register music domain tools in registry"
```

---

### Task 3: Integration Verification

**Step 1: Verify domain selector includes music**

Check that `ToolDomain` type in `types.ts` includes a music-related value. If not, add `'music'` to the `ToolDomain` union.

**Step 2: Verify tool counts**

Write a quick check:
```bash
cd /storage/self/primary/Download/aus-studio/frontend && node -e "
  // Count tools by group
  const fs = require('fs');
  const content = fs.readFileSync('src/tools/domains/music.ts', 'utf8');
  const groups = content.match(/group: '[^']+'/g);
  const counts = {};
  groups.forEach(g => { const name = g.match(/'([^']+)'/)[1]; counts[name] = (counts[name]||0)+1; });
  console.log(counts);
  console.log('Total:', groups.length);
"
```

Expected output:
```
{
  'Audio Engines': 3,
  'Playback & Streaming': 2,
  'Visualization': 2,
  'Music Theory & Notation': 3,
  'Audio Infrastructure': 2,
  'Agents': 3
}
Total: 15
```

**Step 3: Verify no missing required fields**

Check every entry has: id, name, description, category, level, side, domains, themes, group, integrationPrompt:
```bash
cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit 2>&1 | grep music
```
Expected: No errors

**Step 4: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(tools): music domain integration fixes"
```
