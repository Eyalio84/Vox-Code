# RAG Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 32 RAG/retrieval/KG tools (25 in 7 capability groups + 7 KG utilities) to the Expert drawer, with custom tools mixed alongside external libs.

**Architecture:** One domain file (`tools/domains/rag.ts`) exports all 32 tools. Custom tools use `category: 'library'` and live inside capability groups alongside external libs. KG utilities use `category: 'agent'` and appear in the Agents tab. Registry imports and deduplicates.

**Tech Stack:** React 19, TypeScript, existing ToolEntry type system with `group` field (added by site-dev plan)

---

## Prerequisites

**This plan assumes site-dev-plan.md Tasks 1-3 are already implemented:**
- `types.ts` has the `group?: string` field on `ToolEntry`
- `registry.ts` has `dedup()`, `getToolsByGroup()`, `getGroups()`, and imports from `domains/`
- `tools/domains/` directory exists

If those are not done yet, implement site-dev-plan.md Tasks 1-3 first.

**Key existing files:**
- `frontend/src/tools/types.ts` — ToolEntry with `group` field
- `frontend/src/tools/registry.ts` — master catalog with dedup + group helpers
- `frontend/src/tools/domains/site-dev.ts` — reference for domain file pattern

**TypeScript check command:** `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`

---

### Task 1: Create tools/domains/rag.ts with all 32 tools

**Files:**
- Create: `frontend/src/tools/domains/rag.ts`

**Step 1: Create the domain file**

Create `frontend/src/tools/domains/rag.ts` with all 25 grouped tools + 7 KG utilities. Tools are ordered recommended-first within each group. Custom tools use `category: 'library'`, KG utilities use `category: 'agent'`.

```typescript
import type { ToolEntry } from '../types'

// ---------------------------------------------------------------------------
// RAG Expert Tools — 14 external + 11 custom libs + 7 KG utilities = 32 tools
// Custom tools mixed into capability groups alongside external libs.
// KG utilities (category: 'agent') appear in the Agents tab.
// ---------------------------------------------------------------------------

export const RAG_TOOLS: ToolEntry[] = [
  // =========================================================================
  // Vector Storage (2)
  // =========================================================================
  {
    id: 'rag-chroma',
    name: 'Chroma',
    description: 'Embedded vector database with zero-config setup — fastest way to prototype vector search',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { pip: 'chromadb' },
    icon: 'database',
    group: 'Vector Storage',
    integrationPrompt: `Integrate ChromaDB as the vector store for RAG.
