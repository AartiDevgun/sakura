
import 'server-only'
import { createHash } from 'node:crypto'

const PREFIX = 'sakura:v1:cache'

function credentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null
}

async function command(args: (string | number)[]): Promise<unknown> {
  const auth = credentials()
  if (!auth) throw new Error('SAKURA Redis is not configured.')

  const response = await fetch(auth.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) throw new Error(`Redis HTTP ${response.status}.`)

  const data = (await response.json()) as {
    result?: unknown
    error?: string
  }

  if (data.error) throw new Error('Redis command failed.')
  return data.result
}

function keyFor(scope: string, identity: string) {
  const digest = createHash('sha256')
    .update(`${scope}\0${identity}`)
    .digest('hex')
  return `${PREFIX}:${scope}:${digest}`
}

export async function cachedJson<T>(
  scope: string,
  identity: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
): Promise<T> {
  const key = keyFor(scope, identity)

  try {
    const value = await command(['GET', key])
    if (typeof value === 'string') return JSON.parse(value) as T
  } catch {
    // A cache read failure is a miss; quota checks still fail closed.
  }

  const result = await producer()

  try {
    await command([
      'SET',
      key,
      JSON.stringify(result),
      'EX',
      String(Math.max(60, Math.floor(ttlSeconds))),
    ])
  } catch {
    console.warn('[SAKURA] Cache write failed.')
  }

  return result
}

export async function consumeDailyBudget(
  provider: string,
  limit: number,
): Promise<number> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('Invalid SAKURA daily usage limit.')
  }

  const day = new Date().toISOString().slice(0, 10)
  const key = `sakura:v1:budget:${provider}:${day}`

  const script = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], 172800)
    end
    if count > tonumber(ARGV[1]) then
      return {0, count}
    end
    return {1, count}
  `

  let result: unknown

  try {
    result = await command([
      'EVAL', script, '1', key, String(limit),
    ])
  } catch {
    throw new Error(
      'SAKURA usage protection is unavailable. Live research is paused.',
    )
  }

  if (
    !Array.isArray(result) ||
    Number(result[0]) !== 1 ||
    !Number.isFinite(Number(result[1]))
  ) {
    throw new Error(
      `Daily ${provider} limit reached. Please try again tomorrow.`,
    )
  }

  return Number(result[1])
}
