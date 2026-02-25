import { useState, useEffect, useCallback, useRef } from 'react'
import type { AusProject } from '../types/project'

export interface ToolRecommendation {
  toolId: string
  reason: string
  priority: number
}

interface RecommendState {
  recommendations: ToolRecommendation[]
  isLoading: boolean
}

const cache = new Map<string, ToolRecommendation[]>()

function cacheKey(project: AusProject): string {
  return `${project.id}:${project.version}`
}

export function useToolRecommendations(
  project: AusProject | null,
  themeId: string,
) {
  const [state, setState] = useState<RecommendState>({
    recommendations: [],
    isLoading: false,
  })
  const abortRef = useRef<AbortController | null>(null)

  const fetchRecs = useCallback(
    async (proj: AusProject) => {
      const key = cacheKey(proj)
      const cached = cache.get(key)
      if (cached) {
        setState({ recommendations: cached, isLoading: false })
        return
      }

      setState((prev) => ({ ...prev, isLoading: true }))

      // Abort any previous in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/studio/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spec_summary: proj.name,
            file_paths: proj.files.map((f) => f.path).slice(0, 20),
            theme: themeId,
            existing_deps: {
              frontend: proj.frontend_deps,
              backend: proj.backend_deps,
            },
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`Recommend failed: ${res.status}`)
        }

        const data = await res.json()
        const recs: ToolRecommendation[] = data.recommendations ?? []
        cache.set(key, recs)
        setState({ recommendations: recs, isLoading: false })
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setState((prev) => ({ ...prev, isLoading: false }))
        }
      }
    },
    [themeId],
  )

  useEffect(() => {
    if (!project) return

    fetchRecs(project)

    return () => {
      abortRef.current?.abort()
    }
  }, [project, fetchRecs])

  const refresh = useCallback(() => {
    if (!project) return
    cache.delete(cacheKey(project))
    fetchRecs(project)
  }, [project, fetchRecs])

  return {
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    refresh,
  }
}