- Add \`chromadb\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/vectorstore.py\`:
  - Singleton \`get_chroma_client()\` returning \`chromadb.PersistentClient(path="./chroma_data")\`.
  - Create default collection \`"documents"\` with cosine similarity.
  - Helper: \`upsert_documents(texts: list[str], ids: list[str], metadatas?: list[dict])\` — uses Chroma's default embedding function.
  - Helper: \`query_similar(query: str, n_results: int = 5)\` returning top-k matches with distances.
  - Helper: \`delete_document(doc_id: str)\`.
- Add FastAPI endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/index\` accepting \`{ texts: string[], ids: string[], metadata?: dict[] }\`.
  - \`POST /api/rag/search\` accepting \`{ query: string, top_k?: number }\` returning matches with scores.
  - \`DELETE /api/rag/document/{id}\`.
- Register the router in \`backend/app/main.py\`.
- Add \`chroma_data/\` to \`.gitignore\`.`,
  },
  {
    id: 'rag-qdrant',
    name: 'Qdrant',
    description: 'High-performance Rust-based vector search engine with rich payload filtering',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { pip: 'qdrant-client' },
    icon: 'search',
    group: 'Vector Storage',
    integrationPrompt: `Integrate Qdrant as the vector store for RAG.
- Add \`qdrant-client\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/vectorstore.py\`:
  - Factory \`get_qdrant_client()\` connecting to \`QDRANT_URL\` (default \`http://localhost:6333\`).
  - On startup, ensure collection \`"documents"\` exists with vector size 384 and cosine distance.
  - Helper: \`upsert_points(ids, vectors, payloads)\`.
  - Helper: \`search_similar(vector: list[float], limit: int = 5, filters?: dict)\` returning scored results.
  - Helper: \`delete_point(point_id: str)\`.
- Add FastAPI endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/index\` accepting \`{ id: str, vector: list[float], payload?: dict }\`.
  - \`POST /api/rag/search\` accepting \`{ vector: list[float], limit?: int, filter?: dict }\`.
  - \`DELETE /api/rag/document/{id}\`.
- Register the router in \`backend/app/main.py\`.
- Add \`QDRANT_URL\` to \`.env.example\`.`,
  },

  // =========================================================================
  // Embeddings (3)
  // =========================================================================
  {
    id: 'rag-transformers-js',
    name: 'Transformers.js',
    description: 'Run Hugging Face models in the browser via ONNX — client-side embeddings without a server',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['ai-ml'],
    themes: ['expert'],
    packages: { npm: '@xenova/transformers' },
    icon: 'cpu',
    group: 'Embeddings',
    integrationPrompt: `Integrate Transformers.js for client-side embeddings in RAG.
- Install \`@xenova/transformers\`.
- Create \`frontend/src/lib/embeddings.ts\`:
  - Lazy-load the feature-extraction pipeline: \`pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')\` as a singleton promise.
  - Export \`embedText(text: string): Promise<number[]>\` that runs the pipeline and returns the 384D vector.
  - Export \`embedBatch(texts: string[]): Promise<number[][]>\` for batch embedding.
- Create \`frontend/src/hooks/useEmbeddings.ts\`:
  - \`loading: boolean\` state for initial model download.
  - \`embed(text: string): Promise<number[]>\` wrapper.
  - \`progress: number\` via the pipeline progress callback.
- Create \`frontend/src/components/rag/EmbeddingStatus.tsx\`:
  - Shows model download progress bar during first load.
  - Shows "Ready" badge once loaded.
- Configure Vite to serve WASM/ONNX files from \`node_modules/@xenova/transformers/dist\`.`,
  },
  {
    id: 'rag-contextual-embeddings',
    name: 'Contextual Embeddings',
    description: 'Self-supervised 256D embedding model with graph-neighbor fusion for context-aware vectors',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'layers',
    group: 'Embeddings',
    integrationPrompt: `Integrate contextual embeddings into the RAG pipeline.
- Create \`backend/app/rag/embeddings.py\` adapting the contextual_embeddings pattern:
  - Class \`ContextualEmbedder\` with:
    - \`embed(text: str) -> list[float]\` returning 256D vectors.
    - \`embed_with_context(text: str, neighbors: list[str]) -> list[float]\` fusing graph-neighbor context.
    - Configurable: \`dimensions=256\`, \`neighbor_weight=0.3\`, \`fusion_mode='concat' | 'average'\`.
  - Self-supervised training loop (optional): \`train(corpus: list[str], epochs: int)\`.
- Add endpoint \`POST /api/rag/embed\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ text: str, neighbors?: list[str] }\`, returns \`{ vector: list[float], dimensions: int }\`.
- Wire into vectorstore: embedding step before upsert.`,
  },
  {
    id: 'rag-embedding-generator',
    name: 'Embedding Generator',
    description: '56D semantic embeddings via keyword-heuristic, Haiku, or hybrid — zero-cost local mode available',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'hash',
    group: 'Embeddings',
    integrationPrompt: `Integrate the embedding generator into the RAG pipeline.
- Create \`backend/app/rag/embeddings_lite.py\` adapting the embedding_generator_cli pattern:
  - Three modes: \`keyword\` (free, heuristic-based), \`haiku\` (Claude Haiku API), \`hybrid\` (keyword + Haiku fusion).
  - Function \`generate_embedding(text: str, mode: str = 'keyword') -> list[float]\` returning 56D vectors.
  - Batch function \`generate_embeddings(texts: list[str], mode: str) -> list[list[float]]\`.
  - Config: \`EMBEDDING_MODE\` env var (default \`keyword\`), \`ANTHROPIC_API_KEY\` for Haiku mode.
- Add endpoint \`POST /api/rag/embed-lite\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ texts: list[str], mode?: str }\`, returns \`{ vectors: list[list[float]], mode: str, cost: float }\`.
- Useful as a fallback when you need embeddings without external API costs.`,
  },

  // =========================================================================
  // Retrieval Pipelines (5)
  // =========================================================================
  {
    id: 'rag-haystack',
    name: 'Haystack',
    description: 'Modular pipeline-based RAG framework — lowest token overhead (~1.57k), hybrid search built-in',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { pip: 'haystack-ai' },
    icon: 'git-branch',
    group: 'Retrieval Pipelines',
    integrationPrompt: `Integrate Haystack as the RAG pipeline framework.
- Add \`haystack-ai\`, \`haystack-integrations[chroma]\` (or qdrant) to \`backend/requirements.txt\`.
- Create \`backend/app/rag/pipeline.py\`:
  - Build an indexing pipeline: \`DocumentCleaner -> DocumentSplitter -> DocumentEmbedder -> DocumentWriter\`.
  - Build a query pipeline: \`TextEmbedder -> Retriever -> PromptBuilder -> Generator\`.
  - Configure the document store (Chroma or Qdrant via Haystack integration).
  - Use \`PromptBuilder\` with a RAG template: "Given context: {documents}, answer: {query}".
- Create \`backend/app/rag/ingest.py\`:
  - Accept text or file upload, run through the indexing pipeline.
- Add endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/ingest\` — run indexing pipeline on uploaded content.
  - \`POST /api/rag/query\` accepting \`{ question: str }\` returning \`{ answer: str, sources: list }\`.
- Add \`OPENAI_API_KEY\` (or relevant LLM provider key) to \`.env.example\`.`,
  },
  {
    id: 'rag-langchain',
    name: 'LangChain.js',
    description: 'RAG framework with chains, agents, vector store retrievers — full pipeline orchestration',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { npm: 'langchain' },
    icon: 'link',
    group: 'Retrieval Pipelines',
    integrationPrompt: `Integrate LangChain.js for RAG pipeline on the frontend.
- Install \`langchain\`, \`@langchain/openai\` (or relevant provider), \`@langchain/community\`.
- Create \`frontend/src/lib/rag/chain.ts\`:
  - Configure a \`ChatOpenAI\` model reading API key from \`import.meta.env.VITE_OPENAI_API_KEY\`.
  - Create a \`ConversationalRetrievalQAChain\` that accepts a vector store retriever.
  - Export \`askQuestion(question: str, retriever): Promise<{ answer: string, sourceDocuments: Document[] }>\`.
- Create \`frontend/src/lib/rag/vectorstore.ts\`:
  - Connect to the backend vector search endpoint as a custom retriever.
  - Implement the LangChain \`BaseRetriever\` interface wrapping \`POST /api/rag/search\`.
- Create \`frontend/src/hooks/useRAGChat.ts\`:
  - Manages conversation history and streams answers.
  - Returns \`{ messages, ask, isLoading, sources }\`.
- Add \`VITE_OPENAI_API_KEY\` to \`.env.example\`.`,
  },
  {
    id: 'rag-dspy',
    name: 'DSPy',
    description: '"Programming not prompting" — self-optimizing retrieval with compiled prompts, 22K stars',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    packages: { pip: 'dspy' },
    icon: 'settings',
    group: 'Retrieval Pipelines',
    integrationPrompt: `Integrate DSPy for self-optimizing RAG retrieval.
- Add \`dspy\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/dspy_pipeline.py\`:
  - Configure DSPy LM: \`dspy.LM('openai/gpt-4o-mini')\` with API key from env.
  - Define a RAG signature: \`class RAG(dspy.Signature): context = dspy.InputField(); question = dspy.InputField(); answer = dspy.OutputField()\`.
  - Create a RAG module: \`class RAGModule(dspy.Module)\` with a retrieve step and a generate step.
  - Implement \`compile()\` method using \`dspy.BootstrapFewShot\` with evaluation examples.
- Add endpoint \`POST /api/rag/query-dspy\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ question: str }\`, runs through compiled DSPy module.
  - Returns \`{ answer: str, reasoning: str, sources: list }\`.
- Add \`OPENAI_API_KEY\` to \`.env.example\`.`,
  },
  {
    id: 'rag-hybrid-query',
    name: 'Hybrid Query',
    description: 'Production hybrid search combining embedding cosine similarity + BM25 + graph-neighbor boosting',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'crosshair',
    group: 'Retrieval Pipelines',
    integrationPrompt: `Integrate hybrid query search into the RAG pipeline.
- Create \`backend/app/rag/hybrid_search.py\` adapting the hybrid_query pattern:
  - Class \`HybridSearcher\` combining three scoring signals:
    - Embedding cosine similarity (weight: 0.5) — queries the vector store.
    - BM25 text matching (weight: 0.3) — uses an in-memory BM25 index.
    - Graph-neighbor boosting (weight: 0.2) — boosts results connected in the KG.
  - \`search(query: str, top_k: int = 10) -> list[SearchResult]\` with \`SearchResult = { id, text, score, breakdown: { cosine, bm25, graph } }\`.
  - Configurable weights via constructor or env vars.
  - Requires: a vector store (Chroma/Qdrant) + a BM25 index + optional KG connection.
- Add endpoint \`POST /api/rag/hybrid-search\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ query: str, top_k?: int, weights?: { cosine: float, bm25: float, graph: float } }\`.
  - Returns scored results with per-signal breakdown.
- Build the BM25 index on startup from indexed documents.`,
  },
  {
    id: 'rag-context-retrieval',
    name: 'Context Retrieval',
    description: 'Intent-aware retrieval engine classifying queries into 6 types, adapts search strategy per intent',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'target',
    group: 'Retrieval Pipelines',
    integrationPrompt: `Integrate context-aware retrieval into the RAG pipeline.
- Create \`backend/app/rag/context_retrieval.py\` adapting the context_retrieval pattern:
  - Class \`ContextRetriever\` that classifies incoming queries into intent types:
    - \`factual\` — direct lookup, prefer exact match.
    - \`exploratory\` — broad search, return diverse results.
    - \`comparative\` — find related items for comparison.
    - \`procedural\` — step-by-step instructions, ordered results.
    - \`definitional\` — concept explanation, prefer authoritative sources.
    - \`analytical\` — data-driven insights, prefer structured data.
  - \`retrieve(query: str) -> ContextResult\` with \`ContextResult = { intent, results: list, strategy_used: str }\`.
  - Each intent type maps to a different retrieval strategy (vector-only, hybrid, KG-augmented, etc.).
- Add endpoint \`POST /api/rag/context-search\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ query: str }\`, auto-classifies intent, runs appropriate strategy.
  - Returns \`{ intent: str, results: list, strategy: str }\`.`,
  },

  // =========================================================================
  // Knowledge Graphs (5)
  // =========================================================================
  {
    id: 'rag-lightrag',
    name: 'LightRAG',
    description: 'Graph-based RAG with dual-level retrieval (entity + relationship) — 27K stars, single API',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    packages: { pip: 'lightrag-hku' },
    icon: 'share-2',
    group: 'Knowledge Graphs',
    integrationPrompt: `Integrate LightRAG for graph-based RAG.
- Add \`lightrag-hku\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/graph_rag.py\`:
  - Initialize LightRAG: \`rag = LightRAG(working_dir="./lightrag_data", llm_model_func=...)\`.
  - Configure with your LLM provider (OpenAI, Anthropic, etc.).
  - Export helpers: \`insert_text(text: str)\`, \`query(question: str, mode: str = "hybrid")\`.
  - Modes: \`naive\` (vector only), \`local\` (entity-focused), \`global\` (relationship-focused), \`hybrid\` (both).
- Add endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/graph/insert\` accepting \`{ text: str }\`.
  - \`POST /api/rag/graph/query\` accepting \`{ question: str, mode?: str }\` returning \`{ answer: str, entities: list, relationships: list }\`.
- Add \`lightrag_data/\` to \`.gitignore\`.
- Add LLM API key to \`.env.example\`.`,
  },
  {
    id: 'rag-nano-graphrag',
    name: 'nano-graphrag',
    description: 'Minimal hackable GraphRAG implementation — ~1000 LOC, easy to modify and extend',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    packages: { pip: 'nano-graphrag' },
    icon: 'minimize-2',
    group: 'Knowledge Graphs',
    integrationPrompt: `Integrate nano-graphrag for lightweight graph-based RAG.
- Add \`nano-graphrag\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/nano_graph.py\`:
  - Initialize: \`rag = GraphRAG(working_dir="./nano_graphrag_data", best_model_func=..., cheap_model_func=...)\`.
  - Configure LLM functions for entity extraction (cheap model) and answer generation (best model).
  - Export: \`insert(text: str)\`, \`query(question: str) -> str\`.
- Add endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/nano-graph/insert\` accepting \`{ text: str }\`.
  - \`POST /api/rag/nano-graph/query\` accepting \`{ question: str }\`.
- Advantage over LightRAG: fully hackable — modify entity extraction, graph construction, or retrieval logic directly.
- Add \`nano_graphrag_data/\` to \`.gitignore\`.`,
  },
  {
    id: 'rag-graph-embedder',
    name: 'Graph Embedder',
    description: 'Graph-structural feature vectors: PageRank, centrality, clustering coefficient from SQLite KG',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'git-branch',
    group: 'Knowledge Graphs',
    integrationPrompt: `Integrate graph embeddings into the KG pipeline.
- Create \`backend/app/rag/graph_embedder.py\` adapting the graph_embedder pattern:
  - Class \`GraphEmbedder\` that computes structural features from a SQLite-backed KG:
    - PageRank score per node.
    - Betweenness centrality.
    - Clustering coefficient.
    - Degree (in/out/total).
    - Community membership (Louvain).
  - \`embed_node(node_id: str) -> list[float]\` returning a feature vector.
  - \`embed_all() -> dict[str, list[float]]\` batch computation for the entire graph.
  - Store embeddings back into the KG as node properties.
- Add endpoint \`POST /api/rag/graph/embed\` in \`backend/app/routes/rag.py\`:
  - Triggers batch embedding computation.
  - Returns \`{ nodes_embedded: int, dimensions: int }\`.
- Useful for graph-neighbor boosting in hybrid search.`,
  },
  {
    id: 'rag-kg-reasoner',
    name: 'Perceptual KG Reasoner',
    description: 'Locality-first KG traversal — 2-hop neighborhood retrieval for focused subgraph answers',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'eye',
    group: 'Knowledge Graphs',
    integrationPrompt: `Integrate perceptual KG reasoning into the RAG pipeline.
- Create \`backend/app/rag/kg_reasoner.py\` adapting the perceptual_kg_reasoner pattern:
  - Class \`KGReasoner\` with locality-first traversal:
    - \`reason(query: str, start_node: str, hops: int = 2) -> ReasoningResult\`.
    - Retrieves the N-hop neighborhood subgraph around the start node.
    - Ranks paths by relevance to the query using embedding similarity.
    - Returns: \`{ answer: str, subgraph: { nodes: list, edges: list }, paths: list[Path], confidence: float }\`.
  - Configurable: max hops, max neighbors per hop, relevance threshold.
- Add endpoint \`POST /api/rag/graph/reason\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ query: str, start_node?: str, hops?: int }\`.
  - If no start_node, auto-detect the most relevant entry point via embedding search.
- Wire into the main RAG chain as an optional retrieval step for graph-enhanced answers.`,
  },
  {
    id: 'rag-kg-ask',
    name: 'KG-Ask',
    description: 'Natural language REPL over a unified KG — 7 query types: search, traverse, explain, compare, etc.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'message-circle',
    group: 'Knowledge Graphs',
    integrationPrompt: `Integrate KG-Ask as a natural language interface to the knowledge graph.
- Create \`backend/app/rag/kg_ask.py\` adapting the kg-ask pattern:
  - Class \`KGAsker\` supporting 7 query types:
    - \`search\` — find nodes matching a description.
    - \`traverse\` — follow relationships from a node.
    - \`explain\` — describe a node and its connections.
    - \`compare\` — show similarities/differences between two nodes.
    - \`path\` — find shortest path between two nodes.
    - \`impact\` — what depends on this node?
    - \`suggest\` — recommend related nodes.
  - \`ask(question: str) -> KGResponse\` — auto-classifies query type, executes, returns structured result.
  - Uses the intent_classifier under the hood to determine query type.
- Add endpoint \`POST /api/rag/kg/ask\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ question: str }\`, returns \`{ query_type: str, result: any, explanation: str }\`.
- On the frontend, wire into the chat panel as an alternative to vector search — when the user's question is about entities/relationships, route to KG-Ask.`,
  },

  // =========================================================================
  // Document Ingestion (3)
  // =========================================================================
  {
    id: 'rag-txtai',
    name: 'txtai',
    description: 'All-in-one semantic search + RAG + KG, fully embedded, zero-infrastructure, SQLite-backed',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    packages: { pip: 'txtai' },
    icon: 'package',
    group: 'Document Ingestion',
    integrationPrompt: `Integrate txtai as an all-in-one RAG engine.
- Add \`txtai[pipeline]\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/txtai_engine.py\`:
  - Initialize: \`embeddings = Embeddings(path="sentence-transformers/all-MiniLM-L6-v2", content=True)\`.
  - \`index_documents(docs: list[dict])\` — each doc has \`{ id, text, metadata }\`.
  - \`search(query: str, limit: int = 5) -> list[dict]\` — semantic search returning scored results.
  - \`rag(question: str) -> str\` — full RAG pipeline (search + LLM generation) in one call.
  - Save/load index to disk: \`embeddings.save("txtai_index")\` / \`embeddings.load("txtai_index")\`.
- Add endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/txtai/index\` — index documents.
  - \`POST /api/rag/txtai/search\` — semantic search.
  - \`POST /api/rag/txtai/ask\` — full RAG query.
- Add \`txtai_index/\` to \`.gitignore\`.
- Zero-infrastructure: no external services needed, everything runs embedded.`,
  },
  {
    id: 'rag-parser-adapters',
    name: 'Parser Adapters',
    description: 'Unified parser for 15+ formats: PDF, DOCX, HTML, JSON, CSV, Markdown, YAML, XML, and more',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    icon: 'file',
    group: 'Document Ingestion',
    integrationPrompt: `Integrate the parser adapters for multi-format document ingestion.
- Create \`backend/app/rag/parsers.py\` adapting the parser_adapters pattern:
  - Class \`DocumentParser\` with format-specific adapters:
    - \`.parse(file_path: str) -> ParsedDocument\` auto-detecting format from extension.
    - Supported: PDF, DOCX, HTML, JSON, CSV, MD, YAML, XML, TXT, RST, EPUB, PPTX, XLSX, LOG, INI.
    - Each adapter extracts: \`{ text: str, metadata: dict, sections: list[Section] }\`.
  - \`parse_batch(paths: list[str]) -> list[ParsedDocument]\` for bulk ingestion.
  - Metadata extraction: title, author, date, page count, word count, language detection.
- Add endpoint \`POST /api/rag/parse\` accepting multipart file upload:
  - Detects format, parses, returns structured text + metadata.
  - Optionally chains into the indexing pipeline (parse -> chunk -> embed -> store).
- Install format-specific deps as needed: \`PyPDF2\`, \`python-docx\`, \`beautifulsoup4\`, \`openpyxl\`.`,
  },
  {
    id: 'rag-universal-parser',
    name: 'Universal Parser',
    description: 'Schema-first parser with batch processing, validation, and structured output',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'file-text',
    group: 'Document Ingestion',
    integrationPrompt: `Integrate the universal parser for schema-validated document ingestion.
- Create \`backend/app/rag/universal_parser.py\` adapting the universal_parser pattern:
  - Class \`UniversalParser\` with schema-first approach:
    - Define output schema: \`{ title: str, body: str, entities: list, relationships: list, metadata: dict }\`.
    - \`.parse(input: str | bytes, schema?: dict) -> ValidatedOutput\` — validates output against schema.
    - \`.parse_batch(inputs: list, workers: int = 4) -> list[ValidatedOutput]\` — parallel batch processing.
  - Built-in validators: schema compliance, completeness check, entity dedup.
  - Error handling: returns partial results with validation errors attached.
- Add endpoint \`POST /api/rag/parse-structured\` accepting \`{ content: str, schema?: dict }\`:
  - Returns schema-validated structured output.
- Useful when you need guaranteed output structure for downstream KG ingestion.`,
  },

  // =========================================================================
  // Agent Memory (4)
  // =========================================================================
  {
    id: 'rag-mem0',
    name: 'mem0',
    description: 'Persistent memory layer for agents and RAG — add(), search(), get_all() in 3 lines, 41K stars',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { pip: 'mem0ai' },
    icon: 'hard-drive',
    group: 'Agent Memory',
    integrationPrompt: `Integrate mem0 for persistent agent memory.
- Add \`mem0ai\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/memory.py\`:
  - Initialize: \`memory = Memory()\` (uses SQLite by default).
  - Helpers:
    - \`add_memory(text: str, user_id: str, metadata?: dict)\` — stores a memory.
    - \`search_memories(query: str, user_id: str, limit: int = 5)\` — semantic search over memories.
    - \`get_all_memories(user_id: str)\` — list all memories for a user.
    - \`delete_memory(memory_id: str)\`.
  - Configure with \`MEM0_API_KEY\` for cloud mode, or run fully embedded (default).
- Add endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/memory/add\` accepting \`{ text: str, user_id: str }\`.
  - \`POST /api/rag/memory/search\` accepting \`{ query: str, user_id: str }\`.
  - \`GET /api/rag/memory/{user_id}\` returning all memories.
- Wire into the RAG chain: before generating an answer, search memories for relevant context.
- Add \`MEM0_API_KEY\` to \`.env.example\` (optional, for cloud mode).`,
  },
  {
    id: 'rag-ragatouille',
    name: 'RAGatouille',
    description: 'ColBERT late-interaction retrieval — token-level matching that beats BM25 on benchmarks',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    packages: { pip: 'ragatouille' },
    icon: 'award',
    group: 'Agent Memory',
    integrationPrompt: `Integrate RAGatouille for ColBERT-based retrieval.
- Add \`ragatouille\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/colbert_retriever.py\`:
  - Initialize: \`RAG = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")\`.
  - \`index_documents(docs: list[str], doc_ids: list[str], index_name: str = "default")\`.
  - \`search(query: str, k: int = 5) -> list[dict]\` returning results with token-level relevance scores.
  - Reranking: use ColBERT as a reranker on top of initial vector search results.
- Add endpoints in \`backend/app/routes/rag.py\`:
  - \`POST /api/rag/colbert/index\` accepting \`{ documents: list[str], ids: list[str] }\`.
  - \`POST /api/rag/colbert/search\` accepting \`{ query: str, k?: int }\`.
- Use as a reranker: pipe initial vector search results through ColBERT for more precise ranking.
- Add \`.ragatouille/\` to \`.gitignore\`.`,
  },
  {
    id: 'rag-intent-classifier',
    name: 'Intent Classifier',
    description: 'Rule-based query classifier into 6 intent types with entity extraction — zero-cost, no API calls',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'tag',
    group: 'Agent Memory',
    integrationPrompt: `Integrate intent classification into the RAG pipeline.
- Create \`backend/app/rag/intent_classifier.py\` adapting the intent_classifier pattern:
  - Class \`IntentClassifier\` with rule-based classification:
    - 6 intent types: factual, exploratory, comparative, procedural, definitional, analytical.
    - Pattern matching + keyword detection (no LLM calls, zero cost).
    - Entity extraction: pull out named entities, dates, numbers from the query.
  - \`classify(query: str) -> IntentResult\` returning \`{ intent: str, confidence: float, entities: list[Entity] }\`.
  - Configurable rules: add custom patterns per intent type.
- Wire into the retrieval pipeline as the first step:
  - Route to different retrieval strategies based on classified intent.
  - Pass extracted entities as additional search filters.
- No API endpoint needed — used internally by the retrieval pipeline.
- Zero cost: runs locally with regex/keyword rules, no external services.`,
  },
  {
    id: 'rag-markov-predictor',
    name: 'Markov Predictor',
    description: 'Markov chain for "suggested next query" — predicts follow-up questions from query history',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'trending-up',
    group: 'Agent Memory',
    integrationPrompt: `Integrate the Markov predictor for query suggestions.
- Create \`backend/app/rag/markov_predictor.py\` adapting the markov_predictor pattern:
  - Class \`QueryPredictor\` building a Markov chain from query history:
    - \`record(query: str)\` — add a query to the history, update transition probabilities.
    - \`predict(current_query: str, n: int = 3) -> list[Suggestion]\` — top-N likely follow-up queries.
    - \`Suggestion = { query: str, probability: float }\`.
  - Persistence: save/load the chain to a JSON file.
  - Minimum history threshold before predictions activate (default: 20 queries).
- Add endpoint \`GET /api/rag/suggest?q=current_query\` in \`backend/app/routes/rag.py\`:
  - Returns \`{ suggestions: list[{ query: str, probability: float }] }\`.
- On the frontend, show suggestions below the search input as clickable chips.
- Train the chain from existing query logs if available.`,
  },

  // =========================================================================
  // Streaming / UI (3)
  // =========================================================================
  {
    id: 'rag-vercel-ai',
    name: 'Vercel AI SDK',
    description: 'Streaming-first SDK for real-time RAG answers with React hooks — useChat(), useCompletion()',
    category: 'library',
    level: 'expert',
    side: 'both',
    domains: ['ai-ml', 'saas'],
    themes: ['expert'],
    packages: { npm: 'ai' },
    icon: 'sparkles',
    group: 'Streaming / UI',
    integrationPrompt: `Integrate the Vercel AI SDK for streaming RAG answers.
- Install \`ai\` and \`@ai-sdk/openai\` (or relevant provider).
- Create \`backend/app/api/rag_chat.py\` as a streaming FastAPI endpoint:
  - \`POST /api/rag/chat\` accepting \`{ messages: list[Message] }\`.
  - Retrieves relevant context from the vector store based on the latest message.
  - Streams the LLM response with context injected as a system message.
  - Returns \`StreamingResponse\` with \`text/event-stream\` content type.
- On the frontend, create \`frontend/src/hooks/useRAGChat.ts\`:
  - Use \`useChat()\` from \`ai/react\` pointed at \`/api/rag/chat\`.
  - Returns \`{ messages, input, handleInputChange, handleSubmit, isLoading }\`.
- Create \`frontend/src/components/rag/RAGChatPanel.tsx\`:
  - Chat interface with message bubbles, typing indicator while streaming.
  - Show source citations below each assistant message.
  - Style with theme CSS variables.
- Add API keys to \`.env.example\`.`,
  },
  {
    id: 'rag-pathway',
    name: 'Pathway',
    description: 'Streaming/real-time RAG with incremental indexing — knowledge base updates live as sources change',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    packages: { pip: 'pathway' },
    icon: 'activity',
    group: 'Streaming / UI',
    integrationPrompt: `Integrate Pathway for real-time streaming RAG.
- Add \`pathway\` to \`backend/requirements.txt\`.
- Create \`backend/app/rag/streaming_rag.py\`:
  - Configure a Pathway pipeline that:
    - Watches a document directory for changes (new files, updates, deletions).
    - Incrementally re-indexes changed documents (no full re-index needed).
    - Maintains a live vector index that updates in real-time.
  - \`setup_pipeline(watch_dir: str, index_path: str)\` — configure and start the pipeline.
  - \`query(question: str) -> StreamingResult\` — query against the live index.
- Add endpoint \`POST /api/rag/stream/query\` in \`backend/app/routes/rag.py\`:
  - Queries the live index, returns results reflecting latest document state.
- Add endpoint \`GET /api/rag/stream/status\` returning pipeline health and indexing stats.
- Create a watched documents directory: \`data/documents/\` with a \`.gitkeep\`.
- Best for: knowledge bases that change frequently and need answers reflecting the latest state.`,
  },
  {
    id: 'rag-similarity-search',
    name: 'Similarity Search',
    description: 'Fast semantic search over pre-generated embeddings — <100ms response, $0 cost, REST API wrapper',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'search',
    group: 'Streaming / UI',
    integrationPrompt: `Integrate fast similarity search as a REST API.
- Create \`backend/app/rag/similarity_search.py\` adapting the similarity_search_cli pattern:
  - Class \`SimilaritySearcher\` operating on pre-generated embedding files:
    - \`load_embeddings(path: str)\` — load pre-computed embeddings from JSON/numpy file.
    - \`search(query_vector: list[float], top_k: int = 10) -> list[Match]\` — cosine similarity, <100ms.
    - \`search_text(query: str, embedder, top_k: int = 10)\` — embed query, then search.
    - \`Match = { id: str, score: float, metadata: dict }\`.
  - Uses numpy for fast vectorized cosine computation. No external vector DB needed.
  - For datasets <100K items, this is faster and simpler than Chroma/Qdrant.
- Add endpoint \`POST /api/rag/fast-search\` in \`backend/app/routes/rag.py\`:
  - Accepts \`{ query: str, top_k?: int }\`, returns matches in <100ms.
- Load embeddings into memory on startup for instant search.`,
  },

  // =========================================================================
  // KG Utilities — Agents Tab (7)
  // =========================================================================
  {
    id: 'rag-util-kg-importer',
    name: 'KG Importer',
    description: 'Imports tier-3 KG extraction JSON into SQLite — handles schema mapping and deduplication',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'download',
    group: undefined,
    integrationPrompt: `Run the KG Importer on the project.
- Import structured data (JSON, CSV) into the project's SQLite knowledge graph.
- Map source schema fields to KG node/edge properties.
- Handle deduplication: skip nodes that already exist (match by ID or name).
- Report: nodes imported, edges created, duplicates skipped, schema mapping used.
- Display import summary in the chat.`,
  },
  {
    id: 'rag-util-kg-merger',
    name: 'KG Merger',
    description: 'Merges two knowledge graphs with namespace prefixes, deduplication, and conflict resolution',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'git-merge',
    group: undefined,
    integrationPrompt: `Run the KG Merger to combine knowledge graphs.
- Merge a source KG into the project's target KG.
- Apply namespace prefixes to avoid ID collisions.
- Deduplicate: match nodes by name/type similarity, merge properties.
- Resolve conflicts: when both KGs have the same node with different properties, prefer the newer/more complete version.
- Report: nodes merged, edges merged, conflicts resolved, new unique nodes.
- Display merge report in the chat.`,
  },
  {
    id: 'rag-util-kg-validator',
    name: 'KG Validate Rules',
    description: 'CI-oriented architecture validator — checks KG against defined rules and constraints',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'check-circle',
    group: undefined,
    integrationPrompt: `Run KG validation rules on the project's knowledge graph.
- Check the KG against structural rules:
  - No orphan nodes (every node must have at least one edge).
  - No self-referencing edges.
  - Required properties present on all nodes (id, name, type at minimum).
  - Edge types are from the allowed set (DEPENDS_ON, IMPLEMENTS, USES, etc.).
  - No duplicate edges between the same node pair with the same type.
- Report: rules checked, violations found (with node/edge IDs), severity per violation.
- Display validation report in the chat as a pass/fail checklist.`,
  },
  {
    id: 'rag-util-persist-kg',
    name: 'Persist to KG',
    description: 'Strategic subset selection — decides which data is worth persisting to the knowledge graph',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'save',
    group: undefined,
    integrationPrompt: `Run the Persist to KG selector on new data.
- Analyze incoming data (documents, API responses, user interactions) and decide what's worth indexing in the KG.
- Selection criteria: novelty (not already in KG), relevance (matches project domain), quality (well-structured, has entities and relationships).
- Score each item: persist score 0-1, with threshold at 0.6.
- For items above threshold: extract entities and relationships, add to KG.
- Report: items analyzed, items persisted, items skipped (with reasons).
- Display selection summary in the chat.`,
  },
  {
    id: 'rag-util-intent-keywords',
    name: 'Add Intent Keywords',
    description: 'Enriches KG nodes with multi-level intent keywords for improved retrieval precision',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'tag',
    group: undefined,
    integrationPrompt: `Run intent keyword enrichment on the knowledge graph.
- For each node in the KG, generate multi-level intent keywords:
  - Level 1: Direct keywords (what the node IS).
  - Level 2: Usage keywords (what the node is USED FOR).
  - Level 3: Related keywords (what the node CONNECTS TO).
- Store keywords as a node property: \`intent_keywords: { l1: list, l2: list, l3: list }\`.
- These keywords improve retrieval: when a user query matches L2/L3 keywords, the node surfaces even without direct text match.
- Report: nodes enriched, keywords generated per level, coverage percentage.
- Display enrichment summary in the chat.`,
  },
  {
    id: 'rag-util-kg-impact',
    name: 'KG Impact Analyzer',
    description: 'BFS change-impact analysis — shows what breaks or is affected if you modify a KG node',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'alert-triangle',
    group: undefined,
    integrationPrompt: `Run impact analysis on a KG node.
- Given a target node, perform BFS traversal to find all affected nodes:
  - Direct dependents (1 hop).
  - Transitive dependents (2+ hops).
  - Impact severity per affected node (critical if on a dependency path, low if loosely connected).
- Produce an impact report: \`{ target: str, affected_nodes: list[{ id, name, hops, severity }], total_impact: int }\`.
- Visualize as a dependency tree in the chat.
- Useful before modifying or deleting KG nodes to understand blast radius.`,
  },
  {
    id: 'rag-util-rag-fusion',
    name: 'RAG Fusion Analyzer',
    description: 'Evaluates RAG pipeline quality: hybrid search scoring, query expansion, Reciprocal Rank Fusion',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['ai-ml'],
    themes: ['expert'],
    icon: 'bar-chart',
    group: undefined,
    integrationPrompt: `Run RAG Fusion analysis on the retrieval pipeline.
- Evaluate the current RAG pipeline's retrieval quality:
  - Run test queries against the pipeline.
  - Measure: precision@k, recall@k, MRR (Mean Reciprocal Rank).
  - Compare: vector-only vs BM25-only vs hybrid fusion scoring.
  - Test query expansion: does rephrasing the query improve results?
  - Evaluate RRF (Reciprocal Rank Fusion) weighting across retrieval methods.
- Produce a quality report: \`{ metrics: dict, best_method: str, recommendations: list[str] }\`.
- Display results in the chat with metric comparison table.
- Recommend optimal fusion weights based on the test queries.`,
  },
]
```

**Step 2: TypeScript check**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: May fail if registry.ts doesn't import RAG_TOOLS yet. That's OK — Task 2 handles it.

**Step 3: Do NOT commit yet** — wait until Task 2 wires the registry.

---

### Task 2: Register RAG tools in registry.ts

**Files:**
- Modify: `frontend/src/tools/registry.ts:1-11` (imports and catalog)

**Step 1: Add import and spread**

In `registry.ts`, add the import for RAG_TOOLS and include it in the catalog. The file should already have the dedup function and SITE_DEV_TOOLS import from the site-dev plan. Add RAG_TOOLS alongside:

Add this import near the top (after the SITE_DEV_TOOLS import):
```typescript
import { RAG_TOOLS } from './domains/rag'
```

Add `...RAG_TOOLS` to the TOOL_CATALOG dedup array:
```typescript
export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,
  ...RAG_TOOLS,
])
```

**Step 2: TypeScript check**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: PASS — all 32 RAG tools satisfy the ToolEntry interface.

**Step 3: Commit (Tasks 1 + 2 together)**

```bash
git add frontend/src/tools/domains/rag.ts frontend/src/tools/registry.ts
git commit -m "feat(tools): add RAG domain with 32 expert tools in 7 capability groups

