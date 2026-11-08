import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cachedJson, consumeDailyBudget } from '@/lib/research/cache'
import { errorResponse, parseBody } from '@/lib/research/route-helpers'

const chatRequestSchema = z.object({
  question: z.string().trim().min(2, 'Ask SAKURA a question.').max(1000, 'Keep your question under 1,000 characters.'),
})

const MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash'
const GROQ_MODEL = process.env.GROQ_CHAT_MODEL || process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
const CHAT_TTL_SECONDS = 6 * 60 * 60
const SYSTEM_PROMPT = 'You are SAKURA, a warm, friendly financial-learning companion. Answer questions about finance, stocks, banking, business, startups, economics, and financial terminology in clear, beginner-friendly language. Use simple examples and explain jargon. If asked to explain a term, start with a plain-language definition. Do not pretend to have live market prices, current news, or retrieved sources. Say when a question needs current data. Never give personalised buy/sell/hold recommendations or promise returns. Be honest about uncertainty. Format answers into short, readable paragraphs separated by a blank line. Use a short heading or bullet list when it improves clarity; avoid one continuous block of text. Keep most answers concise and structured.'

export async function POST(request: Request) {
  const body = await parseBody(request, chatRequestSchema)
  if (!body.ok) return body.response

  try {
    const question = body.data.question.trim()
    const normalizedQuestion = question.toLocaleLowerCase().replace(/\s+/g, ' ')
    const providerPreference = (process.env.SAKURA_RESEARCH_PROVIDER ?? 'auto').toLowerCase()
    if (!['auto', 'groq', 'gemini'].includes(providerPreference)) {
      throw new Error('Invalid SAKURA_RESEARCH_PROVIDER. Use auto, groq, or gemini.')
    }

    // Keep the chatbot aligned with research provider selection. Explicit Groq mode
    // must never silently call Gemini, particularly on the quota-controlled preview.
    const useGroq = providerPreference === 'groq' ||
      (providerPreference === 'auto' && Boolean(process.env.GROQ_API_KEY))

    if (useGroq) {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('SAKURA is set to Groq-only mode, but GROQ_API_KEY is not configured for this Vercel Preview. Add the Groq key and redeploy.')
      }

      const answer = await cachedJson<string>(
        'groq-chat-v1',
        JSON.stringify([GROQ_MODEL, normalizedQuestion]),
        CHAT_TTL_SECONDS,
        async () => {
          const limit = Number.parseInt(process.env.SAKURA_GROQ_DAILY_LIMIT ?? '30', 10)
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
              model: GROQ_MODEL,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: question },
              ],
              // Required by the configured GPT-OSS model; hides internal reasoning.
              reasoning_format: 'hidden',
              max_completion_tokens: 900,
            }),
            cache: 'no-store',
            signal: request.signal,
          })

          if (!response.ok) {
            const failure = await response.json().catch(() => null) as {
              error?: { message?: string; code?: string | number; type?: string }
            } | null
            console.error('[SAKURA Groq chat] Provider request failed', {
              httpStatus: response.status,
              providerCode: failure?.error?.code,
              providerType: failure?.error?.type,
              model: GROQ_MODEL,
            })

            if (response.status === 400) {
              throw new Error(`Groq rejected the chat request (400). Check GROQ_CHAT_MODEL/GROQ_MODEL: ${GROQ_MODEL}.`)
            }
            if (response.status === 401 || response.status === 403) {
              throw new Error('Groq authentication failed. Check GROQ_API_KEY in the Vercel environment used by this deployment, then redeploy.')
            }
            if (response.status === 404) {
              throw new Error(`Groq could not find the configured model "${GROQ_MODEL}". Check GROQ_CHAT_MODEL/GROQ_MODEL in Vercel or remove it to use SAKURA’s default model.`)
            }
            if (response.status === 413) {
              throw new Error('Groq request payload was too large (413). Please shorten the question and retry.')
            }
            if (response.status === 429) {
              throw new Error('Groq rate or usage limit reached. Check the Groq Console usage page before retrying.')
            }
            throw new Error(`Groq chat request failed (${response.status}). The provider may be temporarily unavailable; please retry shortly.`)
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
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      throw new Error('Missing environment variable: GEMINI_API_KEY')
    }

    const answer = await cachedJson<string>(
      'gemini-chat-v1',
      JSON.stringify([MODEL, normalizedQuestion]),
      CHAT_TTL_SECONDS,
      async () => {
        const limit = Number.parseInt(process.env.SAKURA_GEMINI_DAILY_LIMIT ?? '60', 10)
        if (!Number.isSafeInteger(limit) || limit < 1) {
          throw new Error('Invalid SAKURA Gemini daily limit.')
        }
        await consumeDailyBudget('gemini', limit)

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': geminiApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [{ role: 'user', parts: [{ text: question }] }],
              generationConfig: {
                maxOutputTokens: 900,
                thinkingConfig: { thinkingLevel: 'low' },
              },
            }),
            cache: 'no-store',
            signal: request.signal,
          },
        )

        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('Gemini rejected the chat request. Check GEMINI_CHAT_MODEL in Vercel and try again.')
          }
          if (response.status === 401 || response.status === 403) {
            throw new Error('Gemini authentication failed. Check GEMINI_API_KEY in the Vercel environment used by this deployment, then redeploy.')
          }
          if (response.status === 404) {
            throw new Error(`Gemini could not find chat model "${MODEL}". Set GEMINI_CHAT_MODEL to gemini-3.8-flash in Vercel Preview, then redeploy.`)
          }
          if (response.status === 413) {
            throw new Error('Gemini request payload was too large (413). Please shorten the question and retry.')
          }
          if (response.status === 429) {
            throw new Error('Gemini rate or usage limit reached. Check Google AI Studio usage and retry after the quota resets.')
          }
          throw new Error(`Gemini chat request failed (${response.status}). Check Google AI Studio and SAKURA environment settings.`)
        }

        const payload = await response.json() as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
          promptFeedback?: { blockReason?: string }
        }
        const content = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('')
          .trim()

        if (!content) {
          if (payload.promptFeedback?.blockReason) {
            throw new Error('Gemini could not answer that question due to its safety filters. Try rephrasing it.')
          }
          throw new Error('The AI returned an empty response.')
        }
        return content.slice(0, 8000)
      },
    )

    return NextResponse.json({ answer })
  } catch (error) {
    return errorResponse(error)
  }
}
