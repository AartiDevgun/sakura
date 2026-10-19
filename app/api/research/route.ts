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

    // An explicit provider choice must never be bypassed by the legacy backend
    // or mock path. In Groq-only mode, run the local engine so missing keys or
    // provider errors are reported honestly instead of silently invoking Gemini elsewhere.
    const providerPreference = process.env.SAKURA_RESEARCH_PROVIDER?.toLowerCase()
    const forceLocalResearch = providerPreference === 'groq' || providerPreference === 'gemini'
    if (forceLocalResearch || (process.env.TAVILY_API_KEY && (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY))) {
      result = await liveResearch(body.data.company, request.signal)
    } else if (process.env.SIGNALFORGE_API_URL) {
      result = await callBackend(
        '/research',
        body.data,
        researchResponseSchema,
        request.signal,
      )
    } else if (getBackendMode() === 'live') {
      throw new Error('Live research is selected, but no research provider is configured.')
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
