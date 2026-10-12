import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { mockResearch } from '@/lib/research/mock'
import { errorResponse, parseBody, readMockScenario } from '@/lib/research/route-helpers'
import { researchRequestSchema, researchResponseSchema } from '@/lib/research/schema'

export const maxDuration = 300

export async function POST(request: Request) {
  const body = await parseBody(request, researchRequestSchema)
  if (!body.ok) return body.response

  try {
    const result =
      getBackendMode() === 'live'
        ? await callBackend('/research', body.data, researchResponseSchema, request.signal)
        : await mockResearch(body.data.company, readMockScenario(request), request.signal)
    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
