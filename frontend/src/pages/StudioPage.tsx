import React, { useState, useCallback } from 'react'
import { useStudioStream } from '../hooks/useStudioStream'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import PreviewPanel from '../components/PreviewPanel'
import ToolDrawer from '../components/ToolDrawer'
import type { ToolEntry } from '../tools/types'

interface StudioPageProps {
  isToolsOpen?: boolean
  onCloseTools?: () => void
}

const StudioPage: React.FC<StudioPageProps> = ({ isToolsOpen, onCloseTools }) => {
  const {
    messages,
    files,
    phases,
    project,
    isStreaming,
    error,
    generate,
    stop,
  } = useStudioStream()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)

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
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--t-bg)' }}>
      <FileTree
        files={files}
        selectedFile={selectedFile}
        onSelectFile={setSelectedFile}
      />
      <ChatPanel
        messages={messages}
        phases={phases}
        isStreaming={isStreaming}
        error={error}
        project={project}
        onSubmit={handleSubmit}
        onStop={stop}
      />
      <PreviewPanel
        files={files}
        selectedFile={selectedFile}
      />
      <ToolDrawer
        isOpen={isToolsOpen ?? false}
        onClose={onCloseTools ?? (() => {})}
        onAddTool={handleAddTool}
        isStreaming={isStreaming}
      />
    </div>
  )
}

export default StudioPage
