# Site-Dev Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 24 domain-specific tools (18 external + 6 agents) organized in 8 capability groups with accordion UI, domain selector, and "Already Added" tracking to the Expert drawer.

**Architecture:** One domain file (`tools/domains/site-dev.ts`) exports all 24 tools with a `group` field. The registry deduplicates by ID (domain overrides generic). The ToolDrawer gets 3 new tabs (Recommended/Tools/Agents), a domain selector dropdown, accordion group rendering, and "Already Added" badge logic using project deps.

**Tech Stack:** React 19, TypeScript, CSS variables (theme-aware), existing ToolEntry type system

---

## Context for Implementer

**Design doc:** `docs/tools/plans/site-dev-design.md`

**Key existing files:**
- `frontend/src/tools/types.ts` — ToolEntry interface (29 lines)
- `frontend/src/tools/registry.ts` — TOOL_CATALOG + 4 filter helpers (49 lines)
- `frontend/src/tools/expert.ts` — 28 generic expert tools (703 lines)
- `frontend/src/components/ToolCard.tsx` — Tool display card (157 lines)
- `frontend/src/components/ToolDrawer.tsx` — Slide-out drawer (434 lines)
- `frontend/src/pages/StudioPage.tsx` — Wires drawer + project state (81 lines)
- `frontend/src/types/project.ts:23-24` — `AusProject` has `frontend_deps` and `backend_deps` as `Record<string, string>`

**TypeScript check command:** `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`

**Vite build command:** `node frontend/node_modules/vite/bin/vite.js build --config frontend/vite.config.ts`

**Important:** All component styling MUST use CSS variables (`var(--t-*)`) for theme inheritance. Never use hardcoded colors.

---

### Task 1: Add `group` field to ToolEntry type

**Files:**
- Modify: `frontend/src/tools/types.ts:17-29`

**Step 1: Add the field**

Add `group?: string` to the `ToolEntry` interface, after the `icon` field on line 28:

```typescript
import type { AdaptiveThemeId } from '../themes/index'

export type ToolCategory = 'library' | 'agent' | 'skill'
export type ToolLevel = 'beginner' | 'intermediate' | 'expert'
export type ToolDomain =
  | 'general'
  | 'saas'
  | 'ai-ml'
  | 'music'
  | 'gaming'
  | 'productivity'
  | 'social'
  | 'ecommerce'
  | 'data-viz'
export type ToolSide = 'frontend' | 'backend' | 'both'

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
  group?: string
}
```

**Step 2: TypeScript check**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: PASS — the field is optional so all existing tools compile without it.

**Step 3: Commit**

```bash
git add frontend/src/tools/types.ts
git commit -m "feat(tools): add group field to ToolEntry type"
```

---

### Task 2: Add registry helpers and dedup logic

**Files:**
- Modify: `frontend/src/tools/registry.ts`

**Step 1: Update registry.ts**

Replace the entire file with:

```typescript
import type { ToolEntry, ToolCategory, ToolDomain } from './types'
import type { AdaptiveThemeId } from '../themes/index'
import { EXPERT_TOOLS } from './expert'
import { SITE_DEV_TOOLS } from './domains/site-dev'

// ---------------------------------------------------------------------------
// Dedup: domain tools listed AFTER generic so they override by id
// ---------------------------------------------------------------------------

function dedup(tools: ToolEntry[]): ToolEntry[] {
  const map = new Map<string, ToolEntry>()
  for (const t of tools) map.set(t.id, t)
  return Array.from(map.values())
}

// ---------------------------------------------------------------------------
// Master catalog -- all tool entries from every tier, deduplicated
// ---------------------------------------------------------------------------

export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,
])

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

/** Return every tool that declares compatibility with the given theme. */
export function getToolsForTheme(themeId: AdaptiveThemeId): ToolEntry[] {
  return TOOL_CATALOG.filter((t) => t.themes.includes(themeId))
}

/** Narrow a tool list to a single category (library / agent / skill). */
export function getToolsByCategory(
  tools: ToolEntry[],
  category: ToolCategory,
): ToolEntry[] {
  return tools.filter((t) => t.category === category)
}

/** Narrow a tool list to entries that belong to a specific domain. */
export function getToolsByDomain(
  tools: ToolEntry[],
  domain: ToolDomain,
): ToolEntry[] {
  return tools.filter((t) => t.domains.includes(domain))
}

/** Free-text search across id, name, and description (case-insensitive). */
export function searchTools(tools: ToolEntry[], query: string): ToolEntry[] {
  const q = query.trim().toLowerCase()
  if (q === '') return tools
  return tools.filter(
    (t) =>
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
  )
}

/** Narrow a tool list to entries that belong to a specific capability group. */
export function getToolsByGroup(
  tools: ToolEntry[],
  group: string,
): ToolEntry[] {
  return tools.filter((t) => t.group === group)
}

/** Return unique group names from a tool list, preserving insertion order. */
export function getGroups(tools: ToolEntry[]): string[] {
  const seen = new Set<string>()
  const groups: string[] = []
  for (const t of tools) {
    if (t.group && !seen.has(t.group)) {
      seen.add(t.group)
      groups.push(t.group)
    }
  }
  return groups
}
```

**IMPORTANT:** This file imports `SITE_DEV_TOOLS` which doesn't exist yet. The TypeScript check will fail until Task 3 is complete. That's expected — Task 2 and Task 3 are paired and should be committed together after Task 3.

**Step 2: Do NOT commit yet** — wait until Task 3 creates the domain file.

---

### Task 3: Create site-dev.ts with 18 external tools

**Files:**
- Create: `frontend/src/tools/domains/site-dev.ts`

**Step 1: Create the domains directory**

```bash
mkdir -p frontend/src/tools/domains
```

**Step 2: Create the file**

Create `frontend/src/tools/domains/site-dev.ts` with all 18 external tools and 6 agents (24 total). Tools are ordered recommended-first within each group.

```typescript
import type { ToolEntry } from '../types'

// ---------------------------------------------------------------------------
// Site-Dev Expert Tools — 18 external + 6 agents = 24 tools
// Organized by capability group. Recommended tool listed first per group.
// ---------------------------------------------------------------------------

export const SITE_DEV_TOOLS: ToolEntry[] = [
  // =========================================================================
  // State Management (2)
  // =========================================================================
  {
    id: 'sd-zustand',
    name: 'Zustand',
    description: 'Minimal flux-style client state manager, ~3.5kB, with immer middleware for immutable updates',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas', 'productivity'],
    themes: ['expert'],
    packages: { npm: 'zustand' },
    icon: 'box',
    group: 'State Management',
    integrationPrompt: `Integrate Zustand for client state management.
