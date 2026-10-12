import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { mockInvestigation } from '@/lib/research/mock'
import { errorResponse, parseBody, readMockScenario } from '@/lib/research/route-helpers'
import { investigateRequestSchema, investigationResponseSchema } from '@/lib/research/schema'

export const maxDuration = 300

export async function POST(request: Request) {
  const body = await parseBody(request, investigateRequestSchema)
  if (!body.ok) return body.response

  try {
    const result =
      getBackendMode() === 'live'
        ? await callBackend('/investigations', body.data, investigationResponseSchema, request.signal)
        : await mockInvestigation(body.data.company, body.data.angleId, readMockScenario(request), request.signal)
    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
