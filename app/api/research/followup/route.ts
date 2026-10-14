import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { liveFollowup } from '@/lib/research/live-engine'
import { errorResponse, parseBody } from '@/lib/research/route-helpers'
import { followupRequestSchema, followupResponseSchema } from '@/lib/research/schema'

export const maxDuration = 300

export async function POST(request: Request) {
  const body = await parseBody(request, followupRequestSchema)
  if (!body.ok) return body.response

  try {
    let result

    if (process.env.TAVILY_API_KEY && process.env.GROQ_API_KEY) {
      result = await liveFollowup(
        body.data.company,
        body.data.researchId,
        body.data.question,
        request.signal,
      )
    } else if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend(
        '/followup',
        body.data,
        followupResponseSchema,
        request.signal,
      )
    } else if (getBackendMode() === 'live') {
      throw new Error('Live follow-up research is selected, but no research provider is configured.')
    } else {
      result = {
        mode: 'mock' as const,
        followupId: 'followup-' + randomUUID(),
        question: body.data.question,
        answer: 'Live follow-up research is not enabled in this environment. Configure the public-source research providers to let SAKURA retrieve and assess new evidence for this question.',
        caveat: 'Demo mode is active. SAKURA did not generate a financial claim or present mock content as a live finding.',
        sources: [],
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
