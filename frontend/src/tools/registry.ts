import type { ToolEntry, ToolCategory, ToolDomain } from './types'
import type { AdaptiveThemeId } from '../themes/index'
import { EXPERT_TOOLS } from './expert'

// ---------------------------------------------------------------------------
// Master catalog -- all tool entries from every tier
// ---------------------------------------------------------------------------

export const TOOL_CATALOG: ToolEntry[] = [
  ...EXPERT_TOOLS,
]

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

/** Return every tool that declares compatibility with the given theme. */
export function getToolsForTheme(themeId: AdaptiveThemeId): ToolEntry[] {
  return TOOL_CATALOG.filter((t) => t.themes.includes(themeId))
}

/** Narrow a tool list to a single category (library / agent / skill). */
export function getToolsByCategory(
  tools: ToolEntry[],
  category: ToolCategory,
): ToolEntry[] {
  return tools.filter((t) => t.category === category)
}

/** Narrow a tool list to entries that belong to a specific domain. */
export function getToolsByDomain(
  tools: ToolEntry[],
  domain: ToolDomain,
): ToolEntry[] {
  return tools.filter((t) => t.domains.includes(domain))
}

/** Free-text search across id, name, and description (case-insensitive). */
export function searchTools(tools: ToolEntry[], query: string): ToolEntry[] {
  const q = query.trim().toLowerCase()
  if (q === '') return tools
  return tools.filter(
    (t) =>
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
  )
}
