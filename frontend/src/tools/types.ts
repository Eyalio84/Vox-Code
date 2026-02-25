import type { AdaptiveThemeId } from '../themes/index'

export type ToolCategory = 'library' | 'agent' | 'skill'
export type ToolLevel = 'beginner' | 'intermediate' | 'expert'
export type ToolDomain =
  | 'general'
  | 'saas'
  | 'ai-ml'
  | 'music'
  | 'gaming'
  | 'productivity'
  | 'social'
  | 'ecommerce'
  | 'data-viz'
export type ToolSide = 'frontend' | 'backend' | 'both'

export interface ToolEntry {
  id: string
  name: string
  description: string
  category: ToolCategory
  level: ToolLevel
  side: ToolSide
  domains: ToolDomain[]
  themes: AdaptiveThemeId[]
  packages?: { npm?: string; pip?: string }
  integrationPrompt: string
  icon?: string
}