- Install \`zustand\` and \`immer\`.
- Create \`frontend/src/stores/uiStore.ts\`:
  - Export \`useUIStore\` with typed state: \`{ sidebarOpen: boolean; activeModal: string | null; toasts: Toast[] }\`.
  - Actions: \`toggleSidebar()\`, \`openModal(id)\`, \`closeModal()\`, \`addToast(msg, type)\`, \`removeToast(id)\`.
  - Use the \`immer\` middleware for nested state updates.
- Create \`frontend/src/stores/dataStore.ts\`:
  - Export \`useDataStore\` for API response caching: \`{ cache: Record<string, unknown>; setCache(key, data): void; clearCache(): void }\`.
- In each store, use selectors (e.g., \`useUIStore(s => s.sidebarOpen)\`) to prevent unnecessary re-renders.
- Replace any shared \`useState\` calls in existing components with store selectors.
- Do NOT create a single monolithic store — keep stores scoped by concern.`,
  },
  {
    id: 'sd-jotai',
    name: 'Jotai',
    description: 'Atomic state management — create independent atoms that compose into derived state',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas'],
    themes: ['expert'],
    packages: { npm: 'jotai' },
    icon: 'zap',
    group: 'State Management',
    integrationPrompt: `Integrate Jotai for atomic state management.
- Install \`jotai\`.
- Create \`frontend/src/atoms/uiAtoms.ts\`:
  - Export primitive atoms: \`sidebarOpenAtom\`, \`activeModalAtom\`, \`toastsAtom\`.
  - Export derived atoms: \`hasToastsAtom = atom(get => get(toastsAtom).length > 0)\`.
- Create \`frontend/src/atoms/dataAtoms.ts\`:
  - Export \`cacheAtom\` as \`atom<Record<string, unknown>>({})\`.
  - Export a write atom \`setCacheAtom\` that merges new entries.
- Wrap the app root in \`<Provider>\` from jotai (in \`App.tsx\` or the layout component).
- Replace any shared \`useState\` calls with \`useAtom()\` / \`useAtomValue()\` / \`useSetAtom()\`.
- Prefer \`useAtomValue\` for read-only and \`useSetAtom\` for write-only to minimize re-renders.`,
  },

  // =========================================================================
  // Data Fetching (2)
  // =========================================================================
  {
    id: 'sd-tanstack-query',
    name: 'TanStack Query',
    description: 'Server state manager with caching, background refetching, and optimistic updates — 43K stars',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas', 'ecommerce', 'productivity'],
    themes: ['expert'],
    packages: { npm: '@tanstack/react-query' },
    icon: 'refresh-cw',
    group: 'Data Fetching',
    integrationPrompt: `Integrate TanStack Query for server state management.
- Install \`@tanstack/react-query\` and \`@tanstack/react-query-devtools\`.
- Create \`frontend/src/lib/queryClient.ts\`:
  - Export a \`QueryClient\` with defaults: \`staleTime: 5 * 60 * 1000\`, \`retry: 1\`, \`refetchOnWindowFocus: false\`.
- Wrap the app root in \`<QueryClientProvider client={queryClient}>\` and add \`<ReactQueryDevtools initialIsOpen={false} />\` inside (in \`App.tsx\` or layout).
- Create \`frontend/src/hooks/useApiQuery.ts\`:
  - Generic typed wrapper: \`useApiQuery<T>(key: string[], url: string)\` that calls \`useQuery\` with a fetch function pointing at the backend API.
  - Handle errors by checking \`response.ok\` and throwing for non-2xx.
- Create \`frontend/src/hooks/useApiMutation.ts\`:
  - Generic typed wrapper: \`useApiMutation<TData, TVars>(url: string, method?: string)\` that calls \`useMutation\` with automatic query invalidation.
- Refactor any existing \`useEffect\` + \`fetch\` patterns to use the new hooks.`,
  },
  {
    id: 'sd-swr',
    name: 'SWR',
    description: 'Stale-while-revalidate data fetching by Vercel, 4.2kB — simpler alternative to TanStack Query',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas'],
    themes: ['expert'],
    packages: { npm: 'swr' },
    icon: 'download-cloud',
    group: 'Data Fetching',
    integrationPrompt: `Integrate SWR for data fetching.
- Install \`swr\`.
- Create \`frontend/src/lib/fetcher.ts\`:
  - Export a typed fetcher: \`const fetcher = <T>(url: string): Promise<T> => fetch(url).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })\`.
- Wrap the app root in \`<SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 5000 }}>\` (in \`App.tsx\` or layout).
- Create \`frontend/src/hooks/useApi.ts\`:
  - Export \`useApi<T>(url: string | null)\` wrapping \`useSWR<T>\` with the global fetcher, returning \`{ data, error, isLoading, mutate }\`.
- Create \`frontend/src/hooks/useApiMutation.ts\`:
  - Export \`useApiMutation<T>(url: string, method: string)\` using \`useSWRMutation\` for POST/PUT/DELETE operations.
- Refactor any existing \`useEffect\` + \`fetch\` patterns to use the new hooks.`,
  },

  // =========================================================================
  // Forms & Validation (2)
  // =========================================================================
  {
    id: 'sd-react-hook-form',
    name: 'React Hook Form',
    description: 'Performant form management via uncontrolled inputs — ~9kB, 41K stars',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas', 'ecommerce'],
    themes: ['expert'],
    packages: { npm: 'react-hook-form' },
    icon: 'edit',
    group: 'Forms & Validation',
    integrationPrompt: `Integrate React Hook Form with Zod validation.
- Install \`react-hook-form\`, \`zod\`, and \`@hookform/resolvers\`.
- Create \`frontend/src/components/forms/FormField.tsx\`:
  - A reusable field wrapper that accepts \`label: string\`, \`error?: string\`, and renders the label, the input (via children/render prop), and an error message styled with \`var(--t-error)\` or \`var(--t-accent1)\`.
- Create \`frontend/src/components/forms/FormExample.tsx\`:
  - Define a Zod schema: \`z.object({ name: z.string().min(1), email: z.string().email(), message: z.string().min(10) })\`.
  - Use \`useForm\` with \`zodResolver(schema)\`.
  - Render fields with \`register()\`, display errors from \`formState.errors\`.
  - On submit, POST to an appropriate API endpoint.
- All form styling should use \`var(--t-input-bg)\`, \`var(--t-input-border)\`, \`var(--t-text)\`, \`var(--t-radius)\`.`,
  },
  {
    id: 'sd-tanstack-form',
    name: 'TanStack Form',
    description: 'Type-safe form management with first-class TypeScript support — newer alternative to RHF',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas'],
    themes: ['expert'],
    packages: { npm: '@tanstack/react-form' },
    icon: 'edit-3',
    group: 'Forms & Validation',
    integrationPrompt: `Integrate TanStack Form for type-safe form management.
- Install \`@tanstack/react-form\` and \`zod\`.
- Create \`frontend/src/components/forms/TSFormExample.tsx\`:
  - Use \`useForm\` with typed default values and field validators.
  - Create a Zod validator adapter for field-level validation.
  - Render fields using \`form.Field\` component with \`children\` render prop exposing \`field.state.value\`, \`field.handleChange\`, \`field.state.meta.errors\`.
  - Show validation errors inline below each field.
  - On submit, POST to an appropriate API endpoint.
- All form styling should use CSS variables: \`var(--t-input-bg)\`, \`var(--t-input-border)\`, \`var(--t-text)\`, \`var(--t-radius)\`.`,
  },

  // =========================================================================
  // UI Components (2)
  // =========================================================================
  {
    id: 'sd-radix-ui',
    name: 'Radix UI',
    description: 'Unstyled, accessible component primitives (32+) — Dialog, Dropdown, Toast, Tooltip, etc.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas', 'productivity'],
    themes: ['expert'],
    packages: { npm: '@radix-ui/react-dialog' },
    icon: 'layers',
    group: 'UI Components',
    integrationPrompt: `Integrate Radix UI primitives with theme-aware styling.
- Install \`@radix-ui/react-dialog\`, \`@radix-ui/react-dropdown-menu\`, \`@radix-ui/react-toast\`, \`@radix-ui/react-tooltip\`.
- Create \`frontend/src/components/ui/Dialog.tsx\`:
  - Wrap \`@radix-ui/react-dialog\` parts (Root, Trigger, Portal, Overlay, Content, Title, Description, Close).
  - Style Overlay with \`background: rgba(0,0,0,0.4)\`, Content with \`background: var(--t-surface)\`, \`border: var(--t-border-width) var(--t-border-style) var(--t-border)\`, \`border-radius: var(--t-radius)\`.
- Create \`frontend/src/components/ui/DropdownMenu.tsx\`:
  - Wrap Dropdown parts. Style items with \`color: var(--t-text)\`, hover with \`background: var(--t-surface2)\`.
- Create \`frontend/src/components/ui/Toast.tsx\`:
  - Wrap Toast parts. Style with \`background: var(--t-surface)\`, \`border: var(--t-border-width) var(--t-border-style) var(--t-border)\`.
  - Include a ToastProvider and ToastViewport at the app root.
- Create \`frontend/src/components/ui/Tooltip.tsx\`:
  - Wrap Tooltip parts. Style content with \`background: var(--t-text)\`, \`color: var(--t-bg)\`, small \`border-radius\`.
- Export all from \`frontend/src/components/ui/index.ts\`.`,
  },
  {
    id: 'sd-ark-ui',
    name: 'Ark UI',
    description: 'Headless components (45+) backed by state machines — framework-agnostic, accessible',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general', 'saas'],
    themes: ['expert'],
    packages: { npm: '@ark-ui/react' },
    icon: 'package',
    group: 'UI Components',
    integrationPrompt: `Integrate Ark UI headless components.
- Install \`@ark-ui/react\`.
- Create \`frontend/src/components/ui/ArkDialog.tsx\`:
  - Use \`Dialog\` from \`@ark-ui/react/dialog\` with Backdrop, Positioner, Content, Title, Description, CloseTrigger.
  - Style with CSS variables: \`var(--t-surface)\`, \`var(--t-border)\`, \`var(--t-radius)\`.
- Create \`frontend/src/components/ui/ArkAccordion.tsx\`:
  - Use \`Accordion\` from \`@ark-ui/react/accordion\` with Item, ItemTrigger, ItemContent.
  - Style triggers with \`var(--t-text)\`, content with \`var(--t-surface)\`.
- Create \`frontend/src/components/ui/ArkTabs.tsx\`:
  - Use \`Tabs\` from \`@ark-ui/react/tabs\` with List, Trigger, Content, Indicator.
  - Style active indicator with \`var(--t-primary)\`.
- Export all from \`frontend/src/components/ui/index.ts\`.`,
  },

  // =========================================================================
  // Routing & SSR (2)
  // =========================================================================
  {
    id: 'sd-astro',
    name: 'Astro',
    description: 'Zero-JS island architecture — multi-framework, content-focused, 46K stars',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['general'],
    themes: ['expert'],
    packages: { npm: 'astro' },
    icon: 'globe',
    group: 'Routing & SSR',
    integrationPrompt: `Integrate Astro with island architecture.
- Install \`astro\` and \`@astrojs/react\`.
- Create \`astro.config.mjs\` at project root:
  - Import \`react()\` from \`@astrojs/react\`.
  - Set \`integrations: [react()]\` and \`output: 'static'\`.
- Create \`src/pages/index.astro\`:
  - Import a React component with \`client:load\` directive for interactive islands.
  - Use Astro's built-in \`<style>\` blocks for scoped CSS using theme variables.
- Create \`src/layouts/BaseLayout.astro\`:
  - Include \`<html>\`, \`<head>\` with theme CSS variable injection, \`<body>\` with a slot.
- Move existing React components into \`src/components/\` as islands — only add \`client:load\` or \`client:visible\` directives to interactive ones.
- Update build scripts in \`package.json\`: \`"dev": "astro dev"\`, \`"build": "astro build"\`.`,
  },
  {
    id: 'sd-hono',
    name: 'Hono',
    description: 'Ultra-lightweight web framework (12kB), Web Standards-based, runs on edge — 25K stars',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['general', 'saas'],
    themes: ['expert'],
    packages: { npm: 'hono' },
    icon: 'zap',
    group: 'Routing & SSR',
    integrationPrompt: `Integrate Hono as an edge API layer.
- Install \`hono\`.
- Create \`frontend/src/api/index.ts\`:
  - Export a Hono app: \`const app = new Hono()\`.
  - Add middleware: CORS, logger, error handler.
  - Add example routes: \`GET /api/health\` returning \`{ ok: true }\`, \`GET /api/data\` returning sample JSON.
- Create \`frontend/src/api/middleware/auth.ts\`:
  - Export a JWT validation middleware using Hono's \`jwt()\` helper.
- If deploying to edge (Cloudflare Workers), create \`wrangler.toml\` with basic config.
- If deploying as Node.js, use \`@hono/node-server\` adapter.
- Wire into the existing project as either a standalone API or a middleware layer in front of the FastAPI backend.`,
  },

  // =========================================================================
  // Backend Infrastructure (3)
  // =========================================================================
  {
    id: 'sd-sqlalchemy',
    name: 'SQLAlchemy 2.x',
    description: 'Async-first ORM and SQL toolkit with modern Python type hints',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['general', 'saas', 'ecommerce'],
    themes: ['expert'],
    packages: { pip: 'sqlalchemy' },
    icon: 'database',
    group: 'Backend Infrastructure',
    integrationPrompt: `Integrate SQLAlchemy 2.x with async support.
- Add \`sqlalchemy[asyncio]\` and \`aiosqlite\` to \`backend/requirements.txt\`.
- Create \`backend/app/db/engine.py\`:
  - Read \`DATABASE_URL\` from env (default \`sqlite+aiosqlite:///./app.db\`).
  - Export \`async_engine = create_async_engine(DATABASE_URL, echo=False)\`.
  - Export \`async_session_factory = async_sessionmaker(async_engine, expire_on_commit=False)\`.
  - Export async context manager \`get_session()\` yielding an \`AsyncSession\`.
- Create \`backend/app/db/base.py\`:
  - Export \`class Base(DeclarativeBase): pass\` using mapped_column style.
- Create \`backend/app/db/models.py\`:
  - At least one example model (e.g., \`Item\`) inheriting from \`Base\` with id, name, created_at columns.
- Add a FastAPI lifespan handler in \`backend/app/main.py\`:
  - On startup: \`async with async_engine.begin() as conn: await conn.run_sync(Base.metadata.create_all)\`.
- Add \`DATABASE_URL\` to \`.env.example\`.
- Add \`*.db\` to \`.gitignore\`.`,
  },
  {
    id: 'sd-alembic',
    name: 'Alembic',
    description: 'Database migration tool for SQLAlchemy with auto-generation and async support',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['general', 'saas', 'ecommerce'],
    themes: ['expert'],
    packages: { pip: 'alembic' },
    icon: 'git-merge',
    group: 'Backend Infrastructure',
    integrationPrompt: `Integrate Alembic for database migrations.
- Add \`alembic\` to \`backend/requirements.txt\`.
- Scaffold: \`cd backend && alembic init alembic\`.
- Edit \`backend/alembic/env.py\`:
  - Import \`Base.metadata\` from \`app.db.base\` as \`target_metadata\`.
  - Read \`DATABASE_URL\` from env var for \`sqlalchemy.url\`.
  - Implement async \`run_migrations_online()\` using \`create_async_engine\`.
- Edit \`backend/alembic.ini\`: set \`script_location = alembic\`.
- Generate initial migration: \`alembic revision --autogenerate -m "initial"\`.
- Document commands in backend README:
  - \`alembic upgrade head\` — apply all migrations
  - \`alembic revision --autogenerate -m "description"\` — create migration
  - \`alembic downgrade -1\` — rollback one step`,
  },
  {
    id: 'sd-redis',
    name: 'Redis',
    description: 'In-memory data store for caching, sessions, rate-limiting, and pub/sub',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['general', 'saas', 'ecommerce'],
    themes: ['expert'],
    packages: { pip: 'redis' },
    icon: 'database',
    group: 'Backend Infrastructure',
    integrationPrompt: `Integrate Redis for caching and session management.
- Add \`redis[hiredis]\` to \`backend/requirements.txt\`.
- Create \`backend/app/cache.py\`:
  - \`get_redis()\` returning \`redis.asyncio.Redis\` connected to \`REDIS_URL\` (default \`redis://localhost:6379/0\`).
  - Helpers: \`cache_get(key)\`, \`cache_set(key, value, ttl=300)\`, \`cache_delete(key)\`.
  - Decorator: \`@cached(ttl=60)\` for use on endpoint handlers or service functions.
- Create FastAPI dependency \`backend/app/deps/cache.py\` injecting the Redis client.
- Wire health check into \`GET /api/health\`: add \`{ "redis": "ok" | "unavailable" }\` to response.
- Add \`REDIS_URL\` to \`.env.example\`.`,
  },

  // =========================================================================
  // DevOps & Deploy (3)
  // =========================================================================
  {
    id: 'sd-docker',
    name: 'Docker',
    description: 'Containerization for consistent dev/prod environments with multi-stage builds',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'box',
    group: 'DevOps & Deploy',
    integrationPrompt: `Add Docker containerization to the project.
- Create \`backend/Dockerfile\`:
  - Base: \`python:3.12-slim\`. Copy requirements, install deps, copy app, expose 8000.
  - Add non-root user, health check (\`CMD curl -f http://localhost:8000/api/health\`).
  - CMD: \`["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]\`.
- Create \`frontend/Dockerfile\`:
  - Multi-stage: \`node:20-alpine\` build stage, \`nginx:alpine\` serve stage.
  - Build: copy package.json, \`npm ci\`, copy src, \`npm run build\`.
  - Serve: copy dist to \`/usr/share/nginx/html\`, copy custom nginx.conf.
- Create \`docker-compose.yml\` at project root:
  - \`backend\` service (port 8000, .env file).
  - \`frontend\` service (port 3000, depends_on backend).
  - Optional \`redis\` service (port 6379).
  - Shared network.
- Create \`frontend/nginx.conf\`: proxy \`/api\` to \`http://backend:8000\`, serve static from root.
- Create \`.dockerignore\` for both services (node_modules, __pycache__, .git, etc.).`,
  },
  {
    id: 'sd-github-actions',
    name: 'GitHub Actions CI/CD',
    description: 'Automated CI/CD pipelines for lint, test, build, and deploy to GHCR',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'play-circle',
    group: 'DevOps & Deploy',
    integrationPrompt: `Add GitHub Actions CI/CD workflows.
- Create \`.github/workflows/ci.yml\`:
  - Trigger: push to main, pull_request.
  - Jobs: \`lint-backend\` (ruff check), \`test-backend\` (pytest), \`lint-frontend\` (npm run lint), \`build-frontend\` (npm run build), \`typecheck\` (tsc --noEmit).
  - Cache pip and npm with \`actions/cache@v4\`.
- Create \`.github/workflows/deploy.yml\`:
  - Trigger: push to main after CI.
  - Build + push Docker images to \`ghcr.io\` using \`docker/build-push-action@v5\`.
  - Tag with \`latest\` and git SHA.
- Create \`.github/dependabot.yml\`:
  - Weekly updates for pip and npm ecosystems.`,
  },
  {
    id: 'sd-sst',
    name: 'SST',
    description: 'Infrastructure-as-code for AWS and Cloudflare — deploy full-stack apps with one command',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    packages: { npm: 'sst' },
    icon: 'cloud',
    group: 'DevOps & Deploy',
    integrationPrompt: `Integrate SST for infrastructure-as-code deployment.
- Install \`sst\` and \`sst ion\` CLI.
- Create \`sst.config.ts\` at project root:
  - Define a \`StaticSite\` resource for the frontend (Vite build output).
  - Define an \`Api\` resource for the backend (Lambda or container).
  - Define any required \`Bucket\`, \`Table\`, or \`Queue\` resources.
  - Wire environment variables from SST secrets to the API.
- Create \`stacks/\` directory with modular stack definitions if the config gets complex.
- Update \`package.json\` scripts: \`"deploy": "sst deploy"\`, \`"dev:sst": "sst dev"\`.
- Add \`.sst/\` to \`.gitignore\`.
- Document deploy commands: \`npx sst deploy --stage production\`.`,
  },

  // =========================================================================
  // Code Quality (2)
  // =========================================================================
  {
    id: 'sd-codemirror',
    name: 'CodeMirror 6',
    description: 'Extensible code editor with syntax highlighting, completions, and 20+ language modes',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['productivity', 'general'],
    themes: ['expert'],
    packages: { npm: '@codemirror/state' },
    icon: 'code',
    group: 'Code Quality',
    integrationPrompt: `Integrate CodeMirror 6 as an embedded code editor.
- Install: \`@codemirror/state\`, \`@codemirror/view\`, \`@codemirror/commands\`, \`@codemirror/language\`, \`@codemirror/autocomplete\`, \`@codemirror/lang-javascript\`, \`@codemirror/lang-python\`, \`@codemirror/lang-html\`.
- Create \`frontend/src/components/editor/CodeEditor.tsx\`:
  - Props: \`value: string\`, \`language: 'javascript' | 'python' | 'html'\`, \`onChange: (value: string) => void\`, \`readOnly?: boolean\`.
  - Use \`useRef<HTMLDivElement>\` + \`useEffect\` to create \`EditorView\`.
  - Extensions: language support, basic setup (line numbers, fold gutter, active line highlight), key bindings (defaultKeymap, indentWithTab).
  - Custom theme via \`EditorView.theme()\`: background from \`var(--t-bg)\`, text from \`var(--t-text)\`, gutters from \`var(--t-surface)\`.
  - Dispatch updates via \`EditorView.updateListener\`.
  - Destroy view on unmount.
- Export a \`ReadOnlyViewer\` variant with editing disabled and cursor hidden.`,
  },
  {
    id: 'sd-ag-grid',
    name: 'AG Grid',
    description: 'Enterprise data grid with sorting, filtering, grouping, and virtualized rendering',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['data-viz', 'saas', 'ecommerce', 'productivity'],
    themes: ['expert'],
    packages: { npm: 'ag-grid-react' },
    icon: 'grid',
    group: 'Code Quality',
    integrationPrompt: `Integrate AG Grid for data tables.
- Install \`ag-grid-react\` and \`ag-grid-community\`.
- Create \`frontend/src/components/grid/DataGrid.tsx\`:
  - Generic wrapper accepting \`rowData: T[]\`, \`columnDefs: ColDef<T>[]\`, optional \`onRowClick\`.
  - Import \`ag-grid-community/styles/ag-grid.css\` and Balham theme CSS.
  - Override with CSS variables: \`--ag-background-color: var(--t-bg)\`, \`--ag-header-background-color: var(--t-surface)\`, \`--ag-foreground-color: var(--t-text)\`, \`--ag-border-color: var(--t-border)\`.
  - Enable defaults: \`sortable: true\`, \`filter: true\`, \`resizable: true\`.
  - Wrap with \`React.memo\`.
- Create example \`frontend/src/components/grid/UsersTable.tsx\` fetching from \`GET /api/users\` and rendering in the grid.`,
  },

  // =========================================================================
  // Agents (6)
  // =========================================================================
  {
    id: 'agent-code-reviewer-sd',
    name: 'Code Reviewer',
    description: 'Scans generated code for security vulnerabilities (CWE IDs), style violations, and performance anti-patterns',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'shield',
    group: undefined,
    integrationPrompt: `Run the Code Reviewer agent on the current project.
- Analyze all generated files (both frontend and backend).
- Check for:
  - Security vulnerabilities: hardcoded secrets, SQL injection, XSS vectors, missing CORS, overly permissive permissions.
  - Style violations: inconsistent naming, missing type annotations, unused imports.
  - Performance anti-patterns: inline object/function props in React, missing memoization, synchronous blocking in async code.
- Return a structured report with severity (info/warning/critical), file path, line number, description, and remediation suggestion.
- Display results in the chat as a formatted checklist grouped by severity.`,
  },
  {
    id: 'agent-code-analyzer-sd',
    name: 'Code Analyzer',
    description: 'AST-based complexity analysis, anti-pattern detection, and dependency graph mapping',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'search',
    group: undefined,
    integrationPrompt: `Run the Code Analyzer agent on the current project.
- Perform AST-based analysis of all source files.
- Measure: cyclomatic complexity per function, lines per file, nesting depth, import dependency graph.
- Detect anti-patterns: circular dependencies, god files (>300 lines), deeply nested callbacks, any/unknown type abuse.
- Return a structured report with metrics, a dependency graph summary, and files ranked by complexity.
- Display results in the chat with the top 5 most complex files highlighted.`,
  },
  {
    id: 'agent-tdd-assistant-sd',
    name: 'TDD Assistant',
    description: 'Generates unit and integration tests, identifies coverage gaps, and suggests test strategies',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'check-square',
    group: undefined,
    integrationPrompt: `Run the TDD Assistant agent on the current project.
- Analyze all source files and identify functions/components without tests.
- For Python backend files: generate pytest tests with fixtures, async support, and mocking.
- For TypeScript/React files: generate Vitest tests with React Testing Library.
- Focus on: edge cases, error paths, boundary conditions, and meaningful assertions.
- Return generated test files placed in the appropriate test directories.
- Display a coverage gap summary in the chat showing which modules need tests.`,
  },
  {
    id: 'agent-refactoring-sd',
    name: 'Refactoring Analyzer',
    description: 'Detects code smells, produces safe refactoring plans with effort/risk estimates',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'scissors',
    group: undefined,
    integrationPrompt: `Run the Refactoring Analyzer agent on the current project.
- Scan all source files for code smells: duplicated logic, long methods, feature envy, data clumps, shotgun surgery.
- For each smell, produce a safe refactoring plan:
  - What to extract/move/inline.
  - Estimated effort (small/medium/large).
  - Risk level (safe/moderate/risky).
  - ROI justification (why this refactor is worth doing).
- Prioritize by ROI (high impact, low risk first).
- Display results in the chat as a prioritized checklist with expandable details.`,
  },
  {
    id: 'agent-scaffold-sd',
    name: 'Scaffold Generator',
    description: 'Generates project structure templates for 7 project types (API, CLI, Fullstack, etc.)',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'folder-plus',
    group: undefined,
    integrationPrompt: `Run the Scaffold Generator to create or extend the project structure.
- Analyze the current project and determine what's missing:
  - Missing directory structure (tests/, docs/, scripts/).
  - Missing configuration files (.editorconfig, .prettierrc, tsconfig paths).
  - Missing entry points or barrel exports.
- Generate the missing structure following best practices for the detected project type.
- Return the list of created files and directories.
- Display results in the chat showing the new project tree.`,
  },
  {
    id: 'agent-resilience-sd',
    name: 'Production Resilience',
    description: 'Adds circuit breaker, retry with backoff, and multi-model fallback patterns',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'shield',
    group: undefined,
    integrationPrompt: `Run the Production Resilience agent to harden the backend.
- Analyze all API endpoints and external service calls.
- Add resilience patterns where needed:
  - Circuit breaker for external API calls (open after 5 failures, half-open after 30s).
  - Retry with exponential backoff for transient failures (max 3 retries).
  - Timeout enforcement on all outbound HTTP calls (default 10s).
  - Graceful degradation: return cached/default responses when upstream is down.
- Create \`backend/app/resilience.py\` with reusable decorators: \`@circuit_breaker\`, \`@retry\`, \`@timeout\`.
- Apply decorators to existing external calls.
- Display a resilience audit in the chat showing which endpoints were hardened.`,
  },
]
```

**Step 3: TypeScript check**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: PASS — all tool entries satisfy the ToolEntry interface with the new `group` field.

**Step 4: Commit (Tasks 2 + 3 together)**

```bash
git add frontend/src/tools/types.ts frontend/src/tools/registry.ts frontend/src/tools/domains/site-dev.ts
git commit -m "feat(tools): add site-dev domain with 24 expert tools in 8 capability groups

