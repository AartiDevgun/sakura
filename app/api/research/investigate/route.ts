import { NextResponse } from 'next/server'
import { callBackend, getBackendMode, usesLocalResearchEngine } from '@/lib/research/backend'
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

    // Match the provider selected by /api/research. Local sessions are stored
    // in Redis, so the follow-up must use the same local engine when configured.
    if (usesLocalResearchEngine()) {
      result = await liveInvestigation(
        body.data.company,
        body.data.angleId,
        request.signal,
        body.data.researchId,
      )
    } else if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend(
        '/investigations',
        body.data,
        investigationResponseSchema,
        request.signal,
      )
    } else if (getBackendMode() === 'live') {
      throw new Error('Live research is selected, but no research provider is configured.')
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
