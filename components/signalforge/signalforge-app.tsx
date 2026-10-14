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
import CrystalizedBall from '@/components/CrystalizedBall'
import { AppHeader } from './app-header'
import { BrandLogo } from './brand-logo'
import { CompanyPrompt } from './company-prompt'
import { RequestError } from './request-error'
import { ResearchTunnel } from './research-tunnel'
import { JellyRadio } from './jelly-radio'
import { ReportDashboard } from './report-dashboard'

type Flow =
  | { step: 'idle' }
  | { step: 'researching'; company: string }
  | { step: 'research-error'; company: string; message: string }
  | { step: 'angles'; research: ResearchResponse }
  | { step: 'investigating'; research: ResearchResponse; angleId: string }
  | { step: 'investigation-error'; research: ResearchResponse; angleId: string; message: string }
  | { step: 'result'; research: ResearchResponse; investigation: InvestigationResponse }

export function SignalForgeApp({ backendMode }: { backendMode: BackendMode }) {
  const [flow, setFlow] = useState<Flow>({ step: 'idle' })
  const [mockScenario, setMockScenario] = useState<MockScenario>('default')
  const [followupBusy, setFollowupBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

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

  // Render directly in the settled state; keep the crystal-ball effect, skip the intro animation.
  const docked = true
  const ready = true
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
      {busy ? <ResearchTunnel /> : null}

      {!busy ? (
        <>
          <BrandLogo docked={docked} electrified={false} />
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
          'relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-72 transition-opacity duration-500 motion-reduce:transition-none sm:px-6',
          homeScreen ? 'justify-center pt-20' : 'gap-8 pt-24',
          ready && !busy ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {homeScreen ? (
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/20 bg-black/50 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.21em] text-pink-200/85 shadow-[0_0_32px_rgba(236,72,153,0.06)] backdrop-blur">
              <span className="size-1.5 rounded-full bg-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.85)]" />
              Autonomous financial research
            </div>

            <div
              role="img"
              aria-label="Interactive crystal sphere with an electric pink rim and glowing dust. Move the pointer over it to stir the light."
              className="relative mt-1 h-52 w-52 sm:h-60 sm:w-60"
            >
              <CrystalizedBall
                preset="plasma"
                color="#f472b6"
                theme="dark"
                size={0.82}
                particleCount={9500}
                speed={0.72}
                interactive
                hoverStrength={0.78}
                className="h-full w-full"
              />
            </div>

            <h1 className="mt-7 max-w-4xl text-balance font-serif text-4xl font-bold leading-[1.06] tracking-[-0.045em] text-rose-50 sm:text-6xl md:text-7xl">
              The most important signal
              <span className="mt-1 block italic text-pink-200">is often hiding in plain sight.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-sm leading-7 text-rose-100/58 sm:text-base sm:leading-8">
              SAKURA follows the evidence across filings, results, industry data and competitors—then challenges its own explanation before calling it a discovery.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-pink-200/20 bg-pink-200/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-pink-100/85">Track A · Financial services</span>
              <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] text-rose-100/45">Evidence before opinion</span>
              <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] text-rose-100/45">Public sources only</span>
            </div>

            <div className="mt-12 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
              <HomeStep number="01" title="Discover" copy="Generate competing questions from public evidence." />
              <HomeStep number="02" title="Challenge" copy="Compare explanations, metrics and time periods." />
              <HomeStep number="03" title="Prove" copy="Trace claims to sources and define what could disprove them." />
            </div>

            {flow.step === 'research-error' ? (
              <div className="mt-6 w-full max-w-2xl text-left">
                <RequestError title="Research could not be completed" message={flow.message} onRetry={() => runResearch(flow.company)} />
              </div>
            ) : null}

            <p className="mt-8 text-[9px] uppercase tracking-[0.24em] text-rose-100/30">Search a company to begin the investigation</p>
          </div>
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

      {ready && !busy && flow.step !== 'result' ? (
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
        <div role="status" aria-live="polite" className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center px-6 text-center">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-pink-300/80">SAKURA intelligence</p>
            <h1 className="mt-5 text-4xl font-light tracking-wide text-rose-50 sm:text-6xl">
              {followupBusy ? 'Following the evidence' : 'Thinking'}<span className="animate-pulse text-pink-400">...</span>
            </h1>
            <p className="mt-5 text-sm leading-6 text-pink-100/60">
              {followupBusy
                ? 'Searching for fresh support and alternative explanations for ' + activeCompany + '.'
                : flow.step === 'researching'
                  ? 'Exploring public evidence for ' + activeCompany + '.'
                  : 'Examining evidence and challenging the hypothesis for ' + activeCompany + '.'}
            </p>
            <div className="mx-auto mt-8 h-px w-36 overflow-hidden bg-pink-100/10">
              <div className="h-full w-1/2 animate-[sakura-scan_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function HomeStep({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-pink-200/10 bg-black/40 p-4 backdrop-blur-sm sm:p-5">
      <p className="text-[10px] font-mono tracking-[0.18em] text-pink-300/65">{number}</p>
      <h2 className="mt-3 text-sm font-semibold text-rose-50">{title}</h2>
      <p className="mt-1.5 text-xs leading-5 text-rose-100/45">{copy}</p>
    </div>
  )
}
