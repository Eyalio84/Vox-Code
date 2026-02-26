/**
 * TemplateGallery — grid of project template cards.
 *
 * Fetches templates from /api/templates, displays as clickable cards.
 * Selecting a template fetches the full project and calls onSelect.
 */

import React, { useState, useEffect, useCallback } from 'react'
import type { AusProject } from '../types/project'

interface TemplateSummary {
  id: string
  name: string
  description: string
  category: string
  stack: string
  file_count: number
}

interface TemplateGalleryProps {
  onSelect: (project: AusProject) => void
  onImport: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  saas: '#3b82f6',
  game: '#ef4444',
  'ai-tool': '#8b5cf6',
  'ai-demo': '#8b5cf6',
  tool: '#10b981',
  landing: '#f59e0b',
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelect, onImport }) => {
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = useCallback(async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/templates/${id}`)
      if (!res.ok) throw new Error('Failed to load template')
      const project = await res.json() as AusProject
      onSelect(project)
    } catch {
      // ignore
    } finally {
      setLoadingId(null)
    }
  }, [onSelect])

  if (loading) {
    return (
      <p style={{ color: 'var(--t-muted)', fontSize: '0.75rem' }}>
        Loading templates...
      </p>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 600 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
        }}
      >
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            disabled={loadingId !== null}
            style={{
              background: 'var(--t-surface)',
              border: '1px solid var(--t-border)',
              borderRadius: 10,
              padding: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              opacity: loadingId && loadingId !== t.id ? 0.5 : 1,
              fontFamily: 'var(--t-font)',
              transition: 'all 150ms ease',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.6rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: 4,
                background: CATEGORY_COLORS[t.category] || 'var(--t-muted)',
                color: '#fff',
                marginBottom: 6,
              }}
            >
              {t.category}
            </span>
            <p style={{ color: 'var(--t-text)', fontSize: '0.8rem', fontWeight: 600, margin: '4px 0' }}>
              {loadingId === t.id ? 'Loading...' : t.name}
            </p>
            <p style={{ color: 'var(--t-muted)', fontSize: '0.65rem', margin: 0, lineHeight: 1.3 }}>
              {t.description.slice(0, 80)}
            </p>
            <p style={{ color: 'var(--t-muted)', fontSize: '0.6rem', marginTop: 6 }}>
              {t.file_count} files
            </p>
          </button>
        ))}

        {/* Import own project card */}
        <button
          onClick={onImport}
          style={{
            background: 'transparent',
            border: '2px dashed var(--t-border)',
            borderRadius: 10,
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontFamily: 'var(--t-font)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 100,
          }}
        >
          <span style={{ fontSize: '1.2rem', color: 'var(--t-muted)' }}>+</span>
          <p style={{ color: 'var(--t-muted)', fontSize: '0.7rem', marginTop: 4 }}>
            Import your own
          </p>
        </button>
      </div>
    </div>
  )
}

export default TemplateGallery
