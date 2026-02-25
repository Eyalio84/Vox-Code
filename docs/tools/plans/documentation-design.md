# Documentation Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: Documentation / Content / API Docs / Knowledge Bases
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/documentation.md`

---

## Goal

Add 17 domain-specific tools (10 external frameworks + 5 custom libraries + 2 agents) to the Expert drawer for documentation projects, organized by 5 capability groups with the same accordion UI, domain selector, and "Already Added" tracking.

## Architecture Decisions

All site-dev architectural decisions carry forward. Documentation-specific decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Curate to top 8 frameworks | Drop Unified (too low-level for standalone use), CodeMirror (in site-dev), dotenvx (too niche). Keep most impactful doc generators. |
| 2 | Include Unified/Remark, Markdoc, Velite | They serve a different role (content processing) than doc site generators (full sites) |
| 3 | 5 capability groups | Doc Site Generators, Content Authoring, API Reference, Code Documentation, Doc Management |
| 4 | Custom tools curated to docs-relevant | Skip KG ingestion tools (belong in RAG). Keep: doc_generator, universal_parser, auditor, tracker, readme_swarm |
| 5 | 2 agents in Agents tab | doc_tracker_agent and readme_generator_swarm are operational tools |
| 6 | MkDocs is pip-based | Only Python doc framework; uses `packages: { pip: 'mkdocs' }` |
| 7 | Dedup: CodeMirror excluded | Already in site-dev domain; docs users get it from there |

## File Structure

```
frontend/src/tools/domains/
├── site-dev.ts       # (already designed)
├── rag.ts            # (already designed)
├── music.ts          # (already designed)
├── games.ts          # (already designed)
├── saas.ts           # (already designed)
├── visuals.ts        # (already designed)
├── animations.ts     # (already designed)
└── documentation.ts  # 17 tools (15 in groups + 2 agents)
```

## Tool Inventory — 15 Tools in 5 Capability Groups

### Doc Site Generators (7)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Astro Starlight** | `docs-starlight` | external | `npm: @astrojs/starlight` | 1st (recommended) | Full documentation theme: sidebar, search, i18n, dark mode out of the box |
| **VitePress** | `docs-vitepress` | external | `npm: vitepress` | 2nd | Vue-powered docs with instant dev server, built-in search, theme customization |
| **Docusaurus** | `docs-docusaurus` | external | `npm: @docusaurus/core` | 3rd | React docs framework by Meta: versioning, blog, plugin ecosystem |
| **Nextra** | `docs-nextra` | external | `npm: nextra` | 4th | Next.js docs/blog generator, MDX-first, file-system routing |
| **Fumadocs** | `docs-fumadocs` | external | `npm: fumadocs-core` | 5th | React docs framework with OpenAPI rendering, fast-growing |
| **MkDocs Material** | `docs-mkdocs` | external | `pip: mkdocs-material` | 6th | Python docs-as-code: Markdown + YAML config, 20K stars |
| **Docsify** | `docs-docsify` | external | `npm: docsify-cli` | 7th | No-build docs from Markdown — runtime rendering, zero build step |

### Content Authoring (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Markdoc** | `docs-markdoc` | external | `npm: @markdoc/markdoc` | 1st (recommended) | Stripe's Markdown authoring framework — strict content/code separation, custom tags |
| **Unified/Remark** | `docs-unified` | external | `npm: unified` | 2nd | Plugin-based Markdown AST pipeline — transform, validate, convert markdown programmatically |
| **Velite** | `docs-velite` | external | `npm: velite` | 3rd | Type-safe content SDK with Zod schemas — Contentlayer replacement for MD/YAML content |

### API Reference (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Scalar** | `docs-scalar` | external | `npm: @scalar/api-reference` | 1st (recommended) | Beautiful OpenAPI renderer with built-in REST client — replaces Swagger UI |
| **TypeDoc** | `docs-typedoc` | external | `npm: typedoc` | 2nd | API reference from TypeScript source — reads tsconfig.json, auto-generates docs |

### Code Documentation (2 custom)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Documentation Generator** | `docs-doc-generator` | custom | — | 1st | AST-based docstring generation (Google/NumPy/Sphinx style) + OpenAPI spec output |
| **Universal Parser** | `docs-universal-parser` | custom | — | 2nd | Schema-first parser for 15+ formats — extracts structured content from any doc format |

### Doc Management (1 custom)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Documentation Auditor** | `docs-auditor` | custom | — | 1st | Codebase documentation coverage audit — scores 0-1 per component, finds gaps |

## Tool Inventory — 2 Agents (Agents Tab)

| Agent | ID | What It Does |
|-------|----|--------------|
| **Doc Tracker Agent** | `docs-agent-tracker` | Scans for markdown docs, categorizes by type, detects coverage gaps |
| **README Generator** | `docs-agent-readme` | Haiku swarm for parallel README generation across project components |

## Integration Prompt Structure

Doc site generators:
```
Integrate [Framework] as the documentation site.
- Install `[package]`.
- Initialize project structure: `[init command]`.
- Configure: sidebar, navigation, search, theme.
- Create starter pages: getting-started, API reference, guides.
- Add to build scripts in package.json.
```

Content authoring tools:
```
Integrate [Tool] for content processing.
- Install `[package]`.
- Configure content pipeline: [markdown -> AST -> transform -> output].
- Create content schemas and validation rules.
```

Custom tools:
```
Integrate [Tool] into the documentation workflow.
- Create `[path]` adapting the [tool_name] pattern.
- [Specific documentation task].
- Wire into CI/CD for automated doc updates.
```

## Gap Analysis

| Gap | Resolution |
|-----|-----------|
| Domain detection | Handled by shared domain selector |
| Already Added | All external tools have npm/pip packages. Custom tools never marked "Added". |
| Dedup with site-dev | CodeMirror excluded from docs domain (users get it from site-dev) |
| Dedup with RAG | KG ingestion tools excluded from docs (users get them from RAG) |
| MkDocs is pip-based | Uses `packages: { pip: 'mkdocs-material' }` — checked against backend deps |
| Theme assignment | `themes: ['expert']` |
| Ordering | Recommended-first per group |

## Success Criteria

1. Selecting 'Documentation' domain shows 5 collapsible capability groups
2. Doc Site Generators shows 7 frameworks (6 JS + 1 Python)
3. MkDocs Material correctly checks pip deps for "Already Added"
4. Custom tools without packages are never marked "Added"
5. Agents tab shows 2 doc management utilities
6. All 17 tools have detailed two-level prompts
7. Accordion, search, and "Already Added" work identically to site-dev
