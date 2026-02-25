# Phase 5: Adaptive Tool Drawer — Design Document

## Goal

Build a context-aware tool drawer that slides out from the right side of the Studio, surfacing libraries, agents, and skills tailored to the active theme, user level, and detected project domain. Adding a tool triggers an ITERATE phase that weaves the tool into the generated code — completing the AI-generation / manual-tools ping-pong loop.

## Architecture

Three layers:

1. **ToolRegistry** — Static TypeScript catalog of all available tools, filtered by theme at render time.
2. **DrawerPanel** — Right-side slide-out UI with tabs, search, and tool cards. Mobile-first (full-screen overlay on small screens).
3. **AI Recommender** — Background Gemini Flash call that analyzes the current project and returns ranked tool recommendations with per-tool reasoning.

### Data Flow

```
ToolRegistry (static)   →  DrawerPanel (UI)  ←  AI Recommender (async)
     |                         |
     |  filtered by themeId    |  user clicks "Add"
     |  + searched by query    |
     ↓                         ↓
theme-specific tools    →  addToolToProject()
                               |
                               ├─ Adds package to frontend_deps / backend_deps
                               ├─ Sends integrationPrompt to ITERATE phase via SSE
                               └─ Chat + FileTree + Preview update in real-time
```

### The "Add" Action

When a user clicks "Add" on a tool card:

1. The tool's `packages.npm` and/or `packages.pip` are added to the project's dependency maps.
2. The tool's `integrationPrompt` is sent as an ITERATE request to the backend SSE endpoint.
3. The existing `useStudioStream` hook processes the response — chat messages, file updates, and preview refresh happen through the same flow as generate/refine.

This means tools don't just get listed in `package.json` — they get **integrated into the code** by the AI.

## Tool Registry Data Model

```typescript
// frontend/src/tools/registry.ts

export type ToolCategory = 'library' | 'agent' | 'skill'
export type ToolLevel = 'beginner' | 'intermediate' | 'expert'
export type ToolDomain = 'general' | 'saas' | 'ai-ml' | 'music' | 'gaming'
                       | 'productivity' | 'social' | 'ecommerce' | 'data-viz'
export type ToolSide = 'frontend' | 'backend' | 'both'

export interface ToolEntry {
  id: string                          // unique slug: 'langchain-js'
  name: string                        // display: 'LangChain.js'
  description: string                 // one-liner
  category: ToolCategory
  level: ToolLevel
  side: ToolSide
  domains: ToolDomain[]
  themes: AdaptiveThemeId[]           // which themes include this tool
  packages?: { npm?: string; pip?: string }
  integrationPrompt: string           // instruction sent to ITERATE phase
  icon?: string                       // emoji or icon identifier
}
```

### Key Decisions

- **`themes: AdaptiveThemeId[]`** — A tool can appear in multiple themes. Stripe appears in expert, sharp, casual, and warm. Tone.js only in creative.
- **`integrationPrompt`** — The actual instruction sent to the AI when the user adds the tool. Example: "Add Stripe payment processing. Create a checkout API endpoint at `/api/checkout` using the `stripe` Python package. Create a React `CheckoutForm` component using `@stripe/react-stripe-js`. Add environment variables `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`."
- **`domains`** — Used by the AI recommender to match tools to the detected project domain.
- **No external API for the catalog** — Ships with the frontend bundle. Fast, offline-capable for browsing.

### Registry File Organization

```
frontend/src/tools/
  types.ts             // ToolEntry type and related types
  registry.ts          // Master TOOL_CATALOG array + helper functions
  expert.ts            // Expert theme tool entries
  sharp.ts             // Sharp theme tool entries (future)
  warm.ts              // Warm theme tool entries (future)
  casual.ts            // Casual theme tool entries (future)
  future.ts            // Future theme tool entries (future)
  minimal.ts           // Minimal theme tool entries (future)
  retro.ts             // Retro theme tool entries (future)
  creative.ts          // Creative theme tool entries (future)
  recommend.ts         // AI recommendation hook
```

## Drawer UI Design

### Desktop (md+ breakpoints)

- Slides in from right, width: 360px
- Overlays the PreviewPanel (preview dims behind it)
- Toggled by a tools icon button in the NavBar (right side)
- Semi-transparent backdrop that closes drawer on click

### Mobile (< md breakpoints)

- Full-screen overlay (100vw, below NavBar)
- Slides in from right
- Close button (X) in top corner
- Same content, stacked vertically

### Drawer Layout (top to bottom)

```
┌─────────────────────────────┐
│  Tools                  [X] │  Header with close button
├─────────────────────────────┤
│  [Search tools...]          │  Search input
├─────────────────────────────┤
│ Recommended │ Libs │ Agents │  Tab bar (3 tabs)
├─────────────────────────────┤
│                             │
│  AI Recommendations         │  Loading shimmer while analysis runs
│  ┌─────────────────────┐   │
│  │ Stripe           ⚡  │   │  Tool card with:
│  │ Payment processing   │   │  - Name + category icon
│  │ pip: stripe          │   │  - One-line description
│  │ npm: @stripe/rjs     │   │  - Package badges
│  │ "Your app has user   │   │  - AI reasoning (recommendations tab)
│  │  accounts but no     │   │  - Level pill + domain tags
│  │  billing"     [Add]  │   │  - Add button
│  └─────────────────────┘   │
│                             │
│  All Libraries              │  Scrollable, filtered by theme
│  ┌─────────────────────┐   │
│  │ LangChain.js     📦  │   │
│  │ RAG framework [Add]  │   │
│  └─────────────────────┘   │
│  ...                        │
└─────────────────────────────┘
```

