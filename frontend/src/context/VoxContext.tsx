import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { AdaptiveThemeId } from '../themes/index'

export interface VoxLine {
  filename: string
  text: string
}

export const VOX_LINES: Record<string, VoxLine> = {
  greeting: { filename: 'greeting', text: "Welcome to Vox Code. I'm Vox, your creative partner." },
  q1_intro: { filename: 'q1_intro', text: 'First, tell me about your style. How do you like to work?' },
  q3_intro: { filename: 'q3_intro', text: 'Last one. What mood suits you best?' },
  reveal_expert: { filename: 'reveal_expert', text: 'Expert Pro. Precision engineering at its finest.' },
  reveal_sharp: { filename: 'reveal_sharp', text: 'Sharp Edge. Clean lines, bold decisions.' },
  reveal_warm: { filename: 'reveal_warm', text: 'Warm Glow. Welcome home.' },
  reveal_casual: { filename: 'reveal_casual', text: "Casual Flow. Let's keep it easy." },
  reveal_future: { filename: 'reveal_future', text: 'Futuristic. The future is now.' },
  reveal_minimal: { filename: 'reveal_minimal', text: 'Minimal Clean. Less is everything.' },
  reveal_retro: { filename: 'reveal_retro', text: 'Retro Terminal. Old school never dies.' },
  reveal_creative: { filename: 'reveal_creative', text: "Creative Burst. Let's make something wild." },
  outro: { filename: 'outro', text: 'Let me reshape your workspace for you.' },
  model_question: { filename: 'model_question', text: 'One more thing. Which model would you like to power me?' },
  action_question: { filename: 'action_question', text: 'Welcome to Vox Code. What would you like to do?' },
}

export type WelcomeStep = 'greeting' | 'q1' | 'q3' | 'reveal' | 'model-select' | 'action-menu' | 'done'

export interface VoxAnswers {
  style?: string
  mood?: string
}

interface VoxContextType {
  step: WelcomeStep
  answers: VoxAnswers
  assignedTheme: AdaptiveThemeId | null
  isPlaying: boolean
  currentLine: VoxLine | null
  setStep: (step: WelcomeStep) => void
  setAnswer: (key: keyof VoxAnswers, value: string) => void
  setAssignedTheme: (theme: AdaptiveThemeId) => void
  playVoxLine: (key: string) => Promise<void>
  skipWelcome: () => void
}

const VoxContext = createContext<VoxContextType | null>(null)

export const useVoxContext = () => {
  const ctx = useContext(VoxContext)
  if (!ctx) throw new Error('useVoxContext must be used within VoxProvider')
  return ctx
}

export const VoxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [step, setStep] = useState<WelcomeStep>('greeting')
  const [answers, setAnswers] = useState<VoxAnswers>({})
  const [assignedTheme, setAssignedTheme] = useState<AdaptiveThemeId | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLine, setCurrentLine] = useState<VoxLine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const setAnswer = useCallback((key: keyof VoxAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }, [])

  const playVoxLine = useCallback(async (key: string) => {
    const line = VOX_LINES[key]
    if (!line) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setCurrentLine(line)
    setIsPlaying(true)

    try {
      const audio = new Audio(`/api/tts/cache/${line.filename}`)
      audioRef.current = audio

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error('Audio playback failed'))
        audio.play().catch(reject)
      })
    } catch (err) {
      console.warn('VOX audio unavailable:', err)
      await new Promise(r => setTimeout(r, 2000))
    } finally {
      setIsPlaying(false)
      audioRef.current = null
    }
  }, [])

  const skipWelcome = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setStep('done')
  }, [])

  return (
    <VoxContext.Provider
      value={{
        step, answers, assignedTheme, isPlaying, currentLine,
        setStep, setAnswer, setAssignedTheme, playVoxLine, skipWelcome,
      }}
    >
      {children}
    </VoxContext.Provider>
  )
}
