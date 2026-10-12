import type { ZodType, z } from 'zod'
import type { MockScenario } from './schema'

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

interface PostOptions {
  signal?: AbortSignal
  /** Only honoured by the API routes while the backend is in mock mode. */
  mockScenario?: MockScenario
}

export async function postJson<T extends ZodType>(
  path: string,
  body: unknown,
  schema: T,
  { signal, mockScenario }: PostOptions = {},
): Promise<z.infer<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (mockScenario && mockScenario !== 'default') headers['x-signalforge-mock-scenario'] = mockScenario

  let response: Response
  try {
    response = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body), signal })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new RequestError('Network error. Check your connection and try again.', 0)
  }

  const json: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
        ? json.error
        : `Request failed (${response.status}).`
    throw new RequestError(message, response.status)
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) throw new RequestError('The server returned an unexpected response.', response.status)
  return parsed.data
}
