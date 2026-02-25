# SaaS Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 20 SaaS domain tools to the Expert drawer organized by 6 capability groups.

**Architecture:** Single domain file (`saas.ts`) exports `SAAS_TOOLS` array with 20 `ToolEntry` objects. Registry imports and dedup merges them. No type or component changes needed — infrastructure from site-dev plan Tasks 1-5 is prerequisite.

**Tech Stack:** TypeScript, existing ToolEntry type system, registry helpers

**Prerequisite:** site-dev plan Tasks 1-5 must be implemented first.

---

### Task 1: Create `frontend/src/tools/domains/saas.ts`

**Files:**
- Create: `frontend/src/tools/domains/saas.ts`

**Step 1: Create the domain file with all 20 tool entries**

```typescript
// frontend/src/tools/domains/saas.ts
import type { ToolEntry } from '../types'

export const SAAS_TOOLS: ToolEntry[] = [
  // ── Authentication (2) ────────────────────────────────────────
  {
    id: 'saas-better-auth',
    name: 'Better-Auth',
    description: 'Full authentication: sessions, OAuth, 2FA, organization/team support, Stripe plugin. 12K stars.',
    category: 'framework',
    level: 'expert',
    side: 'both',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: 'better-auth' },
    group: 'Authentication',
    integrationPrompt: `Integrate Better-Auth for full-stack authentication.
