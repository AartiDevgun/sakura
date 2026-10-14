import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { mockInvestigation } from '@/lib/research/mock'
import { liveInvestigation } from '@/lib/research/live-engine'
import {
  errorResponse,
  parseBody,
  readMockScenario,
} from '@/lib/research/route-helpers'
import {
  investigateRequestSchema,
  investigationResponseSchema,
} from '@/lib/research/schema'

export const maxDuration = 300

export async function POST(request: Request) {
  const body = await parseBody(request, investigateRequestSchema)
  if (!body.ok) return body.response

  try {
    let result

    if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend(
        '/investigations',
        body.data,
        investigationResponseSchema,
        request.signal,
      )
    } else if (
      process.env.TAVILY_API_KEY &&
      process.env.GROQ_API_KEY
    ) {
      result = await liveInvestigation(
        body.data.company,
        body.data.angleId,
        request.signal,
        body.data.researchId,
      )
    } else {
      result = await mockInvestigation(
        body.data.company,
        body.data.angleId,
        readMockScenario(request),
        request.signal,
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}