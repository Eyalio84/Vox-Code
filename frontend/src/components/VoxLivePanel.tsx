/**
 * VoxLivePanel — floating voice conversation panel.
 *
 * Appears when a Gemini Live API session is active.
 * Shows: speaking pulse, mute toggle, transcript, tool cards, end button.
 */

import React, { useRef, useEffect, useState } from 'react'
import { useVoxLive } from '../context/VoxLiveContext'

const VoxLivePanel: React.FC = () => {
  const {
    isConnected,
    isVoxSpeaking,
    isMuted,
    transcript,
    lastToolAction,
    searchSources,
    error,
    endSession,
    toggleMute,
  } = useVoxLive()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  if (!isConnected) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 320,
        maxHeight: '70vh',
        background: 'var(--t-surface)',
        border: '1px solid var(--t-border)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--t-font)',
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--t-border)',
        }}
      >
        {/* Speaking pulse */}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isVoxSpeaking ? 'var(--t-primary)' : 'var(--t-muted)',
            animation: isVoxSpeaking ? 'vox-pulse 1.5s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--t-text)',
            letterSpacing: '0.04em',
          }}
        >
          {isVoxSpeaking ? 'VOX is speaking...' : 'VOX is listening...'}
        </span>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={{
            background: isMuted ? 'var(--t-primary)' : 'transparent',
            border: '1px solid ' + (isMuted ? 'var(--t-primary)' : 'var(--t-border)'),
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: '0.7rem',
            color: isMuted ? '#fff' : 'var(--t-muted)',
            cursor: 'pointer',
          }}
        >
          {isMuted ? 'MUTED' : 'MIC'}
        </button>

        {/* Transcript toggle */}
        <button
          onClick={() => setShowTranscript((p) => !p)}
          style={{
            background: 'transparent',
            border: '1px solid var(--t-border)',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: '0.65rem',
            color: 'var(--t-muted)',
            cursor: 'pointer',
          }}
        >
          {showTranscript ? 'HIDE' : 'LOG'}
        </button>
      </div>

      {/* Transcript */}
      {showTranscript && transcript.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px',
            maxHeight: 200,
          }}
        >
          {transcript.map((entry, i) => (
            <div
              key={i}
              style={{
                marginBottom: 6,
                fontSize: '0.7rem',
                color: entry.role === 'vox' ? 'var(--t-primary)' : 'var(--t-text)',
              }}
            >
              <strong>{entry.role === 'vox' ? 'VOX' : 'You'}:</strong>{' '}
              {entry.text}
            </div>
          ))}
        </div>
      )}

      {/* Last tool action */}
      {lastToolAction && lastToolAction.type === 'tool_call' && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--t-border)',
            fontSize: '0.7rem',
            color: 'var(--t-accent)',
          }}
        >
          VOX used: <strong>{lastToolAction.name}</strong>
        </div>
      )}

      {/* Search indicator */}
      {searchSources.length > 0 && (
        <div
          style={{
            padding: '6px 16px',
            borderTop: '1px solid var(--t-border)',
            fontSize: '0.65rem',
            color: 'var(--t-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ opacity: 0.7 }}>Searched the web</span>
          <span style={{ opacity: 0.5 }}>({searchSources.length} sources)</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            fontSize: '0.7rem',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {/* End button */}
      <div style={{ padding: '8px 16px 12px' }}>
        <button
          onClick={endSession}
          style={{
            width: '100%',
            padding: '8px 0',
            background: 'transparent',
            border: '1px solid var(--t-border)',
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--t-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--t-font)',
            transition: 'all 150ms ease',
          }}
        >
          End Conversation
        </button>
      </div>

      <style>{`
        @keyframes vox-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

export default VoxLivePanel
