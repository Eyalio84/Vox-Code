# RAG Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: RAG / Retrieval / Knowledge Graph
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/rag.md`

---

## Goal

Add 32 domain-specific tools (14 external libraries/frameworks + 11 custom libraries + 7 KG utilities) to the Expert drawer for RAG/retrieval/KG apps, organized by 7 capability groups with the same accordion UI, domain selector, and "Already Added" tracking established in the site-dev design.

## Architecture Decisions

All site-dev architectural decisions carry forward (domain file pattern, accordion, dedup, `group` field, `isAdded` tracking). RAG-specific decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Custom tools mixed into capability groups | RAG custom tools are core libraries (hybrid_query, graph_embedder), not just analysis agents — they belong alongside external libs |
| 2 | Agents tab = KG Utilities | Operational/maintenance tools (importer, merger, validator) that manage KGs rather than integrate into apps |
| 3 | 7 capability groups | Vector Storage, Embeddings, Retrieval Pipelines, Knowledge Graphs, Document Ingestion, Agent Memory, Streaming/UI |
| 4 | Custom tools use `category: 'library'` | They ARE libraries you integrate, not agents that analyze code |
| 5 | Curated to best-in-class from 31 custom tools | Dedup overlapping tools (two similarity_search entries, embedding_generator vs embedding_systems), pick strongest per capability |
| 6 | 5 tools dedup with expert.ts | LangChain.js, Chroma, Qdrant, Transformers.js, Vercel AI SDK — RAG versions override with domain-specific prompts |

## File Structure

```
frontend/src/tools/domains/
├── site-dev.ts       # (already designed)
└── rag.ts            # 32 tools (25 in groups + 7 KG utilities)
```

Registry imports `RAG_TOOLS` from `domains/rag.ts` alongside `SITE_DEV_TOOLS`. Dedup handles overlaps.

## Tool Inventory — 25 Tools in 7 Capability Groups

### Vector Storage (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|-----------------|
| **Chroma** | `rag-chroma` | external | `pip: chromadb` | 1st (recommended) | Creates persistent vector collection, upsert/query/delete endpoints, cosine similarity |
| **Qdrant** | `rag-qdrant` | external | `pip: qdrant-client` | 2nd | Sets up Qdrant client, collection with vector config, search/upsert/filter endpoints |

### Embeddings (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|-----------------|
| **Transformers.js** | `rag-transformers-js` | external | `npm: @xenova/transformers` | 1st (recommended) | Client-side embedding pipeline, model download progress, browser ONNX inference |
| **Contextual Embeddings** | `rag-contextual-embeddings` | custom | — | 2nd | Self-supervised 256D embedding model with graph-neighbor fusion, context-aware vectors |
| **Embedding Generator** | `rag-embedding-generator` | custom | — | 3rd | 56D semantic embeddings via keyword-heuristic/Haiku/hybrid, zero-cost local mode |

### Retrieval Pipelines (5)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|-----------------|
| **Haystack** | `rag-haystack` | external | `pip: haystack-ai` | 1st (recommended) | Modular pipeline: document store + retriever + reader + prompt builder, lowest token overhead |
| **LangChain.js** | `rag-langchain` | external | `npm: langchain` | 2nd | Chains + agents + vector store retriever, ConversationalRetrievalQA pattern |
| **DSPy** | `rag-dspy` | external | `pip: dspy` | 3rd | Self-optimizing retrieval modules, compiled prompts, evaluation-driven pipeline |
| **Hybrid Query** | `rag-hybrid-query` | custom | — | 4th | Production hybrid search: embedding cosine + BM25 + graph-neighbor boosting in one call |
| **Context Retrieval** | `rag-context-retrieval` | custom | — | 5th | Intent-aware retrieval classifying queries into 6 types, adapts search strategy per intent |

### Knowledge Graphs (5)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|-----------------|
| **LightRAG** | `rag-lightrag` | external | `pip: lightrag-hku` | 1st (recommended) | Graph-based RAG with dual-level retrieval, single insert()/query() API, 27K stars |
| **nano-graphrag** | `rag-nano-graphrag` | external | `pip: nano-graphrag` | 2nd | Minimal hackable GraphRAG, ~1000 LOC, easy to modify and extend |
| **Graph Embedder** | `rag-graph-embedder` | custom | — | 3rd | Graph-structural feature vectors (PageRank, centrality, clustering coefficient) from SQLite KG |
| **Perceptual KG Reasoner** | `rag-kg-reasoner` | custom | — | 4th | Locality-first KG traversal (2-hop neighborhood) for focused subgraph retrieval |
| **KG-Ask** | `rag-kg-ask` | custom | — | 5th | Natural language REPL over unified KG, 7 query types (search, traverse, explain, compare, etc.) |

### Document Ingestion (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|-----------------|
| **txtai** | `rag-txtai` | external | `pip: txtai` | 1st (recommended) | All-in-one: semantic search + RAG + KG embedded, zero-infrastructure, SQLite-backed |
| **Parser Adapters** | `rag-parser-adapters` | custom | — | 2nd | Unified parser for 15+ formats (PDF, DOCX, HTML, JSON, CSV, MD, etc.) with metadata extraction |
| **Universal Parser** | `rag-universal-parser` | custom | — | 3rd | Schema-first parser with batch processing, validation, and structured output |

### Agent Memory (4)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|-----------------|
| **mem0** | `rag-mem0` | external | `pip: mem0ai` | 1st (recommended) | Persistent memory layer: add(), search(), get_all() — 3-line integration, 41K stars |
| **RAGatouille** | `rag-ragatouille` | external | `pip: ragatouille` | 2nd | ColBERT late-interaction retrieval for token-level matching (beats BM25 on benchmarks) |
| **Intent Classifier** | `rag-intent-classifier` | custom | — | 3rd | Rule-based query classifier into 6 intent types with entity extraction, zero-cost |
| **Markov Predictor** | `rag-markov-predictor` | custom | — | 4th | Markov chain for "suggested next query" based on query history patterns |

### Streaming / UI (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|-----------------|
| **Vercel AI SDK** | `rag-vercel-ai` | external | `npm: ai` | 1st (recommended) | Streaming RAG answers with useChat() hook, real-time token display |
| **Pathway** | `rag-pathway` | external | `pip: pathway` | 2nd | Streaming/real-time RAG with incremental indexing, live-updating knowledge bases |
| **Similarity Search** | `rag-similarity-search` | custom | — | 3rd | Fast semantic search over pre-generated embeddings (<100ms, $0 cost), REST API wrapper |

## Tool Inventory — 7 KG Utilities (Agents Tab)

| Utility | ID | What It Does |
|---------|----|--------------|
| **KG Importer** | `rag-util-kg-importer` | Imports tier-3 KG extraction JSON into SQLite, handles schema mapping |
| **KG Merger** | `rag-util-kg-merger` | Merges two KGs with namespace prefixes and dedup, conflict resolution |
| **KG Validate Rules** | `rag-util-kg-validator` | CI-oriented architecture validator — checks KG against defined rules/constraints |
| **Persist to KG** | `rag-util-persist-kg` | Strategic subset selection for KG indexing — decides what's worth persisting |
| **Add Intent Keywords** | `rag-util-intent-keywords` | Enriches KG nodes with multi-level intent keywords for better retrieval |
| **KG Impact Analyzer** | `rag-util-kg-impact` | BFS change-impact analysis — shows what breaks if you modify a KG node |
| **RAG Fusion Analyzer** | `rag-util-rag-fusion` | RAG pipeline analyzer: evaluates hybrid search quality, query expansion, RRF scoring |

## Integration Prompt Structure

External tools follow the same pattern as site-dev:
```
Integrate [Tool] for [purpose].
- Install `[package]`.
- Create `[exact/file/path]` with [specific setup].
- Wire into [existing component/endpoint].
- Add [ENV_VAR] to `.env.example`.
```

Custom tools have a different pattern — they reference your existing tool implementations:
```
Integrate [Custom Tool] into the RAG pipeline.
- Create `backend/app/rag/[module].py` adapting the [tool_name] pattern:
  - [Specific function/class to implement based on the custom tool's approach]
  - [Configuration: embedding dimensions, similarity thresholds, etc.]
- Add endpoint `POST /api/rag/[action]` in `backend/app/routes/rag.py`.
- Wire into the retrieval chain in `backend/app/rag/chain.py`.
```

KG utility prompts trigger operational actions:
```
Run [Utility] on the project's knowledge graph.
- [Specific operational task: import, merge, validate, analyze].
- Return structured results in the chat.
```

## Gap Analysis (RAG-Specific)

| Gap | Resolution |
|-----|-----------|
| Domain detection | Handled by shared domain selector (site-dev design) |
| Already Added | External tools with packages: check deps. Custom tools without packages: never marked "Added" |
| Conflicts | Chroma vs Qdrant, Haystack vs LangChain vs DSPy are alternatives. AI recommender handles |
| Dedup with expert.ts | 5 overlaps (LangChain.js, Chroma, Qdrant, Transformers.js, Vercel AI SDK). RAG versions use `rag-` prefixed IDs so they coexist — domain-specific prompts shown when RAG domain is selected |
| Theme assignment | `themes: ['expert']` |
| Ordering | Recommended-first per group |

## Success Criteria

1. Selecting 'AI / ML' domain shows 7 collapsible RAG capability groups
2. Each group contains the correct mix of external + custom tools
3. Custom tools without packages are never marked "Added"
4. External tools that overlap with expert.ts use RAG-specific integration prompts
5. Agents tab shows 7 KG utilities
6. All 32 tools have detailed two-level prompts (short description + full integrationPrompt)
7. Accordion, search, and "Already Added" work identically to site-dev