- Add group field to ToolEntry type
- Add dedup logic and group helpers to registry
- Create tools/domains/site-dev.ts with 18 external + 6 agent tools
- Groups: State Management, Data Fetching, Forms, UI Components,
  Routing & SSR, Backend Infrastructure, DevOps & Deploy, Code Quality"
```

---

### Task 4: Update ToolCard with "Added" state

**Files:**
- Modify: `frontend/src/components/ToolCard.tsx:4-8` (props interface)
- Modify: `frontend/src/components/ToolCard.tsx:18` (component signature)
- Modify: `frontend/src/components/ToolCard.tsx:132-151` (Add button area)

**Step 1: Update the component**

Replace the entire `frontend/src/components/ToolCard.tsx` with:

```typescript
import React from 'react'
import type { ToolEntry } from '../tools/types'

interface ToolCardProps {
  tool: ToolEntry
  reason?: string
  onAdd: (tool: ToolEntry) => void
  disabled?: boolean
  isAdded?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  library: 'LIB',
  agent: 'AGENT',
  skill: 'SKILL',
}

/** A card displaying a single tool with themed styling via CSS vars. */
const ToolCard: React.FC<ToolCardProps> = ({ tool, reason, onAdd, disabled, isAdded }) => {
  return (
    <div
      style={{
        background: 'var(--t-surface)',
        border: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
        borderRadius: 'var(--t-radius)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        opacity: isAdded ? 0.6 : 1,
      }}
    >
      {/* Header: icon + name + category badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {tool.icon && (
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{tool.icon}</span>
        )}
        <span
          style={{
            fontWeight: 600,
            color: 'var(--t-text)',
            fontFamily: 'var(--t-font)',
            fontSize: '0.9rem',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tool.name}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '2px 6px',
            borderRadius: 'var(--t-radius)',
            background: 'var(--t-surface2)',
            color: 'var(--t-text2)',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {CATEGORY_LABELS[tool.category] ?? tool.category}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: '0.8rem',
          lineHeight: 1.4,
          color: 'var(--t-muted)',
          fontFamily: 'var(--t-font)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {tool.description}
      </p>

      {/* AI recommendation reason */}
      {reason && (
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontStyle: 'italic',
            color: 'var(--t-accent1)',
            fontFamily: 'var(--t-font)',
            lineHeight: 1.3,
          }}
        >
          {reason}
        </p>
      )}

      {/* Package badges + Add/Added button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
        {tool.packages?.npm && (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: 'var(--t-radius)',
              background: 'var(--t-surface2)',
              color: 'var(--t-muted)',
              fontFamily: 'var(--t-font)',
            }}
          >
            npm: {tool.packages.npm}
          </span>
        )}
        {tool.packages?.pip && (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: 'var(--t-radius)',
              background: 'var(--t-surface2)',
              color: 'var(--t-muted)',
              fontFamily: 'var(--t-font)',
            }}
          >
            pip: {tool.packages.pip}
          </span>
        )}

        {isAdded ? (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 'var(--t-radius)',
              background: 'var(--t-surface2)',
              color: 'var(--t-muted)',
              fontFamily: 'var(--t-font)',
            }}
          >
            Added
          </span>
        ) : (
          <button
            onClick={() => onAdd(tool)}
            disabled={disabled}
            style={{
              marginLeft: 'auto',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 'var(--t-radius)',
              background: 'var(--t-primary)',
              color: '#fff',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              fontFamily: 'var(--t-font)',
              transition: 'opacity 150ms',
            }}
          >
            Add
          </button>
        )}
      </div>
    </div>
  )
}

export default ToolCard
```

**Step 2: TypeScript check**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: PASS — `isAdded` is optional so existing callers compile without it.

**Step 3: Commit**

```bash
git add frontend/src/components/ToolCard.tsx
git commit -m "feat(ToolCard): add isAdded prop with 'Added' badge and muted styling"
```

---

### Task 5: Refactor ToolDrawer — tabs, domain selector, accordion, "Already Added"

This is the largest task. It modifies `ToolDrawer.tsx` to:
1. Change tabs from `Recommended | Libraries | Agents` to `Recommended | Tools | Agents`
2. Add a domain selector dropdown in the Tools tab
3. Render accordion capability groups
4. Compute "Already Added" from project deps and pass to ToolCard

**Files:**
- Modify: `frontend/src/components/ToolDrawer.tsx` (full rewrite)

**Step 1: Add `project` to ToolDrawerProps**

The drawer needs access to project deps for "Already Added" logic. Update the props interface.

**Step 2: Rewrite ToolDrawer.tsx**

Replace the entire file with the following implementation:

```typescript
import React, { useState, useMemo } from 'react'
import type { ToolEntry, ToolDomain } from '../tools/types'
import {
  getToolsForTheme,
  getToolsByCategory,
  getToolsByDomain,
  getToolsByGroup,
  getGroups,
  searchTools,
} from '../tools/registry'
import { useThemeContext } from '../context/ThemeContext'
import ToolCard from './ToolCard'

interface ToolDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAddTool: (tool: ToolEntry) => void
  recommendations?: Array<{ toolId: string; reason: string; priority: number }>
  isLoadingRecs?: boolean
  isStreaming?: boolean
  projectDeps?: {
    frontend: Record<string, string>
    backend: Record<string, string>
  }
}

type TabId = 'recommended' | 'tools' | 'agents'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'tools', label: 'Tools' },
  { id: 'agents', label: 'Agents' },
]

const DOMAIN_OPTIONS: Array<{ value: ToolDomain | 'all'; label: string }> = [
  { value: 'all', label: 'All Domains' },
  { value: 'general', label: 'General / Site Dev' },
  { value: 'saas', label: 'SaaS' },
  { value: 'ai-ml', label: 'AI / ML' },
  { value: 'music', label: 'Music' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'data-viz', label: 'Data Viz' },
]

/** Check if a tool's packages are already in the project deps. */
function isToolAdded(
  tool: ToolEntry,
  deps?: { frontend: Record<string, string>; backend: Record<string, string> },
): boolean {
  if (!deps) return false
  if (!tool.packages) return false
  if (tool.packages.npm && Object.keys(deps.frontend).some(
    (k) => k === tool.packages!.npm || tool.packages!.npm!.startsWith(k),
  )) return true
  if (tool.packages.pip && Object.keys(deps.backend).some(
    (k) => k === tool.packages!.pip || tool.packages!.pip!.startsWith(k),
  )) return true
  return false
}

/** Slide-out drawer showing theme-aware tool catalog with search, domain selector, and accordion groups. */
const ToolDrawer: React.FC<ToolDrawerProps> = ({
  isOpen,
  onClose,
  onAddTool,
  recommendations,
  isLoadingRecs,
  isStreaming,
  projectDeps,
}) => {
  const { themeId } = useThemeContext()
  const [activeTab, setActiveTab] = useState<TabId>('recommended')
  const [query, setQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<ToolDomain | 'all'>('all')
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // All tools for the current theme
  const themeTools = useMemo(() => getToolsForTheme(themeId), [themeId])

  // Domain-filtered tools (only tools with a group = external tools)
  const domainTools = useMemo(() => {
    const withGroups = themeTools.filter((t) => t.group)
    if (selectedDomain === 'all') return withGroups
    return getToolsByDomain(withGroups, selectedDomain)
  }, [themeTools, selectedDomain])

  // Agent tools (category agent or skill, no group field)
  const agentTools = useMemo(
    () => [
      ...getToolsByCategory(themeTools, 'agent'),
      ...getToolsByCategory(themeTools, 'skill'),
    ],
    [themeTools],
  )

  // Groups for the Tools tab
  const groups = useMemo(() => getGroups(domainTools), [domainTools])

  // Set first group open when groups change (and no group is open)
  useMemo(() => {
    if (groups.length > 0 && (openGroup === null || !groups.includes(openGroup))) {
      setOpenGroup(groups[0])
    }
  }, [groups]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recommended tools resolved from IDs
  const recTools = useMemo(() => {
    if (!recommendations?.length) return []
    const sorted = [...recommendations].sort((a, b) => b.priority - a.priority)
    return sorted
      .map((r) => {
        const tool = themeTools.find((t) => t.id === r.toolId)
        return tool ? { tool, reason: r.reason } : null
      })
      .filter((x): x is { tool: ToolEntry; reason: string } => x !== null)
  }, [recommendations, themeTools])

  // Fallback when no recommendations: first 6 tools
  const popularTools = useMemo(() => themeTools.slice(0, 6), [themeTools])

  // Search filtering
  const isSearching = query.trim() !== ''
  const filteredDomainTools = useMemo(() => searchTools(domainTools, query), [domainTools, query])
  const filteredAgents = useMemo(() => searchTools(agentTools, query), [agentTools, query])
  const filteredRecTools = useMemo(() => {
    if (!isSearching) return recTools
    const q = query.trim().toLowerCase()
    return recTools.filter(
      (r) =>
        r.tool.id.toLowerCase().includes(q) ||
        r.tool.name.toLowerCase().includes(q) ||
        r.tool.description.toLowerCase().includes(q),
    )
  }, [recTools, query, isSearching])
  const filteredPopular = useMemo(() => searchTools(popularTools, query), [popularTools, query])

  const handleGroupToggle = (group: string) => {
    setOpenGroup((prev) => (prev === group ? null : group))
  }

  // Shimmer placeholder cards for loading state
  const ShimmerCard: React.FC = () => (
    <div
      style={{
        background: 'var(--t-surface)',
        border: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
        borderRadius: 'var(--t-radius)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: 24, height: 24, borderRadius: 'var(--t-radius)',
            background: 'var(--t-surface2)', animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            flex: 1, height: 14, borderRadius: 'var(--t-radius)',
            background: 'var(--t-surface2)', animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
          }}
        />
      </div>
      <div
        style={{
          height: 10, width: '80%', borderRadius: 'var(--t-radius)',
          background: 'var(--t-surface2)', animation: 'shimmer 1.5s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
      <div
        style={{
          height: 10, width: '50%', borderRadius: 'var(--t-radius)',
          background: 'var(--t-surface2)', animation: 'shimmer 1.5s ease-in-out infinite',
          animationDelay: '0.3s',
        }}
      />
    </div>
  )

  const renderEmptyState = (label: string) => (
    <p
      style={{
        textAlign: 'center', color: 'var(--t-muted)', fontSize: '0.8rem',
        fontFamily: 'var(--t-font)', padding: '24px 0',
      }}
    >
      No {label} match &lsquo;{query}&rsquo;
    </p>
  )

  const renderToolCard = (tool: ToolEntry, reason?: string) => (
    <ToolCard
      key={tool.id}
      tool={tool}
      reason={reason}
      onAdd={onAddTool}
      disabled={isStreaming}
      isAdded={isToolAdded(tool, projectDeps)}
    />
  )

  // --- Recommended Tab ---
  const renderRecommendedTab = () => {
    if (isLoadingRecs) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ShimmerCard /><ShimmerCard /><ShimmerCard />
        </div>
      )
    }

    if (recTools.length > 0) {
      const items = filteredRecTools
      if (items.length === 0) return renderEmptyState('recommendations')
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((r) => renderToolCard(r.tool, r.reason))}
        </div>
      )
    }

    // Fallback: popular tools
    const items = filteredPopular
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{
          margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--t-muted)',
          fontFamily: 'var(--t-font)', textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          Popular for this theme
        </p>
        {items.length === 0
          ? renderEmptyState('tools')
          : items.map((t) => renderToolCard(t))}
      </div>
    )
  }

  // --- Tools Tab (Accordion Groups) ---
  const renderToolsTab = () => {
    // When searching: show flat filtered list (ignore accordion)
    if (isSearching) {
      if (filteredDomainTools.length === 0) return renderEmptyState('tools')
      // Group search results by their group for readability
      const searchGroups = getGroups(filteredDomainTools)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {searchGroups.map((group) => {
            const groupTools = getToolsByGroup(filteredDomainTools, group)
            return (
              <div key={group}>
                <p style={{
                  margin: '0 0 6px', fontSize: '0.7rem', fontWeight: 600,
                  color: 'var(--t-muted)', fontFamily: 'var(--t-font)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {group}
                </p>
                {groupTools.map((t) => renderToolCard(t))}
              </div>
            )
          })}
        </div>
      )
    }

    // Normal mode: accordion
    if (groups.length === 0) {
      return (
        <p style={{
          textAlign: 'center', color: 'var(--t-muted)', fontSize: '0.8rem',
          fontFamily: 'var(--t-font)', padding: '24px 0',
        }}>
          No tools available for this domain
        </p>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {groups.map((group) => {
          const groupTools = getToolsByGroup(domainTools, group)
          const isOpen = openGroup === group
          return (
            <div key={group}>
              {/* Group header (clickable) */}
              <button
                onClick={() => handleGroupToggle(group)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--t-font)',
                  borderBottom: isOpen ? 'none' : 'var(--t-border-width) var(--t-border-style) var(--t-border)',
                }}
              >
                {/* Chevron */}
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--t-muted)',
                    transition: 'transform 200ms',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}
                >
                  &#9654;
                </span>
                <span style={{
                  flex: 1, textAlign: 'left', fontSize: '0.85rem',
                  fontWeight: 600, color: 'var(--t-text)',
                }}>
                  {group}
                </span>
                <span style={{
                  fontSize: '0.7rem', color: 'var(--t-muted)',
                  padding: '1px 6px', borderRadius: 'var(--t-radius)',
                  background: 'var(--t-surface2)',
                }}>
                  {groupTools.length}
                </span>
              </button>

              {/* Group content (collapsible) */}
              {isOpen && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  padding: '8px 0 12px', borderBottom: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
                }}>
                  {groupTools.map((t) => renderToolCard(t))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // --- Agents Tab ---
  const renderAgentsTab = () => {
    const items = filteredAgents
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{
          margin: 0, fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--t-muted)', fontFamily: 'var(--t-font)',
        }}>
          {items.length} {items.length === 1 ? 'agent' : 'agents'}
        </p>
        {items.length === 0
          ? renderEmptyState('agents')
          : items.map((t) => renderToolCard(t))}
      </div>
    )
  }

  return (
    <>
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          transition: 'opacity 300ms',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          background: 'transparent',
        }}
      >
        <div className="hidden md:block" style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
        }} />
      </div>

      {/* Drawer panel */}
      <div
        className="w-full md:w-[360px]"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          background: 'var(--t-bg)',
          borderLeft: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px',
          borderBottom: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0, fontSize: '1.1rem', fontWeight: 700,
            color: 'var(--t-text)', fontFamily: 'var(--t-font)',
          }}>
            Tools
          </h2>
          <button
            onClick={onClose}
            aria-label="Close tools drawer"
            style={{
              background: 'none', border: 'none', color: 'var(--t-muted)',
              cursor: 'pointer', padding: '4px', fontSize: '1.25rem',
              lineHeight: 1, fontFamily: 'var(--t-font)',
            }}
          >
            &#x2715;
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', fontSize: '0.85rem',
              fontFamily: 'var(--t-font)', color: 'var(--t-text)',
              background: 'var(--t-input-bg)',
              border: 'var(--t-border-width) var(--t-border-style) var(--t-input-border)',
              borderRadius: 'var(--t-radius)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Domain selector (shown only on Tools tab) */}
        {activeTab === 'tools' && (
          <div style={{ padding: '8px 16px 0', flexShrink: 0 }}>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as ToolDomain | 'all')}
              style={{
                width: '100%', padding: '6px 10px', fontSize: '0.8rem',
                fontFamily: 'var(--t-font)', color: 'var(--t-text)',
                background: 'var(--t-input-bg)',
                border: 'var(--t-border-width) var(--t-border-style) var(--t-input-border)',
                borderRadius: 'var(--t-radius)', outline: 'none',
                cursor: 'pointer',
              }}
            >
              {DOMAIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex', padding: '0 16px', marginTop: '12px',
          borderBottom: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
          flexShrink: 0,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px 0', fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--t-primary)' : 'var(--t-muted)',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab.id
                  ? '2px solid var(--t-primary)'
                  : '2px solid transparent',
                cursor: 'pointer', fontFamily: 'var(--t-font)',
                transition: 'color 150ms, border-color 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
          {activeTab === 'recommended' && renderRecommendedTab()}
          {activeTab === 'tools' && renderToolsTab()}
          {activeTab === 'agents' && renderAgentsTab()}
        </div>
      </div>
    </>
  )
}

