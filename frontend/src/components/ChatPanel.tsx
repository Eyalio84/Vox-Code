import React, { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import PhaseIndicator from './PhaseIndicator'
import type { StudioMessage, PhaseResult, AusProject } from '../types/project'

interface ChatPanelProps {
  messages: StudioMessage[]
  phases: PhaseResult[]
  streamingText: string
  isStreaming: boolean
  error: string | null
  project: AusProject | null
  onSubmit: (prompt: string) => void
  onStop: () => void
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  phases,
  streamingText,
  isStreaming,
  error,
  project,
  onSubmit,
  onStop,
}) => {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, phases, streamingText])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    onSubmit(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <p className="text-lg font-medium mb-1" style={{ color: 'var(--t-text)' }}>
                What shall we build?
              </p>
              <p className="text-sm" style={{ color: 'var(--t-muted)' }}>
                Describe the app you want. A(Us) will generate a complete
                full-stack project with backend, database, API, and frontend.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {phases.length > 0 && (
            <div className="my-3">
              <PhaseIndicator phases={phases} />
            </div>
          )}

          {error && (
            <div
              className="my-3 px-3 py-2 text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                borderRadius: 'var(--t-radius)',
              }}
            >
              {error}
            </div>
          )}

          {isStreaming && (
            <div className="my-3">
              {streamingText ? (
                <div
                  className="px-3 py-2 text-sm whitespace-pre-wrap"
                  style={{
                    background: 'var(--t-surface)',
                    color: 'var(--t-text)',
                    borderRadius: 'var(--t-radius)',
                    border: 'var(--t-border-width) var(--t-border-style) var(--t-border)',
                    fontFamily: 'var(--t-font)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {streamingText}
                  <span
                    className="inline-block w-1.5 h-4 ml-0.5 animate-pulse"
                    style={{ background: 'var(--t-primary)', verticalAlign: 'text-bottom' }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--t-muted)' }}>
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: 'var(--t-primary)' }}
                  />
                  Generating...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-3" style={{ borderColor: 'var(--t-border)' }}>
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={project ? 'Describe a change...' : 'Build a todo app with categories...'}
            disabled={isStreaming}
            className="flex-1 px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--t-input-bg, var(--t-surface))',
              color: 'var(--t-text)',
              border: `var(--t-border-width) var(--t-border-style) var(--t-input-border, var(--t-border))`,
              borderRadius: 'var(--t-radius)',
              opacity: isStreaming ? 0.5 : 1,
            }}
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="px-4 py-2 text-sm font-medium shrink-0"
              style={{
                background: 'var(--t-error, #ef4444)',
                color: '#fff',
                borderRadius: 'var(--t-radius)',
              }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium shrink-0"
              style={{
                background: 'var(--t-primary)',
                color: '#fff',
                borderRadius: 'var(--t-radius)',
                opacity: input.trim() ? 1 : 0.5,
              }}
              disabled={!input.trim()}
            >
              {project ? 'Refine' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
