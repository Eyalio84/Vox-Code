# Site Development / General Web — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building a general web application, website, or full-stack project.

## Custom Tools

### From `by category/dev/`

| Tool | Description | Type |
|------|-------------|------|
| `full_stack_scaffolding` | 9 validated app type templates with cost estimates | Utility |
| `enhanced_coding` | Automated code review (style, security, performance) | Utility |
| `production_resilience` | Circuit breaker, retry, multi-model fallback patterns | Library |
| `refactoring_analyzer` | Code smell detection and safe refactoring plans | Utility |
| `tdd_assistant` | TDD workflow automation with test generation | Utility |

### From `by category/generators/`

| Tool | Description | Type |
|------|-------------|------|
| `ast_generator` | AST-based code construction guaranteeing syntactic correctness | Library |
| `boilerplate_generator` | Design pattern injection (Singleton, Factory, Builder, Observer, etc.) | Library |
| `scaffold_generator` | Project structure for 7 project types (API, CLI, Library, Fullstack, etc.) | Utility |
| `template_generator` | Jinja2-compatible template engine with filters | Library |

### From `by category/agents/`

| Tool | Description | Type |
|------|-------------|------|
| `code_analyzer_agent` | AST-based codebase analysis, complexity, anti-pattern detection | Agent |
| `code_reviewer_agent` | Security vulns (CWE IDs), style violations, performance anti-patterns | Agent |
| `code_writer_agent` | NL to Python code generation | Agent |

### From `agents-misc/`

| Tool | Description | Type |
|------|-------------|------|
| `code_review_generator` | Static code review via AST (PEP8, security, complexity) | Utility |
| `refactoring_analyzer` | Code smell detection, refactoring plans, ROI estimation | Utility |
| `tdd_assistant` | TDD workflow, test generation, coverage targeting | Utility |

### From `docs-parsers/`

| Tool | Description | Type |
|------|-------------|------|
| `documentation_generator` | AST-based docstring + OpenAPI spec generation | Library |
| `parser_adapters` | 15+ format unified parser | Library |
| `universal_parser` | Schema-first parser with batch processing | Library |

## External Libraries (Phase 5 Catalog)

| Library | Install | Purpose |
|---------|---------|---------|
| SQLAlchemy 2.x | `pip install sqlalchemy[asyncio]` | Async ORM with type hints |
| Alembic | `pip install alembic` | Database migrations |
| Redis | `pip install redis` | Caching and message broker |
| Docker | -- | Containerization |
| GitHub Actions | -- | CI/CD pipeline |
| CodeMirror 6 | `npm install @codemirror/state` | Code editor component |
| AG Grid | `npm install ag-grid-react` | Data grid |

## Frameworks

| Framework | Install | Description | Stars |
|-----------|---------|-------------|-------|
| Astro | `npm install astro` | Zero-JS island architecture, multi-framework | 46K |
| Hono | `npm install hono` | Ultra-lightweight web framework, 12kB, Web Standards | 25K |
| TanStack Query | `npm install @tanstack/react-query` | Server state: fetching, caching, sync | 43K |
| SWR | `npm install swr` | Stale-while-revalidate data fetching, 4.2kB | 30K |
| Zustand | `npm install zustand` | Minimal flux client state, ~3.5kB | 49K |
| Jotai | `npm install jotai` | Atomic state management | 18K |
| React Hook Form | `npm install react-hook-form` | Form state via uncontrolled inputs, ~9KB | 41K |
| TanStack Form | `npm install @tanstack/react-form` | Type-safe form management | Fast-growing |
| Radix UI | `npm install @radix-ui/react-*` | Unstyled accessible component primitives (32+) | 15K |
| Ark UI | `npm install @ark-ui/react` | Headless components (45+), state-machine-backed | 3.3K |
| SST | `npm install sst` | Infrastructure-as-code for AWS/Cloudflare | 21K |

## Recommended Combinations

- **Full-stack React + FastAPI**: TanStack Query + Zustand + React Hook Form + Radix UI + `scaffold_generator`
- **Static site + islands**: Astro + Radix UI + `template_generator`
- **API-heavy app**: Hono (edge) + TanStack Query + SWR + `production_resilience`
- **Admin/internal tool**: AG Grid + React Hook Form + Radix UI + `code_analyzer_agent`
- **Code quality pipeline**: `code_reviewer_agent` + `tdd_assistant` + `refactoring_analyzer`
- **Project bootstrap**: `full_stack_scaffolding` + `scaffold_generator` + `boilerplate_generator` + Docker
