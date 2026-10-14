
'use client'

import { motion, useReducedMotion } from 'motion/react'
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
import { PeekRating } from './peek-rating'
import { JellyRadio } from './jelly-radio'
import { CounterargumentExplorer } from './counterargument-explorer'

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
          'relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-4 pt-24 pb-64 sm:pb-56 transition-opacity duration-500 motion-reduce:transition-none',
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
              <div className="relative mt-4 flex min-h-44 items-end overflow-hidden rounded-2xl border border-pink-200/15 bg-[#080608] p-5 sm:min-h-52 sm:p-7">
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_12%,rgba(244,114,182,0.18),transparent_42%),radial-gradient(ellipse_at_12%_100%,rgba(190,24,93,0.12),transparent_48%)]" />
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-200/35 to-transparent" />
                <div aria-hidden="true" className="absolute right-7 top-6 size-24 rounded-full border border-pink-200/10 sm:right-12 sm:top-7 sm:size-32" />
                <div aria-hidden="true" className="absolute right-12 top-11 size-14 rounded-full border border-pink-200/10 sm:right-20 sm:top-14 sm:size-20" />
                <div aria-hidden="true" className="absolute right-[4.4rem] top-[3.4rem] size-2 rounded-full bg-pink-200/80 shadow-[0_0_22px_rgba(244,114,182,0.8)] sm:right-[6.4rem] sm:top-[4.4rem]" />
                <div className="relative z-10 max-w-md">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-pink-200/80">SAKURA / SIGNAL & SUBSTANCE</p>
                  <p className="mt-2 text-lg font-medium tracking-tight text-pink-50 sm:text-xl">Evidence first. Assumptions last.</p>
                  <p className="mt-2 text-sm leading-6 text-rose-100/55">Independent research built around traceable sources, calculated signals, and alternative explanations.</p>
                </div>
              </div>
            </div>

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
                  <JellyRadio
                    angles={flow.research.angles}
                    company={flow.research.company}
                    onSelect={angleId => runInvestigation(flow.research, angleId)}
                  />
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
                  <CounterargumentExplorer
                    items={flow.investigation.report.counterarguments}
                    sources={flow.investigation.report.sources}
                  />
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

                <PeekRating
                  investigationId={flow.investigation.investigationId}
                  backendMode={flow.investigation.mode}
                />

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

      {ready && !busy && (
        (flow.step === 'idle' ||
          flow.step === 'research-error' ||
          flow.step === 'angles' ||
          flow.step === 'investigation-error' ||
          flow.step === 'result') && (
          <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/95 to-black/0" />
            <div className="mx-auto w-full max-w-3xl">
              <CompanyPrompt
                key={lastCompany}
                backendMode={backendMode}
                busy={false}
                defaultCompany={lastCompany}
                mockScenario={mockScenario}
                onMockScenarioChange={setMockScenario}
                onSubmit={runResearch}
              />
            </div>
          </div>
        )
      )}

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