- 25 tools in groups: Vector Storage, Embeddings, Retrieval Pipelines,
  Knowledge Graphs, Document Ingestion, Agent Memory, Streaming/UI
- 7 KG utilities in Agents tab
- Custom tools mixed alongside external libs in capability groups
- 14 external (Chroma, Qdrant, Haystack, LangChain, DSPy, LightRAG,
  nano-graphrag, txtai, mem0, RAGatouille, Transformers.js, Vercel AI,
  Pathway) + 11 custom libs + 7 KG utilities"
```

---

### Task 3: Integration verification

**Files:** None (verification only)

**Step 1: TypeScript check (full project)**

Run: `node frontend/node_modules/typescript/bin/tsc --noEmit --pretty -p frontend/tsconfig.json`
Expected: 0 errors

**Step 2: Vite production build**

Run: `node frontend/node_modules/vite/bin/vite.js build --config frontend/vite.config.ts`
Expected: Build succeeds. RAG domain file adds ~25-30KB of tool definitions to the bundle.

**Step 3: Visual verification (if servers are running)**

1. Navigate to the Studio page
2. Open the Tools drawer
3. Switch to the Tools tab
4. Select "AI / ML" from the domain dropdown
5. Verify:
   - 7 capability groups appear in accordion
   - Each group has the correct tools in recommended-first order
   - Custom tools (hybrid_query, context_retrieval, etc.) appear alongside external libs
   - Agents tab shows 7 KG utilities
   - Search works across all RAG tools
6. Select "All Domains" — verify RAG tools appear alongside site-dev tools without duplicates

**Step 4: No commit** — verification only.

---

## Build Order Summary

| Task | What | Files | Depends On |
|------|------|-------|------------|
| 1 | RAG domain file (32 tools) | domains/rag.ts | site-dev plan Tasks 1-3 |
| 2 | Wire into registry | registry.ts | Task 1 |
| 3 | Integration verification | — | All |

**Total commits: 1** (domain file + registry wiring together)

**Prerequisite:** site-dev-plan.md Tasks 1-3 must be implemented first (types.ts `group` field, registry dedup/helpers, domains/ directory).
