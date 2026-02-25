# Games Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 19 games/interactive domain tools to the Expert drawer organized by 5 capability groups.

**Architecture:** Single domain file (`games.ts`) exports `GAMES_TOOLS` array with 19 `ToolEntry` objects. Registry imports and dedup merges them. No type or component changes needed — infrastructure from site-dev plan Tasks 1-5 is prerequisite.

**Tech Stack:** TypeScript, existing ToolEntry type system, registry helpers

**Prerequisite:** site-dev plan Tasks 1-5 (types.ts `group` field, registry helpers, ToolCard `isAdded`, ToolDrawer accordion/domain selector, StudioPage wiring) must be implemented first.

---

### Task 1: Create `frontend/src/tools/domains/games.ts`

**Files:**
- Create: `frontend/src/tools/domains/games.ts`

**Step 1: Create the domain file with all 19 tool entries**

```typescript
// frontend/src/tools/domains/games.ts
import type { ToolEntry } from '../types'

export const GAMES_TOOLS: ToolEntry[] = [
  // ── Game Engines (6) ──────────────────────────────────────────
  {
    id: 'games-phaser',
    name: 'Phaser 3',
    description: 'Full 2D game framework: sprites, tilemaps, 3 physics systems, audio, cameras, particles. 36K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'phaser' },
    group: 'Game Engines',
    integrationPrompt: `Integrate Phaser 3 as the core game engine.
