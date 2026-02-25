# Data Visualization Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 21 data visualization domain tools to the Expert drawer organized by 6 capability groups.

**Architecture:** Single domain file (`visuals.ts`) exports `VISUALS_TOOLS` array with 21 `ToolEntry` objects. Registry imports and dedup merges them. No type or component changes needed — infrastructure from site-dev plan Tasks 1-5 is prerequisite.

**Tech Stack:** TypeScript, existing ToolEntry type system, registry helpers

**Prerequisite:** site-dev plan Tasks 1-5 must be implemented first.

---

### Task 1: Create `frontend/src/tools/domains/visuals.ts`

**Files:**
- Create: `frontend/src/tools/domains/visuals.ts`

**Step 1: Create the domain file with all 21 tool entries**

```typescript
// frontend/src/tools/domains/visuals.ts
import type { ToolEntry } from '../types'

export const VISUALS_TOOLS: ToolEntry[] = [
  // ── Charts & Dashboards (7) ───────────────────────────────────
  {
    id: 'visuals-recharts',
    name: 'Recharts',
    description: 'Declarative React SVG charts — Line, Bar, Area, Pie, Radar with responsive containers. 26K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'recharts' },
    group: 'Charts & Dashboards',
    integrationPrompt: `Integrate Recharts for declarative chart components.
