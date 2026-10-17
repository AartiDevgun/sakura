import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cachedJson, consumeDailyBudget } from '@/lib/research/cache'
import { errorResponse, parseBody } from '@/lib/research/route-helpers'

const chatRequestSchema = z.object({
  question: z.string().trim().min(2, 'Ask SAKURA a question.').max(1000, 'Keep your question under 1,000 characters.'),
})

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
const CHAT_TTL_SECONDS = 6 * 60 * 60

export async function POST(request: Request) {
  const body = await parseBody(request, chatRequestSchema)
  if (!body.ok) return body.response

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Missing environment variable: GROQ_API_KEY')
    }

    const question = body.data.question
    const answer = await cachedJson<string>(
      'groq-chat',
      `${MODEL}\\0${question.trim().toLowerCase()}`,
      CHAT_TTL_SECONDS,
      async () => {
        const limit = Number.parseInt(process.env.SAKURA_GROQ_DAILY_LIMIT ?? '20', 10)
        if (!Number.isSafeInteger(limit) || limit < 1) {
          throw new Error('Invalid SAKURA Groq daily limit.')
        }
        await consumeDailyBudget('groq', limit)

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are SAKURA, a warm, friendly financial-learning companion. Answer questions about finance, stocks, banking, business, startups, economics, and financial terminology in clear, beginner-friendly language. Use simple examples and explain jargon. If asked to explain a term, start with a plain-language definition. Do not pretend to have live market prices, current news, or retrieved sources. Say when a question needs current data. Never give personalised buy/sell/hold recommendations or promise returns. Be honest about uncertainty. Keep most answers concise and structured.',
              },
              { role: 'user', content: question },
            ],
            max_completion_tokens: 900,
            temperature: 0.5,
          }),
          cache: 'no-store',
          signal: request.signal,
        })

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Groq authentication failed. Check GROQ_API_KEY in the Vercel environment used by this deployment, then redeploy.')
          }
          if (response.status === 413) {
            throw new Error('Groq request payload was too large (413). Please shorten the question and retry.')
          }
          if (response.status === 429) {
            throw new Error('Groq rate or usage limit reached. Check the Groq Console usage page before retrying.')
          }
          throw new Error(`Groq analysis request failed (${response.status}). Check the Groq Console and SAKURA environment settings.`)
        }

        const payload = await response.json() as {
          choices?: { message?: { content?: string | null } }[]
        }
        const content = payload.choices?.[0]?.message?.content?.trim()
        if (!content) throw new Error('The AI returned an empty response.')
        return content.slice(0, 8000)
      },
    )

    return NextResponse.json({ answer })
  } catch (error) {
    return errorResponse(error)
  }
}
