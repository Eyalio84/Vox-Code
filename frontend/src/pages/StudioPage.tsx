import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStudioStream } from '../hooks/useStudioStream'
import { useToolRecommendations } from '../hooks/useToolRecommendations'
import { useThemeContext } from '../context/ThemeContext'
import { useVoxModel } from '../context/VoxModelContext'
import { useVoxLive } from '../context/VoxLiveContext'
import ChatPanel from '../components/ChatPanel'
import InterviewWizard from '../components/InterviewWizard'
import FileTree from '../components/FileTree'
import PreviewPanel from '../components/PreviewPanel'
import ToolDrawer from '../components/ToolDrawer'
import ImportModal from '../components/ImportModal'
import TemplateGallery from '../components/TemplateGallery'
import ProjectHub from '../components/ProjectHub'
import type { ToolEntry } from '../tools/types'

interface StudioPageProps {
  isToolsOpen?: boolean
  onCloseTools?: () => void
}

type MobileTab = 'chat' | 'preview' | 'files'

const StudioPage: React.FC<StudioPageProps> = ({ isToolsOpen, onCloseTools }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    messages,
    files,
    phases,
    project,
    streamingText,
    streamingDeps,
    isStreaming,
    error,
    generate,
    stop,
    loadProject,
  } = useStudioStream()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat')
  const { themeId } = useThemeContext()
  const { activeModel } = useVoxModel()
  const { isConnected, startSession, lastToolAction } = useVoxLive()
  const { recommendations, isLoading: isLoadingRecs } = useToolRecommendations(project, themeId)

  const showInterview = searchParams.get('interview') === 'true' && !project
  const showTemplates = searchParams.get('mode') === 'load' && !project
  const [showImport, setShowImport] = useState(false)
  const [hubDismissed, setHubDismissed] = useState(false)
  const showHub = !project && !showInterview && !showTemplates && !hubDismissed && Object.keys(files).length === 0

  const handleTalkToVox = useCallback(() => {
    if (!isConnected) {
      startSession(themeId)
    }
  }, [isConnected, startSession, themeId])

  // Handle VOX UI actions (generate, add_tool from voice commands)
  useEffect(() => {
    if (!lastToolAction || lastToolAction.type !== 'ui_action') return
    const data = lastToolAction.data as Record<string, string> | undefined
    if (!data) return

    if (data.action === 'generate' && data.prompt) {
      generate(data.prompt, project ?? undefined)
    } else if (data.action === 'add_tool' && data.integration_prompt && project) {
      generate(data.integration_prompt, project)
    }
  }, [lastToolAction, generate, project])

  const handleInterviewComplete = useCallback(
    (generationPrompt: string) => {
      setSearchParams({}, { replace: true })
      generate(generationPrompt)
    },
    [generate, setSearchParams],
  )

  const handleInterviewSkip = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const handleExportZip = useCallback(async () => {
    if (!project) return
    try {
      const res = await fetch('/api/project/export/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name || 'project'}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    }
  }, [project])

  const fileCount = Object.keys(files).length

  const handleSubmit = useCallback(
    (prompt: string) => {
      generate(prompt, project ?? undefined)
    },
    [generate, project],
  )

  const handleAddTool = useCallback(
    (tool: ToolEntry) => {
      if (!project || isStreaming) return
      onCloseTools?.()
      generate(tool.integrationPrompt, project)
    },
    [project, isStreaming, onCloseTools, generate],
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--t-bg)' }}>
      {/* Mobile tab bar — visible only on small screens */}
      <div
        className="flex lg:hidden shrink-0 border-b"
        style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface)' }}
      >
        {(['chat', 'preview', 'files'] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: mobileTab === tab ? 'var(--t-primary)' : 'transparent',
              color: mobileTab === tab ? '#fff' : 'var(--t-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              fontFamily: 'var(--t-font)',
            }}
          >
            {tab === 'chat' ? 'Chat' : tab === 'preview' ? `Preview${fileCount ? ` (${fileCount})` : ''}` : 'Files'}
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* FileTree: always visible on desktop, conditional on mobile */}
        <div className={mobileTab === 'files' ? 'flex flex-col w-full lg:w-auto lg:flex' : 'hidden lg:flex'}>
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onSelectFile={(f) => { setSelectedFile(f); setMobileTab('preview') }}
          />
        </div>

        {/* ChatPanel or InterviewWizard: always visible on desktop, conditional on mobile */}
        <div className={`flex-1 min-w-0 flex-col ${mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          {showInterview ? (
            <InterviewWizard
              onComplete={handleInterviewComplete}
              onSkip={handleInterviewSkip}
            />
          ) : showHub ? (
            <ProjectHub
              onNewProject={() => setHubDismissed(true)}
              onTemplates={() => setSearchParams({ mode: 'load' }, { replace: true })}
              onImport={() => setShowImport(true)}
            />
          ) : showTemplates ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto" style={{ background: 'var(--t-bg)' }}>
              <h2 style={{ color: 'var(--t-text)', fontSize: '1rem', fontWeight: 600, marginBottom: 16, fontFamily: 'var(--t-font)' }}>
                Choose a template or import your project
              </h2>
              <TemplateGallery
                onSelect={(p) => { loadProject(p); setSearchParams({}, { replace: true }) }}
                onImport={() => setShowImport(true)}
              />
            </div>
          ) : (
            <ChatPanel
              messages={messages}
              phases={phases}
              streamingText={streamingText}
              isStreaming={isStreaming}
              error={error}
              project={project}
              onSubmit={handleSubmit}
              onStop={stop}
            />
          )}
        </div>

        {/* PreviewPanel: always visible on desktop, conditional on mobile */}
        <div className={`flex flex-col ${mobileTab === 'preview' ? 'flex-1 lg:flex-none' : 'hidden lg:flex'}`}>
          <PreviewPanel
            files={files}
            selectedFile={selectedFile}
            extraDeps={{ ...streamingDeps, ...(project?.frontend_deps ?? {}) }}
          />
        </div>
      </div>

      {activeModel === 'gemini' && !isConnected && (
        <button
          onClick={handleTalkToVox}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            padding: '12px 20px',
            background: 'var(--t-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'var(--t-font)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 999,
            transition: 'all 150ms ease',
          }}
        >
          Talk to VOX
        </button>
      )}

      {/* Import button — fixed bottom-left */}
      <button
        onClick={() => setShowImport(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          padding: '10px 16px',
          background: 'var(--t-surface)',
          color: 'var(--t-text)',
          border: '1px solid var(--t-border)',
          borderRadius: 10,
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'var(--t-font)',
          cursor: 'pointer',
          zIndex: 999,
        }}
      >
        Import
      </button>

      {/* Export ZIP button — fixed bottom-left, offset */}
      {project && (
        <button
          onClick={handleExportZip}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 100,
            padding: '10px 16px',
            background: 'var(--t-surface)',
            color: 'var(--t-text)',
            border: '1px solid var(--t-border)',
            borderRadius: 10,
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'var(--t-font)',
            cursor: 'pointer',
            zIndex: 999,
          }}
        >
          Download ZIP
        </button>
      )}

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={loadProject}
      />

      <ToolDrawer
        isOpen={isToolsOpen ?? false}
        onClose={onCloseTools ?? (() => {})}
        onAddTool={handleAddTool}
        recommendations={recommendations}
        isLoadingRecs={isLoadingRecs}
        isStreaming={isStreaming}
        frontendDeps={project?.frontend_deps ?? {}}
        backendDeps={project?.backend_deps ?? {}}
      />
    </div>
  )
}

export default StudioPage