- Install \`npm install better-auth\`.
- Create \`frontend/src/lib/auth.ts\` with:
  - Auth client initialization: createAuthClient() with API base URL
  - Session management: useSession() hook for React
  - OAuth providers: Google, GitHub, Discord (configure in server)
  - Organization/team support: createOrganization(), inviteMember()
- Create \`backend/app/auth/config.py\` with:
  - BetterAuth server configuration with database adapter (SQLAlchemy)
  - Session strategy: JWT or database sessions
  - OAuth provider credentials from environment variables
  - 2FA setup: TOTP with QR code generation
  - Email verification and password reset flows
- Create \`backend/app/auth/middleware.py\` with:
  - FastAPI dependency: get_current_user() that validates session
  - Role-based route protection: require_role("admin")
  - Organization context: get_current_org() for multi-tenant routes
- Create \`backend/app/auth/routes.py\` with:
  - Auth endpoints: /auth/signup, /auth/signin, /auth/signout
  - OAuth callback endpoints for each provider
  - 2FA verification endpoint
- Add to \`.env.example\`: BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET.
- Wire Stripe plugin for billing-gated features if Stripe is also integrated.
- Use CSS variables from the active theme for auth UI components.`,
  },
  {
    id: 'saas-clerk',
    name: 'Clerk',
    description: 'Hosted auth with React components — zero backend auth code, 10K MAU free tier.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: '@clerk/nextjs' },
    group: 'Authentication',
    integrationPrompt: `Integrate Clerk for hosted authentication.
- Install \`npm install @clerk/clerk-react\` (or @clerk/nextjs for Next.js).
- Create \`frontend/src/lib/clerk.ts\` with:
  - ClerkProvider configuration with publishable key
  - SignIn, SignUp, UserButton, OrganizationSwitcher component imports
- Create \`frontend/src/components/AuthGuard.tsx\` with:
  - Protected route wrapper using useAuth() hook
  - Redirect to sign-in for unauthenticated users
  - Organization membership check for multi-tenant routes
- Create \`backend/app/auth/clerk_middleware.py\` with:
  - JWT verification using Clerk's JWKS endpoint
  - FastAPI dependency: verify_clerk_session()
  - User metadata extraction from Clerk JWT claims
  - Organization/role extraction for authorization
- Clerk handles: OAuth, 2FA, email verification, password reset, user management UI.
- Add to \`.env.example\`: CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY.
- Use CSS variables from the active theme for Clerk component customization.`,
  },

  // ── Billing & Payments (3) ────────────────────────────────────
  {
    id: 'saas-stripe',
    name: 'Stripe',
    description: 'Full-stack payment processing — React checkout components, webhook handling, subscription management.',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: '@stripe/react-stripe-js', pip: 'stripe' },
    group: 'Billing & Payments',
    integrationPrompt: `Integrate Stripe for billing and payments.
- Install frontend: \`npm install @stripe/react-stripe-js @stripe/stripe-js\`.
- Install backend: \`pip install stripe\`.
- Create \`frontend/src/components/billing/CheckoutForm.tsx\` with:
  - Elements provider with Stripe publishable key
  - PaymentElement for card/bank/wallet input
  - Subscription plan selector with price comparison
  - Billing portal redirect button for self-service management
- Create \`backend/app/billing/stripe_service.py\` with:
  - Stripe client initialization with secret key
  - Customer creation: create_customer(user_id, email)
  - Subscription management: create_subscription(), cancel_subscription(), update_subscription()
  - Usage-based billing: report_usage() for metered pricing
  - Invoice management: list_invoices(), upcoming_invoice()
- Create \`backend/app/billing/webhooks.py\` with:
  - Webhook endpoint: POST /api/billing/webhook
  - Signature verification: stripe.Webhook.construct_event()
  - Event handlers: checkout.session.completed, invoice.paid, invoice.payment_failed
  - Subscription lifecycle: customer.subscription.created/updated/deleted
  - Idempotency: track processed event IDs to prevent double-processing
- Create \`backend/app/billing/plans.py\` with:
  - Plan definitions: Free, Pro, Enterprise with feature flags
  - Feature gating: has_feature(user, "advanced_export") checks plan
  - Usage limits: check_limit(user, "api_calls") enforces plan quotas
- Add to \`.env.example\`: STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
- CRITICAL: Always verify webhook signatures. Never trust unverified events.
- Use CSS variables from the active theme for checkout UI.`,
  },
  {
    id: 'saas-lago',
    name: 'Lago',
    description: 'Open-source usage-based billing — metering, invoicing, self-hosted Stripe Billing alternative.',
    category: 'framework',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { pip: 'lago-python-client' },
    group: 'Billing & Payments',
    integrationPrompt: `Integrate Lago for usage-based billing.
- Install \`pip install lago-python-client\`.
- Create \`backend/app/billing/lago_service.py\` with:
  - Lago client initialization with API key and base URL
  - Customer creation/management synced with your user model
  - Subscription assignment: attach plans to customers
  - Usage event ingestion: report billable events (API calls, storage, compute)
  - Invoice retrieval and PDF generation
- Create \`backend/app/billing/metering.py\` with:
  - Event tracking middleware: count API calls per customer
  - Storage metering: track file storage per tenant
  - Compute metering: track processing time for billable operations
  - Batch event submission for performance (buffer events, flush periodically)
- Create \`backend/app/billing/plans.py\` with:
  - Plan definitions in Lago format: base price, per-unit charges, graduated tiers
  - Usage thresholds and alerts
  - Plan migration logic (upgrade/downgrade)
- Lago is self-hosted — deploy alongside your app or use Lago Cloud.
- Add to \`.env.example\`: LAGO_API_KEY, LAGO_API_URL.
- Use for complex usage-based pricing that Stripe Billing can't handle easily.`,
  },
  {
    id: 'saas-wasp',
    name: 'Wasp / Open SaaS',
    description: 'Full-stack SaaS framework — auth, Stripe billing, admin dashboard, email in one deployable package.',
    category: 'framework',
    level: 'expert',
    side: 'both',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: 'wasp' },
    group: 'Billing & Payments',
    integrationPrompt: `Integrate Wasp with the Open SaaS template.
- Install Wasp CLI: \`curl -sSL https://get.wasp-lang.dev/installer.sh | sh\`.
- Initialize project: \`wasp new my-saas -t saas\`.
- The Open SaaS template includes out of the box:
  - Authentication: email/password, Google, GitHub OAuth
  - Stripe integration: subscriptions, checkout, customer portal
  - Admin dashboard: user management, analytics, revenue metrics
  - Email: transactional emails via SendGrid/Mailgun
  - Landing page: marketing page with pricing table
  - Blog: MDX-based blog with SEO
- Customize in \`main.wasp\` DSL:
  - Define routes, pages, queries, actions in declarative syntax
  - Wasp compiles to React (frontend) + Express/Prisma (backend)
- Override generated components in \`src/\` for custom UI.
- Deploy: \`wasp deploy fly\` for one-command deployment to Fly.io.
- Wasp is a full framework — best for starting a new SaaS from scratch rather than adding to existing project.
- Add to \`.env.example\`: STRIPE_KEY, SENDGRID_API_KEY, DATABASE_URL.`,
  },

  // ── Admin Panels (3) ──────────────────────────────────────────
  {
    id: 'saas-refine',
    name: 'Refine',
    description: 'Headless admin panel framework — CRUD from data providers, inference engine, access control.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: '@refinedev/core' },
    group: 'Admin Panels',
    integrationPrompt: `Integrate Refine for the admin panel.
- Install \`npm install @refinedev/core @refinedev/react-router @refinedev/antd\` (or @refinedev/mui, @refinedev/chakra-ui).
- Create \`frontend/src/admin/App.tsx\` with:
  - Refine provider with data provider pointing to your API
  - Resource definitions: users, subscriptions, invoices, organizations
  - Access control provider wired to PyCasbin roles
  - Auth provider connected to Better-Auth/Clerk session
- Create \`frontend/src/admin/resources/users/\` with:
  - UserList.tsx: table with search, filter, sort, pagination
  - UserShow.tsx: detail view with subscription status, activity log
  - UserEdit.tsx: form for admin-level user management (role, plan, status)
- Create \`frontend/src/admin/data-provider.ts\` with:
  - Custom data provider adapter for your FastAPI endpoints
  - CRUD mapping: getList -> GET /api/admin/users, create -> POST, etc.
  - Filter/sort/pagination parameter serialization
- Refine is headless — UI components come from the chosen UI library (Ant Design, MUI, etc.).
- Use CSS variables from the active theme for admin panel styling.`,
  },
  {
    id: 'saas-react-admin',
    name: 'react-admin',
    description: 'Data-agnostic admin framework — 150+ components, 50+ data provider adapters.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: 'react-admin' },
    group: 'Admin Panels',
    integrationPrompt: `Integrate react-admin for the admin panel.
- Install \`npm install react-admin ra-data-simple-rest\` (or appropriate data provider).
- Create \`frontend/src/admin/App.tsx\` with:
  - Admin component with dataProvider pointing to your API
  - authProvider connected to your auth system
  - Resource declarations: <Resource name="users" list={UserList} edit={UserEdit} />
- Create \`frontend/src/admin/resources/\` with:
  - users.tsx: <List>, <Datagrid>, <TextField>, <EditButton> components
  - subscriptions.tsx: subscription management with status badges
  - invoices.tsx: invoice list with PDF download, payment status
- Create \`frontend/src/admin/data-provider.ts\` with:
  - Custom data provider for your FastAPI API format
  - Or use ra-data-simple-rest if API follows REST conventions
  - Pagination: Range header or query parameter based
- react-admin includes: data fetching, caching, optimistic updates, undo, notifications.
- Use CSS variables from the active theme where possible (react-admin uses MUI internally).`,
  },
  {
    id: 'saas-ag-grid',
    name: 'AG Grid',
    description: 'Enterprise data grid — server-side row model, pivot, aggregation for admin dashboards.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: 'ag-grid-react' },
    group: 'Admin Panels',
    integrationPrompt: `Integrate AG Grid for admin data tables.
- Install \`npm install ag-grid-react ag-grid-community\`.
- Create \`frontend/src/admin/components/DataGrid.tsx\` with:
  - AgGridReact wrapper with theme-aware styling
  - Column definitions with type-appropriate renderers (currency, date, status badge)
  - Server-side row model for large datasets (100K+ rows)
  - Row selection with bulk actions (delete, export, change status)
  - Column filtering: text, number, date, set filter types
  - Sort: multi-column sort with server-side support
- Create \`frontend/src/admin/components/grids/\` with:
  - UsersGrid.tsx: user management with role badges, plan indicators
  - SubscriptionsGrid.tsx: subscription table with MRR column, churn indicators
  - InvoicesGrid.tsx: invoice table with payment status, PDF download
  - AuditLogGrid.tsx: activity log with user, action, timestamp, IP
- AG Grid Community is free. Enterprise features (pivoting, aggregation, Excel export) require license.
- Use CSS variables from the active theme for grid styling: --ag-header-background-color, --ag-row-hover-color, etc.`,
  },

  // ── Background Jobs (3) ───────────────────────────────────────
  {
    id: 'saas-bullmq',
    name: 'BullMQ',
    description: 'Node.js job queue on Redis — delayed jobs, rate limiting, priorities, job flows, dashboard.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: 'bullmq' },
    group: 'Background Jobs',
    integrationPrompt: `Integrate BullMQ for background job processing.
- Install \`npm install bullmq\`.
- Create \`backend/src/jobs/queue.ts\` with:
  - Queue creation with Redis connection: new Queue('emails', { connection })
  - Job types: email, invoice-generation, report-export, subscription-renewal
  - Job options: delay, priority, attempts, backoff strategy
  - Flow producer for multi-step job chains (generate invoice -> send email -> update records)
- Create \`backend/src/jobs/workers/\` with:
  - email.worker.ts: send transactional emails with retry on failure
  - invoice.worker.ts: generate PDF invoices, upload to storage
  - report.worker.ts: generate CSV/PDF reports for admin export
  - Each worker: new Worker('queue-name', processor, { connection, concurrency })
- Create \`backend/src/jobs/scheduler.ts\` with:
  - Recurring jobs: daily usage aggregation, weekly reports, subscription checks
  - QueueScheduler for delayed job processing
  - Cron-like scheduling for periodic tasks
- Create \`backend/src/admin/bull-board.ts\` with:
  - Bull Board dashboard for monitoring queues (job counts, failures, throughput)
  - Protected route: admin-only access
- Add to \`.env.example\`: REDIS_URL for job queue connection.
- BullMQ requires Redis 5.0+.`,
  },
  {
    id: 'saas-saq',
    name: 'SAQ',
    description: 'Async Python job queue on Redis/Postgres — drop-in Celery replacement for FastAPI.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { pip: 'saq' },
    group: 'Background Jobs',
    integrationPrompt: `Integrate SAQ for Python background jobs.
- Install \`pip install saq[web]\`.
- Create \`backend/app/jobs/queue.py\` with:
  - Queue initialization with Redis or Postgres broker
  - Job definitions as async functions: async def send_email(ctx, *, to, subject, body)
  - Job scheduling: queue.enqueue("send_email", to="user@example.com", ...)
  - Cron jobs: queue.schedule(cron="0 0 * * *", function=daily_report)
- Create \`backend/app/jobs/workers/\` with:
  - email_jobs.py: transactional email sending with retry
  - billing_jobs.py: invoice generation, usage aggregation, subscription checks
  - report_jobs.py: CSV/PDF report generation
  - Each job: async function with ctx (context) and keyword arguments
- Create \`backend/app/jobs/startup.py\` with:
  - SAQ worker startup integrated with FastAPI lifespan
  - Queue health check endpoint: GET /api/jobs/health
  - Job status endpoint: GET /api/jobs/{job_id}/status
- SAQ is async-native — runs in the same event loop as FastAPI.
- Add to \`.env.example\`: REDIS_URL or DATABASE_URL for broker.`,
  },
  {
    id: 'saas-taskiq',
    name: 'Taskiq',
    description: 'FastAPI-native distributed task queue — shares DI dependencies with your FastAPI app.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { pip: 'taskiq' },
    group: 'Background Jobs',
    integrationPrompt: `Integrate Taskiq for FastAPI-native background jobs.
- Install \`pip install taskiq taskiq-redis taskiq-fastapi\`.
- Create \`backend/app/jobs/broker.py\` with:
  - Redis broker: RedisBroker("redis://localhost:6379")
  - Result backend: RedisAsyncResultBackend("redis://localhost:6379")
  - FastAPI integration: TaskiqApp(broker, app) to share DI dependencies
- Create \`backend/app/jobs/tasks.py\` with:
  - Task definitions: @broker.task() decorated async functions
  - Dependency injection: tasks receive same dependencies as FastAPI routes (db session, config)
  - Task types: email, billing, report, cleanup
  - Retry configuration: @broker.task(retry_on_error=True, max_retries=3)
- Create \`backend/app/jobs/scheduler.py\` with:
  - Scheduled tasks using TaskiqScheduler
  - Cron expressions for recurring jobs
  - Dynamic scheduling from admin panel
- Taskiq's key advantage: shared DI with FastAPI — tasks use the same db sessions, configs, services.
- Run worker: \`taskiq worker backend.app.jobs.broker:broker\`.
- Add to \`.env.example\`: REDIS_URL for broker.`,
  },

  // ── Email & Notifications (1) ─────────────────────────────────
  {
    id: 'saas-react-email',
    name: 'react-email',
    description: 'HTML email templates as React components — type-safe, version-controlled, preview server.',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['saas'],
    themes: ['expert'],
    packages: { npm: 'react-email' },
    group: 'Email & Notifications',
    integrationPrompt: `Integrate react-email for transactional email templates.
- Install \`npm install react-email @react-email/components\`.
- Create \`frontend/src/emails/\` with:
  - WelcomeEmail.tsx: onboarding email with getting-started steps
  - InvoiceEmail.tsx: invoice notification with amount, due date, payment link
  - PasswordResetEmail.tsx: reset link with expiry notice
  - TeamInviteEmail.tsx: organization invitation with accept button
  - SubscriptionEmail.tsx: plan change confirmation with new features list
- Each email template uses @react-email/components:
  - Html, Head, Body, Container, Section, Row, Column, Text, Link, Button, Img, Hr
  - Tailwind component for utility-class styling
  - Preview text for email client preview
- Create \`backend/app/email/renderer.py\` with:
  - Email rendering: compile React email to HTML string
  - Template data injection: pass dynamic data (user name, invoice amount)
  - Provider integration: send via SendGrid, Resend, or AWS SES
- Create \`backend/app/email/service.py\` with:
  - Email service: send_welcome(user), send_invoice(user, invoice), etc.
  - Queue integration: emails sent via background job (SAQ/BullMQ/Taskiq)
  - Logging: track sent emails, delivery status
- Run preview server: \`npx react-email dev\` for visual template development.
- Add to \`.env.example\`: EMAIL_PROVIDER, SENDGRID_API_KEY (or equivalent).
- Use CSS variables from the active theme for email brand colors.`,
  },

  // ── SaaS Infrastructure (5) ───────────────────────────────────
  {
    id: 'saas-sqlalchemy',
    name: 'SQLAlchemy 2.x',
    description: 'Multi-tenant async ORM — schema-per-tenant isolation, row-level security, tenant context middleware.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { pip: 'sqlalchemy[asyncio]' },
    group: 'SaaS Infrastructure',
    integrationPrompt: `Integrate SQLAlchemy 2.x with multi-tenant patterns.
- Install \`pip install sqlalchemy[asyncio] asyncpg\` (or aiosqlite for dev).
- Create \`backend/app/db/engine.py\` with:
  - Async engine: create_async_engine(DATABASE_URL)
  - Session factory: async_sessionmaker(engine, expire_on_commit=False)
  - Lifespan handler: create tables on startup, dispose engine on shutdown
- Create \`backend/app/db/models.py\` with:
  - DeclarativeBase with common columns: id (UUID), created_at, updated_at, tenant_id
  - TenantMixin: adds tenant_id FK and tenant relationship to any model
  - User, Organization, Subscription, Invoice models with tenant isolation
- Create \`backend/app/db/tenant.py\` with:
  - Multi-tenancy strategy (choose one):
    - Row-level: tenant_id column on all tables, filtered in every query
    - Schema-per-tenant: separate PostgreSQL schema per organization
  - Tenant context middleware: extract tenant from JWT/session, set in async context
  - Scoped queries: all_for_tenant(Model, session) auto-filters by tenant
- Create \`backend/app/db/dependencies.py\` with:
  - FastAPI dependency: get_db() yields async session
  - Tenant-scoped dependency: get_tenant_db() yields session pre-filtered to current tenant
- Add to \`.env.example\`: DATABASE_URL, DATABASE_ECHO (for SQL logging in dev).
- CRITICAL: Never allow cross-tenant data access. Every query must filter by tenant_id.`,
  },
  {
    id: 'saas-alembic',
    name: 'Alembic',
    description: 'Tenant-aware database migrations — per-schema migration, multi-database support.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { pip: 'alembic' },
    group: 'SaaS Infrastructure',
    integrationPrompt: `Integrate Alembic for tenant-aware migrations.
- Install \`pip install alembic\`.
- Run \`alembic init backend/alembic\`.
- Configure \`backend/alembic/env.py\` with:
  - Async migration support using run_async()
  - Target metadata from SQLAlchemy models
  - Multi-tenant migration strategy:
    - Row-level: standard migrations, add tenant_id to new tables
    - Schema-per-tenant: iterate schemas, apply migration to each
- Create initial migration:
  - \`alembic revision --autogenerate -m "initial schema"\`
  - Review: ensure tenant_id columns, indexes on tenant_id + frequently-queried columns
- Create \`backend/app/db/migrate.py\` with:
  - Programmatic migration runner for tenant onboarding
  - New tenant: create schema + run all migrations (schema-per-tenant)
  - Or: just create org record + seed data (row-level)
- Add to \`pyproject.toml\` scripts: \`migrate = "alembic upgrade head"\`.
- IMPORTANT: Always review auto-generated migrations before applying.`,
  },
  {
    id: 'saas-redis',
    name: 'Redis',
    description: 'Session caching, rate limiting, job broker, pub/sub for real-time features.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { pip: 'redis' },
    group: 'SaaS Infrastructure',
    integrationPrompt: `Integrate Redis for SaaS infrastructure.
- Install \`pip install redis[hiredis]\`.
- Create \`backend/app/cache/redis_client.py\` with:
  - Async Redis client: redis.asyncio.from_url(REDIS_URL)
  - Health check: ping on startup
  - Connection pool configuration for production
- Create \`backend/app/cache/session_cache.py\` with:
  - Session storage: store user sessions in Redis with TTL
  - Session invalidation: delete on logout, revoke all on password change
  - Per-tenant session limits: max concurrent sessions per plan
- Create \`backend/app/cache/rate_limiter.py\` with:
  - API rate limiting per tenant: sliding window counter
  - Plan-based limits: Free (100/hr), Pro (1000/hr), Enterprise (unlimited)
  - Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - FastAPI middleware integration
- Create \`backend/app/cache/feature_flags.py\` with:
  - Feature flag storage in Redis hashes
  - Per-tenant overrides: enable beta features for specific organizations
  - Real-time flag updates via pub/sub
- Redis also serves as broker for SAQ/BullMQ/Taskiq background jobs.
- Add to \`.env.example\`: REDIS_URL.`,
  },
  {
    id: 'saas-casbin',
    name: 'PyCasbin',
    description: 'RBAC/ABAC authorization — role hierarchy, multi-tenant policies, API middleware.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    packages: { pip: 'casbin' },
    group: 'SaaS Infrastructure',
    integrationPrompt: `Integrate PyCasbin for authorization.
- Install \`pip install casbin casbin-sqlalchemy-adapter\`.
- Create \`backend/app/auth/casbin_model.conf\` with:
  - RBAC model with multi-tenant support:
    [request_definition] r = sub, dom, obj, act
    [policy_definition] p = sub, dom, obj, act
    [role_definition] g = _, _, _
    [matchers] m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act
- Create \`backend/app/auth/casbin_policy.py\` with:
  - SQLAlchemy adapter for persistent policy storage
  - Default roles: owner, admin, member, viewer
  - Default policies: owner can *, admin can manage users, member can read/write, viewer can read
  - Role hierarchy: owner > admin > member > viewer
- Create \`backend/app/auth/authorization.py\` with:
  - FastAPI dependency: require_permission(obj, act) checks Casbin
  - Organization-scoped: permissions are per-org, not global
  - Helper: assign_role(user_id, org_id, role), remove_role()
- Create \`backend/app/auth/rbac_routes.py\` with:
  - Admin endpoints: list roles, assign role, list permissions
  - Organization invite: create invite + assign role on acceptance
- CRITICAL: Always check authorization at the API layer, not just the UI.`,
  },
  {
    id: 'saas-resilience',
    name: 'Production Resilience',
    description: 'Circuit breaker for external APIs (Stripe, email), retry with backoff, multi-model fallback.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas'],
    themes: ['expert'],
    group: 'SaaS Infrastructure',
    integrationPrompt: `Integrate Production Resilience for SaaS external service calls.
- Create \`backend/app/resilience/circuit_breaker.py\` adapting the production_resilience pattern:
  - Circuit breaker per external service: Stripe, email provider, auth provider
  - States: closed (normal), open (failing, reject calls), half-open (testing recovery)
  - Thresholds: open after 5 consecutive failures, half-open after 30s cooldown
  - Fallback behavior: queue for retry (billing), use cached data (auth), skip (analytics)
- Create \`backend/app/resilience/retry.py\` with:
  - Exponential backoff with jitter: 1s, 2s, 4s + random(0, 1s)
  - Max retries per service type: billing (5), email (3), analytics (1)
  - Idempotency keys for safe retries (Stripe API supports this natively)
- Create \`backend/app/resilience/health.py\` with:
  - Health check endpoint: GET /api/health
  - Per-service status: database, Redis, Stripe, email provider
  - Circuit breaker status in health response
  - Degraded mode indicator: which features are unavailable
- Wire into all external service calls via decorator: @with_circuit_breaker("stripe").`,
  },

  // ── Agents (3) ────────────────────────────────────────────────
  {
    id: 'saas-agent-scaffold',
    name: 'Scaffold Generator',
    description: 'Generates SaaS project structure with auth/, billing/, admin/, jobs/ modules.',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['saas'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Scaffold Generator for a SaaS application.
- Analyze project for SaaS requirements (auth, billing, admin, jobs, email).
- Generate SaaS-aware directory structure:
  - backend/app/auth/ — authentication, authorization, sessions
  - backend/app/billing/ — Stripe/Lago integration, plans, invoicing
  - backend/app/admin/ — admin endpoints, user management, analytics
  - backend/app/jobs/ — background job definitions, workers, scheduler
  - backend/app/email/ — email templates, rendering, delivery
  - backend/app/db/ — models, migrations, tenant isolation
  - backend/app/cache/ — Redis client, rate limiting, session cache
  - backend/app/resilience/ — circuit breaker, retry, health checks
  - frontend/src/admin/ — admin panel components
  - frontend/src/components/billing/ — checkout, subscription management
  - frontend/src/emails/ — react-email templates
- Include starter files with multi-tenant patterns.
- Return directory tree with file descriptions.`,
  },
  {
    id: 'saas-agent-boilerplate',
    name: 'Boilerplate Generator',
    description: 'Injects SaaS patterns — Repository for data access, Singleton for services, Factory for tenants.',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['saas'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Boilerplate Generator for SaaS patterns.
- Analyze existing code for SaaS architecture needs.
- Generate appropriate patterns:
  - Repository pattern: data access layer with tenant filtering built in
  - Singleton pattern: service instances (Stripe client, Redis client, email sender)
  - Factory pattern: tenant-specific configuration creation
  - Strategy pattern: billing provider abstraction (Stripe vs Lago)
  - Observer pattern: webhook event handling (billing events, auth events)
- Insert patterns into existing code structure.
- Return summary of injected patterns with usage examples.`,
  },
  {
    id: 'saas-agent-reviewer',
    name: 'Code Reviewer Agent',
    description: 'Security/compliance review — auth bypass, payment handling, data isolation, OWASP SaaS checks.',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['saas'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Code Reviewer Agent for SaaS security review.
- Analyze all source files for SaaS-specific security issues:
  - Auth bypass: routes missing authentication middleware
  - Authorization gaps: endpoints without role/permission checks
  - Tenant isolation: queries without tenant_id filtering (data leakage)
  - Payment security: unverified webhook signatures, missing idempotency
  - Session management: missing expiry, no revocation on password change
  - Rate limiting: unprotected endpoints vulnerable to abuse
  - Input validation: missing validation on billing/admin endpoints
  - Secrets: hardcoded API keys, Stripe keys in client code
- Severity levels: Critical (data leak/auth bypass), Warning (missing check), Info (best practice)
- Return structured report: { severity, file, line, description, fix, owaspRef }.
- Focus on OWASP Top 10 for SaaS applications.`,
  },
]
```

**Step 2: Verify the file has no TypeScript errors**

Run: `cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to saas.ts

**Step 3: Commit**

```bash
git add frontend/src/tools/domains/saas.ts
git commit -m "feat(tools): add SaaS domain with 20 expert tools in 6 capability groups"
```

---

### Task 2: Register SaaS Tools in Registry

**Files:**
- Modify: `frontend/src/tools/registry.ts`

**Step 1: Add import and spread**

Add to the imports section of `registry.ts`:
```typescript
import { SAAS_TOOLS } from './domains/saas'
```

Add to the `TOOL_CATALOG` array:
```typescript
export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,
  ...RAG_TOOLS,
  ...MUSIC_TOOLS,
  ...GAMES_TOOLS,
  ...SAAS_TOOLS,
])
```

**Step 2: Verify no duplicate IDs**

All SaaS tool IDs use `saas-` prefix. Verify:
```bash
cd /storage/self/primary/Download/aus-studio/frontend && grep -c "saas-" src/tools/domains/saas.ts
```
Expected: 20

**Step 3: Commit**

```bash
git add frontend/src/tools/registry.ts
git commit -m "feat(tools): register SaaS domain tools in registry"
```

---

### Task 3: Integration Verification

**Step 1: Verify domain selector includes SaaS**

Check that `ToolDomain` type in `types.ts` includes a saas-related value. If not, add `'saas'` to the `ToolDomain` union.

**Step 2: Verify tool counts**

```bash
cd /storage/self/primary/Download/aus-studio/frontend && node -e "
  const fs = require('fs');
  const content = fs.readFileSync('src/tools/domains/saas.ts', 'utf8');
  const groups = content.match(/group: '[^']+'/g);
  const counts = {};
  groups.forEach(g => { const name = g.match(/'([^']+)'/)[1]; counts[name] = (counts[name]||0)+1; });
  console.log(counts);
  console.log('Total:', groups.length);
"
```

Expected output:
```
{
  'Authentication': 2,
  'Billing & Payments': 3,
  'Admin Panels': 3,
  'Background Jobs': 3,
  'Email & Notifications': 1,
  'SaaS Infrastructure': 5,
  'Agents': 3
}
Total: 20
```

**Step 3: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(tools): SaaS domain integration fixes"
```
