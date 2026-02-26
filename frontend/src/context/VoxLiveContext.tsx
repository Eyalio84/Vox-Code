/**
 * VoxLiveContext — manages Gemini Live API session via backend WebSocket.
 *
 * Handles: WebSocket lifecycle, mic capture (PCM 16-bit 16kHz),
 * audio playback (PCM 24kHz), transcript buffer, tool call events.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'

export interface TranscriptEntry {
  role: 'user' | 'vox'
  text: string
  timestamp: number
}

export interface ToolAction {
  type: 'tool_call' | 'tool_result' | 'ui_action'
  name: string
  args?: Record<string, unknown>
  data?: Record<string, unknown>
  timestamp: number
}

export interface SearchSource {
  title: string
  uri: string
  domain: string
}

interface VoxLiveState {
  isConnected: boolean
  isVoxSpeaking: boolean
  isMuted: boolean
  transcript: TranscriptEntry[]
  lastToolAction: ToolAction | null
  searchSources: SearchSource[]
  error: string | null
}

interface VoxLiveContextType extends VoxLiveState {
  startSession: (theme?: string) => Promise<void>
  endSession: () => void
  toggleMute: () => void
  sendText: (text: string) => void
}

const VoxLiveContext = createContext<VoxLiveContextType | null>(null)

export function useVoxLive(): VoxLiveContextType {
  const ctx = useContext(VoxLiveContext)
  if (!ctx) throw new Error('useVoxLive must be used within VoxLiveProvider')
  return ctx
}

// Audio playback: queue PCM chunks and play them sequentially
class AudioPlayer {
  private ctx: AudioContext | null = null
  private queue: ArrayBuffer[] = []
  private playing = false
  onSpeakingChange?: (speaking: boolean) => void

  async play(pcmData: ArrayBuffer): Promise<void> {
    this.queue.push(pcmData)
    if (!this.playing) this.drain()
  }

  private async drain(): Promise<void> {
    if (!this.queue.length) {
      this.playing = false
      this.onSpeakingChange?.(false)
      return
    }

    this.playing = true
    this.onSpeakingChange?.(true)

    if (!this.ctx) this.ctx = new AudioContext({ sampleRate: 24000 })

    const chunk = this.queue.shift()!
    const int16 = new Int16Array(chunk)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }

    const buffer = this.ctx.createBuffer(1, float32.length, 24000)
    buffer.getChannelData(0).set(float32)

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.ctx.destination)

    return new Promise<void>((resolve) => {
      source.onended = () => {
        resolve()
        this.drain()
      }
      source.start()
    })
  }

  stop(): void {
    this.queue = []
    this.playing = false
    this.onSpeakingChange?.(false)
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

export const VoxLiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<VoxLiveState>({
    isConnected: false,
    isVoxSpeaking: false,
    isMuted: false,
    transcript: [],
    lastToolAction: null,
    searchSources: [],
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const playerRef = useRef<AudioPlayer>(new AudioPlayer())
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const mutedRef = useRef(false)

  // Keep mutedRef in sync
  useEffect(() => { mutedRef.current = state.isMuted }, [state.isMuted])

  // Audio playback speaking callback
  useEffect(() => {
    playerRef.current.onSpeakingChange = (speaking) => {
      setState((prev) => ({ ...prev, isVoxSpeaking: speaking }))
    }
  }, [])

  const stopMic = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null
    micCtxRef.current?.close().catch(() => {})
    micCtxRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
    })
    streamRef.current = stream

    const ctx = new AudioContext({ sampleRate: 16000 })
    micCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)

    // ScriptProcessorNode for raw PCM access
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      if (mutedRef.current) return

      const float32 = e.inputBuffer.getChannelData(0)
      const int16 = new Int16Array(float32.length)
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      wsRef.current.send(int16.buffer)
    }

    source.connect(processor)
    processor.connect(ctx.destination)
  }, [])

  const startSession = useCallback(async (theme = 'expert') => {
    setState((prev) => ({ ...prev, error: null, transcript: [], lastToolAction: null }))

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/vox/live`)
    wsRef.current = ws

    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'start', theme }))
    }

    ws.onmessage = (event: MessageEvent) => {
      // Binary = audio from VOX
      if (event.data instanceof ArrayBuffer) {
        playerRef.current.play(event.data)
        return
      }

      // Text = JSON control
      try {
        const msg = JSON.parse(event.data as string)
        switch (msg.type) {
          case 'ready':
            setState((prev) => ({ ...prev, isConnected: true }))
            startMic()
            break

          case 'transcript':
            setState((prev) => ({
              ...prev,
              transcript: [
                ...prev.transcript,
                { role: msg.role, text: msg.text, timestamp: Date.now() },
              ],
            }))
            break

          case 'tool_call':
          case 'tool_result':
          case 'ui_action':
            setState((prev) => ({
              ...prev,
              lastToolAction: {
                type: msg.type,
                name: msg.name || msg.action || '',
                args: msg.args,
                data: msg.data || msg,
                timestamp: Date.now(),
              },
            }))
            break

          case 'search_used':
            setState((prev) => ({
              ...prev,
              searchSources: msg.sources || [],
            }))
            break

          case 'error':
            setState((prev) => ({ ...prev, error: msg.message }))
            break

          case 'session_end':
            setState((prev) => ({ ...prev, isConnected: false }))
            stopMic()
            break
        }
      } catch {
        // ignore malformed
      }
    }

    ws.onerror = () => {
      setState((prev) => ({ ...prev, error: 'WebSocket connection failed', isConnected: false }))
    }

    ws.onclose = () => {
      setState((prev) => ({ ...prev, isConnected: false }))
      stopMic()
    }
  }, [startMic, stopMic])

  const endSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }))
    }
    wsRef.current?.close()
    wsRef.current = null
    playerRef.current.stop()
    stopMic()
    setState((prev) => ({ ...prev, isConnected: false, isVoxSpeaking: false }))
  }, [stopMic])

  const toggleMute = useCallback(() => {
    setState((prev) => {
      const muted = !prev.isMuted
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mute', muted }))
      }
      return { ...prev, isMuted: muted }
    })
  }, [])

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', content: text }))
      setState((prev) => ({
        ...prev,
        transcript: [
          ...prev.transcript,
          { role: 'user', text, timestamp: Date.now() },
        ],
      }))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close()
      playerRef.current.stop()
      stopMic()
    }
  }, [stopMic])

  return (
    <VoxLiveContext.Provider
      value={{ ...state, startSession, endSession, toggleMute, sendText }}
    >
      {children}
    </VoxLiveContext.Provider>
  )
}
