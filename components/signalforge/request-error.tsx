import { Button } from '@/components/ui/button'

interface RequestErrorProps {
  title: string
  message: string
  onRetry?: () => void
}

export function RequestError({ title, message, onRetry }: RequestErrorProps) {
  const tavilyLimit = /Daily Tavily search (?:allowance|limit) reached/i.test(message)
  const groqLimit = /Daily Groq analysis (?:allowance|limit) reached/i.test(message)
  const quotaLimit = tavilyLimit || groqLimit

  const resolvedTitle = tavilyLimit
    ? 'Daily web-search capacity reached'
    : groqLimit
      ? 'Daily analysis capacity reached'
      : title

  const resolvedMessage = tavilyLimit
    ? 'SAKURA has used its daily public web-search allowance. It resets at 05:30 IST. No new discovery was fabricated. To increase capacity, raise SAKURA_TAVILY_DAILY_LIMIT in Vercel Preview only if your Tavily plan allows it.'
    : groqLimit
      ? 'SAKURA has used its daily analysis allowance. It resets at 05:30 IST. To increase capacity, raise SAKURA_GROQ_DAILY_LIMIT in Vercel Preview only if your Groq plan allows it.'
      : message

  return (
    <div
      role="alert"
      className={
        'rounded-2xl border p-4 sm:p-5 ' +
        (quotaLimit
          ? 'border-amber-200/20 bg-amber-950/20'
          : 'border-rose-200/15 bg-black/45')
      }
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ' +
            (quotaLimit
              ? 'border-amber-200/30 text-amber-100/80'
              : 'border-rose-200/20 text-rose-200/80')
          }
        >
          {quotaLimit ? 'i' : '!'}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-rose-50">{resolvedTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-rose-100/65">{resolvedMessage}</p>
          {!quotaLimit && onRetry ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
