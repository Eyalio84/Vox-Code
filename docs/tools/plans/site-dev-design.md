# Site-Dev Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: Site Development / General Web
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/site-dev.md`

---

## Goal

Add 24 domain-specific tools (18 external libraries/frameworks + 6 custom agents) to the Expert drawer for site/web development, organized by capability groups with an accordion UI, domain selector, and "Already Added" tracking.

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Capability-based grouping (8 groups) | More intuitive than type-based tabs for expert users picking tools for a specific need |
| 2 | Accordion UI (one group open at a time) | Keeps the view focused, prevents scroll fatigue |
| 3 | Tabs: Recommended / Tools / Agents | Separates AI suggestions, external libs, and custom analysis tools |
| 4 | Domain selector dropdown | Explicit domain selection at top of Tools tab, defaults to 'general' |
| 5 | "Already Added" tracking | Check project deps against tool packages, show badge + disabled button |
| 6 | No `pairsWith` field | AI recommender handles complementary suggestions dynamically |
| 7 | Domain tools override expert tools | Dedup by `id` — domain-specific entries take priority over generic |
| 8 | `themes: ['expert']` for all site-dev tools | Other levels added later when we simplify for beginner/intermediate |
| 9 | Recommended-first ordering per group | Most-recommended tool first in each group, then alphabetical |
| 10 | Two-level prompts | Short description on card, full detailed prompt sent to ITERATE |

## Type Changes

```typescript
// types.ts — add one optional field
export interface ToolEntry {
  id: string
  name: string
  description: string
  category: ToolCategory
  level: ToolLevel
  side: ToolSide
  domains: ToolDomain[]
  themes: AdaptiveThemeId[]
  packages?: { npm?: string; pip?: string }
  integrationPrompt: string
  icon?: string
  group?: string  // NEW: capability group label (e.g., "State Management")
}
```

## File Structure

```
frontend/src/tools/
├── types.ts              # ToolEntry + group field
├── registry.ts           # Master catalog + filter/group helpers + dedup logic
├── expert.ts             # Existing 28 generic expert tools (unchanged)
└── domains/
    └── site-dev.ts       # 24 tools (18 external + 6 agents) in 8 capability groups
```

Future domain files (music.ts, games.ts, rag.ts, etc.) will follow the same pattern.

## Registry Changes

```typescript
// registry.ts additions:

// Dedup: domain tools override expert tools with same id
function dedup(tools: ToolEntry[]): ToolEntry[] {
  const map = new Map<string, ToolEntry>()
  for (const t of tools) map.set(t.id, t)
  return Array.from(map.values())
}

export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,  // domain tools listed AFTER so they override
])

