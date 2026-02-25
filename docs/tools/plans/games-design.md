# Games Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: Games / Interactive / Physics / Multiplayer
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/games.md`

---

## Goal

Add 19 domain-specific tools (13 external libraries + 2 custom libraries + 4 agents) to the Expert drawer for game development, organized by 5 capability groups with the same accordion UI, domain selector, and "Already Added" tracking established in the site-dev design.

## Architecture Decisions

All site-dev architectural decisions carry forward (domain file pattern, accordion, dedup, `group` field, `isAdded` tracking). Games-specific decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | All 6 game frameworks included | Each serves a distinct niche: Phaser (full), Excalibur (TS/ECS), KAPLAY (beginner), LittleJS (tiny), Kontra (micro), melonJS (tiles) |
| 2 | Merge dual-role tools | Phaser 3, Rapier, Planck.js, Colyseus appear in both libs and frameworks — one entry each |
| 3 | 5 capability groups | Game Engines, Rendering, Physics, Multiplayer, Game Audio & Infrastructure |
| 4 | Howler.js duplicated with game-specific prompts | `games-howler` has spatial audio + SFX sprite prompts, separate from `music-howler` |
| 5 | Rendering is single-tool group | PixiJS v8 is the only standalone renderer; game engines include their own. Fine as a focused group. |
| 6 | Custom tools split between groups and agents | Production Resilience and Game Patterns are libs in groups; Scaffold/Analysis tools are agents |
| 7 | 4 agents in Agents tab | Scaffold Generator, Full Stack Scaffolding, Code Writer Agent, Code Analyzer Agent |

## File Structure

```
frontend/src/tools/domains/
├── site-dev.ts       # (already designed)
├── rag.ts            # (already designed)
├── music.ts          # (already designed)
└── games.ts          # 19 tools (15 in groups + 4 agents)
```

Registry imports `GAMES_TOOLS` from `domains/games.ts` alongside other domain exports. Dedup handles overlaps.

## Tool Inventory — 15 Tools in 5 Capability Groups

### Game Engines (6)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Phaser 3** | `games-phaser` | external | `npm: phaser` | 1st (recommended) | Sets up Phaser game config with scene management, physics (Arcade/Matter), asset preloader, input handlers |
| **Excalibur.js** | `games-excalibur` | external | `npm: excalibur` | 2nd | Creates ECS-based game with Engine, Scene, Actor, and Component setup with full TypeScript types |
| **KAPLAY** | `games-kaplay` | external | `npm: kaplay` | 3rd | Sets up component-based game with plain-English API: add(), onCollide(), onKeyPress() |
| **LittleJS** | `games-littlejs` | external | `npm: littlejsengine` | 4th | Creates ultra-minimal game setup (~6KB) with tile engine, particles, and WebGL renderer |
| **Kontra.js** | `games-kontra` | external | `npm: kontra` | 5th | Creates micro game with tree-shakeable modules: Sprite, GameLoop, TileEngine, each opt-in |
| **melonJS 2** | `games-melonjs` | external | `npm: melonjs` | 6th | Sets up Tiled TMX-first game with entity system, object layers, and built-in asset pipeline |

### Rendering (1)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **PixiJS v8** | `games-pixi` | external | `npm: pixi.js` | 1st (recommended) | Sets up WebGPU/WebGL renderer with scene graph, filters, mesh/sprite batching for high-performance 2D |

### Physics (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Matter.js** | `games-matter` | external | `npm: matter-js` | 1st (recommended) | Creates physics world with rigid bodies, collision detection, constraints, composites, sleeping |
| **Rapier (WASM)** | `games-rapier` | external | `npm: @dimforge/rapier2d` | 2nd | Sets up WASM physics with deterministic simulation, 2-5x faster than pure JS engines |
| **Planck.js** | `games-planck` | external | `npm: planck` | 3rd | Creates Box2D-compatible physics world with joints, fixtures, contact listeners |

### Multiplayer (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Colyseus** | `games-colyseus` | external | `npm: colyseus` | 1st (recommended) | Sets up authoritative multiplayer server with rooms, matchmaking, delta-compressed state sync |
| **Production Resilience** | `games-resilience` | custom | — | 2nd | Adds multiplayer error handling: reconnection, state reconciliation, timeout recovery, graceful degradation |

### Game Audio & Infrastructure (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Howler.js** | `games-howler` | external | `npm: howler` | 1st (recommended) | Sets up game audio manager: BGM, SFX sprites, spatial audio, audio pools for concurrent sounds |
| **Game Patterns** | `games-patterns` | custom | — | 2nd | Implements game architecture patterns: Observer (events), State (game states), Command (input/undo) |

## Tool Inventory — 4 Agents (Agents Tab)

| Agent | ID | What It Does |
|-------|----|--------------|
| **Scaffold Generator** | `games-agent-scaffold` | Generates game project structure with assets/, scenes/, entities/ directories |
| **Full Stack Scaffolding** | `games-agent-fullstack` | Plans game app architecture with asset pipeline, build targets, deployment configs |
| **Code Writer Agent** | `games-agent-codewriter` | Generates game logic from natural language: AI behaviors, level generators, scoring systems |
| **Code Analyzer Agent** | `games-agent-analyzer` | Profiles game code: render loop optimization, GC pressure, memory allocation hotspots |

## Integration Prompt Structure

External tools follow the same pattern as site-dev with game-specific considerations:
```
Integrate [Tool] for [purpose].
- Install `[package]`.
- Create `[exact/file/path]` with [specific setup].
- Use requestAnimationFrame for rendering, fixed timestep for physics.
- Wire into [existing game loop/scene/entity system].
```

Custom tools reference game patterns:
```
Integrate [Custom Tool] into the game architecture.
- Create `frontend/src/game/[module].ts` with:
  - [Specific pattern implementation]
  - [Game-specific configuration]
```

Agent prompts trigger game-specific analysis:
```
Run [Agent] on the current game project.
- Analyze [scope: render loop / entity code / network layer].
- Check for [game-specific concerns: GC pressure, frame drops, input lag].
- Return structured report.
```

## Gap Analysis (Games-Specific)

| Gap | Resolution |
|-----|-----------|
| Domain detection | Handled by shared domain selector (site-dev design) |
| Already Added | All external tools have npm packages — standard check. Custom tools never marked "Added" |
| Dedup with expert.ts | No overlaps — all IDs use `games-` prefix |
| Dedup with music | Howler.js gets `games-howler` with game-specific prompts (spatial audio, SFX sprites) |
| Fixed timestep | All engine integrationPrompts note fixed timestep for physics |
| Mobile input | Prompts include touch/gesture considerations for mobile games |
| Theme assignment | `themes: ['expert']` |
| Ordering | Recommended-first per group |

## Success Criteria

1. Selecting 'Games / Interactive' domain shows 5 collapsible capability groups
2. Game Engines group shows all 6 engines in recommended-first order
3. Rendering group shows PixiJS as standalone high-performance option
4. Physics group shows 3 engines from approachable to high-performance
5. Custom tools without packages are never marked "Added"
6. Agents tab shows 4 game development utilities
7. All 19 tools have detailed two-level prompts
8. Howler.js `games-howler` has game-specific prompts distinct from `music-howler`
9. Accordion, search, and "Already Added" work identically to site-dev
