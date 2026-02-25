import React, { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStudioStream } from '../hooks/useStudioStream'
import { useToolRecommendations } from '../hooks/useToolRecommendations'
import { useThemeContext } from '../context/ThemeContext'
import ChatPanel from '../components/ChatPanel'
import InterviewWizard from '../components/InterviewWizard'
import FileTree from '../components/FileTree'
import PreviewPanel from '../components/PreviewPanel'
import ToolDrawer from '../components/ToolDrawer'
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
    isStreaming,
    error,
    generate,
    stop,
  } = useStudioStream()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat')
  const { themeId } = useThemeContext()
  const { recommendations, isLoading: isLoadingRecs } = useToolRecommendations(project, themeId)

  const showInterview = searchParams.get('interview') === 'true' && !project

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
          />
        </div>
      </div>

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
