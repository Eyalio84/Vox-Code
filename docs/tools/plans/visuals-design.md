# Data Visualization Expert Tools — Design Document

**Date**: 2026-02-25
**Domain**: Data Visualization / Dashboards / Charts / Graphs
**Level**: Expert only (other levels TBD)
**Reference**: `docs/tools/suggestions/visuals.md`

---

## Goal

Add 21 domain-specific tools (15 external libraries/frameworks + 3 custom libraries + 3 agents) to the Expert drawer for data visualization apps, organized by 6 capability groups with the same accordion UI, domain selector, and "Already Added" tracking.

## Architecture Decisions

All site-dev architectural decisions carry forward. Visuals-specific decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Split Charts from Primitives | Charts (Recharts, Tremor, etc.) are ready-to-use; D3/Visx are low-level and require more expertise |
| 2 | shadcn Charts included | Copy-paste (no npm), never marked "Already Added", integrationPrompt copies components |
| 3 | 6 capability groups | Charts & Dashboards, Low-Level Primitives, Network & Graph Viz, Geospatial, Data Grids, Graph Analysis |
| 4 | AG Grid in standalone Data Grids group | It's the only grid tool but visuals-specific prompts (data exploration, dashboard tables) |
| 5 | Custom tools as Graph Analysis group | graph_embedder, kg_reasoner, kg-impact are core visualization libraries, not agents |
| 6 | 3 agents for utility tasks | ASCII graph viz, textual viewer, documentation generator — operational, not integrated |
| 7 | Dedup: AG Grid overlap | `visuals-ag-grid` with visualization-focused prompts (data exploration, dashboard tables) |

## File Structure

```
frontend/src/tools/domains/
├── site-dev.ts       # (already designed)
├── rag.ts            # (already designed)
├── music.ts          # (already designed)
├── games.ts          # (already designed)
├── saas.ts           # (already designed)
└── visuals.ts        # 21 tools (18 in groups + 3 agents)
```

## Tool Inventory — 18 Tools in 6 Capability Groups

### Charts & Dashboards (7)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Recharts** | `visuals-recharts` | external | `npm: recharts` | 1st (recommended) | Declarative React SVG charts: Line, Bar, Area, Pie, Radar with responsive containers |
| **Tremor** | `visuals-tremor` | external | `npm: @tremor/react` | 2nd | Tailwind dashboard components: KPI cards, charts, tables — entire dashboard in minutes |
| **Nivo** | `visuals-nivo` | external | `npm: @nivo/core` | 3rd | Rich chart collection (SVG, Canvas, HTML) with built-in theming and motion |
| **Plotly.js** | `visuals-plotly` | external | `npm: react-plotly.js` | 4th | Interactive scientific charts with hover tooltips, zoom, pan built-in |
| **ECharts** | `visuals-echarts` | external | `npm: echarts` | 5th | Feature-rich charting from Apache: auto-resize, theme support, 60+ chart types |
| **Observable Plot** | `visuals-observable-plot` | external | `npm: @observablehq/plot` | 6th | Grammar-of-graphics marks and scales — extremely concise API for exploratory analysis |
| **shadcn/ui Charts** | `visuals-shadcn-charts` | external | — | 7th | Chart primitives styled with shadcn tokens — zero new deps if using shadcn |

### Low-Level Primitives (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **D3.js** | `visuals-d3` | external | `npm: d3` | 1st (recommended) | Full SVG/Canvas data visualization control: scales, axes, shapes, transitions, layouts |
| **Visx** | `visuals-visx` | external | `npm: @visx/visx` | 2nd | Low-level React D3 primitives — compositional, mix-and-match components |

### Network & Graph Viz (3)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **React Flow** | `visuals-react-flow` | external | `npm: @xyflow/react` | 1st (recommended) | Node-and-edge graph canvas with drag, zoom, custom nodes. 27K stars. |
| **Cytoscape.js** | `visuals-cytoscape` | external | `npm: cytoscape` | 2nd | Graph/network visualization + analysis with 40+ layout algorithms |
| **Sigma.js** | `visuals-sigma` | external | `npm: sigma` | 3rd | WebGL network graph rendering for 100K+ nodes — fastest for large graphs |