export default ToolDrawer
```

**Step 3: TypeScript check**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: May show errors in StudioPage.tsx because the `projectDeps` prop is now expected but not yet passed. That's OK — Task 6 will fix it.

**Step 4: Commit**

```bash
git add frontend/src/components/ToolDrawer.tsx
git commit -m "feat(ToolDrawer): add domain selector, accordion groups, and Already Added logic

- Tabs: Recommended | Tools | Agents
- Domain selector dropdown (shown on Tools tab)
- Accordion rendering with chevron, one group open at a time
- Search overrides accordion (shows flat grouped results)
- isToolAdded() checks project deps against tool packages
- projectDeps prop for Already Added computation"
```

---

### Task 6: Wire projectDeps from StudioPage into ToolDrawer

**Files:**
- Modify: `frontend/src/pages/StudioPage.tsx:68-75` (ToolDrawer props)

**Step 1: Compute and pass projectDeps**

Update `StudioPage.tsx` — add a `projectDeps` memo and pass it to ToolDrawer:

```typescript
import React, { useState, useCallback, useMemo } from 'react'
import { useStudioStream } from '../hooks/useStudioStream'
import { useToolRecommendations } from '../hooks/useToolRecommendations'
import { useThemeContext } from '../context/ThemeContext'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import PreviewPanel from '../components/PreviewPanel'
import ToolDrawer from '../components/ToolDrawer'
import type { ToolEntry } from '../tools/types'

