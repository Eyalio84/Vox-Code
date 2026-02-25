# Music / Audio / Sound — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building an app that involves music production, audio manipulation, sound synthesis, or music visualization.

---

## Custom Tools (from docs/tools/)

| Tool | Source Folder | What It Does | Integration Role |
|------|---------------|--------------|------------------|
| `parser_adapters` | docs-parsers | 15+ format parsers including audio metadata extraction (ID3, Vorbis, FLAC tags) | Library |
| `agent_orchestrator` | agents-misc | Multi-agent orchestration for complex audio pipelines (e.g., analyze -> transform -> render) | Backend service |
| `scaffold_generator` | by category/generators | Project scaffolding for music apps with audio-aware directory structures | Utility |
| `boilerplate_generator` | by category/generators | Design patterns for audio state management (Observer for playback events, State for transport) | Library |
| `production_resilience` | by category/dev | Error handling for streaming audio APIs (reconnect logic, buffer underrun recovery) | Library |
| `full_stack_scaffolding` | by category/dev | App type template planning with audio-specific configurations | Utility |

> **Note**: The custom tool collection is primarily focused on AI/KG/development tools. For music specifically, external libraries and frameworks carry the weight. The custom tools above provide supporting infrastructure (scaffolding, orchestration, error handling) rather than audio-specific functionality.

---

## External Libraries

| Library | Install | What It Does | Why It Matters |
|---------|---------|--------------|----------------|
| **Tone.js** | `npm: tone` | Full DAW-style Web Audio framework: synths, effects, transport, scheduling | 13K stars, the standard for web audio |
| **Howler.js** | `npm: howler` | Audio playback manager, 7KB gzipped, sprite-based sample maps | 23K stars, covers every browser/format edge case |
| **wavesurfer.js** | `npm: wavesurfer.js` | Interactive waveform rendering + synchronized playback | 8.5K stars, v7 with extensible plugin system |
| **Tonal.js** | `npm: tonal` | Music theory primitives: notes, chords, scales, intervals, progressions | 6K stars, pure functional API, zero deps |
| **VexFlow** | `npm: vexflow` | Sheet music notation rendering to SVG or Canvas | 3.7K stars, publication-quality engraving |
| **MidiWriterJS** | `npm: midi-writer-js` | Programmatic MIDI file generation and export | Full General MIDI event model, multi-track |
| **audioMotion-analyzer** | `npm: audiomotion-analyzer` | Real-time spectrum analyzer (FFT), zero dependencies | 240-band resolution, ANSI-standard octave bands |
| **Elementary Audio** | `npm: @elemaudio/core` | Declarative/functional DSP graph construction | Same mental model as React, but for audio signal processing |
| **WebAudioFont** | `npm: webaudiofont` | 2000+ General MIDI-compatible wavetable soundfonts | Instant instrument playback in the browser, no samples to load |

---

## Frameworks

| Framework | Install | What It Does | Why Choose It |
|-----------|---------|--------------|---------------|
| **Tone.js** | `npm: tone` | DAW-level scheduling, transport control, sequencing, effects chains | Industry standard for web audio applications; if you need one framework, this is it |
| **Elementary Audio** | `npm: @elemaudio/core @elemaudio/web-renderer` | Declarative DSP with hot-reloadable audio processing graphs | React-like mental model for audio; write DSP as composable functions |
| **Strudel.js** | Web-based (strudel.cc) | Live coding music pattern language inspired by TidalCycles | Algorithmic composition directly in the browser; great for generative music |

---

## Recommended Combinations

### Music Player App
> Howler.js + wavesurfer.js + audioMotion-analyzer

- **Howler.js** handles cross-browser playback, format detection, and audio sprites
- **wavesurfer.js** provides the interactive waveform timeline with seek/zoom
- **audioMotion-analyzer** adds real-time frequency spectrum visualization
- Use `parser_adapters` for reading audio file metadata (artist, album, duration)

### DAW / Sequencer
> Tone.js + MidiWriterJS + Tonal.js + VexFlow

- **Tone.js** is the audio engine: synths, effects, transport clock, pattern sequencing
- **MidiWriterJS** handles MIDI import/export for interop with hardware and other DAWs
- **Tonal.js** powers the theory engine: chord detection, scale suggestions, transposition
- **VexFlow** renders notation for a score/piano-roll view
- Use `boilerplate_generator` for Observer pattern (transport events) and State pattern (playback modes)

### Music Theory Tool
> Tonal.js + VexFlow + WebAudioFont

- **Tonal.js** is the computational core: interval math, chord voicings, scale mappings
- **VexFlow** renders the theory visually as standard notation
- **WebAudioFont** provides instant playback of any GM instrument for audible examples
- Use `scaffold_generator` for a clean project structure with theory modules separated from UI

### Audio Visualizer
> wavesurfer.js + audioMotion-analyzer + D3.js

- **wavesurfer.js** handles audio loading, decoding, and the base waveform view
- **audioMotion-analyzer** provides FFT data and built-in spectrum visualizations
- **D3.js** enables fully custom visualizations driven by audio data (radial, particle, etc.)
- Use `production_resilience` for handling Web Audio API context suspension/resume across browsers

### Generative Music
> Elementary Audio + Tonal.js + `agent_orchestrator`

- **Elementary Audio** defines the DSP graph declaratively (oscillators, filters, envelopes)
- **Tonal.js** provides the harmonic vocabulary for algorithmic composition
- **`agent_orchestrator`** runs an AI composition pipeline: analyze input -> generate patterns -> render audio
- Use `full_stack_scaffolding` to plan the app architecture (frontend controls + backend generation service)

---

## Integration Notes

- **Web Audio API context**: Browsers require a user gesture before starting audio. Always gate `AudioContext.resume()` behind a click/tap handler.
- **Streaming audio**: For real-time audio processing or streaming from a server, use `production_resilience` to handle buffer underruns, network drops, and reconnection.
- **Audio worklets**: Tone.js and Elementary Audio both support AudioWorklet for off-main-thread processing. Prefer worklets over ScriptProcessorNode (deprecated).
- **CORS and audio**: Cross-origin audio files need proper CORS headers for Web Audio API analysis (FFT, waveform). Serve audio from the same origin or configure CORS on the CDN.
- **Mobile considerations**: iOS Safari has strict autoplay policies. Howler.js handles most edge cases, but always test on real devices.