### Geospatial (2)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **react-map-gl + MapLibre** | `visuals-maplibre` | external | `npm: react-map-gl` | 1st (recommended) | WebGL maps with React — open-source, Mapbox-compatible |
| **deck.gl** | `visuals-deckgl` | external | `npm: deck.gl` | 2nd | GPU geospatial layers: scatter, heat, arc — millions of points, WebGPU ready |

### Data Grids (1)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **AG Grid** | `visuals-ag-grid` | external | `npm: ag-grid-react` | 1st (recommended) | Data exploration grid: sort, filter, group, paginate, export — for dashboard data tables |

### Graph Analysis (3 custom)
| Tool | ID | Type | Package | Ordering | What "Add" Does |
|------|----|------|---------|----------|--------------------|
| **Graph Embedder** | `visuals-graph-embedder` | custom | — | 1st | Graph structural feature extraction: PageRank, centrality, clustering — feeds into graph visualizations |
| **Perceptual KG Reasoner** | `visuals-kg-reasoner` | custom | — | 2nd | Locality-first graph traversal with 2D projection — generates data for network visualizations |
| **KG Impact Analyzer** | `visuals-kg-impact` | custom | — | 3rd | DOT-format graph export for visualization — converts KG data into Graphviz/Cytoscape format |

## Tool Inventory — 3 Agents (Agents Tab)

| Agent | ID | What It Does |
|-------|----|--------------|
| **ASCII Graph Viz** | `visuals-agent-ascii` | Terminal-based KG visualization for quick graph inspection without a browser |
| **Textual Viewer** | `visuals-agent-textual` | Terminal UI for tabular data display with DataTable component |
| **Documentation Generator** | `visuals-agent-docs` | Generates OpenAPI spec for visualization API endpoints |

## Integration Prompt Structure

Chart tools:
```
Integrate [Tool] for [chart type] visualization.
- Install `[package]`.
- Create `frontend/src/components/charts/[ChartName].tsx` with:
  - [Specific chart configuration]
  - Responsive container with theme-aware colors
  - Data transformation from API response format
- Use CSS variables from the active theme for chart colors and styling.
```

Graph visualization tools:
```
Integrate [Tool] for network/graph visualization.
- Install `[package]`.
- Create graph component with:
  - Node/edge rendering from data source
  - Layout algorithm selection
  - Interaction: click, hover, zoom, pan
  - Custom node/edge renderers for domain data
```

## Gap Analysis

| Gap | Resolution |
|-----|-----------|
| Domain detection | Handled by shared domain selector |
| Already Added | shadcn Charts (no package) + custom tools never marked "Added". All others have npm packages. |
| Dedup with site-dev/saas | AG Grid gets `visuals-ag-grid` with data-exploration-focused prompts |
| Dedup with RAG | graph_embedder, kg_reasoner, kg-impact overlap — visuals versions focus on visualization output, RAG versions focus on retrieval |
| Theme assignment | `themes: ['expert']` |
| Ordering | Recommended-first per group |
| Large Charts group (7) | Fine — charts are the core of this domain, users need to compare options |

## Success Criteria

1. Selecting 'Data Visualization' domain shows 6 collapsible capability groups
2. Charts group shows 7 options from ready-to-use (Recharts) to copy-paste (shadcn)
3. Low-Level Primitives group separates D3/Visx from higher-level chart libraries
4. Network & Graph Viz group shows 3 graph tools from drag-canvas to WebGL
5. shadcn Charts and custom tools are never marked "Added"
6. Graph Analysis custom tools provide visualization-focused prompts
7. Agents tab shows 3 visualization utilities
8. All 21 tools have detailed two-level prompts
9. Accordion, search, and "Already Added" work identically to site-dev
