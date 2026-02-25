import type { ToolEntry } from './types'

// ---------------------------------------------------------------------------
// 28 Expert-tier tools: 18 Libraries + 7 Agents + 3 Skills
// ---------------------------------------------------------------------------

export const EXPERT_TOOLS: ToolEntry[] = [
  // =========================================================================
  // LIBRARIES -- AI / RAG (5)
  // =========================================================================
  {
    id: 'langchain-js',
    name: 'LangChain.js',
    description:
      'Framework for building LLM-powered chains, agents, and retrieval pipelines in TypeScript',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['ai-ml', 'saas', 'productivity'],
    themes: ['expert', 'future'],
    packages: { npm: 'langchain' },
    icon: 'link',
    integrationPrompt: `Integrate LangChain.js into the frontend.
- Install \`langchain\` and \`@langchain/openai\` (or the relevant provider package).
- Create \`frontend/src/lib/langchain.ts\` exporting a configured \`ChatOpenAI\` model instance that reads the API key from \`import.meta.env.VITE_OPENAI_API_KEY\`.
- Create \`frontend/src/lib/chains/conversational.ts\` with a \`ConversationalRetrievalQAChain\` that accepts a vector-store retriever and returns a runnable chain.
- Add a React hook \`frontend/src/hooks/useLangChain.ts\` that exposes \`invoke(prompt: string): Promise<string>\` using the chain.
- Wire the hook into the main chat component so user messages flow through the chain.
- Add VITE_OPENAI_API_KEY to \`.env.example\` with a placeholder value.`,
  },
  {
    id: 'vercel-ai-sdk',
    name: 'Vercel AI SDK',
    description:
      'Streaming-first SDK for building AI-powered UIs with React Server Components support',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['ai-ml', 'saas', 'general'],
    themes: ['expert', 'casual'],
    packages: { npm: 'ai' },
    icon: 'sparkles',
    integrationPrompt: `Integrate the Vercel AI SDK.
- Install \`ai\` and \`@ai-sdk/openai\` (or the relevant provider).
- Create \`backend/app/api/chat.py\` as a FastAPI streaming endpoint at \`POST /api/chat\` that accepts \`{ messages: Message[] }\` and returns a \`StreamingResponse\` using the provider SDK.
- On the frontend, create \`frontend/src/hooks/useAIChat.ts\` using \`useChat()\` from \`ai/react\` pointed at \`/api/chat\`.
- Replace the existing chat input/output in the main chat component with the \`useChat\` return values (\`messages\`, \`input\`, \`handleInputChange\`, \`handleSubmit\`).
- Add streaming message rendering with a typing indicator while \`isLoading\` is true.
- Add VITE_OPENAI_API_KEY and OPENAI_API_KEY to \`.env.example\`.`,
  },
  {
    id: 'transformers-js',
    name: 'Transformers.js',
    description:
      'Run Hugging Face transformer models directly in the browser via ONNX Runtime',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['ai-ml'],
    themes: ['expert', 'future'],
    packages: { npm: '@xenova/transformers' },
    icon: 'cpu',
    integrationPrompt: `Integrate Transformers.js for client-side inference.
- Install \`@xenova/transformers\`.
- Create \`frontend/src/lib/transformers.ts\` that lazy-loads a pipeline (e.g., \`pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english')\`) inside a singleton promise so the model is downloaded once.
- Create \`frontend/src/hooks/useLocalModel.ts\` exposing \`run(text: string): Promise<{ label: string; score: number }>\` and a \`loading: boolean\` state for the initial model download.
- Add a \`<ModelStatus />\` component in \`frontend/src/components/ModelStatus.tsx\` that shows download progress using the pipeline progress callback.
- Wire the hook into a text input component so results display inline below the input.
- Configure Vite to serve the WASM and ONNX files from \`node_modules/@xenova/transformers/dist\` as static assets.`,
  },
  {
    id: 'chromadb',
    name: 'Chroma',
    description:
      'Open-source embedding database for building AI applications with semantic search',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { pip: 'chromadb' },
    icon: 'database',
    integrationPrompt: `Integrate ChromaDB as the vector store.
- Add \`chromadb\` to \`backend/requirements.txt\`.
- Create \`backend/app/vectorstore.py\` with a singleton \`get_chroma_client()\` that returns a persistent \`chromadb.PersistentClient(path="./chroma_data")\`.
- Create a default collection named \`"documents"\` with cosine similarity.
- Add FastAPI endpoints in \`backend/app/routes/vectors.py\`:
  - \`POST /api/vectors/upsert\` accepting \`{ id: str, text: str, metadata?: dict }\` -- uses Chroma's default embedding function.
  - \`POST /api/vectors/query\` accepting \`{ query: str, n_results?: int }\` returning the top-k matches with distances.
  - \`DELETE /api/vectors/{id}\` to remove a document.
- Register the router in \`backend/app/main.py\`.
- Add \`chroma_data/\` to \`.gitignore\`.`,
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    description:
      'High-performance vector similarity search engine with rich filtering',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { pip: 'qdrant-client' },
    icon: 'search',
    integrationPrompt: `Integrate Qdrant as the vector store.
- Add \`qdrant-client\` to \`backend/requirements.txt\`.
- Create \`backend/app/vectorstore.py\` with a factory \`get_qdrant_client()\` connecting to \`QDRANT_URL\` (default \`http://localhost:6333\`) using \`qdrant_client.QdrantClient\`.
- On startup, ensure collection \`"documents"\` exists with vector size 384 and cosine distance via \`recreate_collection\` with \`on_disk_payload=True\`.
- Add FastAPI endpoints in \`backend/app/routes/vectors.py\`:
  - \`POST /api/vectors/upsert\` accepting \`{ id: str, vector: list[float], payload?: dict }\`.
  - \`POST /api/vectors/search\` accepting \`{ vector: list[float], limit?: int, filter?: dict }\` returning scored points.
  - \`DELETE /api/vectors/{id}\` to remove a point.
- Register the router in \`backend/app/main.py\`.
- Add QDRANT_URL to \`.env.example\`.`,
  },

  // =========================================================================
  // LIBRARIES -- Data Visualization (4)
  // =========================================================================
  {
    id: 'd3-js',
    name: 'D3.js',
    description:
      'Low-level, data-driven library for producing dynamic, interactive visualizations in the browser',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['data-viz', 'general', 'saas'],
    themes: ['expert', 'sharp'],
    packages: { npm: 'd3' },
    icon: 'bar-chart',
    integrationPrompt: `Integrate D3.js for custom data visualizations.
- Install \`d3\` and \`@types/d3\`.
- Create \`frontend/src/components/charts/D3Chart.tsx\` -- a reusable wrapper that:
  - Accepts \`data: any[]\`, \`width: number\`, \`height: number\`, and a \`renderFn: (svg: d3.Selection, data: any[], dims: { width: number; height: number }) => void\` prop.
  - Uses \`useRef<SVGSVGElement>\` and \`useEffect\` to call the render function on data/dimension changes.
  - Cleans up previous render with \`selectAll('*').remove()\` before re-rendering.
- Create \`frontend/src/components/charts/BarChart.tsx\` using D3Chart with scaleBand + scaleLinear axes, labeled bars, and hover tooltips.
- Create \`frontend/src/components/charts/LineChart.tsx\` with a time-series line, area fill, and axis formatting.
- Use CSS variables from the active theme (\`--t-primary\`, \`--t-accent1\`, \`--t-text\`) for all colors.`,
  },
  {
    id: 'plotly-js',
    name: 'Plotly.js',
    description:
      'Declarative charting library with 40+ chart types and built-in interactivity',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['data-viz', 'saas', 'ai-ml'],
    themes: ['expert', 'sharp'],
    packages: { npm: 'react-plotly.js' },
    icon: 'pie-chart',
    integrationPrompt: `Integrate Plotly.js via react-plotly.js.
- Install \`react-plotly.js\`, \`plotly.js-dist-min\`, and \`@types/react-plotly.js\`.
- Create \`frontend/src/components/charts/PlotlyChart.tsx\` -- a wrapper around \`<Plot />\` that:
  - Accepts \`data: Plotly.Data[]\`, \`layout?: Partial<Plotly.Layout>\`, and \`config?: Partial<Plotly.Config>\`.
  - Merges a theme-aware default layout: paper_bgcolor and plot_bgcolor from \`--t-bg\`, font color from \`--t-text\`, gridcolor from \`--t-border\`.
  - Sets \`config.responsive = true\` and \`config.displayModeBar = false\` by default.
- Create example charts: \`ScatterPlot.tsx\`, \`Heatmap.tsx\` in the same directory.
- Lazy-load Plotly with \`React.lazy(() => import(...))\` and a \`<Suspense>\` fallback.`,
  },
  {
    id: 'echarts',
    name: 'ECharts',
    description:
      'Apache ECharts -- powerful, interactive charting and visualization library',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['data-viz', 'saas'],
    themes: ['expert'],
    packages: { npm: 'echarts' },
    icon: 'activity',
    integrationPrompt: `Integrate Apache ECharts.
- Install \`echarts\` and \`echarts-for-react\`.
- Create \`frontend/src/components/charts/EChart.tsx\` -- a wrapper around \`ReactECharts\` that:
  - Accepts \`option: echarts.EChartsOption\` and optional \`style\`, \`className\`.
  - Applies a theme-aware base: backgroundColor from \`--t-bg\`, textStyle.color from \`--t-text\`, uses \`--t-primary\` and \`--t-accent1\` as the first two series colors.
  - Handles resize on container dimension changes via ResizeObserver.
- Create example components: \`DashboardPie.tsx\` (pie/donut) and \`TimeSeriesArea.tsx\` (stacked area) in \`frontend/src/components/charts/\`.
- Register only needed ECharts components (BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent) via \`echarts/core\` to reduce bundle size.`,
  },
  {
    id: 'cytoscape-js',
    name: 'Cytoscape.js',
    description:
      'Graph theory / network visualization library for interactive node-edge diagrams',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['data-viz', 'ai-ml'],
    themes: ['expert'],
    packages: { npm: 'cytoscape' },
    icon: 'git-branch',
    integrationPrompt: `Integrate Cytoscape.js for graph/network visualization.
- Install \`cytoscape\` and \`@types/cytoscape\`.
- Create \`frontend/src/components/graph/NetworkGraph.tsx\` that:
  - Accepts \`elements: cytoscape.ElementDefinition[]\` and optional \`layout: string\` (default \`'cose'\`).
  - Mounts a Cytoscape instance into a \`useRef<HTMLDivElement>\` container.
  - Applies a stylesheet using theme CSS variables: node background from \`--t-primary\`, edge line-color from \`--t-border\`, label color from \`--t-text\`.
  - Destroys the instance on unmount to avoid memory leaks.
- Create \`frontend/src/components/graph/GraphControls.tsx\` with zoom-in, zoom-out, fit, and layout-toggle buttons.
- Add a click handler that emits selected node data via an \`onNodeSelect\` callback prop.`,
  },

  // =========================================================================
  // LIBRARIES -- Backend (4)
  // =========================================================================
  {
    id: 'sqlalchemy-2',
    name: 'SQLAlchemy 2.x',
    description:
      'Async-first ORM and SQL toolkit with modern Python type hints',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas', 'general', 'ecommerce'],
    themes: ['expert'],
    packages: { pip: 'sqlalchemy[asyncio]' },
    icon: 'database',
    integrationPrompt: `Integrate SQLAlchemy 2.x with async support.
- Add \`sqlalchemy[asyncio]\` and \`aiosqlite\` to \`backend/requirements.txt\`.
- Create \`backend/app/db/engine.py\` with:
  - \`DATABASE_URL\` read from env var (default \`sqlite+aiosqlite:///./app.db\`).
  - \`async_engine = create_async_engine(DATABASE_URL, echo=False)\`.
  - \`async_session_factory = async_sessionmaker(async_engine, expire_on_commit=False)\`.
  - An async context manager \`get_session()\` yielding an \`AsyncSession\`.
- Create \`backend/app/db/base.py\` with a \`DeclarativeBase\` subclass \`Base\` using \`MappedAsOrm\` style.
- Create \`backend/app/db/models.py\` with at least one example model inheriting from \`Base\`.
- Add a FastAPI lifespan handler in \`backend/app/main.py\` that calls \`Base.metadata.create_all(bind=async_engine)\` on startup.
- Add DATABASE_URL to \`.env.example\`.`,
  },
  {
    id: 'alembic',
    name: 'Alembic',
    description:
      'Database migration tool for SQLAlchemy with auto-generation support',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas', 'general', 'ecommerce'],
    themes: ['expert'],
    packages: { pip: 'alembic' },
    icon: 'git-merge',
    integrationPrompt: `Integrate Alembic for database migrations.
- Add \`alembic\` to \`backend/requirements.txt\`.
- Run \`alembic init backend/alembic\` to scaffold the migrations directory.
- Edit \`backend/alembic/env.py\`:
  - Import \`Base.metadata\` from \`backend/app/db/base.py\` as \`target_metadata\`.
  - Configure \`sqlalchemy.url\` from the \`DATABASE_URL\` env var.
  - Implement \`run_migrations_online()\` using an async engine with \`connectable = create_async_engine(...)\`.
- Edit \`backend/alembic.ini\`: set \`script_location = backend/alembic\`.
- Generate an initial migration: \`alembic revision --autogenerate -m "initial"\`.
- Add helper scripts to the backend README: \`alembic upgrade head\`, \`alembic revision --autogenerate -m "description"\`.`,
  },
  {
    id: 'redis-py',
    name: 'Redis',
    description:
      'In-memory data store used for caching, sessions, rate-limiting, and pub/sub',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas', 'general', 'ecommerce'],
    themes: ['expert', 'sharp'],
    packages: { pip: 'redis' },
    icon: 'zap',
    integrationPrompt: `Integrate Redis for caching and session management.
- Add \`redis[hiredis]\` to \`backend/requirements.txt\`.
- Create \`backend/app/cache.py\`:
  - \`get_redis()\` returning an \`redis.asyncio.Redis\` instance connected to \`REDIS_URL\` (default \`redis://localhost:6379/0\`).
  - Helper functions: \`cache_get(key)\`, \`cache_set(key, value, ttl=300)\`, \`cache_delete(key)\`.
- Create a FastAPI dependency \`backend/app/deps/cache.py\` that injects the Redis client.
- Add a caching decorator \`@cached(ttl=60)\` in \`backend/app/cache.py\` for use on endpoint handlers or service functions.
- Wire Redis health check into \`GET /api/health\` endpoint: \`{ "redis": "ok" | "unavailable" }\`.
- Add REDIS_URL to \`.env.example\`.`,
  },
  {
    id: 'pycasbin',
    name: 'PyCasbin',
    description:
      'Authorization library supporting RBAC, ABAC, ACL, and custom policies',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['saas', 'general'],
    themes: ['expert'],
    packages: { pip: 'casbin' },
    icon: 'shield',
    integrationPrompt: `Integrate PyCasbin for role-based access control.
- Add \`casbin\` and \`casbin-sqlalchemy-adapter\` to \`backend/requirements.txt\`.
- Create \`backend/app/auth/rbac_model.conf\` with an RBAC model definition:
  \`[request_definition] r = sub, obj, act\`
  \`[policy_definition] p = sub, obj, act\`
  \`[role_definition] g = _, _\`
  \`[policy_effect] e = some(where (p.eft == allow))\`
  \`[matchers] m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act\`
- Create \`backend/app/auth/enforcer.py\` with a singleton \`get_enforcer()\` that loads the model and a SQLAlchemy adapter.
- Create a FastAPI dependency \`require_permission(obj: str, act: str)\` in \`backend/app/auth/deps.py\` that extracts the user from the JWT and calls \`enforcer.enforce(user_role, obj, act)\`, raising 403 on denial.
- Seed default policies for admin and user roles in a startup handler.`,
  },

  // =========================================================================
  // LIBRARIES -- DevOps (3)
  // =========================================================================
  {
    id: 'docker',
    name: 'Docker',
    description:
      'Containerization platform for consistent dev/prod environments',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'box',
    integrationPrompt: `Add Docker containerization to the project.
- Create \`backend/Dockerfile\`:
  - Base image \`python:3.12-slim\`.
  - Copy \`requirements.txt\`, run \`pip install --no-cache-dir -r requirements.txt\`.
  - Copy app code, expose port 8000.
  - CMD: \`["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]\`.
- Create \`frontend/Dockerfile\`:
  - Multi-stage: Node 20-alpine for build, nginx:alpine for serve.
  - Build stage: copy package.json, install, copy src, run \`npm run build\`.
  - Serve stage: copy dist to \`/usr/share/nginx/html\`, copy a custom \`nginx.conf\` that proxies \`/api\` to the backend.
- Create \`docker-compose.yml\` at project root:
  - \`backend\` service on port 8000 with \`.env\` file.
  - \`frontend\` service on port 3000 depending on backend.
  - Optional \`redis\` service on port 6379.
- Create \`frontend/nginx.conf\` with \`/api\` proxy_pass to \`http://backend:8000\`.
- Create \`.dockerignore\` files for both services.`,
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions CI/CD',
    description:
      'Automated CI/CD pipelines running on GitHub-hosted or self-hosted runners',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'play-circle',
    integrationPrompt: `Add GitHub Actions CI/CD workflows.
- Create \`.github/workflows/ci.yml\`:
  - Trigger on push to \`main\` and pull requests.
  - Jobs:
    - \`lint-backend\`: Python 3.12, install deps, run \`ruff check backend/\`.
    - \`test-backend\`: Python 3.12, install deps, run \`pytest backend/tests/ -v --tb=short\`.
    - \`lint-frontend\`: Node 20, install deps, run \`npm run lint\` (if script exists).
    - \`build-frontend\`: Node 20, install deps, run \`npm run build\`.
    - \`typecheck-frontend\`: Node 20, install deps, run \`npx tsc --noEmit\`.
  - Use caching: \`actions/cache\` for pip and npm.
- Create \`.github/workflows/deploy.yml\`:
  - Trigger on push to \`main\` (after CI passes).
  - Build and push Docker images to GHCR (\`ghcr.io\`).
  - Use \`docker/build-push-action@v5\` with \`GITHUB_TOKEN\` for auth.
- Add status badge markdown to the project README.`,
  },
  {
    id: 'dotenvx',
    name: 'dotenvx',
    description:
      'Next-gen dotenv with encryption, multi-environment support, and secret management',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    packages: { npm: '@dotenvx/dotenvx' },
    icon: 'lock',
    integrationPrompt: `Integrate dotenvx for environment variable management.
- Install \`@dotenvx/dotenvx\` as a dev dependency in the frontend.
- Create environment files at the project root:
  - \`.env\` with all required variables (placeholder values).
  - \`.env.production\` with production-specific overrides.
  - \`.env.example\` documenting every variable with descriptions.
- Update \`frontend/package.json\` scripts to use dotenvx:
  - \`"dev": "dotenvx run -- vite"\`
  - \`"build": "dotenvx run -f .env.production -- vite build"\`
- Update \`backend/\` run scripts similarly if applicable.
- Add \`.env.keys\` to \`.gitignore\` (dotenvx encryption key file).
- Add \`.env\` to \`.gitignore\` but keep \`.env.example\` tracked.
- Document the setup in a comment block at the top of \`.env.example\`.`,
  },

  // =========================================================================
  // LIBRARIES -- Advanced UI (2)
  // =========================================================================
  {
    id: 'ag-grid',
    name: 'AG Grid',
    description:
      'Enterprise-grade data grid with sorting, filtering, grouping, and virtualized rows',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['data-viz', 'saas', 'ecommerce', 'productivity'],
    themes: ['expert', 'sharp'],
    packages: { npm: 'ag-grid-react' },
    icon: 'grid',
    integrationPrompt: `Integrate AG Grid for data tables.
- Install \`ag-grid-react\` and \`ag-grid-community\`.
- Create \`frontend/src/components/grid/DataGrid.tsx\` -- a generic wrapper:
  - Accept \`rowData: T[]\`, \`columnDefs: ColDef<T>[]\`, and optional \`onRowClick\`.
  - Apply theme-aware AG Grid styling: import \`ag-grid-community/styles/ag-grid.css\` and the Balham theme CSS, then override with CSS variables (\`--ag-background-color: var(--t-bg)\`, \`--ag-header-background-color: var(--t-surface)\`, \`--ag-foreground-color: var(--t-text)\`, \`--ag-border-color: var(--t-border)\`).
  - Enable default features: \`sortable: true\`, \`filter: true\`, \`resizable: true\`.
  - Enable row virtualization (automatic with AG Grid) for large datasets.
- Create an example \`frontend/src/components/grid/UsersTable.tsx\` fetching from \`GET /api/users\` and rendering in the grid.
- Wrap with \`React.memo\` to prevent unnecessary re-renders.`,
  },
  {
    id: 'codemirror-6',
    name: 'CodeMirror 6',
    description:
      'Extensible code editor with syntax highlighting, completions, and language support',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['productivity', 'general'],
    themes: ['expert'],
    packages: { npm: '@codemirror/state' },
    icon: 'code',
    integrationPrompt: `Integrate CodeMirror 6 as an embedded code editor.
- Install core packages: \`@codemirror/state\`, \`@codemirror/view\`, \`@codemirror/commands\`, \`@codemirror/language\`, \`@codemirror/autocomplete\`.
- Install language support: \`@codemirror/lang-javascript\`, \`@codemirror/lang-python\`, \`@codemirror/lang-html\`.
- Create \`frontend/src/components/editor/CodeEditor.tsx\`:
  - Accept \`value: string\`, \`language: 'javascript' | 'python' | 'html'\`, \`onChange: (value: string) => void\`, and optional \`readOnly: boolean\`.
  - Use \`useRef<HTMLDivElement>\` and \`useEffect\` to create the EditorView.
  - Build extensions array: language support, basic setup (line numbers, fold gutter, highlight active line), key bindings (defaultKeymap, indentWithTab).
  - Create a custom theme using \`EditorView.theme()\` that maps to CSS variables: \`&\` background from \`--t-bg\`, \`.cm-content\` color from \`--t-text\`, \`.cm-gutters\` background from \`--t-surface\`.
  - Dispatch updates to the parent via \`EditorView.updateListener\`.
  - Destroy the view on unmount.
- Export a \`ReadOnlyViewer\` variant that disables editing and hides the cursor.`,
  },

  // =========================================================================
  // AGENTS (7)
  // =========================================================================
  {
    id: 'agent-github-searcher',
    name: 'GitHub Searcher',
    description:
      'Agent that searches GitHub repositories, issues, and code for relevant examples and patterns',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas', 'ai-ml'],
    themes: ['expert'],
    icon: 'github',
    integrationPrompt: `Create a GitHub Searcher agent.
- Create \`backend/app/agents/github_searcher.py\`:
  - Accept a natural-language query and convert it into GitHub Search API calls.
  - Use \`httpx.AsyncClient\` with the \`GITHUB_TOKEN\` env var for auth.
  - Search endpoints: \`/search/code\`, \`/search/repositories\`, \`/search/issues\`.
  - Return structured results: \`{ repos: Repo[], code_snippets: CodeSnippet[], issues: Issue[] }\`.
  - Limit to top 5 results per category, include relevance score.
- Add a FastAPI endpoint \`POST /api/agents/github-search\` accepting \`{ query: str, scope?: "code" | "repos" | "issues" | "all" }\`.
- On the frontend, create \`frontend/src/components/agents/GitHubSearchPanel.tsx\` with a search input and tabbed results view.
- Add GITHUB_TOKEN to \`.env.example\`.`,
  },
  {
    id: 'agent-architecture-review',
    name: 'Architecture Review',
    description:
      'Agent that analyzes generated code structure and suggests architectural improvements',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'layers',
    integrationPrompt: `Create an Architecture Review agent.
- Create \`backend/app/agents/architecture_review.py\`:
  - Accept the full project file tree and file contents as input.
  - Analyze: directory structure, dependency graph (imports), separation of concerns, circular dependencies, file size distribution.
  - Generate a structured report: \`{ score: int (0-100), findings: Finding[], suggestions: Suggestion[] }\` where each Finding has severity (info/warning/critical), file path, and description.
  - Use an LLM call (via the SDK's \`call_claude\` or \`call_gemini\`) to produce the analysis, with a system prompt that enforces the output schema.
- Add a FastAPI endpoint \`POST /api/agents/architecture-review\` accepting \`{ project_id: str }\` that loads the project and runs the analysis.
- On the frontend, render findings in a collapsible list grouped by severity in \`frontend/src/components/agents/ArchReviewPanel.tsx\`.`,
  },
  {
    id: 'agent-security-audit',
    name: 'Security Audit',
    description:
      'Agent that scans generated code for common security vulnerabilities and misconfigurations',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['general', 'saas', 'ecommerce'],
    themes: ['expert'],
    icon: 'shield-alert',
    integrationPrompt: `Create a Security Audit agent.
- Create \`backend/app/agents/security_audit.py\`:
  - Scan all generated files for common vulnerabilities:
    - Hardcoded secrets (regex for API keys, passwords, tokens).
    - SQL injection (raw string queries without parameterization).
    - XSS vectors (unescaped user input rendered in templates or via innerHTML).
    - Missing CORS configuration or overly permissive allow_origins=["*"].
    - Missing authentication on sensitive endpoints.
    - Insecure dependencies (check against a known-vulnerable list).
  - Return \`{ risk_level: "low" | "medium" | "high" | "critical", vulnerabilities: Vulnerability[] }\` where each Vulnerability has type, file, line, description, and remediation.
- Add a FastAPI endpoint \`POST /api/agents/security-audit\` accepting \`{ project_id: str }\`.
- On the frontend, create \`frontend/src/components/agents/SecurityAuditPanel.tsx\` with color-coded severity badges and expandable remediation steps.`,
  },
  {
    id: 'agent-generate-tests',
    name: 'Generate Tests',
    description:
      'Agent that generates unit and integration tests for both frontend and backend code',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'check-square',
    integrationPrompt: `Create a Test Generation agent.
- Create \`backend/app/agents/test_generator.py\`:
  - Accept a list of source files and their contents.
  - For Python files: generate pytest test files with fixtures, mocking, and async test support. Place in \`backend/tests/\` mirroring the source structure.
  - For TypeScript/React files: generate Vitest test files with React Testing Library. Place in \`frontend/src/__tests__/\` mirroring the source structure.
  - Use an LLM call with a prompt that emphasizes: edge cases, error paths, mocking external dependencies, and meaningful assertions.
  - Return \`{ test_files: GeneratedFile[], coverage_estimate: string }\`.
- Add a FastAPI endpoint \`POST /api/agents/generate-tests\` accepting \`{ project_id: str, files?: string[] }\` (if files omitted, generate for all).
- On the frontend, create \`frontend/src/components/agents/TestGenPanel.tsx\` showing generated test files in a code viewer with a "Save to project" button.`,
  },
  {
    id: 'agent-generate-docs',
    name: 'Generate Docs',
    description:
      'Agent that generates API documentation, README, and inline JSDoc/docstring comments',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'file-text',
    integrationPrompt: `Create a Documentation Generation agent.
- Create \`backend/app/agents/doc_generator.py\`:
  - Accept project files and generate:
    - \`README.md\` with project overview, setup instructions, architecture diagram (Mermaid), and API endpoint table.
    - \`API.md\` with detailed endpoint docs: method, path, request/response schemas, example curl commands.
    - Inline docstrings for all Python functions missing them.
    - JSDoc comments for all exported TypeScript functions missing them.
  - Use an LLM call with a documentation-specialist system prompt.
  - Return \`{ docs: GeneratedFile[], updated_sources: GeneratedFile[] }\`.
- Add a FastAPI endpoint \`POST /api/agents/generate-docs\` accepting \`{ project_id: str, scope?: "readme" | "api" | "inline" | "all" }\`.
- On the frontend, create \`frontend/src/components/agents/DocGenPanel.tsx\` with a markdown preview and diff view for inline changes.`,
  },
  {
    id: 'agent-docker-containerize',
    name: 'Docker Containerize',
    description:
      'Agent that analyzes the project and generates optimized Dockerfile and docker-compose configuration',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'package',
    integrationPrompt: `Create a Docker Containerize agent.
- Create \`backend/app/agents/docker_containerize.py\`:
  - Analyze the project structure to determine:
    - Python version and dependencies from \`requirements.txt\` / \`pyproject.toml\`.
    - Node version and build commands from \`package.json\`.
    - Required services (database, Redis, etc.) from code analysis.
    - Environment variables from \`.env.example\`.
  - Generate optimized files:
    - \`backend/Dockerfile\` with multi-stage build, non-root user, health check.
    - \`frontend/Dockerfile\` with multi-stage build (node build + nginx serve).
    - \`docker-compose.yml\` with all detected services, volumes, networks.
    - \`docker-compose.dev.yml\` override with hot-reload mounts.
    - \`.dockerignore\` for both services.
  - Return \`{ files: GeneratedFile[], services: string[], estimated_image_sizes: Record<string, string> }\`.
- Add a FastAPI endpoint \`POST /api/agents/containerize\` accepting \`{ project_id: str }\`.
- On the frontend, create \`frontend/src/components/agents/DockerPanel.tsx\` showing generated files and a service topology diagram.`,
  },
  {
    id: 'agent-performance-audit',
    name: 'Performance Audit',
    description:
      'Agent that analyzes code for performance issues: bundle size, N+1 queries, memory leaks',
    category: 'agent',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas', 'ecommerce'],
    themes: ['expert'],
    icon: 'trending-up',
    integrationPrompt: `Create a Performance Audit agent.
- Create \`backend/app/agents/performance_audit.py\`:
  - Analyze frontend code for:
    - Large imports that should be code-split (e.g., full lodash, moment.js).
    - Missing React.memo / useMemo / useCallback on expensive components.
    - Unoptimized images (missing lazy loading, no width/height).
    - Excessive re-renders from inline object/function props.
  - Analyze backend code for:
    - N+1 query patterns (SQLAlchemy eager/lazy loading issues).
    - Missing database indexes on filtered/sorted columns.
    - Synchronous blocking calls in async endpoints.
    - Missing pagination on list endpoints.
  - Return \`{ score: int (0-100), frontend_issues: Issue[], backend_issues: Issue[], quick_wins: string[] }\`.
- Add a FastAPI endpoint \`POST /api/agents/performance-audit\` accepting \`{ project_id: str }\`.
- On the frontend, create \`frontend/src/components/agents/PerfAuditPanel.tsx\` with a score gauge, categorized issues, and a "quick wins" checklist.`,
  },

  // =========================================================================
  // SKILLS (3)
  // =========================================================================
  {
    id: 'skill-rag-pipeline',
    name: 'Add RAG Pipeline',
    description:
      'Skill that scaffolds a complete Retrieval-Augmented Generation pipeline with ChromaDB and LangChain',
    category: 'skill',
    level: 'expert',
    side: 'both',
    domains: ['ai-ml', 'saas'],
    themes: ['expert', 'future'],
    packages: { npm: 'langchain', pip: 'chromadb' },
    icon: 'layers',
    integrationPrompt: `Scaffold a complete RAG pipeline.
- Backend:
  - Add \`chromadb\`, \`langchain\`, \`langchain-community\`, and \`sentence-transformers\` to \`backend/requirements.txt\`.
  - Create \`backend/app/rag/vectorstore.py\`: initialize a persistent Chroma collection with \`SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")\`.
  - Create \`backend/app/rag/ingest.py\`: accept text or PDF, chunk with \`RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)\`, embed, and upsert into Chroma.
  - Create \`backend/app/rag/retriever.py\`: wrap the Chroma collection as a LangChain retriever with \`search_kwargs={"k": 5}\`.
  - Create \`backend/app/rag/chain.py\`: build a \`RetrievalQA\` chain that uses the retriever and an LLM (configurable via \`LLM_PROVIDER\` env var).
  - Add endpoints in \`backend/app/routes/rag.py\`:
    - \`POST /api/rag/ingest\` accepting multipart file upload or JSON \`{ text: str }\`.
    - \`POST /api/rag/query\` accepting \`{ question: str }\` returning \`{ answer: str, sources: Source[] }\`.
- Frontend:
  - Create \`frontend/src/components/rag/RAGChat.tsx\`: a chat UI that posts to \`/api/rag/query\` and shows source citations.
  - Create \`frontend/src/components/rag/DocumentUpload.tsx\`: drag-and-drop file upload posting to \`/api/rag/ingest\`.
- Add LLM_PROVIDER, OPENAI_API_KEY (or equivalent) to \`.env.example\`.`,
  },
  {
    id: 'skill-auth-rbac',
    name: 'Add Auth + RBAC',
    description:
      'Skill that scaffolds JWT authentication with role-based access control using PyCasbin',
    category: 'skill',
    level: 'expert',
    side: 'both',
    domains: ['saas', 'general', 'ecommerce'],
    themes: ['expert'],
    packages: { pip: 'PyJWT casbin' },
    icon: 'shield',
    integrationPrompt: `Scaffold JWT authentication with RBAC.
- Backend:
  - Add \`PyJWT\`, \`passlib[bcrypt]\`, \`casbin\`, \`python-multipart\` to \`backend/requirements.txt\`.
  - Create \`backend/app/auth/models.py\`: User model with id, email, hashed_password, role (enum: admin, editor, viewer), created_at.
  - Create \`backend/app/auth/security.py\`: \`hash_password()\`, \`verify_password()\`, \`create_access_token(sub, role, exp=30min)\`, \`decode_token()\` using \`JWT_SECRET\` env var.
  - Create \`backend/app/auth/routes.py\`:
    - \`POST /api/auth/register\` accepting \`{ email, password }\`, returning \`{ token, user }\`.
    - \`POST /api/auth/login\` accepting \`{ email, password }\`, returning \`{ token, user }\`.
    - \`GET /api/auth/me\` returning the current user (requires valid JWT).
  - Create \`backend/app/auth/rbac.py\`: Casbin enforcer with RBAC model, file-based policy adapter at \`backend/app/auth/policy.csv\`.
  - Create \`backend/app/auth/deps.py\`: FastAPI dependencies \`get_current_user()\` and \`require_role(role: str)\`.
  - Seed default admin user on first startup.
- Frontend:
  - Create \`frontend/src/contexts/AuthContext.tsx\`: React context with \`user\`, \`login()\`, \`register()\`, \`logout()\`, token stored in localStorage.
  - Create \`frontend/src/components/auth/LoginForm.tsx\` and \`RegisterForm.tsx\`.
  - Create \`frontend/src/components/auth/ProtectedRoute.tsx\` wrapper that redirects to /login if unauthenticated.
  - Add Authorization header to all API calls via an httpx/fetch interceptor.
- Add JWT_SECRET to \`.env.example\`.`,
  },
  {
    id: 'skill-ci-cd',
    name: 'Add CI/CD',
    description:
      'Skill that scaffolds GitHub Actions workflows for linting, testing, building, and deploying',
    category: 'skill',
    level: 'expert',
    side: 'both',
    domains: ['general', 'saas'],
    themes: ['expert'],
    icon: 'refresh-cw',
    integrationPrompt: `Scaffold CI/CD with GitHub Actions.
- Create \`.github/workflows/ci.yml\`:
  - Trigger: push to main, pull_request.
  - Matrix strategy: Python 3.11/3.12, Node 18/20.
  - Jobs:
    - \`backend-lint\`: \`pip install ruff && ruff check backend/\`.
    - \`backend-test\`: \`pip install -r backend/requirements.txt && pip install pytest pytest-asyncio && pytest backend/tests/ -v\`.
    - \`frontend-typecheck\`: \`npm ci && npx tsc --noEmit\`.
    - \`frontend-build\`: \`npm ci && npm run build\`.
  - Cache pip and npm dependencies with \`actions/cache@v4\`.
  - Upload build artifacts with \`actions/upload-artifact@v4\`.
- Create \`.github/workflows/deploy.yml\`:
  - Trigger: push to main (only after CI passes, use \`workflow_run\`).
  - Build Docker images and push to GitHub Container Registry.
  - Use \`docker/login-action@v3\` and \`docker/build-push-action@v5\`.
  - Tag with \`latest\` and the git SHA.
- Create \`.github/workflows/pr-checks.yml\`:
  - Trigger: pull_request.
  - Run a lightweight check: lint + typecheck only.
  - Add PR comment with results using \`actions/github-script@v7\`.
- Create \`.github/dependabot.yml\` for automated dependency updates (pip and npm ecosystems, weekly schedule).`,
  },
]
