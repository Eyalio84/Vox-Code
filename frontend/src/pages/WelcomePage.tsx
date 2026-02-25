/* VOX Welcome Flow — voiced onboarding with personality questions */

import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VoxProvider, useVoxContext } from '../context/VoxContext'
import { useThemeContext } from '../context/ThemeContext'
import { useVoxModel } from '../context/VoxModelContext'
import type { VoxModel } from '../context/VoxModelContext'
import { useTypewriter } from '../hooks/useTypewriter'
import { saveWelcomeProfile } from '../services/apiService'
import { STYLE_OPTIONS, MOOD_OPTIONS } from '../themes/adaptive'
import VoxGreeting from '../components/VoxGreeting'
import WelcomeQuestion from '../components/WelcomeQuestion'
import type { AdaptiveThemeId } from '../themes/index'

const QUESTION_MAP = {
  q1: { key: 'style' as const, options: [...STYLE_OPTIONS] },
  q3: { key: 'mood' as const, options: [...MOOD_OPTIONS] },
} as const

const MODEL_OPTIONS = [
  { value: 'gemini', label: 'Gemini', description: "Real-time voice conversation. I can listen and talk naturally using Google's Live API. Full Jarvis mode." },
  { value: 'claude', label: 'Claude', description: "Fast and precise reasoning with local voice. Powered by Anthropic's models + Kokoro speech." },
]

const ACTION_OPTIONS = [
  { value: 'new-build', label: 'Start New Build', description: "I'll interview you about what to build, then generate a complete app." },
  { value: 'load-project', label: 'Load Project', description: 'Resume where you left off on a previous build. (Coming soon)' },
  { value: 'guided-tour', label: 'Guided Tour', description: "I'll walk you through everything Vox Code can do. (Coming soon)" },
]

const WelcomeFlow: React.FC = () => {
  const navigate = useNavigate()
  const {
    step, setStep, answers, setAnswer,
    isPlaying, currentLine, playVoxLine,
    setAssignedTheme, skipWelcome,
  } = useVoxContext()
  const { triggerDissolveRebuild, setPersonality } = useThemeContext()
  const { setActiveModel } = useVoxModel()
  const [selected, setSelected] = useState<string | null>(null)

  const { displayed: typedText, isDone: typingDone } = useTypewriter(
    currentLine?.text ?? '',
    !!currentLine,
    { speed: 35 }
  )

  // Start greeting on mount
  useEffect(() => {
    playVoxLine('greeting')
  }, [playVoxLine])

  // After greeting finishes, advance to q1
  useEffect(() => {
    if (step === 'greeting' && !isPlaying && typingDone && currentLine?.filename === 'greeting') {
      const t = setTimeout(() => {
        setStep('q1')
        playVoxLine('q1_intro')
      }, 800)
      return () => clearTimeout(t)
    }
  }, [step, isPlaying, typingDone, currentLine, setStep, playVoxLine])

  const handleSelect = useCallback(async (value: string) => {
    setSelected(value)
    const qMap = QUESTION_MAP[step as 'q1' | 'q3']
    if (!qMap) return

    setAnswer(qMap.key, value)

    setTimeout(async () => {
      setSelected(null)
      if (step === 'q1') {
        setStep('q3')
        await playVoxLine('q3_intro')
      } else if (step === 'q3') {
        const profile = { ...answers, [qMap.key]: value }
        try {
          const result = await saveWelcomeProfile({ ...profile, density: 'balanced' })
          const theme = result.theme as AdaptiveThemeId
          setAssignedTheme(theme)
          setPersonality({
            style: profile.style as 'technical' | 'professional' | 'casual' | 'creative',
            density: 'balanced',
            mood: (profile.mood ?? value) as 'cool' | 'warm' | 'bold' | 'calm',
          })
          setStep('reveal')
          await playVoxLine(`reveal_${theme}`)
          triggerDissolveRebuild(theme)
          await playVoxLine('outro')
          // After outro, auto-advance to model selection
          setTimeout(() => {
            setStep('model-select')
            playVoxLine('model_question')
          }, 800)
        } catch {
          setAssignedTheme('casual')
          setStep('reveal')
        }
      }
    }, 500)
  }, [step, answers, setStep, setAnswer, setAssignedTheme, setPersonality, playVoxLine, triggerDissolveRebuild])

  const handleModelSelect = useCallback((value: string) => {
    setSelected(value)
    setActiveModel(value as VoxModel)
    setTimeout(() => {
      setSelected(null)
      setStep('action-menu')
      playVoxLine('action_question')
    }, 500)
  }, [setActiveModel, setStep, playVoxLine])

  const handleActionSelect = useCallback((value: string) => {
    setSelected(value)
    setTimeout(() => {
      if (value === 'new-build') {
        navigate('/studio?interview=true')
      } else {
        navigate('/studio')
      }
    }, 500)
  }, [navigate])

  const qConfig = step === 'q1' || step === 'q3'
    ? QUESTION_MAP[step]
    : null

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-6 p-6 overflow-auto"
      style={{ background: 'var(--t-bg)' }}
    >
      <VoxGreeting isPlaying={isPlaying} />

      {currentLine && (
        <p
          className="text-center text-sm max-w-md min-h-[2.5rem]"
          style={{
            color: 'var(--t-text)',
            fontFamily: 'var(--t-font)',
          }}
        >
          {typedText}
          {!typingDone && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle"
              style={{
                background: 'var(--t-primary)',
                animation: 'blink 0.8s step-end infinite',
              }}
            />
          )}
        </p>
      )}

      {qConfig && !isPlaying && typingDone && (
        <WelcomeQuestion
          options={[...qConfig.options]}
          selected={selected}
          onSelect={handleSelect}
        />
      )}

      {step === 'model-select' && !isPlaying && typingDone && (
        <WelcomeQuestion
          options={MODEL_OPTIONS}
          selected={selected}
          onSelect={handleModelSelect}
        />
      )}

      {step === 'action-menu' && !isPlaying && typingDone && (
        <WelcomeQuestion
          options={ACTION_OPTIONS}
          selected={selected}
          onSelect={handleActionSelect}
        />
      )}

      {step !== 'reveal' && step !== 'model-select' && step !== 'action-menu' && step !== 'done' && (
        <button
          onClick={() => {
            skipWelcome()
            navigate('/studio')
          }}
          className="text-xs underline mt-4"
          style={{ color: 'var(--t-muted)' }}
        >
          Skip to Studio
        </button>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

const WelcomePage: React.FC = () => {
  return (
    <VoxProvider>
      <WelcomeFlow />
    </VoxProvider>
  )
}

export default WelcomePage
