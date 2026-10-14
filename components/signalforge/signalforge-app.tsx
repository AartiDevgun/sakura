'use client'

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
import { SakuraParticles } from '@/components/sakura-particles'
import { AppHeader } from './app-header'
import { BrandLogo } from './brand-logo'
import { CompanyPrompt } from './company-prompt'
import { RequestError } from './request-error'
import { JellyRadio } from './jelly-radio'
import { ReportDashboard } from './report-dashboard'

const INTRO_HOLD_MS = 1100

type IntroPhase = 'intro' | 'docking' | 'done'

type Flow =
  | { step: 'idle' }
  | { step: 'researching'; company: string }
  | { step: 'research-error'; company: string; message: string }
  | { step: 'angles'; research: ResearchResponse }
  | { step: 'investigating'; research: ResearchResponse; angleId: string }
  | { step: 'investigation-error'; research: ResearchResponse; angleId: string; message: string }
  | { step: 'result'; research: ResearchResponse; investigation: InvestigationResponse }

export function SignalForgeApp({ backendMode }: { backendMode: BackendMode }) {
  const [intro, setIntro] = useState<IntroPhase>('done')
  const [flow, setFlow] = useState<Flow>({ step: 'idle' })
  const [mockScenario, setMockScenario] = useState<MockScenario>('default')
  const [followupBusy, setFollowupBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (intro !== 'intro') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setIntro('done')
      return
    }
    const skip = () => setIntro('docking')
    const timer = window.setTimeout(skip, INTRO_HOLD_MS)
    window.addEventListener('keydown', skip, { once: true })
    window.addEventListener('pointerdown', skip, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [intro])

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
      const research = await postJson('/api/research', { company }, researchResponseSchema, { signal, mockScenario })
      if (research.angles.length > 0) {
        await runInvestigation(research, research.angles[0].id)
      } else {
        setFlow({ step: 'angles', research })
      }
    } catch (error) {
      if (isAbortError(error)) return
      setFlow({ step: 'research-error', company, message: (error as Error).message })
    }
  }

  const runInvestigation = async (research: ResearchResponse, angleId: string) => {
    const signal = startRequest()
    setFlow({ step: 'investigating', research, angleId })
    try {
      const investigation = await postJson(
        '/api/research/investigate',
        { researchId: research.researchId, company: research.company, angleId },
        investigationResponseSchema,
        { signal, mockScenario },
      )
      setFlow({ step: 'result', research, investigation })
    } catch (error) {
      if (isAbortError(error)) return
      setFlow({ step: 'investigation-error', research, angleId, message: (error as Error).message })
    }
  }

  const reset = () => {
    cancelRequest()
    setFollowupBusy(false)
    setFlow({ step: 'idle' })
  }

  const docked = intro !== 'intro'
  const ready = intro === 'done'
  const researching = flow.step === 'researching' || flow.step === 'investigating'
  const busy = researching || followupBusy
  const lastCompany = flow.step === 'idle'
    ? ''
    : flow.step === 'researching' || flow.step === 'research-error'
      ? flow.company
      : flow.research.company
  const activeCompany = flow.step === 'researching' || flow.step === 'research-error'
    ? flow.company
    : 'research' in flow
      ? flow.research.company
      : ''
  const homeScreen = flow.step === 'idle' || flow.step === 'research-error'

  return (
    <>
      {!busy ? <SakuraParticles /> : null}

      {!busy ? (
        <>
          <BrandLogo docked={docked} electrified={!ready} onDocked={() => setIntro('done')} />
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none fixed inset-x-0 top-[calc(50%+70px)] z-50 text-center font-mono text-xl font-bold tracking-[0.32em] text-pink-100 transition-opacity duration-500 motion-reduce:transition-none',
              docked ? 'opacity-0' : 'opacity-100',
            )}
          >
            SAKURA
          </div>
        </>
      ) : null}

      <AppHeader
        visible={docked && !busy}
        backendMode={backendMode}
        onReset={flow.step === 'idle' || busy ? undefined : reset}
      />

      <main
        inert={!ready || busy}
        aria-busy={busy}
        className={cn(
          'relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-24 transition-opacity duration-500 motion-reduce:transition-none sm:px-6',
          homeScreen ? 'justify-center pt-20' : 'gap-8 pt-24',
          ready && !busy ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {homeScreen ? (
          <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-12 py-6 text-left md:grid-cols-[minmax(0,1.2fr)_minmax(250px,0.8fr)] md:gap-20 md:py-12">
            <div className="flex min-w-0 flex-col items-start">
              <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-pink-200/70">
                <span className="h-px w-8 bg-pink-300/70" />
                SAKURA / Financial research desk
              </p>

              <h1 className="mt-7 max-w-2xl text-balance font-serif text-5xl font-medium leading-[1.02] tracking-[-0.045em] text-stone-100 sm:text-6xl md:text-7xl">
                Don&apos;t stop at the result.
                <span className="mt-2 block font-normal italic text-pink-200">Trace what made it happen.</span>
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-sm leading-7 text-stone-300/70 sm:text-base sm:leading-8">
                A closer read of India&apos;s public companies. SAKURA follows changes through filings, results and industry data, then checks whether the evidence really supports the story.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-white/[0.12] py-3 text-[9px] font-medium uppercase tracking-[0.15em] text-stone-400/75 sm:text-[10px]">
                <span>NIFTY 50</span>
                <span aria-hidden="true" className="text-pink-300/60">/</span>
                <span>Public records</span>
                <span aria-hidden="true" className="text-pink-300/60">/</span>
                <span>Source-linked claims</span>
              </div>

              <div className="mt-8 w-full max-w-xl">
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

              <p className="mt-4 text-[11px] leading-5 text-stone-500">
                Research, not a stock tip. Every conclusion should be traceable to a public source.
              </p>

              {flow.step === 'research-error' ? (
                <div className="mt-6 w-full max-w-xl">
                  <RequestError title="Research could not be completed" message={flow.message} onRetry={() => runResearch(flow.company)} />
                </div>
              ) : null}
            </div>

            <aside className="mt-2 border-t border-pink-200/25 pt-5 md:mt-24">
              <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone-500">How we work <span className="ml-2 text-pink-200/65">01—03</span></p>

              <div className="mt-3">
                <div className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-white/[0.11] py-5">
                  <span className="pt-0.5 font-mono text-xs text-pink-200/65">01</span>
                  <div>
                    <h2 className="text-sm font-medium text-stone-100">Find the question</h2>
                    <p className="mt-1.5 text-xs leading-5 text-stone-400">Spot a change that deserves more than a headline.</p>
                  </div>
                </div>
                <div className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-white/[0.11] py-5">
                  <span className="pt-0.5 font-mono text-xs text-pink-200/65">02</span>
                  <div>
                    <h2 className="text-sm font-medium text-stone-100">Follow the record</h2>
                    <p className="mt-1.5 text-xs leading-5 text-stone-400">Compare periods, disclosures and independent sources.</p>
                  </div>
                </div>
                <div className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-white/[0.11] py-5">
                  <span className="pt-0.5 font-mono text-xs text-pink-200/65">03</span>
                  <div>
                    <h2 className="text-sm font-medium text-stone-100">Try to disprove it</h2>
                    <p className="mt-1.5 text-xs leading-5 text-stone-400">Keep alternatives visible and state what would change the conclusion.</p>
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-xs text-xs leading-6 text-stone-500">
                No black-box score. No claim without a trail back to its source.
              </p>
            </aside>
          </section>
        ) : null}

        {flow.step === 'angles' || flow.step === 'investigation-error' ? (
          <section className="mx-auto w-full max-w-5xl space-y-5" aria-labelledby="angles-heading">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-300/75">Investigation plan · {flow.research.company}</p>
              <h1 id="angles-heading" className="mt-3 text-3xl font-semibold tracking-tight text-rose-50 sm:text-4xl">Choose the signal worth testing.</h1>
              <p className="mt-3 text-sm leading-7 text-rose-100/55">These are hypotheses, not findings. Select one to collect angle-specific evidence, calculate supported changes and actively test alternatives.</p>
            </div>
            {flow.research.angles.length > 0 ? (
              <JellyRadio angles={flow.research.angles} company={flow.research.company} onSelect={angleId => runInvestigation(flow.research, angleId)} />
            ) : (
              <RequestError title="No research angles returned" message="The available sources were not enough to form a useful investigation. Try searching again with the full company name." onRetry={() => runResearch(flow.research.company)} />
            )}
            {flow.step === 'investigation-error' ? (
              <RequestError title="Investigation failed" message={flow.message} onRetry={() => runInvestigation(flow.research, flow.angleId)} />
            ) : null}
          </section>
        ) : null}

        {flow.step === 'result' ? (
          <ReportDashboard
            research={flow.research}
            investigation={flow.investigation}
            backendMode={backendMode}
            onExploreAngles={() => setFlow({ step: 'angles', research: flow.research })}
            onFollowupBusyChange={setFollowupBusy}
          />
        ) : null}
      </main>

      {ready && !busy && flow.step !== 'result' && !homeScreen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-8 sm:px-5">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/95 to-black/0" />
          <div className="mx-auto w-full max-w-4xl">
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
      ) : null}

      {busy ? (
        <div role="status" aria-live="polite" className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-[#080708]/95 px-6 text-left">
          <div className="w-full max-w-lg border-t border-pink-200/30 pt-5">
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone-500">
              Research in progress <span className="mx-2 text-pink-200/60">/</span> {activeCompany}
            </p>
            <h1 className="mt-5 font-serif text-3xl font-medium leading-tight text-stone-100 sm:text-4xl">
              {followupBusy ? 'Checking another explanation.' : flow.step === 'researching' ? 'Reading the public record.' : 'Testing the hypothesis.'}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-stone-400">
              Comparing source passages and dates before presenting a finding. This can take a moment.
            </p>
            <div className="mt-8 h-px w-full bg-white/[0.12]">
              <div className="h-full w-1/3 animate-[sakura-scan_2.4s_ease-in-out_infinite] bg-pink-200/60" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