interface StudioPageProps {
  isToolsOpen?: boolean
  onCloseTools?: () => void
}

const StudioPage: React.FC<StudioPageProps> = ({ isToolsOpen, onCloseTools }) => {
  const {
    messages,
    files,
    phases,
    project,
    isStreaming,
    error,
    generate,
    stop,
  } = useStudioStream()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const { themeId } = useThemeContext()
  const { recommendations, isLoading: isLoadingRecs } = useToolRecommendations(project, themeId)

  const projectDeps = useMemo(() => {
    if (!project) return undefined
    return {
      frontend: project.frontend_deps ?? {},
      backend: project.backend_deps ?? {},
    }
  }, [project])

  const handleSubmit = useCallback(
    (prompt: string) => {
      generate(prompt, project ?? undefined)
    },
    [generate, project],
  )

  const handleAddTool = useCallback(
    (tool: ToolEntry) => {
      if (!project || isStreaming) return
      onCloseTools?.()
      generate(tool.integrationPrompt, project)
    },
    [project, isStreaming, onCloseTools, generate],
  )

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--t-bg)' }}>
      <FileTree
        files={files}
        selectedFile={selectedFile}
        onSelectFile={setSelectedFile}
      />
      <ChatPanel
        messages={messages}
        phases={phases}
        isStreaming={isStreaming}
        error={error}
        project={project}
        onSubmit={handleSubmit}
        onStop={stop}
      />
      <PreviewPanel
        files={files}
        selectedFile={selectedFile}
      />
      <ToolDrawer
        isOpen={isToolsOpen ?? false}
        onClose={onCloseTools ?? (() => {})}
        onAddTool={handleAddTool}
        recommendations={recommendations}
        isLoadingRecs={isLoadingRecs}
        isStreaming={isStreaming}
        projectDeps={projectDeps}
      />
    </div>
  )
}

