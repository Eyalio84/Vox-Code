import React, { useState, useMemo } from 'react'
import type { ToolEntry } from '../tools/types'
import { getToolsForTheme, getToolsByCategory, searchTools } from '../tools/registry'
import { useThemeContext } from '../context/ThemeContext'
import ToolCard from './ToolCard'

interface ToolDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAddTool: (tool: ToolEntry) => void
  recommendations?: Array<{ toolId: string; reason: string; priority: number }>
  isLoadingRecs?: boolean
  isStreaming?: boolean
}

type TabId = 'recommended' | 'libraries' | 'agents'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'agents', label: 'Agents' },
]

/** Slide-out drawer showing theme-aware tool catalog with search and tabs. */
const ToolDrawer: React.FC<ToolDrawerProps> = ({
  isOpen,
  onClose,
  onAddTool,
  recommendations,
  isLoadingRecs,
  isStreaming,
}) => {
  const { themeId } = useThemeContext()
  const [activeTab, setActiveTab] = useState<TabId>('recommended')
  const [query, setQuery] = useState('')

  // All tools for the current theme
  const themeTools = useMemo(() => getToolsForTheme(themeId), [themeId])

  // Category-filtered lists
  const libraries = useMemo(() => getToolsByCategory(themeTools, 'library'), [themeTools])
  const agentsAndSkills = useMemo(
    () => [
      ...getToolsByCategory(themeTools, 'agent'),
      ...getToolsByCategory(themeTools, 'skill'),
    ],
    [themeTools],
  )

  // Recommended tools resolved from IDs
  const recTools = useMemo(() => {
    if (!recommendations?.length) return []
    const sorted = [...recommendations].sort((a, b) => b.priority - a.priority)
    return sorted
      .map((r) => {
        const tool = themeTools.find((t) => t.id === r.toolId)
        return tool ? { tool, reason: r.reason } : null
      })
      .filter((x): x is { tool: ToolEntry; reason: string } => x !== null)
  }, [recommendations, themeTools])

  // Fallback when no recommendations: first 6 tools
  const popularTools = useMemo(() => themeTools.slice(0, 6), [themeTools])

  // Search filtering per tab
  const filteredLibraries = useMemo(() => searchTools(libraries, query), [libraries, query])
  const filteredAgents = useMemo(() => searchTools(agentsAndSkills, query), [agentsAndSkills, query])
  const filteredRecTools = useMemo(() => {
    if (!query.trim()) return recTools
    const q = query.trim().toLowerCase()
    return recTools.filter(
      (r) =>
        r.tool.id.toLowerCase().includes(q) ||
        r.tool.name.toLowerCase().includes(q) ||
        r.tool.description.toLowerCase().includes(q),
    )
  }, [recTools, query])
  const filteredPopular = useMemo(() => searchTools(popularTools, query), [popularTools, query])

  // Shimmer placeholder cards for loading state
  const ShimmerCard: React.FC = () => (
    <div
      style={{
        background: 'var(--t-surface)',
        border: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
        borderRadius: 'var(--t-radius)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--t-radius)',
            background: 'var(--t-surface2)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            flex: 1,
            height: 14,
            borderRadius: 'var(--t-radius)',
            background: 'var(--t-surface2)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
          }}
        />
      </div>
      <div
        style={{
          height: 10,
          width: '80%',
          borderRadius: 'var(--t-radius)',
          background: 'var(--t-surface2)',
          animation: 'shimmer 1.5s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
      <div
        style={{
          height: 10,
          width: '50%',
          borderRadius: 'var(--t-radius)',
          background: 'var(--t-surface2)',
          animation: 'shimmer 1.5s ease-in-out infinite',
          animationDelay: '0.3s',
        }}
      />
    </div>
  )

  const renderEmptyState = (label: string) => (
    <p
      style={{
        textAlign: 'center',
        color: 'var(--t-muted)',
        fontSize: '0.8rem',
        fontFamily: 'var(--t-font)',
        padding: '24px 0',
      }}
    >
      No {label} match &lsquo;{query}&rsquo;
    </p>
  )

  const renderRecommendedTab = () => {
    if (isLoadingRecs) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
      )
    }

    if (recTools.length > 0) {
      const items = filteredRecTools
      if (items.length === 0) return renderEmptyState('recommendations')
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((r) => (
            <ToolCard
              key={r.tool.id}
              tool={r.tool}
              reason={r.reason}
              onAdd={onAddTool}
              disabled={isStreaming}
            />
          ))}
        </div>
      )
    }

    // Fallback: popular tools
    const items = filteredPopular
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--t-muted)',
            fontFamily: 'var(--t-font)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Popular for this theme
        </p>
        {items.length === 0
          ? renderEmptyState('tools')
          : items.map((t) => (
              <ToolCard
                key={t.id}
                tool={t}
                onAdd={onAddTool}
                disabled={isStreaming}
              />
            ))}
      </div>
    )
  }

  const renderLibrariesTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--t-muted)',
            fontFamily: 'var(--t-font)',
          }}
        >
          {filteredLibraries.length} {filteredLibraries.length === 1 ? 'library' : 'libraries'}
        </p>
        {filteredLibraries.length === 0
          ? renderEmptyState('libraries')
          : filteredLibraries.map((t) => (
              <ToolCard
                key={t.id}
                tool={t}
                onAdd={onAddTool}
                disabled={isStreaming}
              />
            ))}
      </div>
    )
  }

  const renderAgentsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--t-muted)',
            fontFamily: 'var(--t-font)',
          }}
        >
          {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'}
        </p>
        {filteredAgents.length === 0
          ? renderEmptyState('agents')
          : filteredAgents.map((t) => (
              <ToolCard
                key={t.id}
                tool={t}
                onAdd={onAddTool}
                disabled={isStreaming}
              />
            ))}
      </div>
    )
  }

  return (
    <>
      {/* Shimmer keyframes (injected once) */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          transition: 'opacity 300ms',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          background: 'transparent',
        }}
      >
        {/* Desktop-only semi-transparent backdrop */}
        <div
          className="hidden md:block"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* Drawer panel */}
      <div
        className="w-full md:w-[360px]"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--t-bg)',
          borderLeft: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--t-text)',
              fontFamily: 'var(--t-font)',
            }}
          >
            Tools
          </h2>
          <button
            onClick={onClose}
            aria-label="Close tools drawer"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t-muted)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '1.25rem',
              lineHeight: 1,
              fontFamily: 'var(--t-font)',
            }}
          >
            &#x2715;
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontFamily: 'var(--t-font)',
              color: 'var(--t-text)',
              background: 'var(--t-input-bg)',
              border: 'var(--t-border-width) var(--t-border-style) var(--t-input-border)',
              borderRadius: 'var(--t-radius)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '0 16px',
            marginTop: '12px',
            borderBottom: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
            flexShrink: 0,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--t-primary)' : 'var(--t-muted)',
                background: 'none',
                border: 'none',
                borderBottom:
                  activeTab === tab.id
                    ? '2px solid var(--t-primary)'
                    : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--t-font)',
                transition: 'color 150ms, border-color 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px 16px',
          }}
        >
          {activeTab === 'recommended' && renderRecommendedTab()}
          {activeTab === 'libraries' && renderLibrariesTab()}
          {activeTab === 'agents' && renderAgentsTab()}
        </div>
      </div>
    </>
  )
}

export default ToolDrawer