// New helpers:
export function getToolsByGroup(tools: ToolEntry[], group: string): ToolEntry[]
export function getGroups(tools: ToolEntry[]): string[]
```

## Drawer UI Changes

### Tab Structure

```
┌─────────────────────────────────────┐
│  [Recommended]  [Tools]  [Agents]   │
└─────────────────────────────────────┘
```

### Tools Tab Layout

```
┌─────────────────────────────────────┐
│  Domain: [site-dev        ▾]        │  ← dropdown selector
│─────────────────────────────────────│
│  ▼ State Management              (2)│  ← open (accordion)
│  ┌──────────────────────────────┐   │
│  │ 🗄 Zustand          [Added] │   │  ← "Added" badge if in deps
│  │ Minimal flux state, ~3.5kB   │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ ⚛ Jotai                  [+]│   │  ← Add button
│  │ Atomic state management       │   │
│  └──────────────────────────────┘   │
│                                     │
│  ▶ Data Fetching                 (2)│  ← collapsed
│  ▶ Forms & Validation            (2)│
│  ▶ UI Components                 (2)│
│  ▶ Routing & SSR                 (2)│
│  ▶ Backend Infrastructure        (3)│
│  ▶ DevOps & Deploy               (3)│
│  ▶ Code Quality                  (2)│
└─────────────────────────────────────┘
```

### Accordion Behavior
- One group open at a time — clicking another closes the current
- First group expanded by default on open
- Search: filters across all groups, auto-expands groups with matches, overrides accordion (shows all matching)
- Clearing search restores accordion with first group open

### "Already Added" Logic
- Compare `tool.packages.npm` against `project.frontend_deps`
- Compare `tool.packages.pip` against `project.backend_deps`
- If matched: show "Added" badge, disable Add button, muted card styling
- Tools without packages (Docker, GitHub Actions) are never marked "Added"

## Tool Inventory — 18 External Tools (8 Groups)

### State Management (2)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **Zustand** | `npm: zustand` | 1st (recommended) | Creates typed store slices with immer middleware, replaces shared useState |
| **Jotai** | `npm: jotai` | 2nd | Creates atomic state primitives with derived atoms |

### Data Fetching (2)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **TanStack Query** | `npm: @tanstack/react-query` | 1st (recommended) | Adds QueryClientProvider, typed query hooks, React Query Devtools |
| **SWR** | `npm: swr` | 2nd | Adds SWR config provider, typed fetch hooks with revalidation |

### Forms & Validation (2)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **React Hook Form** | `npm: react-hook-form` | 1st (recommended) | Creates form components with zod schema validation, error display |
| **TanStack Form** | `npm: @tanstack/react-form` | 2nd | Creates type-safe form with field-level validation |

### UI Components (2)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **Radix UI** | `npm: @radix-ui/react-*` | 1st (recommended) | Adds Dialog, Dropdown, Toast, Tooltip unstyled primitives themed with CSS vars |
| **Ark UI** | `npm: @ark-ui/react` | 2nd | Adds 45+ headless components backed by state machines |

### Routing & SSR (2)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **Astro** | `npm: astro` | 1st (recommended) | Restructures project for island architecture with zero-JS by default |
| **Hono** | `npm: hono` | 2nd | Adds ultra-lightweight edge API layer / middleware |

### Backend Infrastructure (3)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **SQLAlchemy 2.x** | `pip: sqlalchemy[asyncio]` | 1st (recommended) | Sets up async ORM with DeclarativeBase models, async sessions, lifespan handler |
| **Alembic** | `pip: alembic` | 2nd | Adds migration framework with auto-generation, async engine config |
| **Redis** | `pip: redis` | 3rd | Adds caching layer, async client, health check, @cached decorator |

### DevOps & Deploy (3)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **Docker** | — | 1st (recommended) | Creates multi-stage Dockerfiles, compose, nginx proxy config |
| **GitHub Actions** | — | 2nd | Creates CI/CD workflows: lint, test, build, deploy to GHCR |
| **SST** | `npm: sst` | 3rd | Adds infrastructure-as-code config for AWS/Cloudflare deployment |

### Code Quality (2)
| Tool | Package | Ordering | What "Add" Does |
|------|---------|----------|-----------------|
| **CodeMirror 6** | `npm: @codemirror/state` | 1st (recommended) | Embeds code editor with multi-language support, theme-aware styling |
| **AG Grid** | `npm: ag-grid-react` | 2nd | Adds enterprise data grid with sorting, filtering, theme integration |

## Tool Inventory — 6 Custom Agents

| Agent | ID | Source | What "Add" Does |
|-------|----|--------|-----------------|
| **Code Reviewer** | `agent-code-reviewer` | code_reviewer_agent | Scans generated code for security vulns (CWE), style violations, perf anti-patterns |
| **Code Analyzer** | `agent-code-analyzer` | code_analyzer_agent | AST-based complexity analysis, anti-pattern detection, dependency graph |
| **TDD Assistant** | `agent-tdd-assistant` | tdd_assistant | Generates unit/integration tests, targets coverage gaps |
| **Refactoring Analyzer** | `agent-refactoring` | refactoring_analyzer | Detects code smells, produces safe refactoring plans with ROI estimation |
| **Scaffold Generator** | `agent-scaffold` | scaffold_generator | Generates project structure for 7 project types (API, CLI, Fullstack, etc.) |
| **Production Resilience** | `agent-resilience` | production_resilience | Adds circuit breaker, retry with backoff, multi-model fallback patterns |

## Integration Prompt Structure

Each tool has a detailed `integrationPrompt` sent to the ITERATE phase. Prompts follow this structure:

```
Integrate [Tool Name] for [purpose].
- Install `[package]`.
- Create `[exact/file/path.ts]` with:
  - [Specific component/function/config detail]
  - [Connection to existing project patterns]
- Create `[exact/file/path.ts]` with:
  - [Another component/function]
- Wire into existing [component/route/main file]:
  - [Specific integration point]
- Add [ENV_VAR] to `.env.example`.
- Use CSS variables from the active theme for all styling.
```

Agent prompts are different — they trigger analysis/review rather than code generation:

```
Run [Agent Name] on the current project.
- Analyze [scope: all files / backend only / frontend only].
- Check for [specific concerns].
- Return structured report with [severity, file, description, remediation].
- Display results in the chat as a formatted checklist.
```

## Component Changes

### ToolCard.tsx
- Add `isAdded?: boolean` prop
- When `isAdded`: show "Added" badge (green/muted), disable Add button, reduce card opacity slightly

### ToolDrawer.tsx
- Rename tabs: `Recommended | Tools | Agents`
- Add domain selector dropdown below search in Tools tab
- Add accordion group rendering with chevron toggle
- Accordion state: track `openGroup: string | null`, default to first group
- Search override: when query is non-empty, show all matching tools flat (ignore accordion), auto-expand
- "Already Added" logic: compute from project deps, pass `isAdded` to ToolCard

### types.ts
- Add `group?: string` to ToolEntry

### registry.ts
- Add `getToolsByGroup()`, `getGroups()` helpers
- Add `dedup()` function — domain tools override expert tools
- Import `SITE_DEV_TOOLS` from `domains/site-dev`

## Success Criteria

1. Domain selector shows available domains, defaults to 'general'
2. Selecting 'site-dev' shows 8 collapsible capability groups in accordion style
3. Each group contains the correct tools in recommended-first order
4. "Added" badge appears for tools whose packages match project deps
5. Clicking Add sends the detailed integrationPrompt to ITERATE
6. Agents tab shows 6 custom agents for site-dev
7. Search filters across all groups, overrides accordion to show matches
8. No duplicate tools between expert.ts and site-dev.ts in the rendered UI
9. All styling uses CSS vars (theme-aware)
10. Existing expert tools for non-site-dev domains continue working unchanged
