
import 'server-only'
import { createHash } from 'node:crypto'

const PREFIX = 'sakura:v1'

function credentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  return url && token ? { url: url.replace(/\/+$/, ''), token } : null
}

async function redisCommand(args: (string | number)[]): Promise<unknown> {
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

  if (!response.ok) {
    throw new Error(`Redis request failed (${response.status}).`)
  }

  const data = (await response.json()) as {
    result?: unknown
    error?: string
  }

  if (data.error) throw new Error('Redis command failed.')
  return data.result
}

function makeKey(scope: string, identity: string): string {
  const digest = createHash('sha256')
    .update(`${scope}\0${identity}`)
    .digest('hex')

  return `${PREFIX}:${scope}:${digest}`
}

function parseJson<T>(value: unknown): T | null {
  if (typeof value !== 'string') return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/** Retrieve a persisted record. Throws if Redis is unavailable. */
export async function getJson<T>(
  scope: string,
  identity: string,
): Promise<T | null> {
  const value = await redisCommand(['GET', makeKey(scope, identity)])
  return parseJson<T>(value)
}

/** Persist a record with a time-to-live. Throws if persistence fails. */
export async function putJson<T>(
  scope: string,
  identity: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 60) {
    throw new Error('Cache expiry must be an integer of at least 60 seconds.')
  }

  await redisCommand([
    'SET',
    makeKey(scope, identity),
    JSON.stringify(value),
    'EX',
    ttlSeconds,
  ])
}

/** Cache reusable search or analysis results. */
export async function cachedJson<T>(
  scope: string,
  identity: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
): Promise<T> {
  const key = makeKey(scope, identity)

  try {
    const cached = parseJson<T>(await redisCommand(['GET', key]))
    if (cached !== null) return cached
  } catch {
    // Search caching is best-effort. Provider budget checks remain separate.
  }

  const result = await producer()

  try {
    await redisCommand([
      'SET',
      key,
      JSON.stringify(result),
      'EX',
      Math.max(60, Math.floor(ttlSeconds)),
    ])
  } catch {
    console.warn('[SAKURA] Cache write failed.')
  }

  return result
}

/**
 * Atomic daily budget shared across serverless instances.
 * Fail closed if Redis cannot enforce the limit.
 */
export async function consumeDailyBudget(
  provider: string,
  limit: number,
): Promise<number> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error(`Invalid SAKURA daily limit for ${provider}.`)
  }

  const day = new Date().toISOString().slice(0, 10)
  const key = `${PREFIX}:budget:${provider}:${day}`

  const script = `
    local current = tonumber(redis.call('GET', KEYS[1]) or '0')
    local limit = tonumber(ARGV[1])
    if current >= limit then
      return {0, current}
    end
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], 172800)
    end
    return {1, count}
  `

  let result: unknown

  try {
    result = await redisCommand([
      'EVAL',
      script,
      '1',
      key,
      String(limit),
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
    if (provider === 'groq') {
      throw new Error(
        'Daily Groq analysis allowance reached. It resets at 05:30 IST. Increase SAKURA_GROQ_DAILY_LIMIT in Vercel Preview only within your Groq plan limits, or retry after reset.',
      )
    }
    throw new Error(
      'Daily Tavily search allowance reached. It resets at 05:30 IST. Increase SAKURA_TAVILY_DAILY_LIMIT in Vercel Preview only within your Tavily plan limits, or retry after reset.',
    )
  }

  return Number(result[1])
}
