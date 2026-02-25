# SaaS Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: SaaS Applications (Billing, Auth, Multi-Tenancy, Admin, Jobs, Email)
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/saas.md`

---

## Goal

Add 20 domain-specific tools (16 external libraries/frameworks + 1 custom library + 3 agents) to the Expert drawer for SaaS applications, organized by 6 capability groups with the same accordion UI, domain selector, and "Already Added" tracking established in the site-dev design.

## Architecture Decisions

All site-dev architectural decisions carry forward. SaaS-specific decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | SaaS-specific versions of overlapping tools | SQLAlchemy, Alembic, Redis, AG Grid get `saas-` prefixed IDs with multi-tenant/SaaS-specific integrationPrompts |
| 2 | 6 capability groups | Authentication, Billing & Payments, Admin Panels, Background Jobs, Email & Notifications, SaaS Infrastructure |
| 3 | Docker excluded | Already in site-dev, adds no SaaS-specific value — users get it from site-dev domain |
| 4 | Custom tools curated to SaaS-relevant | Only production_resilience (lib), scaffold_generator (agent), boilerplate_generator (agent), code_reviewer_agent (agent). Skip AI-cost-optimization tools. |
| 5 | Stripe has dual packages | Both npm (`@stripe/react-stripe-js`) and pip (`stripe`), covers full-stack billing |
| 6 | Email group has 1 tool | react-email is the clear best option; focused group is better than forced merging |
| 7 | Wasp in Billing group | Wasp/Open SaaS is primarily a SaaS scaffold with built-in Stripe billing integration |

## File Structure

```
frontend/src/tools/domains/
├── site-dev.ts       # (already designed)
├── rag.ts            # (already designed)
├── music.ts          # (already designed)
├── games.ts          # (already designed)
└── saas.ts           # 20 tools (17 in groups + 3 agents)
```

Registry imports `SAAS_TOOLS` from `domains/saas.ts` alongside other domain exports.

## Tool Inventory — 17 Tools in 6 Capability Groups

### Authentication (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Better-Auth** | `saas-better-auth` | external | `npm: better-auth` | 1st (recommended) | Sets up full auth: sessions, OAuth providers, 2FA, organization/team support, Stripe plugin |
| **Clerk** | `saas-clerk` | external | `npm: @clerk/nextjs` | 2nd | Adds hosted auth with React components, zero backend auth code, 10K MAU free tier |

### Billing & Payments (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Stripe** | `saas-stripe` | external | `npm: @stripe/react-stripe-js`, `pip: stripe` | 1st (recommended) | Full-stack billing: React checkout components, backend webhook handling, subscription management |
| **Lago** | `saas-lago` | external | `pip: lago-python-client` | 2nd | Open-source usage-based billing with metering, invoicing, self-hosted alternative to Stripe Billing |
| **Wasp / Open SaaS** | `saas-wasp` | external | `npm: wasp` | 3rd | Full-stack SaaS framework with built-in auth, Stripe billing, admin dashboard, email |

### Admin Panels (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Refine** | `saas-refine` | external | `npm: @refinedev/core` | 1st (recommended) | Headless admin framework: CRUD from data providers, inference engine, access control |
| **react-admin** | `saas-react-admin` | external | `npm: react-admin` | 2nd | Data-agnostic admin with 150+ components, 50+ data provider adapters |
| **AG Grid** | `saas-ag-grid` | external | `npm: ag-grid-react` | 3rd | Enterprise data grid with server-side row model, pivot, aggregation for admin dashboards |

### Background Jobs (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **BullMQ** | `saas-bullmq` | external | `npm: bullmq` | 1st (recommended) | Node.js job queue on Redis: delayed jobs, rate limiting, priorities, job flows, dashboard |
| **SAQ** | `saas-saq` | external | `pip: saq` | 2nd | Async Python job queue on Redis/Postgres, drop-in Celery replacement |
| **Taskiq** | `saas-taskiq` | external | `pip: taskiq` | 3rd | FastAPI-native distributed task queue, shares DI dependencies with FastAPI |

### Email & Notifications (1)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **react-email** | `saas-react-email` | external | `npm: react-email` | 1st (recommended) | HTML email templates as React components: type-safe, version-controlled, preview server |

### SaaS Infrastructure (5)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **SQLAlchemy 2.x** | `saas-sqlalchemy` | external | `pip: sqlalchemy[asyncio]` | 1st (recommended) | Multi-tenant async ORM: schema-per-tenant, row-level security, tenant context middleware |
| **Alembic** | `saas-alembic` | external | `pip: alembic` | 2nd | Tenant-aware migrations: per-schema migration, multi-database support |
| **Redis** | `saas-redis` | external | `pip: redis` | 3rd | Session caching, rate limiting, job broker, pub/sub for real-time features |
| **PyCasbin** | `saas-casbin` | external | `pip: casbin` | 4th | RBAC/ABAC authorization: role hierarchy, multi-tenant policies, API middleware |
| **Production Resilience** | `saas-resilience` | custom | — | 5th | Circuit breaker for external APIs (Stripe, email), retry with backoff, multi-model fallback |

## Tool Inventory — 3 Agents (Agents Tab)

| Agent | ID | What It Does |
|-------|----|--------------|
| **Scaffold Generator** | `saas-agent-scaffold` | Generates SaaS project structure with auth/, billing/, admin/, jobs/ modules |
| **Boilerplate Generator** | `saas-agent-boilerplate` | Injects SaaS patterns: Repository for data access, Singleton for services, Factory for tenants |
| **Code Reviewer Agent** | `saas-agent-reviewer` | Security/compliance review: auth bypass, payment handling, data isolation, OWASP SaaS checks |

## Integration Prompt Structure

External tools follow the same pattern with SaaS-specific concerns:
```
Integrate [Tool] for [purpose].
- Install `[package]`.
- Create `[exact/file/path]` with [specific setup].
- Ensure multi-tenant isolation where applicable.
- Add webhook handling for async events (billing, auth).
- Add [ENV_VAR] to `.env.example`.
```

SaaS infrastructure tools emphasize multi-tenancy:
```
Integrate [Tool] for [SaaS purpose].
- Install `[package]`.
- Configure for multi-tenant operation:
  - [Tenant isolation strategy]
  - [Per-tenant configuration]
