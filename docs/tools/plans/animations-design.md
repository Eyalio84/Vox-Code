# UI Animations Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: UI Animations / Transitions / Scroll Effects / Micro-Interactions
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/animations.md`

---

## Goal

Add 11 domain-specific animation tools (all external libraries/frameworks) to the Expert drawer, organized by 4 capability groups with the same accordion UI, domain selector, and "Already Added" tracking.

## Architecture Decisions

All site-dev architectural decisions carry forward. Animations-specific decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 4 capability groups | Animation Engines, Scroll & Reveal, CSS & Tailwind, Designer Tools |
| 2 | All external, no custom tools | No meaningful custom animation tools exist in the tool collection |
| 3 | No Agents tab | No custom agents relevant to animations — Agents tab will be empty for this domain |
| 4 | GSAP included despite being in project | "Already Added" logic will detect it; integrationPrompt focuses on advanced features |
| 5 | Smallest domain (11 tools) | Animations are a focused area — 11 tools covers all major approaches |
| 6 | No dedup with expert.ts | No overlaps — animation libs are domain-specific |

## File Structure

```
frontend/src/tools/domains/
├── site-dev.ts       # (already designed)
├── rag.ts            # (already designed)
├── music.ts          # (already designed)
├── games.ts          # (already designed)
├── saas.ts           # (already designed)
├── visuals.ts        # (already designed)
└── animations.ts     # 11 tools in 4 groups, no agents
```

## Tool Inventory — 11 Tools in 4 Capability Groups

### Animation Engines (4)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Motion** | `anim-motion` | external | `npm: motion` | 1st (recommended) | Declarative React animation: layout, exit, gesture, scroll-linked, spring physics |
| **GSAP** | `anim-gsap` | external | `npm: gsap` | 2nd | Timeline engine with ScrollTrigger, Draggable, MorphSVG, SplitText plugins |
| **react-spring** | `anim-react-spring` | external | `npm: @react-spring/web` | 3rd | Spring-physics hooks: useSpring, useTrail, useTransition, useChain |
| **Anime.js v4** | `anim-animejs` | external | `npm: animejs` | 4th | Lightweight ESM-first animation engine with tree-shaking |

### Scroll & Reveal (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **AOS** | `anim-aos` | external | `npm: aos` | 1st (recommended) | CSS class injection on scroll — simplest scroll reveal. 27K stars. |
| **TAOS** | `anim-taos` | external | `npm: taos` | 2nd | Tailwind scroll-triggered reveal animations — 600 bytes, no JS, data attributes |
| **AutoAnimate** | `anim-auto-animate` | external | `npm: @formkit/auto-animate` | 3rd | Single hook animates DOM mutations automatically — ~2KB, zero config |

### CSS & Tailwind (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **tailwindcss-motion** | `anim-tw-motion` | external | `npm: tailwindcss-motion` | 1st (recommended) | Tailwind plugin for motion-* utility classes — pure CSS, no runtime JS, RSC compatible |
| **Motion One** | `anim-motion-one` | external | `npm: motion` | 2nd | Framework-agnostic animation using native Web Animations API — zero framework coupling |

### Designer Tools (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Lottie React** | `anim-lottie` | external | `npm: @lottiefiles/dotlottie-react` | 1st (recommended) | After Effects animations at runtime via WASM — .lottie format 80% smaller, scroll-sync |
| **Theatre.js** | `anim-theatre` | external | `npm: @theatre/core` | 2nd | Visual animation editor in browser with keyframe timeline — designer-dev collaboration |

## Integration Prompt Structure

Animation engine prompts:
```
Integrate [Tool] for [animation type].
- Install `[package]`.
- Create `frontend/src/animations/[module].ts` with [specific setup].
- Create example components demonstrating [key capabilities].
- Wire into existing page transitions / component lifecycle.
- Use CSS variables from the active theme for motion timing and colors.
```

CSS/lightweight tool prompts:
```
Integrate [Tool] for [animation type].
- Install `[package]`.
- Add to Tailwind config / CSS setup.
- Apply [utility classes / data attributes] to existing components.
- No JavaScript runtime required.
```

## Gap Analysis

| Gap | Resolution |
|-----|-----------|
| Domain detection | Handled by shared domain selector |
| Already Added | GSAP will be detected as "Added" from existing package.json. All others have npm packages. |
| Motion One shares npm package with Motion | Motion One is the vanilla subset — same `motion` package. Need distinct detection (check imports or accept both showing "Added") |
| Empty Agents tab | Agents tab shows empty state or is hidden for this domain |
| Theme assignment | `themes: ['expert']` |
| Ordering | Recommended-first per group |

## Success Criteria

1. Selecting 'UI Animations' domain shows 4 collapsible capability groups
2. GSAP appears as "Already Added" since it's in the project
3. Each group represents a distinct animation approach (engines, scroll, CSS, designer)
4. All 11 tools have detailed two-level prompts
5. Agents tab is empty or hidden for this domain
6. Accordion, search, and "Already Added" work identically to site-dev