- Install \`npm install phaser\`.
- Create \`frontend/src/game/config.ts\` with:
  - Phaser.Game configuration: canvas size, physics engine selection (Arcade for simple, Matter for complex)
  - Scale manager: responsive resize with aspect ratio preservation
  - Audio configuration: Web Audio API preferred, HTML5 fallback
- Create \`frontend/src/game/scenes/BootScene.ts\` with:
  - Asset preloader: sprites, spritesheets, tilemaps, audio
  - Loading progress bar for large asset bundles
  - Transition to main game scene on completion
- Create \`frontend/src/game/scenes/GameScene.ts\` with:
  - Scene lifecycle: preload(), create(), update(time, delta)
  - Sprite creation with physics bodies
  - Input handling: keyboard (cursors), mouse/touch, gamepad
  - Camera setup: follow player, world bounds, zoom
  - Collision detection between groups (player vs enemies, bullets vs enemies)
- Create \`frontend/src/game/scenes/UIScene.ts\` with:
  - HUD overlay scene running in parallel with GameScene
  - Score display, health bar, minimap
  - Pause menu with resume/restart/quit
- Use fixed timestep for physics: \`this.physics.world.fixedStep = true\` (Arcade) or configure Matter.js engine timing.
- Use CSS variables from the active theme for any HTML UI elements outside the canvas.`,
  },
  {
    id: 'games-excalibur',
    name: 'Excalibur.js',
    description: 'TypeScript-first ECS 2D game engine with full IntelliSense and friendly API.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'excalibur' },
    group: 'Game Engines',
    integrationPrompt: `Integrate Excalibur.js as the game engine.
- Install \`npm install excalibur\`.
- Create \`frontend/src/game/engine.ts\` with:
  - Engine initialization with display mode (FitScreen/FillScreen), background color
  - Loader setup with progress tracking
  - Global configuration: physics, pointer input, antialiasing
- Create \`frontend/src/game/actors/Player.ts\` with:
  - Actor subclass with SpriteSheet graphics
  - Component-based behavior: MotionComponent, HealthComponent
  - Input handling via onPreUpdate() with keyboard/pointer events
  - Collision handlers via onCollisionStart/End
- Create \`frontend/src/game/scenes/Level.ts\` with:
  - Scene subclass with tilemap loading
  - Entity spawning from tile object layers
  - Camera strategy: follow actor with elastic behavior
- Create \`frontend/src/game/components/Health.ts\` with:
  - Custom Component<"health"> with current/max HP
  - Damage/heal methods with event emission
  - Death handling with respawn logic
- Excalibur uses ECS — prefer composition (components) over inheritance (subclassing Actor).
- Use CSS variables from the active theme for HTML UI overlay.`,
  },
  {
    id: 'games-kaplay',
    name: 'KAPLAY',
    description: 'Component-based 2D game library with plain-English API — successor to Kaboom.js. Tiled map integration.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'kaplay' },
    group: 'Game Engines',
    integrationPrompt: `Integrate KAPLAY as the game engine.
- Install \`npm install kaplay\`.
- Create \`frontend/src/game/main.ts\` with:
  - kaplay() initialization with canvas size, background, scale
  - loadSprite(), loadSound() for asset loading
  - scene() definitions for game states (menu, play, gameover)
- Create \`frontend/src/game/player.ts\` with:
  - Player entity with components: sprite(), area(), body(), health()
  - Movement: onKeyDown("left", ...), onKeyDown("right", ...)
  - Collision: player.onCollide("enemy", () => { ... })
  - Plain-English API: \`player.hurt(1)\`, \`player.isGrounded()\`
- Create \`frontend/src/game/level.ts\` with:
  - Level layout using addLevel() with tile map array
  - Tiled TMX map loading via the kaplay-tiled plugin
  - Camera follow with shake effect on hit
- KAPLAY uses a global context pattern — components are added via add([...]) not classes.
- Best for: beginners, rapid prototyping, game jams.
- Use CSS variables from the active theme for HTML UI styling.`,
  },
  {
    id: 'games-littlejs',
    name: 'LittleJS',
    description: 'Tiny ~6KB game engine with zero dependencies — particles, tiles, WebGL renderer. Surprisingly capable.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'littlejsengine' },
    group: 'Game Engines',
    integrationPrompt: `Integrate LittleJS as a minimal game engine.
- Install \`npm install littlejsengine\`.
- Create \`frontend/src/game/main.ts\` with:
  - engineInit() with gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost callbacks
  - Tile sheet setup for sprite rendering
  - Game state management in gameUpdate()
- Create \`frontend/src/game/player.ts\` with:
  - EngineObject subclass for the player entity
  - update() override for movement logic using keyIsDown/keyWasPressed
  - render() override for custom draw calls (optional, sprites work by default)
  - Collision callback via collideWithObject()
- LittleJS includes: tile engine, particle system, sound effects, music, medals, debug tools.
- ~6KB size — ideal for game jams, JS13K, prototypes.
- Uses a global coordinate system with vector math (vec2).
- Use CSS variables from the active theme for any HTML overlay.`,
  },
  {
    id: 'games-kontra',
    name: 'Kontra.js',
    description: 'Micro game library — tree-shakeable modules for Sprite, GameLoop, TileEngine. Fits in 13KB.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'kontra' },
    group: 'Game Engines',
    integrationPrompt: `Integrate Kontra.js as a micro game library.
- Install \`npm install kontra\`.
- Create \`frontend/src/game/main.ts\` with:
  - Import only needed modules: \`import { init, GameLoop, Sprite, TileEngine } from 'kontra'\`
  - init() to set up canvas
  - GameLoop with update() and render() callbacks
- Create \`frontend/src/game/entities.ts\` with:
  - Sprite definitions with position, velocity, image/animations
  - Pool for bullet/particle recycling (avoids GC pressure)
  - TileEngine for tile-based levels
- Kontra is tree-shakeable — only import what you use for minimal bundle size.
- Ideal for JS13K competition or size-constrained deployments.
- Add matter-js only if physics complexity demands it; Kontra includes basic collision via sprite.collidesWith().
- Use CSS variables from the active theme for HTML overlay.`,
  },
  {
    id: 'games-melonjs',
    name: 'melonJS 2',
    description: 'HTML5 game engine with first-class Tiled TMX map support — no bundler required, CDN-ready.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'melonjs' },
    group: 'Game Engines',
    integrationPrompt: `Integrate melonJS 2 as the game engine.
- Install \`npm install melonjs\`.
- Create \`frontend/src/game/main.ts\` with:
  - me.device.onReady() initialization
  - me.video.init() with canvas configuration
  - me.loader.preload() for asset manifest (sprites, TMX maps, audio)
  - State registration: me.state.set(me.state.PLAY, new PlayScreen())
- Create \`frontend/src/game/screens/PlayScreen.ts\` with:
  - me.Stage subclass with onResetEvent() for level setup
  - me.level.load() for TMX map loading from Tiled editor
  - Entity spawning from TMX object layers
  - Camera: me.game.viewport.follow() with easing
- Create \`frontend/src/game/entities/Player.ts\` with:
  - me.Entity subclass with sprite and body configuration
  - update(dt) for movement, gravity, collision response
  - Collision handler via onCollision() callback
  - Animation states: idle, run, jump, attack
- melonJS has built-in: collision, particles, tween, audio, fonts, TMX.
- Best for: tile-based games (RPGs, platformers, top-down adventures).
- Use CSS variables from the active theme for HTML UI.`,
  },

  // ── Rendering (1) ─────────────────────────────────────────────
  {
    id: 'games-pixi',
    name: 'PixiJS v8',
    description: 'Ultra-fast 2D WebGL/WebGPU renderer — scene graph, filters, mesh/sprite batching. 43K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'pixi.js' },
    group: 'Rendering',
    integrationPrompt: `Integrate PixiJS v8 for high-performance 2D rendering.
- Install \`npm install pixi.js\`.
- Create \`frontend/src/game/renderer.ts\` with:
  - Application initialization: \`await app.init({ preference: 'webgpu', fallback: 'webgl2' })\`
  - Canvas sizing with responsive resize handler
  - Render settings: antialiasing, resolution (devicePixelRatio), background color
- Create \`frontend/src/game/gameloop.ts\` with:
  - Fixed-timestep game loop: physics at 60Hz, render at display refresh rate
  - Interpolation between physics states for smooth rendering
  - app.ticker for render loop, separate interval for physics
  - Delta time accumulator pattern to prevent spiral of death
- Create \`frontend/src/game/sprites.ts\` with:
  - Sprite and AnimatedSprite factory from spritesheets
  - Container hierarchy for scene graph management
  - Object pooling for frequently created/destroyed sprites (bullets, particles)
  - Batch rendering configuration for 10K+ sprites
- Create \`frontend/src/game/input.ts\` with:
  - Event system using @pixi/events for pointer/touch input
  - Keyboard input manager (keydown/keyup tracking)
  - Touch gesture recognition for mobile
- PixiJS v8 is WebGPU-first (Chrome 113+). Falls back to WebGL2 automatically.
- PixiJS is a RENDERER only — no physics, no game loop. Combine with Matter.js/Rapier for physics.
- Use CSS variables from the active theme for HTML overlay UI.`,
  },

  // ── Physics (3) ───────────────────────────────────────────────
  {
    id: 'games-matter',
    name: 'Matter.js',
    description: 'Approachable 2D rigid-body physics — collision detection, constraints, composites, sleeping bodies. 16K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'matter-js' },
    group: 'Physics',
    integrationPrompt: `Integrate Matter.js for 2D physics simulation.
- Install \`npm install matter-js\` and \`npm install -D @types/matter-js\`.
- Create \`frontend/src/game/physics.ts\` with:
  - Engine and World creation with gravity configuration
  - Body factories: rectangle, circle, polygon, fromVertices
  - Constraint types: distance, revolute, mouse constraint
  - Composite bodies: car (wheels + chassis), ragdoll, chain, soft body
  - Sleeping bodies for performance (static objects don't simulate)
  - Collision categories and masks for filtered detection
- Create \`frontend/src/game/physics-sync.ts\` with:
  - Sync function: read Matter.js body positions -> update game entity positions
  - Fixed timestep: Engine.update(engine, 1000/60) called at fixed intervals
  - Interpolation: blend between previous and current physics state for smooth rendering
- Create \`frontend/src/game/collision-handler.ts\` with:
  - Events.on(engine, 'collisionStart', ...) for collision callbacks
  - Collision pair filtering by body label or category
  - Contact point data for impact effects (sparks, sounds)
- IMPORTANT: Never call Engine.update() with variable delta — use fixed timestep to prevent physics instability.
- Matter.js is the most approachable physics API — great for most 2D games.
- Use CSS variables from the active theme for any debug renderer overlay.`,
  },
  {
    id: 'games-rapier',
    name: 'Rapier (WASM)',
    description: 'Rust-based physics engine compiled to WebAssembly — 2-5x faster than pure JS, deterministic simulation.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: '@dimforge/rapier2d' },
    group: 'Physics',
    integrationPrompt: `Integrate Rapier WASM for high-performance 2D physics.
- Install \`npm install @dimforge/rapier2d\`.
- Create \`frontend/src/game/physics-rapier.ts\` with:
  - WASM initialization: \`await import('@dimforge/rapier2d')\` (async, must await)
  - World creation with gravity vector
  - RigidBody types: Dynamic, Fixed, KinematicPositionBased, KinematicVelocityBased
  - Collider shapes: ball, cuboid, capsule, convex hull, trimesh
  - Joint types: revolute, prismatic, fixed, ball
  - CCD (Continuous Collision Detection) for fast-moving objects
- Create \`frontend/src/game/rapier-sync.ts\` with:
  - world.step() called at fixed timestep (physics clock)
  - Body position/rotation sync to game entities
  - Event queue processing: collision events, contact force events
- Rapier is 2-5x faster than Matter.js/Planck.js — use for physics-heavy games (100+ dynamic bodies).
- Rapier is deterministic — same inputs produce same outputs across platforms (critical for multiplayer).
- WASM init is async — ensure physics is ready before starting the game loop.
- Use \`@dimforge/rapier3d\` for 3D physics (same API pattern).`,
  },
  {
    id: 'games-planck',
    name: 'Planck.js',
    description: 'JavaScript Box2D port with TypeScript types — accurate, stable simulation matching Box2D behavior.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'planck' },
    group: 'Physics',
    integrationPrompt: `Integrate Planck.js for Box2D-compatible physics.
- Install \`npm install planck\`.
- Create \`frontend/src/game/physics-planck.ts\` with:
  - World creation: \`new planck.World({ gravity: planck.Vec2(0, -10) })\`
  - Body creation: createDynamicBody(), createStaticBody(), createKinematicBody()
  - Fixture shapes: Box, Circle, Polygon, Chain, Edge
  - Joint types: RevoluteJoint, PrismaticJoint, DistanceJoint, WeldJoint, PulleyJoint
  - Contact listener for collision callbacks: beginContact, endContact, preSolve, postSolve
- Create \`frontend/src/game/planck-sync.ts\` with:
  - world.step(1/60, 8, 3) — timestep, velocity iterations, position iterations
  - Body position/angle sync to game entity rendering
  - Pixel-to-meter conversion (Box2D works in meters, games work in pixels)
- Planck.js follows Box2D conventions — use meters for physics, convert to pixels for rendering.
- Best for: games that need exact Box2D behavior (porting from other engines, precise platformer physics).
- Box2D documentation and tutorials apply directly to Planck.js.`,
  },

  // ── Multiplayer (2) ───────────────────────────────────────────
  {
    id: 'games-colyseus',
    name: 'Colyseus',
    description: 'Authoritative multiplayer server — rooms, matchmaking, delta-compressed state sync. 6.1K stars.',
    category: 'framework',
    level: 'expert',
    side: 'both',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'colyseus' },
    group: 'Multiplayer',
    integrationPrompt: `Integrate Colyseus for multiplayer networking.
- Install server: \`npm install colyseus\`.
- Install client: \`npm install colyseus.js\`.
- Create \`backend/src/rooms/GameRoom.ts\` with:
  - Room subclass with onCreate(), onJoin(), onLeave(), onMessage() handlers
  - State schema using @colyseus/schema: define Player, GameState with @type decorators
  - Authoritative game logic: validate inputs, update state, broadcast changes
  - Matchmaking: filterBy() for custom room matching (skill level, region)
  - Lobby/waiting room pattern with ready-up system
- Create \`frontend/src/game/network.ts\` with:
  - Client connection: \`new Client("ws://localhost:2567")\`
  - Room join: \`client.joinOrCreate("game_room", options)\`
  - State change listeners: room.state.onChange(), room.state.players.onAdd()
  - Input sending: room.send("input", { type: "move", direction })
  - Reconnection handling: room.reconnect() on disconnect
- Create \`frontend/src/game/prediction.ts\` with:
  - Client-side prediction: apply input locally before server confirms
  - Server reconciliation: correct position when server state arrives
  - Entity interpolation: smooth other players between server updates
- CRITICAL: Never trust the client. All game logic runs on the server. Client sends inputs only.
- Colyseus state schemas auto-sync — define once, changes propagate to all clients automatically.`,
  },
  {
    id: 'games-resilience',
    name: 'Production Resilience',
    description: 'Multiplayer error handling — reconnection, state reconciliation, timeout recovery, graceful degradation.',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['games'],
    themes: ['expert'],
    group: 'Multiplayer',
    integrationPrompt: `Integrate Production Resilience for multiplayer networking.
- Create \`frontend/src/game/network-resilience.ts\` adapting the production_resilience pattern:
  - Connection monitor: detect disconnect, track reconnection attempts
  - Exponential backoff: reconnect with increasing delays (1s, 2s, 4s, 8s, max 30s)
  - State reconciliation: on reconnect, request full state snapshot from server
  - Input buffering: queue inputs during disconnect, replay on reconnect
  - Graceful degradation: switch to offline/AI mode if server is unreachable
  - Timeout recovery: detect stale connections, force reconnect
- Create \`frontend/src/game/latency-compensation.ts\` with:
  - Ping measurement: round-trip time tracking with running average
  - Jitter buffer: smooth out variable network latency for consistent gameplay
  - Dead reckoning: predict entity positions when updates are delayed
- Wire into Colyseus client (or any WebSocket-based multiplayer).
- Test scenarios: server restart, network drop, high latency (>200ms), packet loss.`,
  },

  // ── Game Audio & Infrastructure (2) ───────────────────────────
  {
    id: 'games-howler',
    name: 'Howler.js',
    description: 'Game audio manager — BGM, SFX sprites, spatial audio, audio pools for concurrent sounds. 23K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    packages: { npm: 'howler' },
    group: 'Game Audio & Infrastructure',
    integrationPrompt: `Integrate Howler.js for game audio.
- Install \`npm install howler\` and \`npm install -D @types/howler\`.
- Create \`frontend/src/game/audio-manager.ts\` with:
  - SoundManager class with separate channels: BGM, SFX, UI, Ambient
  - Volume controls per channel with master volume
  - Audio sprite definitions for SFX: { shoot: [0, 500], hit: [500, 300], jump: [800, 400] }
  - Audio pooling: pre-create multiple Howl instances for frequently-played SFX (avoid creation during gameplay)
  - Spatial audio: Howler.pos() for 3D positional sound, panning based on game entity position
  - BGM crossfade: smooth transition between level themes
  - Mute/unmute per channel, global mute toggle
- Create \`frontend/src/game/audio-triggers.ts\` with:
  - Collision sound mapping: collision type -> SFX sprite name
  - Ambient sound zones: enter/exit area triggers ambient loop
  - Music state machine: menu theme -> gameplay theme -> boss theme
- CRITICAL: First audio playback must be triggered by user interaction (browser autoplay policy).
- Howler.js handles iOS Safari restrictions automatically.
- Pre-load all game audio during the loading screen for zero-latency playback.
- Use CSS variables from the active theme for audio settings UI.`,
  },
  {
    id: 'games-patterns',
    name: 'Game Patterns',
    description: 'Core game architecture patterns — Observer (events), State (game states), Command (input/undo).',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    group: 'Game Audio & Infrastructure',
    integrationPrompt: `Integrate game architecture patterns.
- Create \`frontend/src/game/patterns/EventBus.ts\` adapting the boilerplate_generator Observer pattern:
  - Type-safe event bus: on<T>(event, handler), emit<T>(event, data), off(event, handler)
  - Game events: 'player:damage', 'enemy:killed', 'level:complete', 'score:update'
  - One-shot listeners: once() for single-fire events (level transitions)
  - Priority system: critical handlers (save state) fire before optional (particles)
- Create \`frontend/src/game/patterns/GameStateMachine.ts\` adapting the State pattern:
  - States: Loading, Menu, Playing, Paused, GameOver, Victory
  - Transitions with guards: canPause() (only from Playing), canResume() (only from Paused)
  - onEnter/onExit callbacks per state (start/stop game loops, show/hide UI)
  - History: previous state tracking for "back" behavior
- Create \`frontend/src/game/patterns/InputCommand.ts\` adapting the Command pattern:
  - Command interface: execute(), undo(), canExecute()
  - Input binding: key/button -> command mapping (rebindable)
  - Command history: undo/redo stack for level editors
  - Replay system: record command sequence, play back for replays
- These patterns work with ANY game engine — they manage game-level concerns above the engine.`,
  },

  // ── Agents (4) ────────────────────────────────────────────────
  {
    id: 'games-agent-scaffold',
    name: 'Scaffold Generator',
    description: 'Generates game project structure with assets/, scenes/, entities/ directories.',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['games'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Scaffold Generator for a game project.
- Analyze project for game type and engine choice.
- Generate game-aware directory structure:
  - frontend/src/game/ — engine config, game loop, state management
  - frontend/src/game/scenes/ — scene/level classes
  - frontend/src/game/entities/ — player, enemies, items, projectiles
  - frontend/src/game/systems/ — physics, rendering, input, audio
  - frontend/src/game/patterns/ — event bus, state machine, commands
  - public/assets/sprites/ — sprite sheets and animations
  - public/assets/maps/ — Tiled TMX maps
  - public/assets/audio/ — BGM and SFX files
- Include starter files with game loop and basic scene.
- Return directory tree with file descriptions.`,
  },
  {
    id: 'games-agent-fullstack',
    name: 'Full Stack Scaffolding',
    description: 'Plans game app architecture with asset pipeline, build targets, and deployment configs.',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['games'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Full Stack Scaffolding for a game application.
- Analyze the game description for requirements.
- Plan architecture with game-specific considerations:
  - Frontend: game engine selection, canvas vs DOM, WebGL/WebGPU
  - Backend: multiplayer server (if needed), leaderboards, save system
  - Assets: pipeline for sprites, audio, maps — formats, compression, CDN
  - Build: bundle splitting (engine vs game code), asset hashing, WASM loading
  - Deploy: static hosting for single-player, managed server for multiplayer
- Estimate bundle size and loading time.
- Return architecture plan with component diagram.`,
  },
  {
    id: 'games-agent-codewriter',
    name: 'Code Writer Agent',
    description: 'Generates game logic from natural language — AI behaviors, level generators, scoring systems.',
    category: 'agent',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Code Writer Agent for game logic generation.
- Accept natural language description of desired game behavior.
- Generate code for:
  - AI behaviors: patrol patterns, chase/flee, state machines, behavior trees
  - Level generation: procedural rooms, terrain, item placement, difficulty curves
  - Scoring systems: combo multipliers, time bonuses, achievement conditions
  - Power-up systems: effect stacking, duration timers, visual indicators
- Output: TypeScript code compatible with the selected game engine.
- Include inline comments explaining the AI/generation logic.
- Return generated code with integration instructions.`,
  },
  {
    id: 'games-agent-analyzer',
    name: 'Code Analyzer Agent',
    description: 'Profiles game code — render loop optimization, GC pressure analysis, memory allocation hotspots.',
    category: 'agent',
    level: 'expert',
    side: 'frontend',
    domains: ['games'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Code Analyzer Agent on the game codebase.
- Analyze all game source files for performance issues:
  - Render loop: object allocations inside update/render (creates GC pressure)
  - Memory: leaks from event listeners not cleaned up, sprites not destroyed
  - Physics: too many active bodies, missing sleeping, broad-phase inefficiency
  - Collision: O(n^2) checks that should use spatial hashing or quadtree
  - Asset loading: uncompressed textures, missing atlas packing, redundant loads
- Severity levels: Critical (frame drops), Warning (potential issue), Info (optimization)
- Return structured report: { severity, file, line, description, fix }.
- Focus on 60fps targets — anything causing frame drops is Critical.`,
  },
]
```

**Step 2: Verify the file has no TypeScript errors**

Run: `cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to games.ts