- Wire into existing middleware chain.
```

## Gap Analysis (SaaS-Specific)

| Gap | Resolution |
|-----|-----------|
| Domain detection | Handled by shared domain selector |
| Already Added | All external tools have packages — standard check. Custom tool never marked "Added" |
| Dedup with site-dev | 4 overlaps (SQLAlchemy, Alembic, Redis, AG Grid) — SaaS versions use `saas-` prefix with tenant-aware prompts |
| Docker overlap | Excluded from SaaS — users get it from site-dev domain |
| Multi-tenancy | All infrastructure integrationPrompts include tenant isolation patterns |
| Stripe dual-package | Uses `packages: { npm: '@stripe/react-stripe-js', pip: 'stripe' }` — checks both |
| Theme assignment | `themes: ['expert']` |
| Ordering | Recommended-first per group |

## Success Criteria

1. Selecting 'SaaS' domain shows 6 collapsible capability groups
2. Authentication group shows Better-Auth and Clerk
3. Billing group shows Stripe, Lago, and Wasp
4. Background Jobs group shows BullMQ (JS), SAQ (Python), Taskiq (FastAPI)
5. SaaS infrastructure tools have multi-tenant-specific integrationPrompts
6. Agents tab shows 3 SaaS-focused utilities
7. All 20 tools have detailed two-level prompts
8. Overlapping tools (SQLAlchemy, Alembic, Redis, AG Grid) use `saas-` prefix IDs
9. Accordion, search, and "Already Added" work identically to site-dev
