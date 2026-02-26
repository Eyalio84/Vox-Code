import React from 'react'

interface ProjectHubProps {
  onNewProject: () => void
  onTemplates: () => void
  onImport: () => void
  recentProjects?: Array<{id: string, name: string, description: string, updated_at: string}>
  onLoadRecent?: (projectId: string) => void
}

const ProjectHub: React.FC<ProjectHubProps> = ({ onNewProject, onTemplates, onImport, recentProjects, onLoadRecent }) => {
  const cards = [
    { label: 'New Project', desc: 'Start from scratch with AI generation', action: onNewProject, icon: '+' },
    { label: 'Templates', desc: 'Browse pre-built starter templates', action: onTemplates, icon: '\u25C7' },
    { label: 'Import', desc: 'Load from folder or ZIP file', action: onImport, icon: '\u2191' },
  ]

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--t-bg)' }}
    >
      <h2
        style={{
          color: 'var(--t-text)',
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: 8,
          fontFamily: 'var(--t-font)',
        }}
      >
        Vox Code Studio
      </h2>
      <p
        style={{
          color: 'var(--t-muted)',
          fontSize: '0.85rem',
          marginBottom: 32,
          fontFamily: 'var(--t-font)',
        }}
      >
        What would you like to work on?
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={card.action}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '24px 32px',
              background: 'var(--t-surface)',
              border: '1px solid var(--t-border)',
              borderRadius: 'var(--t-radius)',
              cursor: 'pointer',
              minWidth: 160,
              transition: 'all 150ms ease',
              fontFamily: 'var(--t-font)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--t-primary)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--t-border)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '1.5rem', color: 'var(--t-primary)' }}>{card.icon}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--t-text)' }}>{card.label}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--t-muted)' }}>{card.desc}</span>
          </button>
        ))}
      </div>
      {recentProjects && recentProjects.length > 0 && (
        <div style={{ marginTop: 40, width: '100%', maxWidth: 520 }}>
          <h3 style={{ color: 'var(--t-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontFamily: 'var(--t-font)' }}>
            Recent Projects
          </h3>
          <div className="flex flex-col gap-2">
            {recentProjects.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => onLoadRecent?.(p.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--t-surface)',
                  border: '1px solid var(--t-border)',
                  borderRadius: 'var(--t-radius)',
                  cursor: 'pointer',
                  fontFamily: 'var(--t-font)',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--t-text)' }}>{p.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--t-muted)' }}>
                  {new Date(p.updated_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectHub
