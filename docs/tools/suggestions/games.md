# Games / Interactive / Physics / Multiplayer — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building an app that involves game development, interactive experiences, physics simulation, or multiplayer networking.

---

## Custom Tools (from docs/tools/)

| Tool | Source Folder | What It Does | Integration Role |
|------|---------------|--------------|------------------|
| `scaffold_generator` | by category/generators | Project scaffolding with game-oriented directory structures (assets, scenes, entities) | Utility |
| `boilerplate_generator` | by category/generators | Design patterns critical for game architecture: Observer (events), State (game states), Command (input/undo) | Library |
| `code_writer_agent` | by category/agents | Natural language to code generation for game logic (AI behaviors, level generators, scoring systems) | Agent |
| `code_analyzer_agent` | by category/agents | Codebase analysis for game code optimization (render loops, memory allocation, GC pressure) | Agent |
| `production_resilience` | by category/dev | Error handling for multiplayer/networked games (reconnection, state reconciliation, timeout recovery) | Library |
| `full_stack_scaffolding` | by category/dev | App type planning with game-specific configurations (asset pipeline, build targets, deployment) | Utility |

---

## External Libraries

| Library | Install | What It Does | Why It Matters |
|---------|---------|--------------|----------------|
| **Phaser 3** | `npm: phaser` | Full 2D game framework: sprites, tilemaps, physics (Arcade + Matter.js + Impact), audio, input, cameras | 36K stars, most complete browser game framework |
| **PixiJS v8** | `npm: pixi.js` | Ultra-fast 2D WebGL/WebGPU renderer with scene graph, filters, and mesh support | 43K stars, fastest 2D renderer available; WebGPU-first in v8 |
| **Matter.js** | `npm: matter-js` | 2D rigid-body physics: collision detection, constraints, composites, sleeping bodies | 16K stars, most approachable physics API for the web |
| **Rapier (WASM)** | `npm: @dimforge/rapier2d` | Rust-based physics engine compiled to WebAssembly, 2D and 3D variants | 2-5x faster than pure JS engines; deterministic simulation |
| **Planck.js** | `npm: planck` | JavaScript port of Box2D with TypeScript types | Accurate Box2D simulation behavior; well-documented, stable |
| **Colyseus** | `npm: colyseus` | Authoritative multiplayer game server with rooms, matchmaking, delta-compressed state sync | 6.1K stars, write state schema once and it auto-syncs to all clients |
| **Howler.js** | `npm: howler` | Audio playback manager with spatial audio, sprite maps, and format fallbacks | 23K stars, handles every browser audio edge case |

---

## Frameworks

| Framework | Install | What It Does | Why Choose It |
|-----------|---------|--------------|---------------|
| **Phaser 3** | `npm: phaser` | Full game framework with 3 physics systems, 30+ asset loaders, scene management, tweens, particles | Battle-tested with massive community; if you need one framework, this is it |
| **Excalibur.js** | `npm: excalibur` | TypeScript-first ECS (Entity-Component-System) 2D game engine | Friendly API with full IntelliSense; built for TypeScript developers |
| **KAPLAY** | `npm: kaplay` | Component-based 2D game library, successor to Kaboom.js | Tiled map integration, plain-English syntax like `player.onCollide("enemy", ...)` |
| **LittleJS** | `npm: littlejsengine` | Tiny ~6KB game engine with zero dependencies | Perfect for game jams, prototypes, and learning; surprisingly capable for its size |
| **Kontra.js** | `npm: kontra` | Micro game library designed for the JS13K size constraint | Tree-shakeable modules that fit in 13KB; ideal for size-constrained deployments |
| **melonJS 2** | `npm: melonjs` | Standalone HTML5 game engine with first-class Tiled TMX support | No bundler required, CDN-ready; excellent for tile-based games |
| **Rapier (WASM)** | `npm: @dimforge/rapier2d` or `@dimforge/rapier3d` | Rust physics compiled to WASM, available in 2D and 3D | 2-5x faster than JavaScript physics engines; deterministic cross-platform simulation |
| **Planck.js** | `npm: planck` | JavaScript Box2D port with idiomatic API | Accurate Box2D-compatible simulation with full TypeScript types |
| **Colyseus** | `npm: colyseus` | Multiplayer rooms, matchmaking, lobby, state synchronization | Write your state schema once; automatic delta-compressed sync to all connected clients |

---

## Recommended Combinations

