import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { THEMES, DEFAULT_THEME } from '../themes/index'
import type { AdaptiveThemeId, AdaptiveThemeDefinition } from '../themes/index'
import type { PersonalityProfile } from '../themes/adaptive'
import { initTheme, useThemeApplier } from '../hooks/useTheme'
import { useDissolveRebuild } from '../hooks/useDissolveRebuild'
import ParticleLayer from '../components/ParticleLayer'

interface ThemeContextType {
  themeId: AdaptiveThemeId
  theme: AdaptiveThemeDefinition
  personality: PersonalityProfile | null
  setPersonality: (p: PersonalityProfile) => void
  switchTheme: (id: AdaptiveThemeId) => void
  /** Full dissolve-rebuild effect with GSAP + particles */
  triggerDissolveRebuild: (newThemeId: AdaptiveThemeId) => void
  isTransitioning: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider')
  return ctx
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<AdaptiveThemeId>(DEFAULT_THEME)
  const [personality, setPersonality] = useState<PersonalityProfile | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { switchTheme: applyAndSave } = useThemeApplier()

  const {
    isTransitioning,
    particleMode,
    particleColors,
    particleCount,
    trigger,
  } = useDissolveRebuild()

  // Initialize on mount
  useEffect(() => {
    const saved = initTheme()
    setThemeId(saved)
  }, [])

  // Instant swap (no animation) — for programmatic use
  const switchTheme = useCallback((id: AdaptiveThemeId) => {
    applyAndSave(id)
    setThemeId(id)
  }, [applyAndSave])

  // Full dissolve-rebuild with GSAP + particles
  const triggerDissolveRebuild = useCallback((newThemeId: AdaptiveThemeId) => {
    trigger(newThemeId, containerRef.current, (id) => {
      applyAndSave(id)
      setThemeId(id)
    }, themeId)
  }, [trigger, applyAndSave, themeId])

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme: THEMES[themeId],
        personality,
        setPersonality,
        switchTheme,
        triggerDissolveRebuild,
        isTransitioning,
        containerRef,
      }}
    >
      <ParticleLayer
        mode={particleMode}
        colors={particleColors}
        count={particleCount}
      />
      {children}
    </ThemeContext.Provider>
  )
}
