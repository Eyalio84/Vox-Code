/* A(Us) Studio API service */

const BASE = '/api'

// ---------------------------------------------------------------------------
// Health & metadata
// ---------------------------------------------------------------------------

export async function getHealth(): Promise<{
  status: string
  version: string
  name: string
  ready: boolean
  boot_status: string
  providers: { gemini: boolean; claude: boolean }
}> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}

export async function listStacks(): Promise<{
  stacks: Array<{ id: string; name: string; description: string }>
}> {
  const res = await fetch(`${BASE}/stacks`)
  if (!res.ok) throw new Error('Failed to list stacks')
  return res.json()
}

// ---------------------------------------------------------------------------
// Generation (non-streaming — original endpoints)
// ---------------------------------------------------------------------------

export async function createProject(
  request: string,
  spec?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, spec: spec ?? null }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Generation failed' }))
    throw new Error(err.detail || 'Generation failed')
  }
  return res.json()
}

export async function refineProject(
  project: Record<string, unknown>,
  request: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, request }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Refinement failed' }))
    throw new Error(err.detail || 'Refinement failed')
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Streaming (SSE) — to be connected in Phase 4
// ---------------------------------------------------------------------------

export async function streamCreate(
  request: string,
  spec?: Record<string, unknown>,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${BASE}/studio/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, spec: spec ?? null, mode: 'create' }),
  })
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: 'Stream failed' }))
    throw new Error(err.detail || 'Failed to start stream')
  }
  return res.body
}

export async function streamRefine(
  project: Record<string, unknown>,
  request: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${BASE}/studio/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, request, mode: 'refine' }),
  })
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: 'Stream failed' }))
    throw new Error(err.detail || 'Failed to start stream')
  }
  return res.body
}

// ---------------------------------------------------------------------------
// Welcome flow
// ---------------------------------------------------------------------------

export async function getWelcomeStatus(): Promise<{
  firstVisit: boolean
  profile: Record<string, string> | null
}> {
  const res = await fetch(`${BASE}/welcome/status`)
  if (!res.ok) throw new Error('Failed to get welcome status')
  return res.json()
}

export async function getWelcomeQuestions(): Promise<{
  questions: Array<{
    id: string
    question: string
    options: Array<{ value: string; label: string; description: string }>
  }>
}> {
  const res = await fetch(`${BASE}/welcome/questions`)
  if (!res.ok) throw new Error('Failed to get welcome questions')
  return res.json()
}

export async function saveWelcomeProfile(
  profile: Record<string, string>,
): Promise<{ theme: string }> {
  const res = await fetch(`${BASE}/welcome/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error('Failed to save profile')
  return res.json()
}

// ---------------------------------------------------------------------------
// TTS
// ---------------------------------------------------------------------------

export function getTtsCacheUrl(filename: string): string {
  return `${BASE}/tts/cache/${filename}`
}

export async function speakText(
  text: string,
  voice: string = 'af_bella',
  speed: number = 1.0,
): Promise<Blob> {
  const res = await fetch(`${BASE}/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, speed }),
  })
  if (!res.ok) throw new Error('TTS speak failed')
  return res.blob()
}