### Theme-Specific Styling

The drawer inherits the active theme's look through CSS vars (`--t-surface`, `--t-border`, `--t-text`, `--t-primary`, etc.). No special drawer-specific theming needed — the existing CSS var system handles it.

## AI Recommender

### Endpoint

`POST /api/studio/recommend`

### Request

```json
{
  "spec_summary": "A task management app with user accounts and team workspaces",
  "file_paths": ["backend/app/main.py", "frontend/src/App.tsx", ...],
  "theme": "expert",
  "existing_deps": {
    "frontend": { "react": "^19.0.0", "zustand": "^5.0.0" },
    "backend": { "fastapi": ">=0.115", "sqlmodel": ">=0.0.16" }
  }
}
```

### Response

```json
{
  "recommendations": [
    { "toolId": "stripe", "reason": "Your app has user accounts but no billing system", "priority": 1 },
    { "toolId": "alembic", "reason": "You use SQLModel but have no database migration tool", "priority": 2 },
    { "toolId": "redis", "reason": "Team workspaces would benefit from caching shared state", "priority": 3 }
  ]
}
```

### Implementation Details

- **Model:** Gemini Flash (fast, cheap classification task)
- **Timeout:** 3 seconds
- **Fallback:** Static "Popular for this theme" list from the registry
- **Caching:** Recommendations cached per `projectId + version`. Re-analyzed only when project changes.
- **Cost:** Gemini Flash at ~100 input tokens + ~50 output tokens per call = negligible

## Expert Theme Toolkit (First Build)

### Libraries (18)

| Category | Tools |
|----------|-------|
| AI/RAG | LangChain.js, Vercel AI SDK, Transformers.js, Chroma, Qdrant |
| Data Viz | D3.js, Plotly.js, ECharts, Cytoscape.js |
| Backend | SQLAlchemy 2.x, Alembic, Redis, PyCasbin |
| DevOps | Docker (Dockerfile gen), GitHub Actions CI/CD, dotenvx secrets |
| Advanced UI | AG Grid, CodeMirror 6, React Flow |

### Agents (7)

| Agent | Description |
|-------|-------------|
| GitHub Searcher | Searches GitHub API for implementation examples and patterns |
| Architecture Review | Analyzes code structure against best practices |
| Security Audit | npm audit + ESLint security rules + dependency check |
| Generate Tests | Creates Vitest + pytest test suites |
| Generate Docs | Auto-generates JSDoc/docstrings |
| Docker Containerize | Generates Dockerfile + docker-compose |
| Performance Audit | Lighthouse-style frontend analysis |

### Skills (3)

| Skill | Description |
|-------|-------------|
| Add RAG Pipeline | Composes: vector store + embedding + retrieval chain |
| Add Auth + RBAC | Composes: PyJWT + Casbin + login/register endpoints |
| Add CI/CD | Generates GitHub Actions workflow file |

Skills are pre-written `integrationPrompt` bundles that compose multiple tools into a single action.

## Future Theme Toolkits (not built in Phase 5)

| Theme | Focus | Signature Tools |
|-------|-------|-----------------|
| Sharp (Bloomberg) | Financial/enterprise | AG Grid, Recharts, Redis, Stripe, React Admin |
| Warm (Cozy) | Content/blog | TipTap, react-photo-album, Resend, Supabase |
| Casual (Modern) | General SaaS | Clerk, Stripe, shadcn/ui, React Hook Form, Zustand |
| Future (HUD) | AI/ML | WebLLM, Transformers.js, Vercel AI SDK, Three.js |
| Minimal (Zen) | Simple/clean | Zod, AutoAnimate, jsPDF, basic auth |
| Retro (Win95) | Fun/nostalgic | Phaser, Matter.js, Howler.js, pixel-art tools |
| Creative (Street Art) | Music/art/media | Tone.js, wavesurfer.js, Fabric.js, Konva, p5.js |

## Future: Custom Python Tools Integration

The user has a collection of custom Python tools (KG-query, embeddings, RAG, doc parsers, etc.) that should be analyzed and integrated after the drawer infrastructure is proven. The process:

1. Run a Python code reviewer/explainer agent against the tool collection
2. Categorize which tools fit as agents, skills, or backend modules
3. Write integration prompts for each
4. Add to the appropriate theme registries

This happens after Phase 5 infrastructure is working and the Expert toolkit is tested.

## Build Order

1. Tool types + registry infrastructure (types.ts, registry.ts)
2. Expert theme tool entries (expert.ts)
3. DrawerPanel component (mobile-first)
4. NavBar toggle button
5. Wire drawer into StudioPage
6. "Add" action → ITERATE integration
7. Backend `/api/studio/recommend` endpoint
8. `useToolRecommendations` hook
9. Wire recommendations into drawer
10. Integration verification
