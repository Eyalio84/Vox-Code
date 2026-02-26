/**
 * ImportModal — dialog for importing projects from ZIP or folder path.
 *
 * Two tabs: Upload ZIP (file input) and Folder Path (text input).
 * Calls backend import endpoints, loads result via loadProject().
 */

import React, { useState, useCallback, useRef } from 'react'
import type { AusProject } from '../types/project'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (project: AusProject) => void
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [tab, setTab] = useState<'zip' | 'folder'>('zip')
  const [folderPath, setFolderPath] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleZipUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/project/import/zip', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Import failed' }))
        throw new Error(err.detail || 'Import failed')
      }
      const project = await res.json() as AusProject
      onImport(project)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [onImport, onClose])

  const handleFolderImport = useCallback(async () => {
    if (!folderPath.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/project/import/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Import failed' }))
        throw new Error(err.detail || 'Import failed')
      }
      const project = await res.json() as AusProject
      onImport(project)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [folderPath, onImport, onClose])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleZipUpload(file)
  }, [handleZipUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.zip')) handleZipUpload(file)
    else setError('Please drop a .zip file')
  }, [handleZipUpload])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--t-surface)',
          border: '1px solid var(--t-border)',
          borderRadius: 16,
          width: 420,
          maxWidth: '90vw',
          overflow: 'hidden',
          fontFamily: 'var(--t-font)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--t-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t-text)' }}>
            Import Project
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)' }}>
          {(['zip', 'folder'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: tab === t ? 'var(--t-primary)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--t-muted)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--t-font)',
              }}
            >
              {t === 'zip' ? 'Upload ZIP' : 'Folder Path'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {tab === 'zip' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: '2px dashed var(--t-border)',
                borderRadius: 12,
                padding: '32px 16px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <p style={{ color: 'var(--t-text)', fontSize: '0.85rem', marginBottom: 4 }}>
                {isLoading ? 'Importing...' : 'Drop a .zip file here or click to browse'}
              </p>
              <p style={{ color: 'var(--t-muted)', fontSize: '0.7rem' }}>
                Works with Google AI Studio exports
              </p>
            </div>
          )}

          {tab === 'folder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/path/to/react/project"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--t-border)',
                  background: 'var(--t-bg)',
                  color: 'var(--t-text)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--t-font)',
                  outline: 'none',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleFolderImport()}
              />
              <button
                onClick={handleFolderImport}
                disabled={isLoading || !folderPath.trim()}
                style={{
                  padding: '10px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--t-primary)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: folderPath.trim() ? 'pointer' : 'default',
                  opacity: folderPath.trim() ? 1 : 0.5,
                  fontFamily: 'var(--t-font)',
                }}
              >
                {isLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 12 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportModal
