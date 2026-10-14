'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, LoaderCircle, Sparkles } from 'lucide-react'
import { postJson } from '@/lib/research/client'
import {
  followupResponseSchema,
  type BackendMode,
  type FollowupResponse,
  type InvestigationResponse,
  type ResearchResponse,
} from '@/lib/research/schema'

export function FollowupPanel({
  research,
  investigation,
  backendMode,
  onBusyChange,
}: {
  research: ResearchResponse
  investigation: InvestigationResponse
  backendMode: BackendMode
  onBusyChange: (busy: boolean) => void
}) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<FollowupResponse | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const prompt = question.trim()
    if (prompt.length < 4 || busy) return

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setBusy(true)
    onBusyChange(true)
    setError('')
    try {
      const result = await postJson(
        '/api/research/followup',
        { researchId: research.researchId, company: research.company, question: prompt },
        followupResponseSchema,
        { signal: controller.signal },
      )
      setAnswer(result)
      setQuestion('')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'The follow-up could not be completed.')
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }

  return (
    <section className="rounded-3xl border border-pink-200/15 bg-black/65 p-5 shadow-[0_0_55px_rgba(236,72,153,0.055)] backdrop-blur-xl sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-pink-200/20 bg-pink-200/[0.08] text-pink-200">
          <Sparkles size={17} />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-300/75">Continue the investigation</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-rose-50">Ask SAKURA a follow-up</h3>
          <p className="mt-1 text-sm leading-6 text-rose-100/55">Ask it to test a claim, compare a competitor, inspect a specific year or explain a metric. Live mode searches public evidence again.</p>
          <p className="mt-2 line-clamp-2 border-l border-pink-200/20 pl-3 text-xs leading-5 text-pink-100/45">Current finding: {investigation.discovery.headline}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="sakura-followup">Your follow-up question</label>
        <input
          id="sakura-followup"
          value={question}
          onChange={event => setQuestion(event.target.value)}
          maxLength={1000}
          minLength={4}
          placeholder="e.g. Does the same pattern appear at a competing bank?"
          disabled={busy}
          className="h-12 min-w-0 flex-1 rounded-xl border border-pink-200/20 bg-zinc-950/85 px-4 text-sm text-rose-50 outline-none placeholder:text-rose-100/30 transition focus:border-pink-300/60 focus:ring-2 focus:ring-pink-300/10 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || question.trim().length < 4}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-pink-100/25 bg-gradient-to-r from-rose-200 to-pink-300 px-5 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-55"
        >
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
          {busy ? 'Investigating' : 'Ask'}
        </button>
      </form>

      {backendMode === 'mock' ? (
        <p className="mt-3 text-xs leading-5 text-amber-100/60">Demo mode is active. Follow-up analysis will not present invented claims as live financial research.</p>
      ) : null}

      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</p> : null}

      {answer ? (
        <div className="mt-5 border-t border-pink-200/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-300/75">Follow-up finding</p>
            <button type="button" onClick={() => setAnswer(null)} className="text-xs text-rose-100/45 underline underline-offset-4 hover:text-rose-50">Clear answer</button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-rose-50/85">{answer.answer}</p>
          {answer.caveat ? <p className="mt-3 text-sm leading-6 text-amber-100/65">{answer.caveat}</p> : null}
          {answer.sources.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-100/45">Sources checked</p>
              {answer.sources.map(source => (
                <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-pink-200/10 bg-white/[0.02] p-3 transition hover:border-pink-200/30">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-rose-50/85">{source.title}</span>
                    <span className="mt-1 block text-xs text-pink-300/60">{source.publisher || source.url}</span>
                  </span>
                  <ArrowUpRight size={15} className="shrink-0 text-pink-300" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