export default StudioPage
```

**Step 2: TypeScript check**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: PASS — all types align.

**Step 3: Commit**

```bash
git add frontend/src/pages/StudioPage.tsx
git commit -m "feat(StudioPage): pass projectDeps to ToolDrawer for Already Added tracking"
```

---

### Task 7: Integration verification

**Files:** None (verification only)

**Step 1: TypeScript check (full project)**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: 0 errors

**Step 2: Vite production build**

Run: `node frontend/node_modules/vite/bin/vite.js build --config frontend/vite.config.ts`
Expected: Build succeeds. Check output for:
- No warnings about missing imports
- Bundle size is reasonable (site-dev.ts adds ~15-20KB of tool definitions)

**Step 3: Visual verification (if servers are running)**

1. Navigate to `http://localhost:5176/studio`
2. Click the Tools (wrench) button in the NavBar
3. Verify:
   - Tabs show `Recommended | Tools | Agents`
   - Tools tab shows domain selector dropdown
   - Selecting "All Domains" or "General / Site Dev" shows 8 capability groups
   - Accordion behavior: clicking a group opens it, closes the previous
   - First group (State Management) is open by default
   - Search filters across groups and shows flat results
   - Agents tab shows 6 agents
   - All styling respects the current theme

**Step 4: No commit** — this is verification only.

---

## Build Order Summary

| Task | What | Files | Depends On |
|------|------|-------|------------|
| 1 | Add `group` field to types | types.ts | — |
| 2 | Registry helpers + dedup | registry.ts | Task 1 |
| 3 | Site-dev domain file (24 tools) | domains/site-dev.ts | Task 1 |
| 4 | ToolCard `isAdded` prop | ToolCard.tsx | — |
| 5 | ToolDrawer rewrite (accordion + domain selector + Already Added) | ToolDrawer.tsx | Tasks 2, 3, 4 |
| 6 | Wire projectDeps from StudioPage | StudioPage.tsx | Task 5 |
| 7 | Integration verification | — | All |

**Note:** Tasks 1, 2, and 3 should be committed together (single commit covering the type change + registry + domain file). Task 4 can be committed independently. Tasks 5 and 6 can each be committed independently.

**Total commits: 4** (types+registry+domain, ToolCard, ToolDrawer, StudioPage)
