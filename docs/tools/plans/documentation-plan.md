# Documentation Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 17 documentation domain tools to the Expert drawer organized by 5 capability groups.

**Architecture:** Single domain file (`documentation.ts`) exports `DOCUMENTATION_TOOLS` array with 17 `ToolEntry` objects. Registry imports and dedup merges them. No type or component changes needed — infrastructure from site-dev plan Tasks 1-5 is prerequisite.

**Tech Stack:** TypeScript, existing ToolEntry type system, registry helpers

**Prerequisite:** site-dev plan Tasks 1-5 must be implemented first.

---

### Task 1: Create `frontend/src/tools/domains/documentation.ts`

**Files:**
- Create: `frontend/src/tools/domains/documentation.ts`

**Step 1: Create the domain file with all 17 tool entries**

```typescript
// frontend/src/tools/domains/documentation.ts
import type { ToolEntry } from '../types'

export const DOCUMENTATION_TOOLS: ToolEntry[] = [
  // ── Doc Site Generators (7) ───────────────────────────────────
  {
    id: 'docs-starlight',
    name: 'Astro Starlight',
    description: 'Full documentation theme on Astro — sidebar, search, i18n, dark mode out of the box. 6K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: '@astrojs/starlight' },
    group: 'Doc Site Generators',
    integrationPrompt: `Integrate Astro Starlight as the documentation site.