### Simple 2D Game
> KAPLAY + Matter.js + Howler.js

- **KAPLAY** provides the game loop, sprites, input handling, and scene management with a beginner-friendly API
- **Matter.js** adds physics when KAPLAY's built-in collision isn't enough (e.g., ragdolls, ropes, pulleys)
- **Howler.js** handles all game audio: background music, sound effects, spatial audio
- Use `scaffold_generator` to set up the project with asset folders and a clean entry point
- Use `boilerplate_generator` for the State pattern (menu -> playing -> paused -> game over)

### Complex 2D Game
> Phaser 3 + Rapier (WASM) + Colyseus

- **Phaser 3** is the game framework: rendering, scene management, tilemaps, cameras, input, particles
- **Rapier** replaces Phaser's built-in physics with a high-performance WASM engine for complex simulations
- **Colyseus** adds authoritative multiplayer with room-based matchmaking and state sync
- Use `production_resilience` for handling network disconnects, state reconciliation, and reconnection
- Use `code_analyzer_agent` to profile render loops and identify GC pressure points

### High-Performance Rendering
> PixiJS v8 + Matter.js + custom game loop

- **PixiJS v8** provides the fastest 2D rendering pipeline (WebGPU-first, WebGL fallback)
- **Matter.js** handles physics separately from the render pipeline
- Build a custom game loop with fixed-timestep physics and interpolated rendering
- Use `code_writer_agent` to generate boilerplate for the fixed-timestep loop and input system
- Best for: bullet-hell games, particle-heavy effects, large sprite counts (10K+)

### Game Jam / Prototype
> LittleJS or Kontra.js + `boilerplate_generator`

- **LittleJS** (~6KB) or **Kontra.js** (tree-shakeable) gets you running in minutes with zero configuration
- **`boilerplate_generator`** provides State pattern (game states), Observer pattern (event bus), and Command pattern (input mapping/undo)
- Add Matter.js only if physics complexity demands it; both engines include basic collision detection
- Focus: speed of iteration over architectural perfection; ship in 48 hours

### Tile-Based Game
> melonJS 2 + Tiled (editor) + `code_writer_agent`

- **melonJS 2** has first-class support for Tiled TMX maps, including object layers and tile properties
- **Tiled** (external editor) creates the maps; melonJS loads and renders them directly
- **`code_writer_agent`** generates entity classes, AI behaviors, and level transition logic from natural language
- Use `scaffold_generator` to structure the project with maps/, entities/, and screens/ directories
- Best for: RPGs, platformers, top-down adventure games, strategy games

### Multiplayer Game
> Colyseus + Excalibur.js + `production_resilience`

- **Colyseus** provides the authoritative server: room lifecycle, matchmaking, lobby, state sync
- **Excalibur.js** handles the client-side game with its TypeScript-first ECS architecture
- **`production_resilience`** manages connection handling: reconnection, timeout recovery, graceful degradation
- Colyseus state schemas auto-generate client-side types; pairs naturally with Excalibur's TypeScript API
- Use `code_writer_agent` to generate Colyseus room handlers and state schemas from game design descriptions

---

## Integration Notes

- **Game loop**: Use `requestAnimationFrame` for rendering, but decouple physics with a fixed timestep (e.g., 60Hz physics, variable render rate). This prevents physics instability on low-FPS devices.
- **Asset loading**: All frameworks above include asset loaders, but for large games consider a loading screen with progress. Phaser and melonJS have built-in preloaders; for PixiJS use `@pixi/assets`.
- **Input handling**: For mobile games, add touch/gesture support early. Phaser and KAPLAY handle this natively. For PixiJS, use `@pixi/events` or a library like Hammer.js.
- **Audio in games**: Browser autoplay policies apply to games too. Always start audio on the first user interaction. Howler.js and Phaser's audio system handle this, but test on iOS Safari.
- **Performance**: Watch for garbage collection pauses. Avoid allocating objects in the game loop (reuse vectors, pre-allocate pools). Use `code_analyzer_agent` to identify allocation hotspots.
- **Multiplayer architecture**: Always use an authoritative server (Colyseus). Never trust the client. Send inputs to the server, let the server update state, and sync state back. Client-side prediction + server reconciliation is essential for responsive feel.
- **WebGPU**: PixiJS v8 is WebGPU-first. If targeting modern browsers (Chrome 113+), WebGPU provides significant performance gains over WebGL, especially for particle systems and complex shaders.
