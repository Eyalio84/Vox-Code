import React, { useState, useEffect, useCallback } from 'react'
import VoxGreeting from './VoxGreeting'

interface BootScreenProps {
  onReady: () => void
}

const BootScreen: React.FC<BootScreenProps> = ({ onReady }) => {
  const [status, setStatus] = useState('Initializing Vox Code...')
  const [fadeOut, setFadeOut] = useState(false)

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setStatus(data.boot_status || 'Loading...')
        if (data.ready) {
          setStatus('Ready')
          setFadeOut(true)
          setTimeout(onReady, 400)
          return true
        }
      }
    } catch {
      // Server not up yet — keep polling
    }
    return false
  }, [onReady])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      while (!cancelled) {
        const ready = await poll()
        if (ready || cancelled) break
        await new Promise((r) => setTimeout(r, 800))
      }
    }
    run()
    return () => { cancelled = true }
  }, [poll])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#0a0a0a',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 400ms ease',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <VoxGreeting isPlaying={!fadeOut} />
      <p
        style={{
          color: '#888',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
        }}
      >
        {status}
      </p>
    </div>
  )
}

export default BootScreen
