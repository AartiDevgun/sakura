
'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { isAbortError, postJson } from '@/lib/research/client'
import {
  type BackendMode,
  type MockScenario,
  type ResearchResponse,
  type InvestigationResponse,
  researchResponseSchema,
  investigationResponseSchema,
} from '@/lib/research/schema'
import { cn } from '@/lib/utils'
import { AppHeader } from './app-header'
import { BrandLogo } from './brand-logo'
import { CompanyPrompt } from './company-prompt'
import { RequestError } from './request-error'
import { ResearchTunnel } from './research-tunnel'
import { EvidenceFlipCard } from './evidence-flip-card'

const INTRO_HOLD_MS = 2200

type IntroPhase = 'intro' | 'docking' | 'done'

type Flow =
  | { step: 'idle' }
  | { step: 'researching'; company: string }
  | { step: 'research-error'; company: string; message: string }
  | { step: 'angles'; research: ResearchResponse }
  | { step: 'investigating'; research: ResearchResponse; angleId: string }
  | {
      step: 'investigation-error'
      research: ResearchResponse
      angleId: string
      message: string
    }
  | {
      step: 'result'
      research: ResearchResponse
      investigation: InvestigationResponse
    }

export function SignalForgeApp({ backendMode }: { backendMode: BackendMode }) {
  const reduce = useReducedMotion()
  const [intro, setIntro] = useState<IntroPhase>('intro')
  const [flow, setFlow] = useState<Flow>({ step: 'idle' })
  const [mockScenario, setMockScenario] = useState<MockScenario>('default')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (intro !== 'intro') return

    if (reduce) {
      setIntro('done')
      return
    }

    const skip = () => setIntro('docking')
    const timer = setTimeout(skip, INTRO_HOLD_MS)

    window.addEventListener('keydown', skip, { once: true })
    window.addEventListener('pointerdown', skip, { once: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [intro, reduce])

  useEffect(() => () => abortRef.current?.abort(), [])

  const startRequest = () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    return controller.signal
  }

  const cancelRequest = () => {
    abortRef.current?.abort()
    abortRef.current = null
  }

  const runResearch = async (company: string) => {
    const signal = startRequest()
    setFlow({ step: 'researching', company })

    try {
      const research = await postJson(
        '/api/research',
        { company },
        researchResponseSchema,
        { signal, mockScenario },
      )

      setFlow({ step: 'angles', research })
    } catch (error) {
      if (isAbortError(error)) return

      setFlow({
        step: 'research-error',
        company,
        message: (error as Error).message,
      })
    }
  }

  const runInvestigation = async (
    research: ResearchResponse,
    angleId: string,
  ) => {
    const signal = startRequest()
    setFlow({ step: 'investigating', research, angleId })

    try {
      const investigation = await postJson(
        '/api/research/investigate',
        {
          researchId: research.researchId,
          company: research.company,
          angleId,
        },
        investigationResponseSchema,
        { signal, mockScenario },
      )

      setFlow({ step: 'result', research, investigation })
    } catch (error) {
      if (isAbortError(error)) return

      setFlow({
        step: 'investigation-error',
        research,
        angleId,
        message: (error as Error).message,
      })
    }
  }

  const reset = () => {
    cancelRequest()
    setFlow({ step: 'idle' })
  }

  const docked = intro !== 'intro'
  const ready = intro === 'done'
  const busy =
    flow.step === 'researching' || flow.step === 'investigating'

  const lastCompany =
    flow.step === 'idle'
      ? ''
      : flow.step === 'researching' || flow.step === 'research-error'
        ? flow.company
        : flow.research.company

  const activeCompany =
    flow.step === 'researching'
      ? flow.company
      : flow.step === 'investigating'
        ? flow.research.company
        : ''

  const activeAngle =
    flow.step === 'investigating' || flow.step === 'investigation-error'
      ? flow.research.angles.find(angle => angle.id === flow.angleId)
      : undefined

  return (
    <>
      {/* The one and only fullscreen Light Tunnel during research */}
      {busy ? <ResearchTunnel /> : null}

      <BrandLogo
        docked={docked}
        electrified={!ready || busy}
        onDocked={() => setIntro('done')}
      />

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-x-0 top-[calc(50%+72px)] z-50 text-center font-mono text-2xl font-bold tracking-[0.25em] text-pink-100 transition-opacity duration-500 motion-reduce:transition-none',
          docked ? 'opacity-0' : 'opacity-100',
        )}
      >
        SAKURA
      </div>

      <AppHeader
        visible={docked && !busy}
        backendMode={backendMode}
        onReset={flow.step === 'idle' || busy ? undefined : reset}
      />

      {/* Hide the whole normal page while the tunnel is active */}
      <main
        inert={!ready || busy}
        aria-busy={busy}
        className={cn(
          'relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-4 pt-24 pb-16 transition-opacity duration-500 motion-reduce:transition-none',
          ready && !busy ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {!busy && (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-300">
                Independent financial research
              </p>
              <h1 className="text-pretty text-3xl font-semibold tracking-tight text-pink-50 sm:text-4xl">
                Look beyond the obvious.
              </h1>
              <p className="text-pretty leading-7 text-rose-100/60">
                Investigate public evidence, uncover unusual patterns, and challenge
                the explanations behind them.
              </p>
            </div>

            {(flow.step === 'idle' ||
              flow.step === 'research-error' ||
              flow.step === 'angles' ||
              flow.step === 'investigation-error' ||
              flow.step === 'result') && (
              <CompanyPrompt
                key={lastCompany}
                backendMode={backendMode}
                busy={false}
                defaultCompany={lastCompany}
                mockScenario={mockScenario}
                onMockScenarioChange={setMockScenario}
                onSubmit={runResearch}
              />
            )}

            {flow.step === 'research-error' ? (
              <RequestError
                title="Research failed"
                message={flow.message}
                onRetry={() => runResearch(flow.company)}
              />
            ) : null}

            {flow.step === 'angles' ||
            flow.step === 'investigation-error' ? (
              <section aria-labelledby="angles-heading" className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
                    Choose your direction
                  </p>
                  <h2
                    id="angles-heading"
                    tabIndex={-1}
                    className="mt-2 text-xl font-semibold text-pink-50 outline-none sm:text-2xl"
                  >
                    {flow.research.angles.length} research angles for{' '}
                    {flow.research.company}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-rose-100/55">
                    Select an angle to investigate its supporting evidence,
                    counterarguments and potential risks.
                  </p>
                </div>

                {flow.research.angles.length === 0 ? (
                  <div className="rounded-xl border border-pink-200/15 bg-white/[0.03] p-5 text-sm text-rose-100/70">
                    No research angles were returned. Try another company or retry.
                    <button
                      type="button"
                      onClick={() => runResearch(flow.research.company)}
                      className="ml-2 text-pink-300 underline underline-offset-4"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {flow.research.angles.map((angle, index) => (
                      <button
                        type="button"
                        key={angle.id}
                        onClick={() =>
                          runInvestigation(flow.research, angle.id)
                        }
                        className="group w-full rounded-2xl border border-pink-200/15 bg-gradient-to-br from-pink-950/35 to-black/70 p-5 text-left transition-all duration-300 hover:border-pink-300/60 hover:shadow-[0_0_30px_rgba(236,72,153,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-pink-300/25 text-sm text-pink-200">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 text-xs uppercase tracking-[0.16em] text-pink-300/80">
                              {angle.label}
                            </div>
                            <h3 className="font-semibold leading-6 text-pink-50 transition-colors group-hover:text-pink-200">
                              {angle.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-rose-100/60">
                              {angle.rationale}
                            </p>
                            {angle.signalStrength ? (
                              <p className="mt-3 text-xs text-pink-200/70">
                                Initial signal: {angle.signalStrength}
                              </p>
                            ) : null}
                          </div>
                          <span className="text-lg text-pink-300 transition-transform group-hover:translate-x-1">
                            ↗
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {flow.step === 'investigation-error' ? (
                  <RequestError
                    title="Investigation failed"
                    message={flow.message}
                    onRetry={() =>
                      runInvestigation(flow.research, flow.angleId)
                    }
                  />
                ) : null}
              </section>
            ) : null}

            {flow.step === 'result' ? (
              <section className="space-y-5" aria-labelledby="discovery-heading">
                <div className="rounded-2xl border border-pink-300/25 bg-gradient-to-br from-pink-950/45 via-black to-black p-6 shadow-[0_0_45px_rgba(236,72,153,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pink-300">
                    Research discovery · {flow.investigation.discovery.confidence}{' '}
                    confidence
                  </p>
                  <h2
                    id="discovery-heading"
                    className="mt-3 text-2xl font-semibold leading-tight text-pink-50 sm:text-3xl"
                  >
                    {flow.investigation.discovery.headline}
                  </h2>
                  <p className="mt-4 leading-7 text-rose-100/75">
                    {flow.investigation.discovery.summary}
                  </p>
                </div>

                <ReportSection title="What the evidence supports">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-rose-100/65">
                    {flow.investigation.report.thesis}
                  </p>
                </ReportSection>

                {flow.investigation.report.calculations.length > 0 ? (
                  <section className="space-y-3">
                    <h3 className="font-semibold text-pink-100">Calculations</h3>
                    {flow.investigation.report.calculations.map((calc, index) => (
                      <div
                        key={`${calc.label}-${index}`}
                        className="rounded-xl border border-pink-200/15 p-4"
                      >
                        <p className="font-medium text-pink-50">{calc.label}</p>
                        <p className="mt-2 text-sm text-pink-200">{calc.result}</p>
                        <p className="mt-1 text-xs text-rose-100/50">
                          {calc.formula}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-rose-100/65">
                          {calc.interpretation}
                        </p>
                        {calc.inputs.some(input => input.sourceId) ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {calc.inputs.map((input, inputIndex) => {
                              const source = flow.investigation.report.sources.find(
                                item => item.id === input.sourceId,
                              )
                              return source ? (
                                <a
                                  key={`${input.sourceId}-${inputIndex}`}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-pink-300 underline decoration-pink-300/30 underline-offset-4 hover:text-pink-100"
                                >
                                  {input.name}: source ↗
                                </a>
                              ) : null
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </section>
                ) : null}

                {flow.investigation.report.timeline.length > 0 ? (
                  <section className="space-y-3">
                    <h3 className="font-semibold text-pink-100">Timeline</h3>
                    {flow.investigation.report.timeline.map((event, index) => (
                      <div
                        key={`${event.date}-${index}`}
                        className="border-l border-pink-300/35 py-1 pl-4"
                      >
                        <p className="text-xs text-pink-300">{event.date}</p>
                        <p className="mt-1 text-sm leading-6 text-rose-100/75">
                          {event.event}
                        </p>
                        {event.sourceId ? (() => {
                          const source = flow.investigation.report.sources.find(
                            item => item.id === event.sourceId,
                          )
                          return source ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-pink-300 underline decoration-pink-300/30 underline-offset-4"
                            >
                              Source: {source.publisher || source.title} ↗
                            </a>
                          ) : null
                        })() : null}
                      </div>
                    ))}
                  </section>
                ) : null}

                <ReportSection title="Counterarguments">
                  {flow.investigation.report.counterarguments.length ? (
                    <div className="space-y-4">
                      {flow.investigation.report.counterarguments.map(
                        (item, index) => {
                          const source = flow.investigation.report.sources.find(
                            candidate => candidate.id === item.sourceId,
                          )
                          return (
                            <EvidenceFlipCard
                              key={`${item.argument}-${index}`}
                              argument={item.argument}
                              assessment={item.assessment}
                              sourceUrl={source?.url}
                              sourceLabel={source ? `Source: ${source.publisher || source.title}` : undefined}
                            />
                          )
                        },
                      ) )}
                    </div>
                  ) : (
                    <p className="text-sm text-rose-100/60">
                      No counterarguments were returned. Treat the conclusion as
                      incomplete until alternatives are assessed.
                    </p>
                  )}
                </ReportSection>

                <ReportSection title="What would change this conclusion?">
                  <p className="text-sm leading-6 text-rose-100/70">
                    {flow.investigation.report.falsification.condition}
                  </p>
                  {flow.investigation.report.falsification.metric ? (
                    <p className="mt-2 text-xs text-pink-200/70">
                      Monitor: {flow.investigation.report.falsification.metric}
                    </p>
                  ) : null}
                </ReportSection>

                <section className="space-y-3">
                  <h3 className="font-semibold text-pink-100">Evidence sources</h3>
                  {flow.investigation.report.sources.map(source => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-pink-200/15 p-4 transition-colors hover:border-pink-300/50"
                    >
                      <p className="font-medium text-pink-100">{source.title}</p>
                      <p className="mt-1 break-all text-xs text-pink-300/70">
                        {source.publisher || source.url}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
                        {source.sourceTier ? (
                          <span className="rounded-full border border-pink-200/20 px-2 py-1 text-rose-100/70">
                            {source.sourceTier} source
                          </span>
                        ) : null}
                        {source.sourceType ? (
                          <span className="rounded-full border border-pink-200/10 px-2 py-1 text-rose-100/50">
                            {source.sourceType.replace(/_/g, ' ')}
                          </span>
                        ) : null}
                      </div>
                      {source.publishedAt ? (
                        <p className="mt-1 text-xs text-rose-100/45">
                          Published: {source.publishedAt}
                        </p>
                      ) : null}
                    </a>
                  ))}
                </section>

                <button
                  type="button"
                  onClick={() =>
                    setFlow({ step: 'angles', research: flow.research })
                  }
                  className="text-sm text-pink-300 underline underline-offset-4 hover:text-pink-100"
                >
                  Explore another research angle
                </button>
              </section>
            ) : null}
          </>
        )}
      </main>

      {/* Minimal, centred thinking text: no panel, no secondary loader */}
      {busy ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center px-6 text-center"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.4em] text-pink-300/80">
              SAKURA intelligence
            </p>
            <h1 className="mt-5 text-4xl font-light tracking-wide text-pink-50 sm:text-6xl">
              Thinking<span className="animate-pulse text-pink-400">...</span>
            </h1>
            <p className="mt-5 text-sm leading-6 text-pink-100/65">
              {flow.step === 'researching'
                ? `Exploring public evidence for ${activeCompany}.`
                : `Examining evidence and challenging the hypothesis for ${activeCompany}.`}
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}

function ReportSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-pink-200/15 bg-white/[0.025] p-5">
      <h3 className="mb-3 font-semibold text-pink-100">{title}</h3>
      {children}
    </div>
  )
}

