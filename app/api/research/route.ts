import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { mockResearch } from '@/lib/research/mock'
import { liveResearch } from '@/lib/research/live-engine'
import {
  errorResponse,
  parseBody,
  readMockScenario,
} from '@/lib/research/route-helpers'
import {
  researchRequestSchema,
  researchResponseSchema,
} from '@/lib/research/schema'

export const maxDuration = 300

export async function POST(request: Request) {
  const body = await parseBody(request, researchRequestSchema)
  if (!body.ok) return body.response

  try {
    let result

    if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend(
        '/research',
        body.data,
        researchResponseSchema,
        request.signal,
      )
    } else if (getBackendMode() === 'live') {
      result = await liveResearch(body.data.company, request.signal)
    } else {
      result = await mockResearch(
        body.data.company,
        readMockScenario(request),
        request.signal,
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}