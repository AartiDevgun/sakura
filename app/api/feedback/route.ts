import { randomUUID, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { callBackend, getBackendMode } from '@/lib/research/backend'
import { mockFeedback } from '@/lib/research/mock'
import { appendJsonList, putJson, getJsonList } from '@/lib/research/cache'
import { errorResponse, parseBody } from '@/lib/research/route-helpers'
import { feedbackRequestSchema, feedbackResponseSchema } from '@/lib/research/schema'

const FEEDBACK_TTL_SECONDS = 180 * 24 * 60 * 60
const FEEDBACK_INBOX_LIMIT = 500

type StoredFeedback = {
  id: string
  investigationId: string
  rating: number
  comment?: string
  submittedAt: string
}

function isAuthorized(request: Request): boolean {
  const configuredToken = process.env.SAKURA_FEEDBACK_ADMIN_TOKEN
  if (!configuredToken || configuredToken.length < 32) return false

  const supplied = request.headers.get('authorization') || ''
  const expected = `Bearer ${configuredToken}`
  const suppliedBuffer = Buffer.from(supplied)
  const expectedBuffer = Buffer.from(expected)
  return suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
}

/**
 * Protected admin inbox. Set SAKURA_FEEDBACK_ADMIN_TOKEN (32+ characters)
 * in the target Vercel environment and send it as a Bearer token.
 */
export async function GET(request: Request) {
  const configuredToken = process.env.SAKURA_FEEDBACK_ADMIN_TOKEN
  if (!configuredToken || configuredToken.length < 32) {
    return NextResponse.json(
      { error: 'Feedback inbox is not configured. Add a private SAKURA_FEEDBACK_ADMIN_TOKEN (at least 32 characters) in Vercel, then redeploy.' },
      { status: 503 },
    )
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized. Enter the feedback inbox token configured in Vercel.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '100', 10)
  const limit = Number.isSafeInteger(requestedLimit) ? Math.max(1, Math.min(200, requestedLimit)) : 100

  try {
    const cutoff = Date.now() - FEEDBACK_TTL_SECONDS * 1000
    const feedback = (await getJsonList<StoredFeedback>('feedback-inbox', 'latest', limit))
      .filter(entry => Number.isFinite(Date.parse(entry.submittedAt)) && Date.parse(entry.submittedAt) >= cutoff)
    return NextResponse.json({ feedback })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  const body = await parseBody(request, feedbackRequestSchema)
  if (!body.ok) return body.response

  try {
    let result

    if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend('/feedback', body.data, feedbackResponseSchema, request.signal)
    } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const entry: StoredFeedback = {
        id: randomUUID(),
        ...body.data,
        submittedAt: new Date().toISOString(),
      }

      // Keep individual record compatibility and a bounded index for the feedback inbox.
      await putJson(
        'feedback',
        `${body.data.investigationId}:${entry.id}`,
        entry,
        FEEDBACK_TTL_SECONDS,
      )
      await appendJsonList(
        'feedback-inbox',
        'latest',
        entry,
        FEEDBACK_TTL_SECONDS,
        FEEDBACK_INBOX_LIMIT,
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
