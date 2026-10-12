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
  console.error('[signalforge] Unexpected error:', error)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
