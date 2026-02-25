/* Core dissolve-rebuild orchestration hook
 *
 * Sequence:
 *   1. Pack dissolve-out (or generic GSAP fallback)
 *   2. Particles scatter (dissolve mode)
 *   3. Theme CSS vars swap
 *   4. Particles reform
 *   5. Pack rebuild-in (or generic GSAP fallback)
 *
 * When a theme pack is cached for the current theme, its dissolveOut()
 * factory drives phase 1. For rebuild-in the *new* theme's pack is
 * loaded async (loadPack) so it is ready for future transitions.
 * If no pack is available the hook falls back to the generic GSAP tween.
 */

import { useState, useCallback, useRef } from 'react'
import type { AdaptiveThemeId } from '../themes/index'
import { THEMES } from '../themes/index'
import { getPreset } from '../animations/transitions'
import { ensureGsap } from '../animations/gsapSetup'
import { getCachedPack, loadPack } from '../themes/packs/registry'
import type { ParticleMode } from '../components/ParticleLayer'

interface DissolveRebuildState {
  isTransitioning: boolean
  particleMode: ParticleMode
  particleColors: [string, string, string]
  particleCount: number
}

interface UseDissolveRebuildReturn extends DissolveRebuildState {
  trigger: (
    newThemeId: AdaptiveThemeId,
    containerEl: HTMLElement | null,
    onSwapTheme: (id: AdaptiveThemeId) => void,
    currentThemeId: AdaptiveThemeId
  ) => void
}

export function useDissolveRebuild(): UseDissolveRebuildReturn {
  const [state, setState] = useState<DissolveRebuildState>({
    isTransitioning: false,
    particleMode: 'idle',
    particleColors: ['#6366f1', '#a78bfa', '#f472b6'],
    particleCount: 40,
  })

  const lockRef = useRef(false)

  const trigger = useCallback(
    (
      newThemeId: AdaptiveThemeId,
      containerEl: HTMLElement | null,
      onSwapTheme: (id: AdaptiveThemeId) => void,
      currentThemeId: AdaptiveThemeId
    ) => {
      if (lockRef.current) return
      lockRef.current = true

      const newTheme = THEMES[newThemeId]
      const preset = getPreset(newThemeId)

      // Use the *new* theme's swatch for particles
      setState({
        isTransitioning: true,
        particleMode: 'dissolve',
        particleColors: newTheme.swatch,
        particleCount: preset.particleCount,
      })

      // Run animation asynchronously
      ;(async () => {
        await ensureGsap()
        const gsap = (await import('gsap')).default

        const children = containerEl
          ? Array.from(containerEl.children) as HTMLElement[]
          : []

        // Phase 1: dissolve out
        // Try pack-specific dissolveOut for the *current* theme
        const currentPack = getCachedPack(currentThemeId)
        if (currentPack && containerEl) {
          await currentPack.dissolveOut(containerEl, children)
        } else if (children.length > 0) {
          // Fallback: generic GSAP dissolve
          await gsap.to(children, {
            opacity: 0,
            scale: preset.dissolveScale,
            duration: preset.dissolveDuration,
            stagger: preset.stagger,
            ease: preset.dissolveEase,
          })
        } else if (containerEl) {
          await gsap.to(containerEl, {
            opacity: 0,
            duration: preset.dissolveDuration,
            ease: preset.dissolveEase,
          })
        }

        // Phase 2: swap theme (CSS vars update instantly)
        onSwapTheme(newThemeId)

        // Phase 3: reform particles
        setState(prev => ({ ...prev, particleMode: 'reform' }))

        // Phase 4: rebuild in
        // Try to load the *new* theme's pack (async -- caches for future use)
        let newPack
        try {
          newPack = await loadPack(newThemeId)
        } catch {
          // loadPack failed -- fall through to generic GSAP rebuild
          newPack = undefined
        }

        if (newPack && containerEl) {
          await newPack.rebuildIn(containerEl, children)
        } else if (children.length > 0) {
          // Fallback: generic GSAP rebuild
          gsap.set(children, { scale: preset.dissolveScale, opacity: 0 })
          await gsap.to(children, {
            opacity: 1,
            scale: 1,
            duration: preset.rebuildDuration,
            stagger: preset.stagger,
            ease: preset.rebuildEase,
          })
        } else if (containerEl) {
          await gsap.to(containerEl, {
            opacity: 1,
            duration: preset.rebuildDuration,
            ease: preset.rebuildEase,
          })
        }

        // Phase 5: settle
        setState(prev => ({
          ...prev,
          isTransitioning: false,
          particleMode: 'idle',
        }))
        lockRef.current = false
      })()
    },
    []
  )

  return { ...state, trigger }
}
