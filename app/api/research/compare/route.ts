import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { livePeerComparison } from '@/lib/research/live-engine'
import { mockPeerComparison } from '@/lib/research/mock'
import {
  errorResponse,
  parseBody,
  readMockScenario,
} from '@/lib/research/route-helpers'
import {
  peerComparisonRequestSchema,
  peerComparisonResponseSchema,
} from '@/lib/research/schema'

export const maxDuration = 300

export async function POST(request: Request) {
  const body = await parseBody(request, peerComparisonRequestSchema)
  if (!body.ok) return body.response

  try {
    let result

    // Keep the peer comparison on the same protected local research engine when available.
    if (process.env.TAVILY_API_KEY && (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY)) {
      result = await livePeerComparison(body.data, request.signal)
    } else if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend(
        '/comparisons',
        body.data,
        peerComparisonResponseSchema,
        request.signal,
      )
    } else if (getBackendMode() === 'live') {
      throw new Error('Live research is selected, but no research provider is configured.')
    } else {
      result = await mockPeerComparison(
        body.data,
        readMockScenario(request),
        request.signal,
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
