import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { mockFeedback } from '@/lib/research/mock'
import { errorResponse, parseBody } from '@/lib/research/route-helpers'
import { feedbackRequestSchema, feedbackResponseSchema } from '@/lib/research/schema'

export async function POST(request: Request) {
  const body = await parseBody(request, feedbackRequestSchema)
  if (!body.ok) return body.response

  try {
    const result =
      getBackendMode() === 'live'
        ? await callBackend('/feedback', body.data, feedbackResponseSchema, request.signal)
        : await mockFeedback(body.data)
    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