- Install \`npm install recharts\`.
- Create \`frontend/src/components/charts/LineChart.tsx\` with:
  - ResponsiveContainer for auto-sizing
  - LineChart with XAxis, YAxis, CartesianGrid, Tooltip, Legend
  - Multiple Line series with theme-aware colors from CSS variables
  - Custom tooltip component matching the app's design system
- Create \`frontend/src/components/charts/BarChart.tsx\` with:
  - Stacked and grouped bar variants
  - Animated transitions on data change
  - Click handler for drill-down navigation
- Create \`frontend/src/components/charts/PieChart.tsx\` with:
  - Pie/Donut variants with custom labels
  - Active shape on hover for detail display
  - Legend with percentage and value
- Create \`frontend/src/components/charts/AreaChart.tsx\` with:
  - Gradient fills using theme colors
  - Stacked area for composition analysis
  - Brush component for time range selection
- Create \`frontend/src/hooks/useChartData.ts\` with:
  - Data transformation hook: API response -> Recharts format
  - Memoized computation for large datasets
  - Loading/error state handling
- Recharts is built on D3 internally — no D3 knowledge needed.
- Use CSS variables from the active theme for all chart colors.`,
  },
  {
    id: 'visuals-tremor',
    name: 'Tremor',
    description: 'Tailwind dashboard components — KPI cards, charts, tables. Build an entire dashboard in minutes.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: '@tremor/react' },
    group: 'Charts & Dashboards',
    integrationPrompt: `Integrate Tremor for a complete dashboard.
- Install \`npm install @tremor/react\`.
- Create \`frontend/src/components/dashboard/KPICards.tsx\` with:
  - Card, Metric, Text for key performance indicators
  - SparkAreaChart or SparkBarChart for inline trends
  - DeltaBar for period-over-period comparison
  - Color coding: green (up), red (down), gray (neutral)
- Create \`frontend/src/components/dashboard/Charts.tsx\` with:
  - AreaChart for time series (revenue, users, etc.)
  - BarChart for category comparisons
  - DonutChart for composition breakdown
  - All with built-in Legend, Tooltip, responsive sizing
- Create \`frontend/src/components/dashboard/Tables.tsx\` with:
  - Table with BadgeDelta for status indicators
  - Searchable, sortable columns
  - Row click for detail navigation
- Create \`frontend/src/pages/DashboardPage.tsx\` with:
  - Grid layout: KPI cards row, main chart, secondary charts, data table
  - Date range selector for filtering all components
  - Auto-refresh with configurable interval
- Tremor is Tailwind-based — works with your existing Tailwind config.
- Use CSS variables from the active theme for Tailwind color extensions.`,
  },
  {
    id: 'visuals-nivo',
    name: 'Nivo',
    description: 'Rich chart collection (SVG, Canvas, HTML) with built-in theming and motion. Storybook docs.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: '@nivo/core' },
    group: 'Charts & Dashboards',
    integrationPrompt: `Integrate Nivo for themed, animated charts.
- Install \`npm install @nivo/core @nivo/bar @nivo/line @nivo/pie @nivo/heatmap\`.
- Create \`frontend/src/components/charts/nivo-theme.ts\` with:
  - Nivo theme object mapped from CSS variables: background, text, grid, axis colors
  - Font configuration matching the app's typography
  - Tooltip theme matching the app's design system
- Create \`frontend/src/components/charts/NivoLine.tsx\` with:
  - ResponsiveLine with multi-series support
  - Animated transitions, point markers, area fill
  - Custom slice tooltip for comparing series at a time point
- Create \`frontend/src/components/charts/NivoBar.tsx\` with:
  - ResponsiveBar with grouped/stacked modes
  - Custom bar component for gradient fills
  - Label positioning (inside/outside) based on value
- Create \`frontend/src/components/charts/NivoHeatmap.tsx\` with:
  - ResponsiveHeatMap for correlation matrices
  - Color scale from theme palette
  - Cell click handler for drill-down
- Nivo supports SVG (crisp), Canvas (performant for large data), and HTML (accessible).
- Choose renderer based on data size: SVG < 1000 points, Canvas > 1000 points.
- Use CSS variables from the active theme for the Nivo theme configuration.`,
  },
  {
    id: 'visuals-plotly',
    name: 'Plotly.js',
    description: 'Interactive scientific charts — hover tooltips, zoom, pan, 3D, statistical plots built-in.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'react-plotly.js' },
    group: 'Charts & Dashboards',
    integrationPrompt: `Integrate Plotly.js for interactive scientific charts.
- Install \`npm install react-plotly.js plotly.js-basic-dist-min\`.
- Create \`frontend/src/components/charts/PlotlyChart.tsx\` with:
  - Generic Plot component wrapping react-plotly.js
  - Layout configuration: theme colors, font, margin, legend position
  - Config: responsive, displayModeBar with download PNG/SVG
  - onClickData, onHover, onSelect event handlers
- Create \`frontend/src/components/charts/ScatterPlot.tsx\` with:
  - Scatter with marker size/color encoding data dimensions
  - Trendline overlay (linear regression)
  - Hover template showing all data fields
- Create \`frontend/src/components/charts/Histogram.tsx\` with:
  - Distribution histogram with configurable bin size
  - Overlay: normal distribution curve, KDE
  - Box plot alongside for summary statistics
- Create \`frontend/src/components/charts/Heatmap.tsx\` with:
  - 2D heatmap for correlation/frequency data
  - Colorscale from theme palette
  - Annotation with values in cells
- Plotly.js is large (~3MB full). Use plotly.js-basic-dist-min (~1MB) for common chart types.
- Use CSS variables from the active theme for layout colors.`,
  },
  {
    id: 'visuals-echarts',
    name: 'ECharts',
    description: 'Feature-rich charting from Apache — 60+ chart types, auto-resize, theme support.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'echarts' },
    group: 'Charts & Dashboards',
    integrationPrompt: `Integrate ECharts for feature-rich charting.
- Install \`npm install echarts echarts-for-react\`.
- Create \`frontend/src/components/charts/echarts-theme.ts\` with:
  - ECharts theme registered with echarts.registerTheme()
  - Colors mapped from CSS variables
  - Typography matching app fonts
- Create \`frontend/src/components/charts/EChart.tsx\` with:
  - Generic ReactECharts wrapper with auto-resize
  - Theme application from registered theme
  - Loading state with built-in loading animation
  - Event handlers: click, hover, legendselectchanged
- Create \`frontend/src/components/charts/TimeSeriesChart.tsx\` with:
  - Line/area with dataZoom for range selection
  - Multiple Y-axes for different scales
  - markLine/markArea for annotations (thresholds, events)
- Create \`frontend/src/components/charts/GaugeChart.tsx\` with:
  - Gauge for KPI display (progress, utilization, scores)
  - Configurable thresholds with color zones
- ECharts supports tree-shaking: import only needed chart types to reduce bundle.
- Use CSS variables from the active theme for ECharts theme.`,
  },
  {
    id: 'visuals-observable-plot',
    name: 'Observable Plot',
    description: 'Grammar-of-graphics marks and scales — extremely concise API for exploratory data analysis.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: '@observablehq/plot' },
    group: 'Charts & Dashboards',
    integrationPrompt: `Integrate Observable Plot for exploratory data visualization.
- Install \`npm install @observablehq/plot\`.
- Create \`frontend/src/components/charts/ObservablePlot.tsx\` with:
  - React wrapper: useRef + useEffect to render Plot into a DOM container
  - Plot.plot() with marks, scales, and style configuration
  - Responsive: re-render on container resize
  - Theme colors applied via style option
- Create \`frontend/src/components/charts/ExploratoryCharts.tsx\` with:
  - Dot plot: Plot.dot(data, { x: "field1", y: "field2", fill: "category" })
  - Bar mark: Plot.barY(data, Plot.groupX({ y: "count" }, { x: "category" }))
  - Line mark: Plot.line(data, { x: "date", y: "value", stroke: "series" })
  - Faceted plots: Plot.plot({ facet: { data, x: "category" }, marks: [...] })
- Observable Plot is concise — entire charts in 1-3 lines of code.
- Best for: data exploration, rapid prototyping, analysis dashboards.
- Use CSS variables from the active theme for Plot style configuration.`,
  },
  {
    id: 'visuals-shadcn-charts',
    name: 'shadcn/ui Charts',
    description: 'Chart primitives styled with shadcn tokens — zero new deps if already using shadcn/ui.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    group: 'Charts & Dashboards',
    integrationPrompt: `Integrate shadcn/ui Charts for design-system-consistent charts.
- No npm install needed — shadcn charts are copy-paste components built on Recharts.
- Prerequisite: shadcn/ui must be set up in the project.
- Copy chart components using the shadcn CLI:
  - \`npx shadcn@latest add chart\` (base chart component)
- Create \`frontend/src/components/charts/AreaChart.tsx\` with:
  - ChartContainer with chartConfig for consistent theming
  - Recharts AreaChart wrapped with shadcn's ChartTooltip, ChartLegend
  - Colors from CSS variables: --chart-1 through --chart-5
- Create \`frontend/src/components/charts/BarChart.tsx\` with:
  - Stacked/grouped variants using shadcn chart tokens
  - ChartTooltipContent with custom formatters
- Create \`frontend/src/components/charts/RadialChart.tsx\` with:
  - Radial/donut chart using Recharts RadialBarChart
  - Center label with total/percentage
- shadcn Charts use Recharts internally but with your design system's tokens.
- Note: No npm package — cannot be detected by "Already Added" logic.
- Colors are defined in globals.css: --chart-1, --chart-2, etc.`,
  },

  // ── Low-Level Primitives (2) ──────────────────────────────────
  {
    id: 'visuals-d3',
    name: 'D3.js',
    description: 'The gold standard for data visualization — total SVG/Canvas control with scales, axes, shapes, layouts.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'd3' },
    group: 'Low-Level Primitives',
    integrationPrompt: `Integrate D3.js for custom data visualization.
- Install \`npm install d3\` and \`npm install -D @types/d3\`.
- Create \`frontend/src/components/viz/D3Container.tsx\` with:
  - React ref-based D3 integration (useRef + useEffect for D3 rendering)
  - SVG container with responsive viewBox
  - Cleanup: remove D3 selections on unmount/re-render
- Create \`frontend/src/components/viz/scales.ts\` with:
  - Scale factories: scaleLinear, scaleTime, scaleBand, scaleOrdinal
  - Color scales from theme CSS variables
  - Axis generators: axisBottom, axisLeft with tick formatting
- Create \`frontend/src/components/viz/CustomViz.tsx\` with:
  - Example custom visualization: force-directed graph, treemap, sunburst, or chord diagram
  - Data join pattern: selectAll().data().join(enter, update, exit)
  - Transitions: .transition().duration(300) for animated updates
  - Interaction: mouseover tooltips, click handlers, brush selection
- D3 gives total control but requires more code than declarative libraries.
- Best for: unique visualizations that don't fit standard chart types.
- IMPORTANT: In React, use D3 for computation (scales, layouts) and React for rendering when possible.
- Use CSS variables from the active theme for all D3 color scales.`,
  },
  {
    id: 'visuals-visx',
    name: 'Visx',
    description: 'Low-level React D3 primitives — compositional, mix-and-match chart building blocks from Airbnb.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: '@visx/visx' },
    group: 'Low-Level Primitives',
    integrationPrompt: `Integrate Visx for compositional chart primitives.
- Install \`npm install @visx/visx\` (or individual packages: @visx/shape, @visx/scale, @visx/axis, @visx/group).
- Create \`frontend/src/components/viz/VisxChart.tsx\` with:
  - SVG container with ParentSize for responsive sizing
  - Group for margin management
  - scaleLinear/scaleTime/scaleBand for data mapping
  - AxisBottom, AxisLeft with theme-aware tick styling
- Create \`frontend/src/components/viz/VisxLine.tsx\` with:
  - LinePath from @visx/shape with curve interpolation
  - Circle markers at data points
  - Tooltip using @visx/tooltip: useTooltip, TooltipWithBounds
  - Voronoi overlay for nearest-point tooltip detection
- Create \`frontend/src/components/viz/VisxBar.tsx\` with:
  - Bar groups using @visx/shape BarGroup/BarStack
  - Animated transitions using @visx/react-spring
  - Gradient fills using @visx/gradient
- Visx is the React-native way to use D3 — each primitive is a React component.
- Tree-shakeable: import only @visx/shape, @visx/scale etc. for minimal bundle.
- Use CSS variables from the active theme for colors and typography.`,
  },

  // ── Network & Graph Viz (3) ───────────────────────────────────
  {
    id: 'visuals-react-flow',
    name: 'React Flow',
    description: 'Node-and-edge graph canvas with drag, zoom, custom nodes, minimap. 27K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: '@xyflow/react' },
    group: 'Network & Graph Viz',
    integrationPrompt: `Integrate React Flow for interactive node graphs.
- Install \`npm install @xyflow/react\`.
- Create \`frontend/src/components/graph/FlowCanvas.tsx\` with:
  - ReactFlow component with nodes and edges state
  - MiniMap for overview navigation
  - Controls for zoom in/out/fit
  - Background with dots or lines pattern
  - onNodesChange, onEdgesChange for state updates
  - onConnect for creating new edges via drag
- Create \`frontend/src/components/graph/nodes/\` with:
  - CustomNode.tsx: themed node with handles, label, icon
  - GroupNode.tsx: container node for nested graphs
  - InputNode.tsx: node with form inputs for data flow diagrams
  - Each node uses CSS variables for border, background, text colors
- Create \`frontend/src/components/graph/edges/\` with:
  - CustomEdge.tsx: animated edge with label and delete button
  - BezierEdge, StepEdge, SmoothStepEdge variants
- Create \`frontend/src/hooks/useFlowData.ts\` with:
  - Data conversion: API data -> React Flow nodes/edges format
  - Layout algorithm: dagre or elkjs for automatic positioning
  - Save/load graph state
- React Flow is for editable, interactive graphs (workflows, diagrams, editors).
- Use CSS variables from the active theme for all node/edge styling.`,
  },
  {
    id: 'visuals-cytoscape',
    name: 'Cytoscape.js',
    description: 'Graph/network visualization + analysis with 40+ layout algorithms.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'cytoscape' },
    group: 'Network & Graph Viz',
    integrationPrompt: `Integrate Cytoscape.js for network visualization and analysis.
- Install \`npm install cytoscape\` and \`npm install -D @types/cytoscape\`.
- Install layout extensions: \`npm install cytoscape-dagre cytoscape-cola cytoscape-fcose\`.
- Create \`frontend/src/components/graph/CytoscapeGraph.tsx\` with:
  - Cytoscape instance with container ref
  - Elements (nodes + edges) from data source
  - Layout selection: dagre (hierarchical), cola (force), fcose (compound), grid, circle
  - Style mapping: node color/size from data properties, edge thickness from weight
  - Interaction: tap (select), mouseover (highlight neighbors), box select
- Create \`frontend/src/components/graph/cytoscape-style.ts\` with:
  - Stylesheet using theme CSS variables for colors
  - Node styles: background-color, label, shape, size by data.type
  - Edge styles: line-color, curve-style, target-arrow-shape
  - Selection styles: highlighted border, dimmed non-neighbors
- Create \`frontend/src/hooks/useCytoscape.ts\` with:
  - React hook managing Cytoscape lifecycle
  - Analysis functions: degree centrality, betweenness, PageRank, shortest path
  - Export: PNG, JSON, GraphML
- Cytoscape.js is for analytical graph visualization — better analysis APIs than React Flow.
- Use CSS variables from the active theme for graph styling.`,
  },
  {
    id: 'visuals-sigma',
    name: 'Sigma.js',
    description: 'WebGL network graph rendering for 100K+ nodes — the fastest graph renderer for the browser.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'sigma' },
    group: 'Network & Graph Viz',
    integrationPrompt: `Integrate Sigma.js for large-scale graph rendering.
- Install \`npm install sigma graphology\`.
- Create \`frontend/src/components/graph/SigmaGraph.tsx\` with:
  - Sigma renderer with graphology graph instance
  - WebGL canvas for rendering 100K+ nodes smoothly
  - ForceAtlas2 layout algorithm for automatic positioning
  - Node rendering: size by degree, color by community, label above threshold zoom
  - Edge rendering: curved, color from source node, thickness by weight
- Create \`frontend/src/components/graph/sigma-controls.tsx\` with:
  - Zoom in/out/fit buttons
  - Search: find node by label, zoom to it
  - Filter: show/hide nodes by attribute (type, community, degree)
  - Layout toggle: start/stop ForceAtlas2
- Create \`frontend/src/hooks/useSigma.ts\` with:
  - React hook wrapping Sigma lifecycle
  - Event handlers: clickNode, enterNode, leaveNode
  - Camera controls: animateToNode(), resetCamera()
  - Data loading: from JSON, GraphML, or API
- Sigma.js uses graphology for the graph data structure — all graph algorithms available.
- Best for: large graphs (10K-1M nodes) where React Flow or Cytoscape would lag.
- Use CSS variables from the active theme for node/edge default colors.`,
  },

  // ── Geospatial (2) ────────────────────────────────────────────
  {
    id: 'visuals-maplibre',
    name: 'react-map-gl + MapLibre',
    description: 'WebGL maps with React — open-source, Mapbox-compatible, no API key required for self-hosted tiles.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'react-map-gl' },
    group: 'Geospatial',
    integrationPrompt: `Integrate react-map-gl with MapLibre for interactive maps.
- Install \`npm install react-map-gl maplibre-gl\`.
- Create \`frontend/src/components/map/MapView.tsx\` with:
  - Map component with MapLibre as mapLib
  - Initial viewport: center coordinates, zoom level
  - Map style: free tile providers (OpenStreetMap, Stamen, CARTO)
  - Navigation controls: zoom, rotation, pitch
  - GeolocateControl for user location
- Create \`frontend/src/components/map/Markers.tsx\` with:
  - Marker component for point locations
  - Popup component on marker click with detail info
  - Clustered markers for dense point data
- Create \`frontend/src/components/map/Layers.tsx\` with:
  - Source + Layer for GeoJSON data overlay
  - Fill layer for choropleth maps (regions colored by value)
  - Heatmap layer for density visualization
  - Line layer for routes/paths
- Create \`frontend/src/hooks/useMapData.ts\` with:
  - GeoJSON data loading and transformation
  - Viewport state management
  - Geocoding integration (optional: Nominatim for free)
- MapLibre is open-source — no Mapbox API key needed if using free tile providers.
- Use CSS variables from the active theme for popup/control styling.`,
  },
  {
    id: 'visuals-deckgl',
    name: 'deck.gl',
    description: 'GPU geospatial layers — scatter, heat, arc, hexagon. Renders millions of points. WebGPU ready.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'deck.gl' },
    group: 'Geospatial',
    integrationPrompt: `Integrate deck.gl for GPU-accelerated geospatial visualization.
- Install \`npm install deck.gl @luma.gl/core\`.
- Create \`frontend/src/components/map/DeckGLMap.tsx\` with:
  - DeckGL component overlaid on react-map-gl base map
  - Layer stack: ScatterplotLayer, HeatmapLayer, ArcLayer, HexagonLayer
  - ViewState management: longitude, latitude, zoom, pitch, bearing
  - Picking: onHover and onClick for interactive layers
- Create \`frontend/src/components/map/layers/\` with:
  - ScatterLayer.tsx: colored points with size encoding (1M+ points)
  - HexbinLayer.tsx: aggregated hexagonal bins with height/color by count
  - ArcLayer.tsx: origin-destination flow visualization
  - TripsLayer.tsx: animated paths for trajectory data
  - Each layer: data source, accessor functions, color scale from theme
- Create \`frontend/src/hooks/useDeckData.ts\` with:
  - Large dataset loading with streaming (deck.gl handles millions of rows)
  - Data transformation for layer-specific formats
  - Filter controls: time range, category, value range
- deck.gl renders on the GPU — handles 1M+ points smoothly.
- Combine with react-map-gl for base map + deck.gl layers on top.
- Use CSS variables from the active theme for tooltip/control styling.`,
  },

  // ── Data Grids (1) ────────────────────────────────────────────
  {
    id: 'visuals-ag-grid',
    name: 'AG Grid',
    description: 'Enterprise data grid for data exploration — sort, filter, group, paginate, export.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['visuals'],
    themes: ['expert'],
    packages: { npm: 'ag-grid-react' },
    group: 'Data Grids',
    integrationPrompt: `Integrate AG Grid for data exploration tables.
- Install \`npm install ag-grid-react ag-grid-community\`.
- Create \`frontend/src/components/grid/DataExplorer.tsx\` with:
  - AgGridReact with auto-sized columns from data schema
  - Column types: text, number, date, boolean with appropriate filters
  - Quick filter: global search across all columns
  - Column grouping: drag columns to group bar for pivot-table behavior
  - Row selection: checkbox column for multi-select + bulk actions
  - Export: CSV and Excel download buttons
- Create \`frontend/src/components/grid/grid-theme.ts\` with:
  - AG Grid theme parameters from CSS variables:
    --ag-background-color, --ag-header-background-color,
    --ag-row-hover-color, --ag-selected-row-background-color
  - Font configuration matching app typography
- Create \`frontend/src/hooks/useGridData.ts\` with:
  - Server-side row model for large datasets
  - Data source: getRows() calls API with sort/filter params
  - Infinite scroll with configurable page size
  - Cache management for previously loaded rows
- AG Grid Community is free. Enterprise features (pivoting, charts, Excel export) require license.
- Use CSS variables from the active theme for grid styling.`,
  },

  // ── Graph Analysis (3 custom) ─────────────────────────────────
  {
    id: 'visuals-graph-embedder',
    name: 'Graph Embedder',
    description: 'Graph structural feature extraction — PageRank, centrality, clustering coefficient for visualization data.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['visuals'],
    themes: ['expert'],
    group: 'Graph Analysis',
    integrationPrompt: `Integrate Graph Embedder for visualization-ready graph metrics.
- Create \`backend/app/viz/graph_metrics.py\` adapting the graph_embedder pattern:
  - PageRank computation: node importance scores for size encoding in visualization
  - Betweenness centrality: identify bridge nodes, highlight in graph viz
  - Clustering coefficient: community density for color encoding
  - Degree distribution: histogram data for companion chart
  - Output format: { nodeId, pagerank, centrality, clustering, degree } for each node
- Add endpoint \`GET /api/viz/graph-metrics?source=\` with:
  - Compute metrics from graph data source (SQLite KG, JSON, API)
  - Return metrics array for direct consumption by Cytoscape/Sigma/React Flow
  - Cache results (graph metrics are expensive to compute)
- Wire into graph visualization components: node.size = pagerank, node.color = community.`,
  },
  {
    id: 'visuals-kg-reasoner',
    name: 'Perceptual KG Reasoner',
    description: 'Locality-first graph traversal with 2D projection — generates subgraph data for focused visualizations.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['visuals'],
    themes: ['expert'],
    group: 'Graph Analysis',
    integrationPrompt: `Integrate Perceptual KG Reasoner for focused graph visualization.
- Create \`backend/app/viz/subgraph_extractor.py\` adapting the perceptual_kg_reasoner pattern:
  - 2-hop neighborhood extraction: given a focus node, extract its local subgraph
  - 2D projection: assign x,y coordinates to nodes for deterministic layout
  - Edge weighting: stronger connections placed closer in projection
  - Pruning: remove low-importance edges to reduce visual clutter
  - Output: { nodes: [{id, label, x, y, size}], edges: [{source, target, weight}] }
- Add endpoint \`GET /api/viz/subgraph?focus=&hops=2\` with:
  - Extract subgraph centered on focus node
  - Return pre-laid-out graph data for immediate rendering
  - Supports Cytoscape, Sigma, React Flow formats
- Use for: "show me everything connected to this entity" explorations.`,
  },
  {
    id: 'visuals-kg-impact',
    name: 'KG Impact Analyzer',
    description: 'DOT-format graph export — converts KG data to Graphviz/Cytoscape-compatible format for visualization.',
    category: 'library',
    level: 'expert',
    side: 'backend',
    domains: ['visuals'],
    themes: ['expert'],
    group: 'Graph Analysis',
    integrationPrompt: `Integrate KG Impact Analyzer for graph export and impact visualization.
- Create \`backend/app/viz/graph_export.py\` adapting the kg-impact-analyzer pattern:
  - DOT export: convert graph data to Graphviz DOT format
  - JSON export: Cytoscape.js elements format, Sigma graphology format
  - GraphML export: standard XML format for graph interchange
  - BFS impact analysis: starting from a changed node, trace all affected nodes
  - Impact visualization data: { changed: [nodes], affected: [nodes], edges: [connections] }
- Add endpoint \`POST /api/viz/graph-export\` with:
  - Accept: format (dot, json, graphml), scope (full, subgraph), focus node
  - Return: exported graph in requested format
- Add endpoint \`GET /api/viz/impact?node=&depth=\` with:
  - BFS traversal from node to specified depth
  - Return impact tree with severity levels (direct, indirect, distant)
- Wire into graph visualization: highlight affected nodes in red, unaffected in gray.`,
  },

  // ── Agents (3) ────────────────────────────────────────────────
  {
    id: 'visuals-agent-ascii',
    name: 'ASCII Graph Viz',
    description: 'Terminal-based graph visualization — quick KG inspection without a browser.',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['visuals'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run ASCII Graph Viz for terminal graph inspection.
- Render graph data as ASCII art in the terminal.
- Node display: [label] with connections shown as arrows (-->).
- Layout: hierarchical or radial ASCII layout.
- Useful for: quick debugging, SSH sessions, CI/CD pipeline output.
- Return formatted ASCII graph in the chat.`,
  },
  {
    id: 'visuals-agent-textual',
    name: 'Textual Viewer',
    description: 'Terminal UI for tabular data display — DataTable with sorting, filtering in the terminal.',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['visuals'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Textual Viewer for terminal data inspection.
- Display data in a formatted table using Textual DataTable.
- Features: column sorting, row selection, search/filter.
- Useful for: data inspection during development, SSH sessions.
- Return instructions for running the Textual viewer.`,
  },
  {
    id: 'visuals-agent-docs',
    name: 'Documentation Generator',
    description: 'Generates OpenAPI spec for visualization API endpoints — interactive Swagger/ReDoc documentation.',
    category: 'agent',
    level: 'expert',
    side: 'backend',
    domains: ['visuals'],
    themes: ['expert'],
    group: 'Agents',
    integrationPrompt: `Run Documentation Generator for visualization endpoints.
- Analyze all /api/viz/* endpoints in the backend.
- Generate OpenAPI 3.0 specification with:
  - Endpoint descriptions, parameter schemas, response examples
  - Chart data format documentation
  - Graph export format documentation
- Output: openapi.yaml or interactive Swagger UI endpoint.
- Return documentation summary in the chat.`,
  },
]
```

**Step 2: Verify no TypeScript errors**

Run: `cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to visuals.ts