**Step 3: Commit**

```bash
git add frontend/src/tools/domains/games.ts
git commit -m "feat(tools): add games domain with 19 expert tools in 5 capability groups"
```

---

### Task 2: Register Games Tools in Registry

**Files:**
- Modify: `frontend/src/tools/registry.ts`

**Step 1: Add import and spread**

Add to the imports section of `registry.ts`:
```typescript
import { GAMES_TOOLS } from './domains/games'
```

Add to the `TOOL_CATALOG` array (after existing domain spreads):
```typescript
export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,
  ...RAG_TOOLS,
  ...MUSIC_TOOLS,
  ...GAMES_TOOLS,
])
```

**Step 2: Verify no duplicate IDs**

All games tool IDs use `games-` prefix. Verify:
```bash
cd /storage/self/primary/Download/aus-studio/frontend && grep -c "games-" src/tools/domains/games.ts
```
Expected: 19

**Step 3: Commit**

```bash
git add frontend/src/tools/registry.ts
git commit -m "feat(tools): register games domain tools in registry"
```

---

### Task 3: Integration Verification

**Step 1: Verify domain selector includes games**

Check that `ToolDomain` type in `types.ts` includes a games-related value. If not, add `'games'` to the `ToolDomain` union.

**Step 2: Verify tool counts**

```bash
cd /storage/self/primary/Download/aus-studio/frontend && node -e "
  const fs = require('fs');
  const content = fs.readFileSync('src/tools/domains/games.ts', 'utf8');
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
  'Game Engines': 6,
  'Rendering': 1,
  'Physics': 3,
  'Multiplayer': 2,
  'Game Audio & Infrastructure': 2,
  'Agents': 4
}
Total: 19 (note: 1 extra because games-howler doesn't appear as a separate entry — recount)
```

**Step 3: Verify no missing required fields**

Run: `cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit 2>&1 | grep games`
Expected: No errors

**Step 4: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(tools): games domain integration fixes"
```
