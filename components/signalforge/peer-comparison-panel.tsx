'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowUpRight, LoaderCircle, Network, Search, ShieldCheck } from 'lucide-react'
import { isAbortError, postJson } from '@/lib/research/client'
import {
  type InvestigationResponse,
  type PeerComparisonResponse,
  type ResearchResponse,
  peerComparisonResponseSchema,
} from '@/lib/research/schema'

const OUTCOMES = {
  company_specific: {
    label: 'Company-specific evidence',
    description: 'Comparable peers were reviewed and the available evidence suggests this issue differs at the company under investigation.',
    className: 'border-fuchsia-200/25 bg-fuchsia-300/10 text-fuchsia-100',
  },
  peer_shared: {
    label: 'Also seen in peers',
    description: 'At least one comparable company has source evidence of a similar issue. This does not by itself establish an industry-wide pattern.',
    className: 'border-amber-200/25 bg-amber-300/10 text-amber-100',
  },
  industry_wide: {
    label: 'Broader sector pattern',
    description: 'Several comparable companies and broader sector evidence point to a shared trend.',
    className: 'border-pink-200/25 bg-pink-300/10 text-pink-100',
  },
  inconclusive: {
    label: 'Inconclusive',
    description: 'The available public evidence is not strong or comparable enough to decide whether the issue is company-specific.',
    className: 'border-white/15 bg-white/[0.04] text-rose-100/75',
  },
} as const

function readableRelationship(value: string) {
  return value.replace(/_/g, ' ')
}

export function PeerComparisonPanel({
  research,
  investigation,
}: {
  research: ResearchResponse
  investigation: InvestigationResponse
}) {
  const [comparison, setComparison] = useState<PeerComparisonResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const selectedAngle = research.angles.find(angle => angle.id === investigation.angleId)

  useEffect(() => () => abortRef.current?.abort(), [])

  const runComparison = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setComparison(null)
    setError('')
    setLoading(true)
    try {
      const result = await postJson(
        '/api/research/compare',
        {
          researchId: research.researchId,
          company: research.company,
          angleId: investigation.angleId,
          discoveryHeadline: investigation.discovery.headline,
          discoverySummary: investigation.discovery.summary,
          thesis: investigation.report.thesis,
        },
        peerComparisonResponseSchema,
        { signal: controller.signal },
      )
      setComparison(result)
    } catch (caught) {
      if (!isAbortError(caught)) {
        setError(caught instanceof Error ? caught.message : 'The peer comparison could not be completed.')
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-pink-200/15 bg-black/40 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-pink-200/20 bg-pink-200/[0.07] text-pink-200">
            <Network size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-300/70">Cross-company investigation</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-rose-50 sm:text-2xl">Is this issue unique to {research.company}?</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-rose-100/55">
              SAKURA will look for comparable companies, retrieve their own public evidence, and check whether the same issue appears elsewhere. It compares relevant business models and reporting periods instead of treating missing information as proof that a problem is unique.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/35 p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-rose-100/35">Issue to compare</p>
          <p className="mt-1 text-sm leading-6 text-rose-50/85">{investigation.discovery.headline}</p>
          {selectedAngle ? <p className="mt-2 text-xs leading-5 text-rose-100/45">Research angle: {selectedAngle.title}</p> : null}
        </div>

        <button
          type="button"
          onClick={runComparison}
          disabled={loading}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-pink-200/25 bg-pink-200/[0.09] px-4 py-3 text-sm font-semibold text-pink-100 transition hover:border-pink-200/45 hover:bg-pink-200/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Comparing public evidence…' : comparison ? 'Run comparison again' : 'Compare with relevant peers'}
        </button>
        <p className="mt-2 text-[11px] leading-5 text-rose-100/35">This is a separate, on-demand research step. Fresh web searches are subject to SAKURA’s daily usage budget.</p>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="rounded-2xl border border-pink-200/15 bg-black/35 p-5">
          <div className="flex items-center gap-3 text-pink-100/80"><LoaderCircle size={17} className="animate-spin text-pink-300" /><p className="text-sm">Finding comparable companies and checking their own disclosures.</p></div>
          <p className="mt-2 pl-7 text-xs leading-5 text-rose-100/40">SAKURA will report when the evidence is incomplete rather than assume the issue is unique.</p>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-2xl border border-amber-200/15 bg-amber-950/15 p-4">
          <div className="flex items-start gap-2 text-amber-100/80"><AlertCircle size={16} className="mt-0.5 shrink-0" /><p className="text-sm leading-6">{error}</p></div>
        </div>
      ) : null}

      {comparison ? (
        <div className="space-y-4" aria-live="polite">
          {comparison.mode === 'mock' ? (
            <div className="rounded-xl border border-amber-200/20 bg-amber-950/20 px-4 py-3 text-xs leading-5 text-amber-100/75">
              Demo data only — no real peer research was performed in this run.
            </div>
          ) : null}

          <article className="rounded-2xl border border-pink-200/15 bg-black/45 p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-300/70">Comparison result</p>
            <h3 className="mt-2 text-xl font-semibold text-rose-50">{OUTCOMES[comparison.outcome].label}</h3>
            <p className={'mt-3 inline-flex rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ' + OUTCOMES[comparison.outcome].className}>
              {comparison.outcome.replace(/_/g, ' ')}
            </p>
            <p className="mt-3 text-sm leading-7 text-rose-100/75">{comparison.outcomeRationale}</p>
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/30 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-pink-300/65">What was comparable?</p>
              <p className="mt-2 text-sm leading-6 text-rose-100/65">{comparison.comparisonBasis}</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-rose-100/40">{OUTCOMES[comparison.outcome].description}</p>
          </article>

          <section className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-rose-50">What the peer evidence says</h3>
              <p className="mt-1 text-xs leading-5 text-rose-100/40">Each company needs its own source-backed evidence. A company with no usable disclosure is marked as unassessed—not as unaffected.</p>
            </div>
            {comparison.peers.length ? comparison.peers.map(peer => (
              <article key={peer.company} className="rounded-2xl border border-pink-200/12 bg-black/40 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="text-base font-semibold text-rose-50">{peer.company}</h4>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-rose-100/45">{readableRelationship(peer.relationship)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-rose-100/70">{peer.assessment}</p>
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-rose-100/35">Comparison point</p>
                  <p className="mt-1 text-sm leading-6 text-rose-100/65">{peer.comparisonPoint}</p>
                </div>
                {peer.evidence.length ? (
                  <div className="mt-3 space-y-3">
                    {peer.evidence.map((item, index) => {
                      const source = comparison.sources.find(candidate => candidate.id === item.sourceId)
                      return (
                        <div key={item.sourceId + '-' + index} className="rounded-xl border border-pink-200/10 p-3">
                          <p className="text-sm font-medium leading-6 text-rose-50/85">{item.claim}</p>
                          <blockquote className="mt-2 border-l-2 border-pink-300/40 pl-3 text-xs leading-6 text-rose-100/55">“{item.quote}”</blockquote>
                          {item.date ? <p className="mt-2 text-[10px] text-rose-100/35">{item.date}</p> : null}
                          {source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-pink-300 underline underline-offset-4">{source.title} <ArrowUpRight size={12} /></a> : <p className="mt-2 text-xs text-amber-100/60">Source link unavailable</p>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-amber-200/10 bg-amber-950/10 p-3 text-xs leading-5 text-amber-100/65">No peer-specific quote passed verification. SAKURA has not treated this company as evidence for or against the issue.</p>
                )}
              </article>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-sm leading-6 text-rose-100/55">No defensible peer group could be established from the retrieved material.</div>
            )}
          </section>

          {comparison.differences.length ? (
            <section className="rounded-2xl border border-pink-200/12 bg-black/35 p-5">
              <h3 className="text-base font-semibold text-rose-50">Where the companies differ</h3>
              <ul className="mt-3 space-y-2">{comparison.differences.map((item, index) => <li key={index} className="flex gap-2 text-sm leading-6 text-rose-100/65"><span className="text-pink-300">—</span><span>{item}</span></li>)}</ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-amber-200/12 bg-amber-950/10 p-5">
            <h3 className="text-base font-semibold text-rose-50">Limits of this comparison</h3>
            <ul className="mt-3 space-y-2">{comparison.limitations.map((item, index) => <li key={index} className="flex gap-2 text-xs leading-6 text-rose-100/55"><span className="text-amber-200">•</span><span>{item}</span></li>)}</ul>
            <p className="mt-3 border-t border-amber-100/10 pt-3 text-xs leading-5 text-rose-100/40">A missing source does not prove a company is unaffected. Similar results do not automatically mean the causes or severity are the same.</p>
          </section>

          {comparison.sources.length ? (
            <details className="rounded-2xl border border-pink-200/10 bg-black/30 p-4">
              <summary className="cursor-pointer text-sm font-medium text-rose-100/75">All sources used in this comparison ({comparison.sources.length})</summary>
              <div className="mt-3 space-y-2">
                {comparison.sources.map(source => (
                  <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-3 rounded-lg border border-white/[0.06] p-3 text-xs text-rose-100/65 hover:border-pink-200/25">
                    <span>{source.title}<span className="mt-1 block text-[10px] text-rose-100/35">{source.publisher || 'Publisher not identified'}{source.publishedAt ? ' · ' + source.publishedAt : ''}</span></span>
                    <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-pink-300" />
                  </a>
                ))}
              </div>
            </details>
          ) : null}

          <p className="flex items-start gap-2 text-[11px] leading-5 text-rose-100/35"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-pink-300/65" />The comparison is a research aid, not an investment recommendation. Metrics must be checked against original documents where the definitions or periods differ.</p>
        </div>
      ) : null}
    </section>
  )
}
