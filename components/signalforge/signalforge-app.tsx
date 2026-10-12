'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { isAbortError, postJson } from '@/lib/research/client'
import {
  type BackendMode,
  type MockScenario,
  type ResearchResponse,
  researchResponseSchema,
} from '@/lib/research/schema'
import { cn } from '@/lib/utils'
import { AppHeader } from './app-header'
import { BrandLogo } from './brand-logo'
import { CompanyPrompt } from './company-prompt'
import { RequestError } from './request-error'
import { ResearchProgress } from './research-progress'

const INTRO_HOLD_MS = 2200

type IntroPhase = 'intro' | 'docking' | 'done'

type Flow =
  | { step: 'idle' }
  | { step: 'researching'; company: string }
  | { step: 'research-error'; company: string; message: string }
  | { step: 'angles'; research: ResearchResponse }

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
      const research = await postJson('/api/research', { company }, researchResponseSchema, { signal, mockScenario })
      setFlow({ step: 'angles', research })
    } catch (error) {
      if (isAbortError(error)) return
      setFlow({ step: 'research-error', company, message: (error as Error).message })
    }
  }

  const reset = () => {
    cancelRequest()
    setFlow({ step: 'idle' })
  }

  const docked = intro !== 'intro'
  const ready = intro === 'done'
  const busy = flow.step === 'researching'
  const lastCompany = flow.step === 'idle' ? '' : flow.step === 'angles' ? flow.research.company : flow.company

  return (
    <>
      <BrandLogo docked={docked} electrified={!ready || busy} onDocked={() => setIntro('done')} />

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-x-0 top-[calc(50%+72px)] z-50 text-center font-mono text-2xl font-semibold tracking-tight transition-opacity duration-500 motion-reduce:transition-none',
          docked ? 'opacity-0' : 'opacity-100',
        )}
      >
        SignalForge
      </div>

      <AppHeader visible={docked} backendMode={backendMode} onReset={flow.step === 'idle' ? undefined : reset} />

      <main
        inert={!ready}
        className={cn(
          'mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-4 pt-24 pb-16 transition-opacity duration-500 motion-reduce:transition-none',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-pretty text-3xl font-semibold tracking-tight sm:text-4xl">Research a company</h1>
          <p className="text-pretty text-muted-foreground">
            Find research angles, investigate one, and review the evidence behind the discovery.
          </p>
        </div>

        <CompanyPrompt
          key={lastCompany}
          backendMode={backendMode}
          busy={busy}
          defaultCompany={lastCompany}
          mockScenario={mockScenario}
          onMockScenarioChange={setMockScenario}
          onSubmit={runResearch}
        />

        {flow.step === 'researching' ? (
          <ResearchProgress
            label={`Researching ${flow.company}`}
            detail="Waiting for the research backend to return candidate angles."
            onCancel={reset}
          />
        ) : null}

        {flow.step === 'research-error' ? (
          <RequestError
            title="Research failed"
            message={flow.message}
            onRetry={() => runResearch(flow.company)}
          />
        ) : null}

        {flow.step === 'angles' ? (
          <section aria-labelledby="angles-heading">
            <h2 id="angles-heading" ref={el => el?.focus()} tabIndex={-1} className="text-xl font-semibold outline-none">
              {flow.research.angles.length} research angles for {flow.research.company}
            </h2>
          </section>
        ) : null}
      </main>
    </>
  )
}
