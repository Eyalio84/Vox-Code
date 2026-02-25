# Documentation — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building documentation sites, content management systems, API docs, code docs, or markdown-driven projects.

## Custom Tools

### From `docs-parsers/`

| Tool | Description | Type |
|------|-------------|------|
| `documentation_generator` | AST-based docstring generation (Google/NumPy/Sphinx), OpenAPI output | Library |
| `documentation_auditor` | Codebase documentation coverage audit, scores 0-1 per component | Utility |
| `doc_tracker_agent` | Scans for markdown docs, categorizes, detects gaps | Agent |
| `readme_generator_swarm` | Haiku swarm for parallel README generation across components | Agent |
| `readme_parser` | Extracts entities from README markdown without AI | Library |
| `playbook_indexer` | Indexes PLAYBOOK markdown files into SQLite KG | Utility |
| `coder_blueprints_parser` | Parses Obsidian wiki-link markdown into KG | Utility |
| `universal_parser` | Schema-first parser for 15+ formats | Library |
| `parser_adapters` | Unified 15+ format parser | Library |

### From `agents-misc/`

| Tool | Description | Type |
|------|-------------|------|
| `code_review_generator` | Generates code review documentation | Utility |

### From `by category/generators/`

| Tool | Description | Type |
|------|-------------|------|
| `template_generator` | Jinja2-compatible template engine | Library |

### From `by category/knowledge/`

| Tool | Description | Type |
|------|-------------|------|
| `graph_engineering` | KG ingestion with relationship extraction from README links | Utility |

### From `embeddings-rag-query-KG/`

| Tool | Description | Type |
|------|-------------|------|
| `kg_audit_ingestion` | Ingests doc-audit components into unified KG | Utility |
| `kg-critical-components` | Identifies critical nodes for testing/documentation priority | Utility |
| `persist_to_kg` | Strategic fact selection for KG indexing | Utility |
| `consolidate_rules` | Deduplicates and organizes synthesis rules | Utility |

## External Libraries

| Library | Install | Purpose |
|---------|---------|---------|
| CodeMirror 6 | `npm install @codemirror/state` | Code editor for documentation sites |
| dotenvx | `npm install @dotenvx/dotenvx` | Environment variable documentation |

## Frameworks

| Framework | Install | Description | Stars |
|-----------|---------|-------------|-------|
| VitePress | `npm install vitepress` | Vue-powered docs SSG, instant dev server | 13K |
| Astro Starlight | `npm install @astrojs/starlight` | Full documentation theme on Astro | 6K, sidebar/search/i18n OOTB |
| Docusaurus | `npm install @docusaurus/core` | React docs framework by Meta, versioning | 57K |
| Nextra | `npm install nextra` | Next.js docs/blog generator, MDX-first | 12K |
| Fumadocs | `npm install fumadocs-core` | React docs framework, OpenAPI rendering | 3.5K, fast-growing |
| MkDocs + Material | `pip install mkdocs mkdocs-material` | Python docs-as-code, Markdown + YAML | 20K (Material) |
| Docsify | `npm install docsify-cli` | No-build docs from Markdown, runtime rendering | 27K |
| Markdoc | `npm install @markdoc/markdoc` | Stripe's Markdown authoring framework | 7.5K, strict content/code separation |
| Unified/Remark | `npm install unified remark rehype` | Plugin-based Markdown AST pipeline | Backbone of most doc generators |
| TypeDoc | `npm install typedoc` | API reference from TypeScript source | 7.5K, reads tsconfig.json |
| Scalar | `npm install @scalar/api-reference` | Beautiful OpenAPI renderer with REST client | 8K, replaces SwaggerUI |
| Velite | `npm install velite` | Type-safe content SDK, Zod schemas for MD/YAML | 3K, Contentlayer replacement |

## Recommended Combinations

- **Project docs site**: Starlight + `documentation_generator` (API docs) + `doc_tracker_agent` (gap detection)
- **API documentation**: Scalar + TypeDoc + `documentation_generator` (OpenAPI from code)
- **Internal knowledge base**: VitePress + `readme_generator_swarm` + `playbook_indexer`
- **Content pipeline**: Velite + Unified/Remark + `universal_parser` + `parser_adapters`
- **Documentation audit**: `documentation_auditor` + `doc_tracker_agent` + `kg-critical-components`
- **Python project docs**: MkDocs Material + `documentation_generator` + TypeDoc (for TS parts)
