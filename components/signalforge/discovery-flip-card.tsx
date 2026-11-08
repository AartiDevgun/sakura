'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import type { InvestigationResponse } from '@/lib/research/schema'
import { ParagraphText } from './paragraph-text'

interface DiscoveryFlipCardProps {
  company: string
  discovery: InvestigationResponse['discovery']
  report: InvestigationResponse['report']
}

export function DiscoveryFlipCard({ company, discovery, report }: DiscoveryFlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const reduce = useReducedMotion()
  const strength = discovery.confidence === 'high' ? 'Strong' : discovery.confidence === 'medium' ? 'Moderate' : 'Weak'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-300/75">Discovery card · {company}</p>
        <span className="text-[10px] uppercase tracking-[0.14em] text-rose-100/40">Tap to turn · {flipped ? 'Reasoning' : 'Finding'}</span>
      </div>
      <div className="perspective-[1400px]">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.62, ease: [0.2, 0.75, 0.25, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className="grid"
        >
          <article
            className="col-start-1 row-start-1 flex min-h-[335px] flex-col rounded-3xl border border-pink-200/20 bg-gradient-to-br from-[#210b19]/95 via-[#0b080b]/95 to-black p-6 shadow-[0_0_70px_rgba(236,72,153,0.07)] sm:min-h-[365px] sm:p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-pink-200/20 bg-pink-200/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-200">Track A · Financial services</span>
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-rose-100/55">{strength} evidence strength</span>
            </div>
            <h3 className="mt-6 text-pretty text-2xl font-semibold leading-tight tracking-tight text-rose-50 sm:text-4xl">{discovery.headline}</h3>
            <ParagraphText text={discovery.summary} className="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-rose-100/70 sm:text-base" paragraphClassName="" />
            <p className="mt-4 text-xs leading-6 text-rose-100/45">Evidence-led finding, not an investment recommendation. Review the reasoning and source trail before relying on it.</p>
            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
              <p className="text-xs text-rose-100/35">{report.sources.length} source link{report.sources.length === 1 ? '' : 's'} · {report.calculations.length} calculated metric{report.calculations.length === 1 ? '' : 's'}</p>
              <button type="button" onClick={() => setFlipped(true)} aria-expanded={flipped} className="inline-flex items-center gap-2 rounded-full border border-pink-200/30 bg-pink-200/[0.08] px-4 py-2.5 text-xs font-semibold text-pink-100 transition hover:border-pink-200/60 hover:bg-pink-200/[0.14] focus-visible:outline-2 focus-visible:outline-pink-300">
                Flip for reasoning <ArrowUpRight size={14} />
              </button>
            </div>
          </article>
          <article
            className="col-start-1 row-start-1 flex min-h-[335px] flex-col rounded-3xl border border-pink-200/25 bg-[#090609] p-6 sm:min-h-[365px] sm:p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            aria-label="Discovery reasoning"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-300/75">What the evidence supports</p>
              <span className="text-xs text-rose-100/35">Reasoning · {strength}</span>
            </div>
            <ParagraphText text={report.thesis} className="mt-4 space-y-3 text-sm leading-7 text-rose-100/75" paragraphClassName="" />
            <h4 className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-pink-200/75">Why it matters</h4>
            <ul className="mt-2 space-y-2">
              {discovery.whyItMatters.slice(0, 5).map((item, index) => (
                <li key={index} className="flex gap-2 text-sm leading-6 text-rose-100/65"><span className="mt-0.5 text-pink-300">↳</span><span>{item}</span></li>
              ))}
            </ul>
            {report.evidence?.length ? (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-pink-200/60">Evidence anchors</p>
                {report.evidence.slice(0, 2).map((item, index) => {
                  const source = report.sources.find(candidate => candidate.id === item.sourceId)
                  return <div key={item.sourceId + '-' + index} className="rounded-xl border border-pink-200/10 bg-black/35 p-3">
                    <p className="text-xs leading-5 text-rose-100/65">“{item.quote}”</p>
                    {source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-pink-300 underline underline-offset-4">{source.title} ↗</a> : null}
                  </div>
                })}
              </div>
            ) : null}
            <p className="mt-4 text-xs leading-5 text-rose-100/35"><CheckCircle2 size={13} className="mr-1 inline text-pink-300/70" />Confidence rationale: {discovery.confidenceReason || 'Interpret alongside the report limitations and source coverage.'}</p>
            <div className="mt-auto flex justify-end pt-5">
              <button type="button" onClick={() => setFlipped(false)} aria-expanded={flipped} className="inline-flex items-center gap-2 rounded-full border border-pink-200/30 px-4 py-2.5 text-xs font-semibold text-pink-100 transition hover:bg-pink-200/[0.08] focus-visible:outline-2 focus-visible:outline-pink-300">
                <ArrowLeft size={14} /> Back to discovery
              </button>
            </div>
          </article>
        </motion.div>
      </div>
    </div>
  )
}