- Install: \`npm create astro@latest -- --template starlight\` (new project) or \`npx astro add starlight\` (existing Astro project).
- Configure \`astro.config.mjs\` with:
  - Starlight integration: title, logo, social links
  - Sidebar structure: groups, links, auto-generated from file system
  - Search: built-in Pagefind search (zero config)
  - i18n: multi-language support with locale configuration
  - Custom CSS: override variables for brand colors
- Create documentation pages in \`src/content/docs/\`:
  - index.mdx: landing page with hero component
  - getting-started.mdx: installation, quick start, first example
  - guides/*.mdx: how-to guides organized by topic
  - reference/*.mdx: API reference pages
- Configure frontmatter:
  - title, description for SEO
  - sidebar: { order: N } for manual ordering
  - tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 }
- Add custom components in \`src/components/\` for interactive examples.
- Build: \`npm run build\` outputs static HTML to \`dist/\`.
- Starlight is the most batteries-included doc framework — search, sidebar, i18n, dark mode all work immediately.`,
  },
  {
    id: 'docs-vitepress',
    name: 'VitePress',
    description: 'Vue-powered docs SSG with instant dev server, built-in search, theme customization. 13K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: 'vitepress' },
    group: 'Doc Site Generators',
    integrationPrompt: `Integrate VitePress as the documentation site.
- Install: \`npm install -D vitepress\` and \`npx vitepress init\`.
- Configure \`.vitepress/config.ts\` with:
  - Title, description, base URL
  - Theme config: nav (top navigation), sidebar (per-section sidebar trees)
  - Search: built-in local search or Algolia DocSearch
  - Social links: GitHub, Discord, Twitter
  - Edit link: "Edit this page on GitHub" with repo URL pattern
- Create documentation in \`docs/\` directory:
  - index.md: landing page with VitePress hero layout
  - guide/*.md: getting started, tutorials, advanced topics
  - api/*.md: API reference with type tables
- VitePress features:
  - Code groups: tabbed code blocks for multi-language examples
  - Custom containers: tip, warning, danger, details callout blocks
  - Vue components in Markdown for interactive demos
  - Frontmatter: title, outline, aside, lastUpdated
- Build: \`vitepress build docs\` outputs static HTML.
- Dev: \`vitepress dev docs\` with instant HMR.
- VitePress is Vue-based — if your project uses React, consider Starlight or Docusaurus instead.`,
  },
  {
    id: 'docs-docusaurus',
    name: 'Docusaurus',
    description: 'React docs framework by Meta — versioning, blog, plugin ecosystem. 57K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: '@docusaurus/core' },
    group: 'Doc Site Generators',
    integrationPrompt: `Integrate Docusaurus as the documentation site.
- Install: \`npx create-docusaurus@latest my-docs classic\`.
- Configure \`docusaurus.config.js\` with:
  - Title, tagline, URL, baseUrl, organizationName, projectName
  - Navbar: logo, items (docs, blog, GitHub link)
  - Footer: links organized by column
  - Theme: colorMode (light/dark), prism (code highlighting themes)
  - Plugins: search (Algolia), sitemap, PWA
- Documentation structure:
  - docs/intro.md: getting started page
  - docs/tutorial-basics/*.md: tutorial series
  - docs/api/*.md: API reference
  - sidebars.js: sidebar configuration (auto-generated or manual)
- Docusaurus features:
  - Versioning: \`npm run docusaurus docs:version 1.0\` snapshots current docs
  - Blog: built-in blog with RSS, authors, tags
  - MDX: React components in Markdown
  - i18n: translation framework with crowdsourcing support
  - Search: Algolia DocSearch (free for open source)
- Build: \`npm run build\` outputs to \`build/\`.
- Docusaurus is the most feature-rich option but has the largest bundle. Best for large projects.`,
  },
  {
    id: 'docs-nextra',
    name: 'Nextra',
    description: 'Next.js docs/blog generator — MDX-first, file-system routing, minimal config. 12K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: 'nextra' },
    group: 'Doc Site Generators',
    integrationPrompt: `Integrate Nextra as the documentation site.
- Install: \`npm install nextra nextra-theme-docs\`.
- Configure \`next.config.mjs\`:
  \`const withNextra = require('nextra')({ theme: 'nextra-theme-docs', themeConfig: './theme.config.tsx' })\`
  \`module.exports = withNextra()\`
- Configure \`theme.config.tsx\` with:
  - Logo, project link, docsRepositoryBase
  - Navigation: top nav items
  - Sidebar: auto-generated from file system (uses _meta.json for ordering)
  - Footer, search, dark mode toggle
- Create pages in \`pages/\`:
  - index.mdx: landing page
  - docs/*.mdx: documentation pages
  - _meta.json: page ordering and sidebar labels
- Nextra features:
  - MDX: full React components in Markdown
  - Callout component: info, warning, error blocks
  - Tabs component: multi-variant code examples
  - Steps component: numbered step-by-step guides
  - File-system routing: page structure = URL structure
- Nextra is Next.js-based — if your project uses Next.js, this is the natural choice.
- Build: \`next build\` for SSG or SSR.`,
  },
  {
    id: 'docs-fumadocs',
    name: 'Fumadocs',
    description: 'React docs framework with OpenAPI rendering, fast-growing. 3.5K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: 'fumadocs-core' },
    group: 'Doc Site Generators',
    integrationPrompt: `Integrate Fumadocs as the documentation site.
- Install: \`npm install fumadocs-core fumadocs-ui fumadocs-mdx\`.
- Configure source in \`source.config.ts\`:
  - defineSource() with content directory and schema
  - MDX compilation with custom plugins
- Create \`app/docs/layout.tsx\` with:
  - DocsLayout with sidebar, TOC, breadcrumbs
  - Search integration (built-in or Algolia)
  - Theme toggle
- Create documentation in \`content/docs/\`:
  - index.mdx: landing/getting-started
  - meta.json: sidebar ordering and labels
  - Nested folders for sections
- Fumadocs features:
  - OpenAPI rendering: \`fumadocs-openapi\` generates pages from OpenAPI spec
  - Type table: render TypeScript types as documentation
  - Code highlighting: Shiki with line highlighting, diff display
  - Search: built-in Orama search (client-side)
- Best for: React/Next.js projects that need OpenAPI documentation alongside guides.
- Build: \`next build\` outputs static or server-rendered docs.`,
  },
  {
    id: 'docs-mkdocs',
    name: 'MkDocs Material',
    description: 'Python docs-as-code — Markdown + YAML config with Material theme. 20K stars.',
    category: 'framework',
    level: 'expert',
    side: 'backend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { pip: 'mkdocs-material' },
    group: 'Doc Site Generators',
    integrationPrompt: `Integrate MkDocs with Material theme for documentation.
- Install: \`pip install mkdocs-material\`.
- Create \`mkdocs.yml\` with:
  - site_name, site_url, repo_url
  - theme: material with palette (light/dark), font, logo, favicon
  - nav: manually ordered page tree
  - plugins: search, tags, social cards, git-revision-date
  - markdown_extensions: admonitions, code highlighting, tabs, tables
- Create documentation in \`docs/\`:
  - index.md: landing page
  - getting-started.md: installation, quick start
  - guides/*.md: how-to guides
  - reference/*.md: API reference
- MkDocs Material features:
  - Admonitions: note, tip, warning, danger callout blocks
  - Code annotations: line-by-line code explanations
  - Content tabs: tabbed content blocks
  - Social cards: auto-generated Open Graph images
  - Blog plugin: integrated blog with RSS
  - Offline search: works without server
- Build: \`mkdocs build\` outputs to \`site/\`.
- Dev: \`mkdocs serve\` with live reload.
- MkDocs is Python-based — best for Python projects or teams comfortable with pip.`,
  },
  {
    id: 'docs-docsify',
    name: 'Docsify',
    description: 'No-build docs from Markdown — runtime rendering, zero build step, instant setup. 27K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: 'docsify-cli' },
    group: 'Doc Site Generators',
    integrationPrompt: `Integrate Docsify for zero-build documentation.
- Install: \`npm install -g docsify-cli\` and \`docsify init ./docs\`.
- Configure \`docs/index.html\` with:
  - window.\$docsify config: name, repo, loadSidebar, loadNavbar
  - Theme: vue.css (default) or custom theme CSS
  - Plugins: search, copy-code, pagination, dark-mode
- Create documentation in \`docs/\`:
  - README.md: landing page (loaded by default)
  - _sidebar.md: sidebar navigation links
  - _navbar.md: top navigation links
  - guide/*.md: documentation pages
- Docsify features:
  - Zero build: Markdown rendered at runtime in the browser
  - GitHub Pages ready: just push \`docs/\` folder
  - Plugins: 100+ community plugins
  - Custom themes: CSS-only theming
  - Embedded code demos: include live examples
- Docsify has NO build step — changes to .md files appear immediately.
- Best for: simple documentation that doesn't need SSG (README-driven projects).
- Serve: \`docsify serve docs\` for local development.`,
  },

  // ── Content Authoring (3) ─────────────────────────────────────
  {
    id: 'docs-markdoc',
    name: 'Markdoc',
    description: 'Stripe\'s Markdown authoring framework — strict content/code separation, custom tags. 7.5K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: '@markdoc/markdoc' },
    group: 'Content Authoring',
    integrationPrompt: `Integrate Markdoc for structured content authoring.
- Install \`npm install @markdoc/markdoc\`.
- Create \`frontend/src/markdoc/config.ts\` with:
  - Tag definitions: callout, tabs, code-group, badge (custom components)
  - Node customization: heading (auto-id), fence (syntax highlighting), link (external detection)
  - Function definitions: custom template functions for dynamic content
  - Validation rules: enforce content structure (required frontmatter, heading order)
- Create \`frontend/src/markdoc/tags/\` with:
  - Callout.tsx: {% callout type="warning" %} content {% /callout %}
  - Tabs.tsx: {% tabs %} {% tab label="React" %} ... {% /tab %} {% /tabs %}
  - CodeGroup.tsx: multiple code blocks in tabs
- Create \`frontend/src/lib/markdoc-render.ts\` with:
  - Parse: Markdoc.parse(content)
  - Transform: Markdoc.transform(ast, config)
  - Render: Markdoc.renderers.react(renderableTree, React, components)
- Markdoc separates content (Markdown) from presentation (React components).
- Best for: large documentation projects where content authors shouldn't write React code.
- Use CSS variables from the active theme for custom tag styling.`,
  },
  {
    id: 'docs-unified',
    name: 'Unified/Remark',
    description: 'Plugin-based Markdown AST pipeline — transform, validate, convert markdown programmatically.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: 'unified' },
    group: 'Content Authoring',
    integrationPrompt: `Integrate Unified/Remark for markdown processing.
- Install \`npm install unified remark-parse remark-rehype rehype-stringify\`.
- Install plugins: \`npm install remark-gfm remark-frontmatter rehype-highlight rehype-slug\`.
- Create \`frontend/src/lib/markdown-pipeline.ts\` with:
  - Unified pipeline: unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify)
  - Plugin chain: parse markdown -> GFM (tables, strikethrough) -> convert to HTML -> syntax highlighting
  - Frontmatter extraction: remark-frontmatter + remark-extract-frontmatter
  - Custom plugin: add anchor links to headings, auto-link references, validate structure
- Create \`frontend/src/lib/markdown-plugins/\` with:
  - auto-toc.ts: generate table of contents from heading hierarchy
  - link-checker.ts: validate internal links resolve to existing pages
  - reading-time.ts: calculate estimated reading time from word count
- Create \`frontend/src/hooks/useMarkdown.ts\` with:
  - React hook that processes markdown content through the pipeline
  - Memoized: only re-process when content changes
  - Returns: HTML string, frontmatter, TOC, reading time
- Unified is the backbone of most doc generators (VitePress, Docusaurus, Nextra use it internally).
- Best for: custom content pipelines, programmatic markdown transformation.`,
  },
  {
    id: 'docs-velite',
    name: 'Velite',
    description: 'Type-safe content SDK with Zod schemas for Markdown/YAML — Contentlayer replacement. 3K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: 'velite' },
    group: 'Content Authoring',
    integrationPrompt: `Integrate Velite for type-safe content management.
- Install \`npm install velite\`.
- Create \`velite.config.ts\` with:
  - Content collections: docs, blog, changelog (each with Zod schema)
  - Schema: z.object({ title: z.string(), description: z.string(), date: z.date() })
  - MDX configuration: plugins, components
  - Output: generates typed data at build time
- Create content in \`content/\`:
  - docs/*.mdx: documentation pages with typed frontmatter
  - blog/*.mdx: blog posts
  - Each file validated against Zod schema at build time
- Use generated types:
  - \`import { docs } from '.velite'\`
  - Full TypeScript types: docs[0].title is string, docs[0].date is Date
  - Query: docs.filter(d => d.category === 'guide').sort((a,b) => b.date - a.date)
- Velite is the Contentlayer replacement — same concept, actively maintained.
- Best for: Next.js/Astro projects that want typed content with compile-time validation.`,
  },

  // ── API Reference (2) ─────────────────────────────────────────
  {
    id: 'docs-scalar',
    name: 'Scalar',
    description: 'Beautiful OpenAPI renderer with built-in REST client — modern Swagger UI replacement. 8K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: '@scalar/api-reference' },
    group: 'API Reference',
    integrationPrompt: `Integrate Scalar for OpenAPI API documentation.
- Install \`npm install @scalar/api-reference\`.
- Create \`frontend/src/components/ApiReference.tsx\` with:
  - ApiReference component with OpenAPI spec URL or inline content
  - Theme customization: colors, fonts, layout
  - Authentication: configure API key, OAuth, Bearer token for "Try it" feature
  - Server selection: switch between dev/staging/prod base URLs
- Create \`frontend/src/pages/ApiDocsPage.tsx\` with:
  - Full-page API reference with sidebar navigation
  - Endpoint grouping by tag
  - Search across all endpoints, parameters, schemas
- For FastAPI backend, serve OpenAPI spec:
  - FastAPI auto-generates at \`/openapi.json\`
  - Point Scalar to this URL
- Scalar features:
  - Interactive "Try it" REST client: send requests directly from docs
  - Request/response examples in multiple languages (curl, Python, JS, etc.)
  - Schema viewer: expandable JSON schemas with type information
  - Dark mode: built-in light/dark themes
- Scalar is a drop-in Swagger UI replacement with much better UX.
- Use CSS variables from the active theme for Scalar customization.`,
  },
  {
    id: 'docs-typedoc',
    name: 'TypeDoc',
    description: 'API reference from TypeScript source — reads tsconfig.json, auto-generates documentation. 7.5K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['documentation'],
    themes: ['expert'],
    packages: { npm: 'typedoc' },
    group: 'API Reference',
    integrationPrompt: `Integrate TypeDoc for TypeScript API documentation.
- Install \`npm install -D typedoc\`.
- Create \`typedoc.json\` with:
  - entryPoints: ["src/index.ts"] or ["src/"] for all exports
  - out: "docs/api" — output directory
  - tsconfig: "./tsconfig.json"
  - plugin: typedoc-plugin-markdown (for Markdown output) or default HTML
  - excludePrivate: true, excludeProtected: true
  - categoryOrder: ["Functions", "Classes", "Types", "Interfaces"]
- Add script to package.json:
  \`"docs:api": "typedoc"\`
- TypeDoc features:
  - Reads JSDoc/TSDoc comments from source code
  - Generates: class hierarchy, interface docs, function signatures, type aliases
  - Cross-references: links between related types
  - Search: built-in search in HTML output
  - Markdown output: integrate into VitePress/Docusaurus/Starlight
- For integration with doc sites:
  - Install \`typedoc-plugin-markdown\` for Markdown output
  - Output to doc site's content directory
  - Auto-generate on build: include in CI/CD pipeline
- IMPORTANT: Write TSDoc comments on exported members for TypeDoc to document.`,
  },

  // ── Code Documentation (2 custom) ─────────────────────────────
  {
    id: 'docs-doc-generator',
    name: 'Documentation Generator',
    description: 'AST-based docstring generation (Google/NumPy/Sphinx style) + OpenAPI spec output from Python code.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['documentation'],
    themes: ['expert'],
    group: 'Code Documentation',
    integrationPrompt: `Integrate Documentation Generator for automated code docs.
- Create \`backend/app/docs/generator.py\` adapting the documentation_generator pattern:
  - AST parser: extract function/class/module structure from Python source
  - Docstring generation: Google style (default), NumPy style, Sphinx style
  - Parameter documentation: type, description, default values from annotations
  - Return documentation: type and description from return annotation
  - Example generation: create usage examples from function signatures
- Create \`backend/app/docs/openapi_gen.py\` with:
  - FastAPI route extraction: parse all @router decorators
  - Schema extraction: Pydantic model to JSON Schema
  - OpenAPI spec assembly: paths, components, info, servers
  - Output: openapi.json or openapi.yaml
- Add endpoint \`GET /api/docs/generate\` with:
  - Accept: scope (module, package, all), style (google, numpy, sphinx)
  - Return: generated documentation as structured JSON or Markdown
- Wire into CI: generate docs on push, commit to docs directory.`,
  },
  {
    id: 'docs-universal-parser',
    name: 'Universal Parser',
    description: 'Schema-first parser for 15+ formats — extracts structured content from Markdown, YAML, JSON, CSV, etc.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['documentation'],
    themes: ['expert'],
    group: 'Code Documentation',
    integrationPrompt: `Integrate Universal Parser for multi-format content extraction.
- Create \`backend/app/docs/parser.py\` adapting the universal_parser pattern:
  - Format detection: auto-detect from file extension or content sniffing
  - Supported formats: Markdown, YAML, JSON, TOML, CSV, TSV, XML, HTML, RST, AsciiDoc, LaTeX, DOCX, PDF, Jupyter Notebook
  - Schema validation: define expected structure per format using Pydantic
  - Content extraction: structured output with metadata (title, sections, links, code blocks)
  - Batch processing: parse entire directories with progress tracking
- Create \`backend/app/docs/content_index.py\` with:
  - Index all documentation files in the project
  - Extract: titles, headings, links, code blocks, frontmatter
  - Build searchable index for documentation search
  - Detect broken internal links
- Add endpoint \`POST /api/docs/parse\` with:
  - Accept: file upload or directory path
  - Return: structured content with metadata
- Use for: ingesting existing documentation into your doc site.`,
  },

  // ── Doc Management (1 custom) ─────────────────────────────────
  {
    id: 'docs-auditor',
    name: 'Documentation Auditor',
    description: 'Codebase documentation coverage audit — scores 0-1 per component, finds undocumented code.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['documentation'],
    themes: ['expert'],
    group: 'Doc Management',
    integrationPrompt: `Integrate Documentation Auditor for coverage analysis.
- Create \`backend/app/docs/auditor.py\` adapting the documentation_auditor pattern:
  - Scan all source files for documentation coverage:
    - Functions: has docstring? (0 or 1)
    - Classes: has docstring + method docs? (0-1 score)
    - Modules: has module docstring? (0 or 1)
    - API endpoints: has description in decorator? (0 or 1)
  - Overall coverage score: weighted average across all components
  - Gap report: list of undocumented functions/classes/modules
  - Priority ranking: most-used undocumented components first (by import count)
- Add endpoint \`GET /api/docs/audit\` with:
  - Accept: scope (module, package, all), threshold (minimum acceptable score)
  - Return: { overallScore, components: [{ path, name, score, gaps }] }
- Add endpoint \`GET /api/docs/audit/badge\` with:
  - Returns SVG badge showing documentation coverage percentage
  - Can be embedded in README: ![docs](api/docs/audit/badge)
- Wire into CI: fail build if coverage drops below threshold.`,
  },

  // ── Agents (2) ────────────────────────────────────────────────
  {
    id: 'docs-agent-tracker',
    name: 'Doc Tracker Agent',
    description: 'Scans for markdown docs, categorizes by type (guide, reference, tutorial), detects coverage gaps.',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['documentation'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Doc Tracker Agent on the project.
- Scan all directories for documentation files (*.md, *.mdx, *.rst, *.txt).
- Categorize each document: guide, reference, tutorial, changelog, readme, contributing, license.
- Map documentation to code: which modules/features have docs, which don't.
- Detect gaps:
  - Public API endpoints without documentation
  - Complex modules without guides
  - Missing: README, CONTRIBUTING, CHANGELOG, LICENSE
  - Outdated: docs that reference removed code/features
- Return structured report: { documented, undocumented, outdated, missing }.`,
  },
  {
    id: 'docs-agent-readme',
    name: 'README Generator',
    description: 'Parallel README generation across project components — uses Haiku swarm for speed.',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['documentation'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run README Generator on the project.
- Scan project structure for components that need README files.
- For each component, generate README with:
  - Title and description
  - Installation/setup instructions
  - Usage examples with code blocks
  - API reference (public functions/classes)
  - Configuration options
  - Dependencies and requirements
- Output: markdown README files, one per component.
- Review generated READMEs for accuracy before committing.`,
  },
]
```

**Step 2: Verify no TypeScript errors**

Run: `cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to documentation.ts

