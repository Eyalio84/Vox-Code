import React from 'react'
import type { ToolEntry } from '../tools/types'

interface ToolCardProps {
  tool: ToolEntry
  reason?: string
  onAdd: (tool: ToolEntry) => void
  disabled?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  library: 'LIB',
  agent: 'AGENT',
  skill: 'SKILL',
}

/** A card displaying a single tool with themed styling via CSS vars. */
const ToolCard: React.FC<ToolCardProps> = ({ tool, reason, onAdd, disabled }) => {
  return (
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
      {/* Header: icon + name + category badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {tool.icon && (
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{tool.icon}</span>
        )}
        <span
          style={{
            fontWeight: 600,
            color: 'var(--t-text)',
            fontFamily: 'var(--t-font)',
            fontSize: '0.9rem',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tool.name}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '2px 6px',
            borderRadius: 'var(--t-radius)',
            background: 'var(--t-surface2)',
            color: 'var(--t-text2)',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {CATEGORY_LABELS[tool.category] ?? tool.category}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: '0.8rem',
          lineHeight: 1.4,
          color: 'var(--t-muted)',
          fontFamily: 'var(--t-font)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {tool.description}
      </p>

      {/* AI recommendation reason */}
      {reason && (
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontStyle: 'italic',
            color: 'var(--t-accent1)',
            fontFamily: 'var(--t-font)',
            lineHeight: 1.3,
          }}
        >
          {reason}
        </p>
      )}

      {/* Package badges + Add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
        {tool.packages?.npm && (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: 'var(--t-radius)',
              background: 'var(--t-surface2)',
              color: 'var(--t-muted)',
              fontFamily: 'var(--t-font)',
            }}
          >
            npm: {tool.packages.npm}
          </span>
        )}
        {tool.packages?.pip && (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: 'var(--t-radius)',
              background: 'var(--t-surface2)',
              color: 'var(--t-muted)',
              fontFamily: 'var(--t-font)',
            }}
          >
            pip: {tool.packages.pip}
          </span>
        )}

        <button
          onClick={() => onAdd(tool)}
          disabled={disabled}
          style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 'var(--t-radius)',
            background: 'var(--t-primary)',
            color: '#fff',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            fontFamily: 'var(--t-font)',
            transition: 'opacity 150ms',
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

export default ToolCard
