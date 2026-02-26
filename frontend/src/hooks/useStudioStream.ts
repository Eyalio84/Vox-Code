import { useState, useCallback, useRef } from 'react'
import type {
  AusProject,
  AusFile,
  PhaseResult,
  StudioMessage,
} from '../types/project'

export interface StudioState {
  messages: StudioMessage[]
  files: Record<string, AusFile>
  phases: PhaseResult[]
  project: AusProject | null
  plan: string
  streamingText: string
  streamingDeps: Record<string, string>
  isStreaming: boolean
  error: string | null
}

const initialState: StudioState = {
  messages: [],
  files: {},
  phases: [],
  project: null,
  plan: '',
  streamingText: '',
  streamingDeps: {},
  isStreaming: false,
  error: null,
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function useStudioStream() {
  const [state, setState] = useState<StudioState>(initialState)
  const abortRef = useRef<AbortController | null>(null)
  // Use a ref for accumulated text to avoid stale closures in the SSE loop
  const accTextRef = useRef('')

  const addMessage = useCallback(
    (role: StudioMessage['role'], content: string, extra?: Partial<StudioMessage>) => {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: makeId(),
            role,
            content,
            timestamp: new Date().toISOString(),
            ...extra,
          },
        ],
      }))
    },
    [],
  )

  // Auto-save project to persistence API after generation completes
  const saveProject = useCallback(async (proj: AusProject) => {
    try {
      const filesObj: Record<string, unknown> = {}
      for (const f of proj.files) {
        filesObj[f.path] = { path: f.path, content: f.content, role: f.role, language: f.language, size: f.size, order: f.order }
      }
      const body = {
        name: proj.name,
        description: '',
        stack: proj.stack || 'REACT_ONLY',
        files: filesObj,
        frontend_deps: proj.frontend_deps || {},
        backend_deps: proj.backend_deps || {},
      }
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      // Fire-and-forget — don't break the UX on save failure
    }
  }, [])

  const handleEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case 'token':
          // Accumulate streaming text in ref (avoids stale closure)
          accTextRef.current += data.content as string
          setState((prev) => ({
            ...prev,
            streamingText: accTextRef.current,
          }))
          break

        case 'phase':
          setState((prev) => {
            const updated = [...prev.phases]
            const existing = updated.findIndex(
              (p) => p.phase === data.phase,
            )
            const phaseResult: PhaseResult = {
              phase: data.phase as PhaseResult['phase'],
              success: data.status === 'completed',
              output: '',
              error: data.status === 'failed' ? 'Phase failed' : null,
              duration_ms: (data.duration_ms as number) || 0,
              tokens_used: (data.tokens_used as number) || 0,
              model: (data.model as string) || null,
            }
            if (existing >= 0) {
              updated[existing] = phaseResult
            } else {
              updated.push(phaseResult)
            }
            return { ...prev, phases: updated }
          })
          break

        case 'studio_plan':
          setState((prev) => ({ ...prev, plan: data.content as string }))
          addMessage('assistant', data.content as string)
          break

        case 'studio_file':
          setState((prev) => ({
            ...prev,
            files: {
              ...prev.files,
              [data.path as string]: {
                path: data.path as string,
                content: data.content as string,
                role: (data.role as AusFile['role']) || 'COMPONENT',
                language: (data.language as string) || 'text',
                size: (data.content as string).length,
                order: Object.keys(prev.files).length,
              },
            },
          }))
          break

        case 'studio_deps':
          setState((prev) => {
            const frontendDeps = (data.frontend as Record<string, string>) ?? {}
            const newStreamingDeps = { ...prev.streamingDeps, ...frontendDeps }
            // Also update project if it exists
            const updatedProject = prev.project
              ? {
                  ...prev.project,
                  frontend_deps: { ...prev.project.frontend_deps, ...frontendDeps },
                  backend_deps: {
                    ...prev.project.backend_deps,
                    ...((data.backend as Record<string, string>) ?? {}),
                  },
                }
              : prev.project
            return {
              ...prev,
              streamingDeps: newStreamingDeps,
              project: updatedProject,
            }
          })
          break

        case 'done': {
          const project = data.project as AusProject
          const fileCount = project?.files?.length || Object.keys(state.files).length || 0
          // Finalize: add the accumulated text as an assistant message, clear streaming state
          const finalText = accTextRef.current
          accTextRef.current = ''
          setState((prev) => ({
            ...prev,
            project,
            streamingText: '',
            messages: [
              ...prev.messages,
              {
                id: makeId(),
                role: 'assistant' as const,
                content: finalText || `Generation complete — ${fileCount} files generated.`,
                timestamp: new Date().toISOString(),
              },
            ],
          }))
          // Auto-save to persistence
          if (project) {
            saveProject(project)
          }
          break
        }

        case 'error':
          setState((prev) => ({ ...prev, error: data.message as string }))
          addMessage('system', `Error: ${data.message}`)
          break
      }
    },
    [addMessage, state.files, saveProject],
  )

  const generate = useCallback(
    async (prompt: string, project?: AusProject) => {
      addMessage('user', prompt)
      accTextRef.current = ''
      setState((prev) => ({
        ...prev,
        isStreaming: true,
        error: null,
        phases: [],
        streamingText: '',
        streamingDeps: {},
      }))

      const controller = new AbortController()
      abortRef.current = controller

      const mode = project ? 'refine' : 'create'
      const body = JSON.stringify({
        request: prompt,
        mode,
        project: project ?? null,
        spec: null,
      })

      try {
        const res = await fetch('/api/studio/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ detail: 'Stream failed' }))
          throw new Error(err.detail || 'Failed to start stream')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let currentEvent = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim()
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6))
                handleEvent(currentEvent, data)
              } catch {
                // skip malformed events
              }
              currentEvent = ''
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          const msg = (err as Error).message || 'Stream failed'
          setState((prev) => ({ ...prev, error: msg }))
          addMessage('system', `Error: ${msg}`)
        }
      } finally {
        setState((prev) => ({ ...prev, isStreaming: false, streamingText: '' }))
        abortRef.current = null
      }
    },
    [addMessage, handleEvent],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    accTextRef.current = ''
    setState(initialState)
  }, [])

  const loadProject = useCallback((project: AusProject) => {
    // Abort any active generation before loading
    abortRef.current?.abort()
    abortRef.current = null
    const filesMap: Record<string, AusFile> = {}
    for (const f of project.files) {
      filesMap[f.path] = f
    }
    accTextRef.current = ''
    setState({
      messages: [{
        id: makeId(),
        role: 'system',
        content: `Loaded project "${project.name}" — ${project.files.length} files.`,
        timestamp: new Date().toISOString(),
      }],
      files: filesMap,
      phases: [],
      project,
      plan: '',
      streamingText: '',
      streamingDeps: {},
      isStreaming: false,
      error: null,
    })
  }, [])

  const addBlueprint = useCallback((files: AusFile[]) => {
    setState((prev) => {
      const updated = { ...prev.files }
      for (const f of files) {
        updated[f.path] = f
      }
      return { ...prev, files: updated }
    })
  }, [])

  const listProjects = useCallback(async (): Promise<Array<{id: string, name: string, description: string, stack: string, updated_at: string}>> => {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }, [])

  return { ...state, generate, stop, reset, addMessage, loadProject, addBlueprint, saveProject, listProjects }
}