**Step 3: Commit**

```bash
git add frontend/src/tools/domains/documentation.ts
git commit -m "feat(tools): add documentation domain with 17 expert tools in 5 capability groups"
```

---

### Task 2: Register Documentation Tools in Registry

**Files:**
- Modify: `frontend/src/tools/registry.ts`

**Step 1: Add import and spread**

```typescript
import { DOCUMENTATION_TOOLS } from './domains/documentation'

export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,
  ...RAG_TOOLS,
  ...MUSIC_TOOLS,
  ...GAMES_TOOLS,
  ...SAAS_TOOLS,
  ...VISUALS_TOOLS,
  ...ANIMATIONS_TOOLS,
  ...DOCUMENTATION_TOOLS,
])
```

**Step 2: Verify no duplicate IDs**

All documentation tool IDs use `docs-` prefix. Verify:
```bash
grep -c "docs-" src/tools/domains/documentation.ts
```
Expected: 17

**Step 3: Commit**

```bash
git add frontend/src/tools/registry.ts
git commit -m "feat(tools): register documentation domain tools in registry"
```

---

### Task 3: Integration Verification

**Step 1: Verify ToolDomain includes documentation**

Check `types.ts` for a documentation-related domain value. Add if missing.

**Step 2: Verify tool counts**

Expected groups:
```
Doc Site Generators: 7
Content Authoring: 3
API Reference: 2
Code Documentation: 2
Doc Management: 1
Agents: 2
Total: 17
```

**Step 3: Verify MkDocs pip detection**

MkDocs has `packages: { pip: 'mkdocs-material' }`. "Already Added" logic should check `project.backend_deps` for this.

**Step 4: Commit if fixes needed**

```bash
git add -A
git commit -m "fix(tools): documentation domain integration fixes"
```
