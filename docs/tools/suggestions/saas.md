# SaaS Applications — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building a SaaS application involving billing, auth, multi-tenancy, admin dashboards, background jobs, or email.

## Custom Tools (from docs/tools/)

These are custom-built Python tools from the project's tool collection that are relevant to SaaS applications.

| Tool | Source Folder | What It Does | Integration Role |
|------|--------------|--------------|-----------------|
| `agent_orchestrator` | agents-misc/ | Multi-agent orchestration with caching and retry | Backend service |
| `agent_composer` | agents-misc/ | Composes agent configs from use-case descriptions | Agent |
| `batch_optimizer` | agents-misc/ | Anthropic Batch API configuration optimizer | Utility |
| `cache_roi_calculator` | agents-misc/ | Prompt caching ROI calculator | Utility |
| `cost_analyzer` | agents-misc/ | Claude API cost optimization analysis | Utility |
| `code_review_generator` | agents-misc/ | AST-based static code review | Utility |
| `thinking_budget_optimizer` | agents-misc/ | Extended thinking token budget optimizer | Utility |
| `tool_registry_builder` | agents-misc/ | Builds Claude-compatible tool definitions | Utility |
| `full_stack_scaffolding` | by category/dev/ | Project structure from 9 app type templates | Utility |
| `production_resilience` | by category/dev/ | Circuit breaker, retry, multi-model fallback | Library |
| `enhanced_coding` | by category/dev/ | Automated code review with security checks | Utility |
| `tdd_assistant` | by category/dev/ | TDD workflow automation | Utility |
| `boilerplate_generator` | by category/generators/ | Design pattern injection (Singleton, Factory, etc.) | Library |
| `scaffold_generator` | by category/generators/ | Project structure for 7 project types | Utility |
| `code_analyzer_agent` | by category/agents/ | Codebase analysis via AST | Agent |
| `code_reviewer_agent` | by category/agents/ | Security/style/performance review | Agent |
| `code_writer_agent` | by category/agents/ | NL to Python code generation | Agent |
| `documentation_generator` | docs-parsers/ | AST-based docstring generation, OpenAPI output | Library |
| `parser_adapters` | docs-parsers/ | 15+ format parser for data ingestion | Library |

## External Libraries & Modules

From the Phase 5 research catalog (157 libs) and web research.

| Library/Module | Package | What It Does | Why For SaaS |
|----------------|---------|--------------|--------------|
| SQLAlchemy 2.x | pip: `sqlalchemy[asyncio]` | Async ORM | Production database layer |
| Alembic | pip: `alembic` | Database migrations | Schema evolution |
| Redis | pip: `redis` | Caching and message broker | Session/response caching |
| PyCasbin | pip: `casbin` | RBAC/ABAC authorization | Role-based access |
| AG Grid | npm: `ag-grid-react` | Enterprise data grid | Admin dashboards |
| Stripe | npm: `@stripe/react-stripe-js`, pip: `stripe` | Payment processing | Billing |
| Docker | -- | Containerization | Deployment |

## Frameworks

| Framework | Package | What It Does | Why It Boosts Productivity |
|-----------|---------|--------------|---------------------------|
| Better-Auth | npm: `better-auth` | Full auth: sessions, OAuth, 2FA, orgs, Stripe plugin | 12K stars, replaces NextAuth + Lucia |
| Clerk | npm: `@clerk/nextjs` | Hosted auth with React components | Zero backend auth code, 10K MAU free |
| Lago | pip: `lago-python-client` | Open-source usage-based billing | Self-hosted Stripe Billing alternative |
| Wasp / Open SaaS | npm: `wasp` | Full-stack framework with SaaS boilerplate | Deployable MVP in one command |
| SAQ | pip: `saq` | Async Python job queue on Redis/Postgres | Drop-in Celery replacement |
| Taskiq | pip: `taskiq` | Distributed async task queue for FastAPI | FastAPI-native, shares DI dependencies |
| Refine | npm: `@refinedev/core` | Headless admin panel framework | CRUD from data providers in minutes |
| react-admin | npm: `react-admin` | Data-agnostic admin framework | 150+ components, 50+ adapters |
| react-email | npm: `react-email` | HTML emails with React components | Type-safe, version-controlled email templates |
| BullMQ | npm: `bullmq` | Node.js job queue on Redis | Most feature-complete JS queue |

## Recommended Combinations

- **Auth + billing MVP**: Better-Auth + Stripe + PyCasbin + `code_writer_agent`
- **Admin dashboard**: Refine + AG Grid + SQLAlchemy 2.x + `full_stack_scaffolding`
- **Background jobs**: SAQ (Python) or BullMQ (Node) + Redis + `production_resilience`
- **Full SaaS scaffold**: Wasp + `scaffold_generator` + `boilerplate_generator` + Alembic
- **Email + notifications**: react-email + `documentation_generator` (for API docs)
