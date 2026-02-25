# Phase 8: Visual Agent Builder + Claude Code Integration — Placeholder

> **Status**: Placeholder — design and planning TBD after Phase 7.

**Goal:** A visual studio for building Claude Code agents, skills, hooks, and workflows — with a node-based pipeline editor, capability configuration panels, JSON export, and a native Claude Code slash command (`/agent-json`) that auto-installs the result.

---

## The Idea (Two Parts)

### Part 1: Visual Agent Builder (in A(Us) Studio)

A panel-based visual editor for constructing Claude Code agentic workflows:

- **Capability Panel** — Radio buttons / cards for each Claude Code capability:
  - `AskUserQuestion` tool
  - `effort` level configuration
  - `thinking-budget` (token allocation for extended thinking)
  - Tool permissions (Read, Write, Edit, Bash, Glob, Grep, WebSearch, etc.)
  - Hook events (PreToolUse, PostToolUse, Stop, SessionStart, etc.)
  - Subagent definitions
  - MCP server connections
  - Skill references
  - Slash command definitions
  - And many more...

- **Config Panels** — Each capability button opens a dedicated configuration UI:
  - Effort → slider/selector for effort level
  - Thinking budget → token budget configurator
  - Tools → permission checkboxes with descriptions
  - Hooks → event selector + handler editor
  - etc.

- **"Add to Pipeline" Button** — Adds the configured capability as a node in the visual workflow

- **Pipeline Canvas** — Node-based editor showing connected capabilities as a visual workflow
  - Drag, connect, reorder nodes
  - Conditional branching (if/else)
  - Parallel execution paths
  - Node previews showing configuration summary

- **Save/Load** — Persist pipelines within A(Us) Studio for iteration

- **Export as JSON** — Serialize the entire pipeline to a structured JSON file

### Part 2: Claude Code Native Agent (`/agent-json`)

A custom Claude Code agent + slash command specifically designed to consume the exported JSON:

```bash
claude /agent-json workflow.json
```

What it does:
1. Reads the exported JSON pipeline
2. Understands the full structure (agent definition, skills, hooks, commands, MCP config)
3. Automatically generates the correct files:
   - `.claude/commands/<name>.md` for slash commands
   - `.claude/skills/<name>.md` for skills (with correct frontmatter)
   - `.claude/settings.json` updates for hooks
   - Agent system prompts and tool configurations
4. Installs everything into Claude Code
5. Reports what was created and how to use it

---

## Why This Is Powerful

1. **No visual Claude Code agent builder exists** — All current agent/skill creation is manual markdown/JSON editing
2. **Full lifecycle** — Build visually → Configure → Export JSON → One command install → Running agent
3. **Democratizes agent creation** — Non-experts can build sophisticated Claude Code workflows
4. **Self-reinforcing** — A(Us) Studio builds apps AND builds the agents that help build apps
5. **Extensible** — The node editor can grow to support any new Claude Code feature

## Key Design Questions (for future brainstorming)

1. **Node editor library** — React Flow? Custom canvas? What fits the existing theme system?
2. **JSON schema** — What structure makes it reliable for the Claude Code agent to reconstruct?
3. **Capability inventory** — Complete list of configurable Claude Code capabilities
4. **Validation** — How to preview/test a pipeline before export?
5. **Versioning** — How to handle Claude Code API changes that affect the schema?
6. **Templates** — Pre-built agent pipeline templates (code reviewer, debugger, test writer)?

## Builds On

- **Phase 4** (Studio Core) — Panel layout, Sandpack preview pattern
- **Phase 5** (Tool Drawer) — Capability selector UI, tool registry
- **Phase 6** (Domain Tools) — Tool configuration patterns, accordion groups
- **Phase 7** (AI Studio Apps) — Export/import pattern, template system

---

## Scope Sketch

| Component | Description |
|-----------|-------------|
| Capability Panel | Grid/list of Claude Code capabilities as selectable cards |
| Config Panels | Per-capability configuration UIs (forms, sliders, editors) |
| Pipeline Canvas | Node-based visual editor with connections |
| Pipeline Store | Save/load pipelines (SQLite or localStorage) |
| JSON Exporter | Serialize pipeline to structured JSON |
| `/agent-json` Command | Claude Code slash command that reads JSON and generates files |
| Agent Installer | The Claude Code agent that understands the JSON schema |
