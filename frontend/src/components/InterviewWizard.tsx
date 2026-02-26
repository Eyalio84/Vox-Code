import React, { useState, useCallback, useEffect, useRef } from 'react'
import VoxGreeting from './VoxGreeting'
import WelcomeQuestion from './WelcomeQuestion'
import { useTypewriter } from '../hooks/useTypewriter'
import { useVoxModel } from '../context/VoxModelContext'
import { getTemplate } from '../interview/templates'
import type { InterviewTemplate, InterviewQuestion, InterviewAnswers } from '../interview/types'

type WizardState =
  | 'speaking'
  | 'waiting'
  | 'synthesizing'
  | 'confirming'
  | 'generating'

interface InterviewWizardProps {
  onComplete: (generationPrompt: string) => void
  onSkip: () => void
}

const InterviewWizard: React.FC<InterviewWizardProps> = ({ onComplete, onSkip }) => {
  const { activeModel } = useVoxModel()

  const [template, setTemplate] = useState<InterviewTemplate>(() => getTemplate('webapp'))
  const [sectionIndex, setSectionIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<InterviewAnswers>({})
  const [wizardState, setWizardState] = useState<WizardState>('speaking')
  const [isPlaying, setIsPlaying] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [synthesisResult, setSynthesisResult] = useState<{
    summary: string
    generation_prompt: string
  } | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const section = template.sections[sectionIndex]
  const question: InterviewQuestion | undefined = section?.questions[questionIndex]

  const [displayText, setDisplayText] = useState('')
  const { displayed: typedText, isDone: typingDone } = useTypewriter(
    displayText,
    !!displayText,
    { speed: 35 }
  )

  const playVoice = useCallback(async (text: string, wavFilename?: string) => {
    setIsPlaying(true)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    try {
      let audioUrl: string
      if (wavFilename) {
        audioUrl = `/api/tts/cache/${wavFilename}`
      } else {
        const res = await fetch('/api/welcome/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'af_bella', speed: 1.0 }),
        })
        if (!res.ok) throw new Error('TTS failed')
        const blob = await res.blob()
        audioUrl = URL.createObjectURL(blob)
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error('Audio failed'))
        audio.play().catch(reject)
      })
    } catch (err) {
      console.warn('InterviewWizard audio failed:', err)
      await new Promise((r) => setTimeout(r, 1500))
    } finally {
      setIsPlaying(false)
    }
  }, [])

  const speakQuestion = useCallback(async () => {
    if (!question) return
    setWizardState('speaking')

    if (questionIndex === 0 && section.voxIntro) {
      setDisplayText(section.voxIntro)
      await playVoice(section.voxIntro, section.voxIntroWav)
      await new Promise((r) => setTimeout(r, 600))
    }

    setDisplayText(question.text)
    await playVoice(question.text, question.voxWav)
    setWizardState('waiting')
  }, [question, questionIndex, section, playVoice])

  useEffect(() => {
    speakQuestion()
  }, [sectionIndex, questionIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (wizardState === 'waiting' && question?.type !== 'constrained' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [wizardState, question])

  const advanceToNext = useCallback(() => {
    setTextInput('')
    const nextQ = questionIndex + 1
    if (nextQ < section.questions.length) {
      setQuestionIndex(nextQ)
    } else {
      const nextS = sectionIndex + 1
      if (nextS < template.sections.length) {
        setSectionIndex(nextS)
        setQuestionIndex(0)
      } else {
        setWizardState('synthesizing')
      }
    }
  }, [questionIndex, sectionIndex, section, template])

  const handleAnswer = useCallback((value: string) => {
    const id = question?.id
    if (!id) return

    setAnswers((prev) => ({ ...prev, [id]: value }))

    if (id === 'domain_type' && value !== 'webapp' && value !== 'other') {
      const newTemplate = getTemplate(value)
      if (newTemplate.domain !== 'webapp') {
        setTemplate(newTemplate)
      }
    }

    setTimeout(advanceToNext, 400)
  }, [question, advanceToNext])

  const handleTextSubmit = useCallback(() => {
    const value = textInput.trim()
    if (!value && question?.required) return
    handleAnswer(value || '(skipped)')
  }, [textInput, question, handleAnswer])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }, [handleTextSubmit])

  // Synthesis effect
  useEffect(() => {
    if (wizardState !== 'synthesizing') return

    const synthesize = async () => {
      setDisplayText('Let me put that together...')
      await playVoice('Let me put that together...', 'interview_synthesizing')

      try {
        const res = await fetch('/api/studio/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: template.domain,
            answers,
            model: activeModel,
          }),
        })
        if (!res.ok) throw new Error('Synthesis failed')
        const data = await res.json()
        setSynthesisResult(data)

        setDisplayText(data.summary)
        await playVoice(data.summary)
        setWizardState('confirming')
      } catch (err) {
        console.error('Synthesis failed:', err)
        const fallbackPrompt = Object.entries(answers)
          .filter(([, v]) => v && v !== '(skipped)')
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
        setSynthesisResult({
          summary: 'I have enough to get started. Let me build it.',
          generation_prompt: `Build an application based on these requirements:\n${fallbackPrompt}`,
        })
        setWizardState('confirming')
      }
    }

    synthesize()
  }, [wizardState]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = useCallback(() => {
    if (!synthesisResult) return
    setWizardState('generating')
    onComplete(synthesisResult.generation_prompt)
  }, [synthesisResult, onComplete])

  const isConstrained = question?.type === 'constrained' && question.options
  const showInput = wizardState === 'waiting' && !isConstrained
  const showCards = wizardState === 'waiting' && isConstrained

  return (
    <div className="flex flex-col items-center gap-5 py-8 px-4 max-w-lg mx-auto">
      <VoxGreeting isPlaying={isPlaying} />

      <p
        className="text-center text-sm max-w-md min-h-[2.5rem]"
        style={{ color: 'var(--t-text)', fontFamily: 'var(--t-font)' }}
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

      {showCards && question.options && (
        <WelcomeQuestion
          options={question.options}
          selected={null}
          onSelect={handleAnswer}
        />
      )}

      {showInput && (
        <div className="w-full max-w-md">
          {question?.hint && (
            <p className="text-xs mb-2" style={{ color: 'var(--t-muted)' }}>
              {question.hint}
            </p>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--t-input-bg, var(--t-surface))',
                color: 'var(--t-text)',
                border: 'var(--t-border-width) var(--t-border-style) var(--t-input-border, var(--t-border))',
                borderRadius: 'var(--t-radius)',
              }}
            />
            <button
              onClick={handleTextSubmit}
              className="px-4 py-2 text-sm font-medium shrink-0"
              style={{
                background: 'var(--t-primary)',
                color: '#fff',
                borderRadius: 'var(--t-radius)',
                opacity: textInput.trim() || !question?.required ? 1 : 0.5,
              }}
            >
              Next
            </button>
          </div>
          {!question?.required && (
            <button
              onClick={() => handleAnswer('(skipped)')}
              className="text-xs underline mt-2"
              style={{ color: 'var(--t-muted)' }}
            >
              Skip this question
            </button>
          )}
        </div>
      )}

      {wizardState === 'confirming' && typingDone && (
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            className="px-6 py-2 text-sm font-medium"
            style={{
              background: 'var(--t-primary)',
              color: '#fff',
              borderRadius: 'var(--t-radius)',
            }}
          >
            Looks good — build it!
          </button>
        </div>
      )}

      {wizardState === 'synthesizing' && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--t-muted)' }}>
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--t-primary)' }}
          />
          Synthesizing your requirements...
        </div>
      )}

      {wizardState !== 'synthesizing' && wizardState !== 'confirming' && wizardState !== 'generating' && (
        <p className="text-xs" style={{ color: 'var(--t-muted)' }}>
          Section {sectionIndex + 1} of {template.sections.length} • Question {questionIndex + 1} of {section?.questions.length ?? 0}
        </p>
      )}

      {wizardState !== 'generating' && (
        <button
          onClick={onSkip}
          className="text-xs underline mt-2"
          style={{ color: 'var(--t-muted)' }}
        >
          Skip Interview
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

export default InterviewWizard
