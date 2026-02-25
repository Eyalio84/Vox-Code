# Data Visualization — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building an app that involves data visualization, dashboards, charts, or network graphs.

---

## Custom Tools

| Tool | Source | Description | Type |
|------|--------|-------------|------|
| `ascii_graph_viz` | agents-misc | ASCII art KG visualization in terminal | Utility |
| `textual_viewer` | agents-misc | Terminal UI for data display with DataTable | Utility |
| `kdtree_spatial_index` | agents-misc | KD-tree for spatial data queries | Library |
| `graph_embedder` | embeddings-rag-query-KG | Graph structural feature extraction (PageRank, centrality) | Library |
| `perceptual_kg_reasoner` | embeddings-rag-query-KG | Locality-first graph traversal with 2D projection | Library |
| `kg-impact-analyzer` | embeddings-rag-query-KG | DOT-format graph export for visualization | Utility |
| `documentation_generator` | docs-parsers | OpenAPI spec output for API documentation viz | Library |

---

## External Libraries

| Library | Package | Description | Why |
|---------|---------|-------------|-----|
| D3.js | npm: `d3` | Low-level SVG/Canvas data viz | Total control, the gold standard |
| Plotly.js | npm: `react-plotly.js` | Interactive scientific charts | Hover tooltips, zoom, pan built-in |
| ECharts | npm: `echarts` | Feature-rich charting from Apache | Auto-resize, theme support |
| Cytoscape.js | npm: `cytoscape` | Graph/network visualization + analysis | 40+ layout algorithms |
| AG Grid | npm: `ag-grid-react` | Enterprise data grid | Sort, filter, group, paginate |

---

## Frameworks

| Framework | Package | Description | Why |
|-----------|---------|-------------|-----|
| Recharts | npm: `recharts` | React SVG charts (line, bar, area, pie) | 26K stars, declarative API, no D3 knowledge needed |
| Visx | npm: `@visx/visx` | Low-level React D3 primitives | Compositional, mix-and-match |
| Nivo | npm: `@nivo/core` | Rich chart collection (SVG, Canvas, HTML) | Storybook docs, built-in theming and motion |
| Tremor | npm: `@tremor/react` | Tailwind dashboard components (KPI cards, charts) | Entire dashboard in minutes, shadcn compatible |
| shadcn/ui Charts | (copy-paste, built on recharts) | Chart primitives styled with shadcn tokens | Zero new deps if using shadcn |
| Observable Plot | npm: `@observablehq/plot` | Grammar-of-graphics marks and scales | Extremely concise API, exploratory analysis |
| react-map-gl + MapLibre | npm: `react-map-gl`, `maplibre-gl` | WebGL maps with React | Open-source, Mapbox-compatible |
| deck.gl | npm: `deck.gl` | GPU geospatial layers (scatter, heat, arc) | Millions of points, WebGPU ready |
| React Flow | npm: `@xyflow/react` | Node-and-edge graph canvas | Drag, zoom, custom nodes, 27K stars |
| Sigma.js | npm: `sigma` | WebGL network graph rendering (100K+ nodes) | Fastest for large graphs |

---

## Recommended Combinations

- **Dashboard**: Tremor + Recharts + AG Grid
- **Scientific visualization**: Plotly.js + Observable Plot + D3.js (custom)
- **Network/graph app**: React Flow + Cytoscape.js + `graph_embedder` + `perceptual_kg_reasoner`
- **Geospatial**: deck.gl + react-map-gl + MapLibre
- **KG visualizer**: Sigma.js + `kg-impact-analyzer` (DOT export) + `ascii_graph_viz` (terminal fallback)
- **Data exploration**: Nivo + Visx + `documentation_generator` (API docs)
