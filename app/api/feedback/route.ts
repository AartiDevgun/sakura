import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { mockFeedback } from '@/lib/research/mock'
import { putJson } from '@/lib/research/cache'
import { errorResponse, parseBody } from '@/lib/research/route-helpers'
import { feedbackRequestSchema, feedbackResponseSchema } from '@/lib/research/schema'

const FEEDBACK_TTL_SECONDS = 180 * 24 * 60 * 60

export async function POST(request: Request) {
  const body = await parseBody(request, feedbackRequestSchema)
  if (!body.ok) return body.response

  try {
    let result

    if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend('/feedback', body.data, feedbackResponseSchema, request.signal)
    } else if (process.env.TAVILY_API_KEY && process.env.GROQ_API_KEY) {
      await putJson(
        'feedback',
        `${body.data.investigationId}:${randomUUID()}`,
        { ...body.data, submittedAt: new Date().toISOString() },
        FEEDBACK_TTL_SECONDS,
      )
      result = {
        mode: 'live' as const,
        investigationId: body.data.investigationId,
        persisted: true,
      }
    } else if (getBackendMode() === 'live') {
      throw new Error('Feedback storage is not configured.')
    } else {
      result = await mockFeedback(body.data)
    }

    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
