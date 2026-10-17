import 'server-only'

import { NextResponse } from 'next/server'
import type { ZodType, z } from 'zod'
import { BackendError } from './backend'
import { MockScenarioError, type MockScenario } from './mock'

export async function parseBody<T extends ZodType>(request: Request, schema: T) {
  const json: unknown = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    return { ok: false as const, response: NextResponse.json({ error: message }, { status: 400 }) }
  }
  return { ok: true as const, data: parsed.data as z.infer<T> }
}

/** Test hook for exercising empty/error states. Only honoured in mock mode. */
export function readMockScenario(request: Request): MockScenario {
  const value = request.headers.get('x-signalforge-mock-scenario')
  return value === 'empty' || value === 'error' ? value : 'default'
}

export function errorResponse(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return NextResponse.json({ error: 'Request cancelled.' }, { status: 499 })
  }
  if (error instanceof BackendError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof MockScenarioError) {
    return NextResponse.json({ error: error.message }, { status: 502 })
  }
  if (error instanceof Error) {
    const message = error.message
    const safeOperationalError =
      message.startsWith('Missing environment variable: ') ||
      message.startsWith('Invalid SAKURA Tavily daily limit.') ||
      message.startsWith('Invalid SAKURA Groq daily limit.') ||
      message.startsWith('Web search failed (') ||
      message.startsWith('AI analysis failed (') ||
      message.startsWith('Groq authentication failed.') ||
      message.startsWith('Groq could not find the configured model') ||
      message.startsWith('Groq rate or usage limit reached.') ||
      message.startsWith('Groq analysis request failed (') ||
      message.startsWith('Groq request payload was too large (413).') ||
      message.startsWith('No usable public sources were found after trying fallback searches.') ||
      message.startsWith('Search results were returned, but none contained usable source text.') ||
      message.startsWith('Daily Groq analysis allowance reached.') ||
      message.startsWith('Daily Tavily search allowance reached.') ||
      message === 'SAKURA usage protection is unavailable. Live research is paused.' ||
      message === 'SAKURA Redis is not configured.' ||
      message === 'The AI returned an empty response.' ||
      message === 'The AI returned invalid JSON. Please retry.' ||
      message === 'No usable public sources were found. Try the full company name.' ||
      message === 'SAKURA could not form research angles from the retrieved evidence.' ||
      message === 'Research session expired or does not match this company. Run the company search again.' ||
      message === 'The selected research angle is not part of this research session. Please search again.' ||
      message === 'Feedback storage is not configured.'
    if (safeOperationalError) {
      const clientError = message.startsWith('Research session expired') ||
        message.startsWith('The selected research angle')
      const providerError = message.startsWith('Web search failed') ||
        message.startsWith('AI analysis failed') ||
        message.startsWith('Groq authentication failed') ||
        message.startsWith('Groq could not find the configured model') ||
        message.startsWith('Groq analysis request failed') ||
        message.startsWith('Groq request payload was too large')
      const quotaError = message.startsWith('Daily Groq analysis allowance reached') ||
        message.startsWith('Daily Tavily search allowance reached') ||
        message.startsWith('Groq rate or usage limit reached')
      return NextResponse.json(
        { error: message },
        { status: clientError ? 400 : quotaError ? 429 : providerError ? 502 : 503 },
      )
    }
  }
  console.error('[signalforge] Unexpected error:', error)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
