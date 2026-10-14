
'use client'

import { type FormEvent, useId, useState } from 'react'
import { ArrowUpRight, LoaderCircle, Search } from 'lucide-react'
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
          className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400"
        >
          Company to investigate · NIFTY 50
        </Label>

        <div className="group relative rounded-md border border-white/[0.15] bg-[#0b0a0b] p-1.5 transition-colors duration-200 focus-within:border-pink-200/55">
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
                className="h-12 min-w-0 border-0 bg-transparent px-0 text-sm text-stone-100 shadow-none placeholder:text-stone-600 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="h-12 shrink-0 gap-2 rounded-sm border border-pink-200/70 bg-pink-200 px-5 font-medium text-[#171015] transition-colors duration-200 hover:bg-pink-100 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-60 sm:h-12"
            >
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Investigating
                </>
              ) : (
                <>
                  Investigate
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

        <p className="text-[11px] leading-relaxed text-stone-500">
          Public filings / source checks / evidence-led analysis
        </p>
      </div>

      {backendMode === 'mock' ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-white/[0.12] bg-[#0b0a0b] p-3 text-sm">
          <MockBadge label="Mock only" />
          <label htmlFor={`${inputId}-scenario`} className="text-stone-300">
            Test scenario
          </label>
          <select
            id={`${inputId}-scenario`}
            value={mockScenario}
            onChange={event =>
              onMockScenarioChange(event.target.value as MockScenario)
            }
            disabled={busy}
            className="h-9 rounded-sm border border-white/[0.15] bg-[#080708] px-3 text-sm text-stone-200 focus-visible:outline-2 focus-visible:outline-pink-300"
          >
            <option value="default">Success</option>
            <option value="empty">Empty result</option>
            <option value="error">Backend error</option>
          </select>
          <p className="w-full text-xs text-stone-500">
            Demo data only. Configure the research backend to enable live research.
          </p>
        </div>
      ) : null}
    </form>
  )
}

function SearchIcon() {
  return (
    <Search
      aria-hidden="true"
      className="size-5 shrink-0 text-stone-500 transition-colors duration-200 group-focus-within:text-pink-200"
    />
  )
}
