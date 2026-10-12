'use client'

import { type FormEvent, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type BackendMode, companyInputSchema, type MockScenario } from '@/lib/research/schema'
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
      setValidationError(parsed.error.issues[0]?.message ?? 'Enter a company name.')
      return
    }
    setValidationError(null)
    onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <Label htmlFor={inputId} className="text-sm text-muted-foreground">
        Company name or ticker
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={inputId}
          name="company"
          value={company}
          onChange={event => setCompany(event.target.value)}
          placeholder="e.g. Acme Robotics"
          autoComplete="organization"
          maxLength={120}
          disabled={busy}
          aria-invalid={validationError ? true : undefined}
          aria-describedby={validationError ? errorId : undefined}
          className="h-12 text-base"
        />
        <Button type="submit" size="lg" disabled={busy} className="h-12 sm:px-6">
          {busy ? 'Researching…' : 'Research'}
        </Button>
      </div>
      {validationError ? (
        <p id={errorId} className="text-sm text-destructive">
          {validationError}
        </p>
      ) : null}

      {backendMode === 'mock' ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-warning/40 p-3 text-sm">
          <MockBadge label="Mock only" />
          <label htmlFor={`${inputId}-scenario`} className="text-muted-foreground">
            Test scenario
          </label>
          <select
            id={`${inputId}-scenario`}
            value={mockScenario}
            onChange={event => onMockScenarioChange(event.target.value as MockScenario)}
            disabled={busy}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="default">Success</option>
            <option value="empty">Empty result</option>
            <option value="error">Backend error</option>
          </select>
          <p className="w-full text-xs text-muted-foreground">
            No research backend is connected. Set <code className="font-mono">SIGNALFORGE_API_URL</code> to use real
            data; this selector disappears in live mode.
          </p>
        </div>
      ) : null}
    </form>
  )
}
