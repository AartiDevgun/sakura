import 'server-only'

import type { z } from 'zod'
import type { BackendMode } from './schema'

export function getBackendMode(): BackendMode {
  // Allows preview deployments to render and exercise the UI without consuming model/search quotas.
  if (process.env.SAKURA_FORCE_MOCK === 'true') return 'mock'

  const externalBackend = Boolean(process.env.SIGNALFORGE_API_URL)
  const localResearch = Boolean(
    process.env.TAVILY_API_KEY && process.env.GROQ_API_KEY
  )

  return externalBackend || localResearch ? 'live' : 'mock'
}

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

/**
 * POSTs to the configured SignalForge research backend and validates the reply.
 * The backend must return JSON matching `schema` (minus `mode`, which is added here).
 */
export async function callBackend<T extends z.ZodType>(
  path: string,
  body: unknown,
  schema: T,
  signal?: AbortSignal,
): Promise<z.infer<T>> {
  const baseUrl = process.env.SIGNALFORGE_API_URL
  if (!baseUrl) throw new BackendError('Research backend is not configured.', 503)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.SIGNALFORGE_API_KEY) headers.Authorization = `Bearer ${process.env.SIGNALFORGE_API_KEY}`

  let response: Response
  try {
    response = await fetch(new URL(path, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
      cache: 'no-store',
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new BackendError('Could not reach the research backend.', 502)
  }

  if (!response.ok) {
    throw new BackendError(`Research backend responded with status ${response.status}.`, 502)
  }

  const json: unknown = await response.json().catch(() => null)
  const parsed = schema.safeParse({ ...(json as object), mode: 'live' })
  if (!parsed.success) {
    console.error('[signalforge] Backend response failed validation:', parsed.error.issues)
    throw new BackendError('Research backend returned data in an unexpected format.', 502)
  }
  return parsed.data
}
