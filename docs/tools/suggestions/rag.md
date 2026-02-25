# RAG / Retrieval / Knowledge Graph — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building an app that involves RAG, retrieval, knowledge graphs, semantic search, or embeddings.

## Custom Tools (from docs/tools/)

These are custom-built Python tools from the project's tool collection that are relevant to RAG/retrieval applications.

| Tool | Source Folder | What It Does | Integration Role |
|------|--------------|--------------|-----------------|
| `hybrid_query` | emmbeddings-rag-query-KG/ | Production hybrid search (embedding cosine + BM25 + graph-neighbor boosting) | Backend service |
| `context_retrieval` | emmbeddings-rag-query-KG/ | Intent-aware retrieval engine classifying queries into 6 intent types | Backend service |
| `contextual_embeddings` | emmbeddings-rag-query-KG/ | Self-supervised 256D contextual embedding model with graph-neighbor fusion | Library |
| `embedding_generator_cli` | emmbeddings-rag-query-KG/ | Generates 56D semantic embeddings via keyword-heuristic, Haiku, or hybrid | Library |
| `similarity_search_cli` | emmbeddings-rag-query-KG/ | Fast semantic similarity search over pre-generated embeddings (<100ms, $0) | Backend service |
| `intent_classifier` | emmbeddings-rag-query-KG/ | Rule-based query classifier into 6 intent types with entity extraction | Library |
| `graph_embedder` | emmbeddings-rag-query-KG/ | Graph-structural feature vectors (PageRank, centrality) from SQLite KG | Library |
| `kg-ask` | emmbeddings-rag-query-KG/ | Natural language REPL over a unified KG, 7 query types | Agent |
| `kg-query-unified` | emmbeddings-rag-query-KG/ | Unified query across manual + automated KGs | Backend service |
| `kg-merger` | emmbeddings-rag-query-KG/ | Merges two KGs with namespace prefixes and dedup | Utility |
| `kg-pattern-mapper` | emmbeddings-rag-query-KG/ | Maps patterns to code implementations via cosine similarity | Utility |
| `kg-impact-analyzer` | emmbeddings-rag-query-KG/ | BFS change-impact analysis on KG | Utility |
| `kg-validate-rules` | emmbeddings-rag-query-KG/ | CI-oriented architecture validator against KG | Utility |
| `create_claude_code_kg` | emmbeddings-rag-query-KG/ | SQLite KG builder from JSON templates | Utility |
| `kg-importer` | emmbeddings-rag-query-KG/ | Imports tier-3 KG extraction JSON into SQLite | Utility |
| `perceptual_kg_reasoner` | emmbeddings-rag-query-KG/ | Locality-first KG traversal (2-hop neighborhood) | Library |
| `markov_predictor` | emmbeddings-rag-query-KG/ | Markov chain for "suggested next query" | Library |
| `persist_to_kg` | emmbeddings-rag-query-KG/ | Strategic subset selection for KG indexing | Utility |
| `add_intent_keywords` | emmbeddings-rag-query-KG/ | Enriches KG nodes with multi-level intent keywords | Utility |
| `advanced_rag_fusion` | by category/knowledge/ | RAG pipeline analyzer: hybrid search, query expansion, RRF | Utility |
| `embedding_systems` | by category/knowledge/ | 56D semantic embedding generator (free/Haiku/hybrid) | Utility |
| `graph_engineering` | by category/knowledge/ | KG ingestion with 63D embeddings and relationship extraction | Utility |
| `similarity_search_cli` | by category/knowledge/ | CLI semantic search over embeddings | Utility |
| `kdtree_spatial_index` | agents-misc/ | KD-tree spatial index for KG embeddings in SQLite | Library |
| `ascii_graph_viz` | agents-misc/ | ASCII art KG visualization | Utility |
| `textual_viewer` | agents-misc/ | Terminal UI for KG query results | Utility |
| `parser_adapters` | docs-parsers/ | Unified parser for 15+ file formats for document ingestion | Library |
| `universal_parser` | docs-parsers/ | Schema-first universal parser with batch processing | Library |
| `readme_parser` | docs-parsers/ | Extracts structured entities from README markdown | Library |
| `playbook_indexer` | docs-parsers/ | Indexes PLAYBOOK markdown files into SQLite KG | Utility |
| `coder_blueprints_parser` | docs-parsers/ | Parses Obsidian wiki-link markdown into KG | Utility |

## External Libraries & Modules

From the Phase 5 research catalog (157 libs) and web research.

| Library/Module | Package | What It Does | Why For RAG |
|----------------|---------|--------------|-------------|
| LangChain.js | npm: `langchain` | RAG framework with chains, agents, vector stores | Full RAG pipeline orchestration |
| Chroma | pip: `chromadb` | Embedded vector DB, zero-config | Fastest prototyping for vector search |
| Qdrant | pip: `qdrant-client` | High-performance Rust vector search | Production-scale similarity search |
| Transformers.js | npm: `@xenova/transformers` | Client-side ML inference via ONNX | Browser-side embeddings without server |
| Vercel AI SDK | npm: `ai` | Streaming AI responses with hooks | Real-time RAG answer streaming |

## Frameworks

| Framework | Package | What It Does | Why It Boosts Productivity |
|-----------|---------|--------------|---------------------------|
| LightRAG | pip: `lightrag-hku` | Graph-based RAG with dual-level retrieval | 27K stars, single insert()/query() API |
| Haystack | pip: `haystack-ai` | Modular pipeline-based RAG framework | Lowest token overhead (~1.57k), hybrid search |
| DSPy | pip: `dspy` | "Programming not prompting" — compiles to optimized prompts | Self-optimizing retrieval, 22K stars |
| txtai | pip: `txtai` | All-in-one semantic search + RAG + KG, fully embedded | Zero-infrastructure, perfect for local/edge |
| mem0 | pip: `mem0ai` | Persistent memory layer for agents and RAG | Stateful memory in 3 lines, 41K stars |
| nano-graphrag | pip: `nano-graphrag` | Minimal hackable re-implementation of GraphRAG | ~1000 LOC, easy to modify |
| RAGatouille | pip: `ragatouille` | ColBERT late-interaction retrieval | Token-level matching beats BM25 |
| FlashRAG | pip: `flashrag` | Research toolkit with 36 benchmarks, 23 algorithms | Reproduce/baseline any RAG paper |
| Pathway | pip: `pathway` | Streaming/real-time RAG with incremental indexing | Live-updating knowledge bases |

## Recommended Combinations

- **Quick RAG prototype**: Chroma + LangChain.js + `hybrid_query` (your custom search)
- **Production RAG pipeline**: Qdrant + Haystack + `embedding_generator_cli` + `context_retrieval`
- **Graph-enhanced RAG**: nano-graphrag + `kg-merger` + `graph_embedder` + `perceptual_kg_reasoner`
- **Zero-infrastructure RAG**: txtai + `similarity_search_cli` + `parser_adapters` (document ingestion)
- **Agent memory RAG**: mem0 + DSPy + `intent_classifier` + `markov_predictor`
