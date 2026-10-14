
'use client'

import { type FormEvent, useId, useState } from 'react'
import { ArrowUpRight, LoaderCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type BackendMode,
  companyInputSchema,
  type MockScenario,
} from '@/lib/research/schema'
import { MockBadge } from './mock-badge'

interface CompanyPromptProps {
  backendMode: BackendMode
  busy: boolean
  defaultCompany?: string
  mockScenario: MockScenario
  onMockScenarioChange: (scenario: MockScenario) => void
  onSubmit: (company: string) => void
}

export function CompanyPrompt({
  backendMode,
  busy,
  defaultCompany = '',
  mockScenario,
  onMockScenarioChange,
  onSubmit,
}: CompanyPromptProps) {
  const inputId = useId()
  const errorId = useId()
  const [company, setCompany] = useState(defaultCompany)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return

    const parsed = companyInputSchema.safeParse(company)

    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? 'Enter a company name.',
      )
      return
    }

    setValidationError(null)
    onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-200/80"
        >
          Search a NIFTY 50 company
        </Label>

        <div className="group relative rounded-2xl border border-pink-300/25 bg-zinc-950/70 p-2 shadow-[0_0_35px_rgba(236,72,153,0.07)] transition-all duration-300 focus-within:border-pink-300/60 focus-within:shadow-[0_0_35px_rgba(236,72,153,0.14)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <SearchIcon />

              <Input
                id={inputId}
                name="company"
                value={company}
                onChange={event => setCompany(event.target.value)}
                placeholder="e.g. HDFC Bank, ICICI Bank, Bajaj Finance"
                autoComplete="organization"
                maxLength={120}
                disabled={busy}
                aria-invalid={validationError ? true : undefined}
                aria-describedby={validationError ? errorId : undefined}
                className="h-12 min-w-0 border-0 bg-transparent px-0 text-base text-pink-50 shadow-none placeholder:text-rose-100/35 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="h-12 shrink-0 gap-2 rounded-xl border border-pink-100/30 bg-gradient-to-r from-rose-200 via-pink-300 to-fuchsia-300 px-5 font-semibold text-zinc-950 shadow-[0_0_20px_rgba(244,114,182,0.13)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_28px_rgba(244,114,182,0.25)] focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-60 sm:h-12"
            >
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Investigating
                </>
              ) : (
                <>
                  Begin research
                  <ArrowUpRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {validationError ? (
          <p id={errorId} role="alert" className="text-sm text-rose-300">
            {validationError}
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-rose-100/45">
          Public filings · Independent source checks · Evidence-led analysis
        </p>
      </div>

      {backendMode === 'mock' ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pink-300/20 bg-pink-950/20 p-3 text-sm">
          <MockBadge label="Mock only" />
          <label htmlFor={`${inputId}-scenario`} className="text-rose-100/70">
            Test scenario
          </label>
          <select
            id={`${inputId}-scenario`}
            value={mockScenario}
            onChange={event =>
              onMockScenarioChange(event.target.value as MockScenario)
            }
            disabled={busy}
            className="h-9 rounded-lg border border-pink-300/25 bg-zinc-950 px-3 text-sm text-rose-100 focus-visible:outline-2 focus-visible:outline-pink-300"
          >
            <option value="default">Success</option>
            <option value="empty">Empty result</option>
            <option value="error">Backend error</option>
          </select>
          <p className="w-full text-xs text-rose-100/50">
            Demo data only. Configure the research backend to enable live research.
          </p>
        </div>
      ) : null}
    </form>
  )
}

function SearchIcon() {
  return (
    <Sparkles
      aria-hidden="true"
      className="size-5 shrink-0 text-pink-300 transition-transform duration-300 group-focus-within:scale-110"
    />
  )
}