**Step 3: Commit**

```bash
git add frontend/src/tools/domains/visuals.ts
git commit -m "feat(tools): add data visualization domain with 21 expert tools in 6 capability groups"
```

---

### Task 2: Register Visuals Tools in Registry

**Files:**
- Modify: `frontend/src/tools/registry.ts`

**Step 1: Add import and spread**

```typescript
import { VISUALS_TOOLS } from './domains/visuals'

export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,
  ...RAG_TOOLS,
  ...MUSIC_TOOLS,
  ...GAMES_TOOLS,
  ...SAAS_TOOLS,
  ...VISUALS_TOOLS,
])
```

**Step 2: Verify no duplicate IDs**

All visuals tool IDs use `visuals-` prefix. Verify:
```bash
grep -c "visuals-" src/tools/domains/visuals.ts
```
Expected: 21

**Step 3: Commit**

```bash
git add frontend/src/tools/registry.ts
git commit -m "feat(tools): register data visualization domain tools in registry"
```

---

### Task 3: Integration Verification

**Step 1: Verify ToolDomain includes visuals**

Check `types.ts` for a visuals-related domain value. Add if missing.

**Step 2: Verify tool counts**

Expected groups:
```
Charts & Dashboards: 7
Low-Level Primitives: 2
Network & Graph Viz: 3
Geospatial: 2
Data Grids: 1
Graph Analysis: 3
Agents: 3
Total: 21
```

**Step 3: Commit if fixes needed**

```bash
git add -A
git commit -m "fix(tools): data visualization domain integration fixes"
```
