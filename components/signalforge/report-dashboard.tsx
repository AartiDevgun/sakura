'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, BookOpen, CalendarDays, ChartNoAxesCombined, FlaskConical, MessageCircle, Network, Sparkles, type LucideIcon } from 'lucide-react'
import type { BackendMode, InvestigationResponse, ResearchAngle, ResearchResponse } from '@/lib/research/schema'
import { assessDiscovery, isVerifiedDiscovery } from '@/lib/research/discovery-quality'
import { CounterargumentExplorer } from './counterargument-explorer'
import { FollowupPanel } from './follow-up-panel'
import { PeekRating } from './peek-rating'
import { JellyRadio } from './jelly-radio'
import { DiscoveryFlipCard } from './discovery-flip-card'
import { ParagraphText } from './paragraph-text'
import { PeerComparisonPanel } from './peer-comparison-panel'

type SectionKey = 'overview' | 'discovery' | 'evidence' | 'peers' | 'numbers' | 'timeline' | 'challenge' | 'sources' | 'followup'

const SECTIONS: { id: SectionKey; label: string; icon: LucideIcon; note: string }[] = [
  { id: 'overview', label: 'Full report', icon: BookOpen, note: 'All required outputs' },
  { id: 'discovery', label: 'Discovery', icon: Sparkles, note: 'The signal' },
  { id: 'evidence', label: 'Evidence trail', icon: Network, note: 'What supports it' },
  { id: 'peers', label: 'Peer context', icon: Network, note: 'Company vs peers' },
  { id: 'numbers', label: 'Numbers', icon: ChartNoAxesCombined, note: 'Calculated changes' },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays, note: 'When it emerged' },
  { id: 'challenge', label: 'Challenge it', icon: FlaskConical, note: 'Alternatives & falsification' },
  { id: 'sources', label: 'Sources', icon: BookOpen, note: 'Public documents' },
  { id: 'followup', label: 'Follow-up', icon: MessageCircle, note: 'Investigate again' },
]


export function ReportDashboard({
  research,
  investigation,
  discoveries,
  backendMode,
  onSelectDiscovery,
  onExploreAngles,
  onFollowupBusyChange,
}: {
  research: ResearchResponse
  investigation: InvestigationResponse
  discoveries: InvestigationResponse[]
  backendMode: BackendMode
  onSelectDiscovery: (angleId: string) => void
  onExploreAngles: () => void
  onFollowupBusyChange: (busy: boolean) => void
}) {
  const [active, setActive] = useState<SectionKey>('overview')
  const reduce = useReducedMotion()
  const report = investigation.report
  const discovery = investigation.discovery
  const selectedAngle = research.angles.find(angle => angle.id === investigation.angleId)
  const discoveryOptions: ResearchAngle[] = discoveries.map((item, index) => {
    const angle = research.angles.find(candidate => candidate.id === item.angleId)
    return {
      id: item.angleId,
      label: angle?.label || `Discovery ${index + 1}`,
      title: item.discovery.headline,
      rationale: item.discovery.summary,
      signalStrength: item.discovery.confidence === 'high' ? 'strong' : item.discovery.confidence === 'medium' ? 'moderate' : 'weak',
    }
  })
  const cited = new Set((report.evidence ?? []).map(item => item.sourceId))
  const primaryCount = report.sources.filter(source => source.sourceTier === 'primary').length
  const independentPublisherCount = new Set(report.sources.map(source => { try { return new URL(source.url).hostname.replace(/^www\./, '').toLowerCase() } catch { return source.publisher?.toLowerCase() || source.id } })).size
  const confidenceLabel = discovery.confidence === 'high' ? 'Strong' : discovery.confidence === 'medium' ? 'Moderate' : 'Weak'
  const verifiedCount = discoveries.filter(isVerifiedDiscovery).length
  const selectedAssessment = assessDiscovery(investigation)

  return (
    <section className="space-y-5" aria-labelledby="research-report-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-pink-300/75">SAKURA intelligence · Track A</p>
          <h2 id="research-report-heading" className="mt-2 text-2xl font-semibold tracking-tight text-rose-50 sm:text-3xl">{research.company}</h2>
          <p className="mt-1 text-sm text-rose-100/45">Banking, NBFCs & financial services · Public-evidence investigation</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatChip label="Verified findings" value={String(verifiedCount)} />
          <StatChip label="Sources" value={String(report.sources.length)} />
          <StatChip label="Primary" value={String(primaryCount)} />
          <StatChip label="Evidence strength" value={confidenceLabel} />
        </div>
      </div>

      <div className={"rounded-2xl px-4 py-3 text-xs leading-6 " + (verifiedCount === 0 ? "border border-amber-200/20 bg-amber-950/20 text-amber-100/80" : "border border-pink-200/10 bg-black/35 text-rose-100/55")}>
        {verifiedCount === 0
          ? "No tested angle met the minimum verification gate. The report below is a diagnostic candidate, not a verified discovery. " + selectedAssessment.reason
          : "Showing " + verifiedCount + " verified discovery" + (verifiedCount === 1 ? "" : "ies") + ", ranked by attention priority and evidence strength. Each displayed discovery has at least two quoted claims across distinct publishers and a primary source cited directly."}
      </div>

      <div className="rounded-2xl border border-pink-200/10 bg-black/35 px-4 py-3 sm:flex sm:items-center sm:gap-4">
        <p className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.17em] text-pink-300/60">Hypothesis tested</p>
        <p className="mt-1 text-xs leading-5 text-rose-100/65 sm:mt-0">{selectedAngle?.title || 'The strongest hypothesis supported by the retrieved public evidence'}</p>
      </div>

      {discoveries.length > 1 ? (
        <JellyRadio
          angles={discoveryOptions}
          company={research.company}
          heading="Priority discoveries"
          description={`These results passed source verification and are ranked by attention priority, then evidence strength. Select one to switch the full report instantly—no additional research call is needed.`}
          activeId={investigation.angleId}
          onSelect={onSelectDiscovery}
        />
      ) : null}

      <div className="rounded-2xl border border-pink-200/10 bg-black/40 p-2 backdrop-blur-md">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Research report sections">
          {SECTIONS.map((section, index) => {
            const selected = active === section.id
            const Icon = section.icon
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                id={'sakura-tab-' + section.id}
                aria-selected={selected}
                aria-controls="sakura-report-panel"
                onClick={() => setActive(section.id)}
                className={'relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pink-300 sm:px-4 ' + (selected ? 'text-zinc-950' : 'text-rose-100/55 hover:bg-white/[0.04] hover:text-rose-50')}
              >
                {selected ? <motion.span layoutId="sakura-tab-pill" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 340, damping: 28 }} className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-200 to-pink-300" /> : null}
                <Icon size={14} className="relative z-10" />
                <span className="relative z-10">{section.label}</span>
                <span className={'relative z-10 hidden rounded-md px-1.5 py-0.5 text-[9px] sm:inline ' + (selected ? 'bg-black/10 text-black/65' : 'bg-white/[0.05] text-rose-100/35')}>{String(index + 1).padStart(2, '0')}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div id="sakura-report-panel" role="tabpanel" aria-labelledby={'sakura-tab-' + active} className="min-h-[350px] outline-none">
        {active === 'overview' ? (
          <div className="space-y-4">
            <DiscoveryFlipCard company={research.company} discovery={discovery} report={report} />

            <ReportSection title="Why it matters" subtitle="Significance of the finding">
              {discovery.whyItMatters && discovery.whyItMatters.length > 0 ? (
                <ul className="space-y-2">{discovery.whyItMatters.slice(0, 5).map((item, index) => <li key={index} className="flex gap-3 text-sm leading-6 text-rose-100/70"><span className="text-pink-300">{String(index + 1).padStart(2, '0')}</span><span>{item}</span></li>)}</ul>
              ) : <p className="text-sm text-amber-100/65">The model did not provide the required 3–5 implications. Treat the report as incomplete.</p>}
            </ReportSection>

            <ReportSection title="Evidence trail" subtitle="Claim → document → quoted passage">
              {report.evidence && report.evidence.length > 0 ? <div className="space-y-3">{report.evidence.map((item, index) => {
                const source = report.sources.find(candidate => candidate.id === item.sourceId)
                return <div key={item.sourceId + '-overview-' + index} className="rounded-xl border border-pink-200/10 bg-black/30 p-4">
                  <p className="text-sm font-medium text-rose-50">{item.claim}</p>
                  <blockquote className="mt-2 border-l-2 border-pink-300/45 pl-3 text-xs leading-6 text-rose-100/60">“{item.quote}”</blockquote>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">{item.date ? <span className="text-[10px] text-rose-100/35">{item.date}</span> : null}{source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-300 underline underline-offset-4">{source.title} ↗</a> : <span className="text-xs text-amber-100/60">Source link unavailable</span>}</div>
                </div>
              })}</div> : <p className="text-sm text-amber-100/65">No source quotations passed verification. The discovery is not sufficiently traceable.</p>}
            </ReportSection>

            <ReportSection title="Timeline" subtitle="Verified changes in chronological order">
              {report.timeline.length > 0 ? <div className="space-y-3">{[...report.timeline].sort((a, b) => { const yearA = Number(a.date.match(/(?:19|20)\d{2}/)?.[0] ?? 0); const yearB = Number(b.date.match(/(?:19|20)\d{2}/)?.[0] ?? 0); return yearA - yearB || Date.parse(a.date) - Date.parse(b.date) }).map((event, index) => {
                const source = report.sources.find(candidate => candidate.id === event.sourceId)
                return <div key={event.date + '-overview-' + index} className="rounded-xl border border-pink-200/10 bg-black/30 p-4">
                  <p className="text-xs font-semibold text-pink-300">{event.date}</p><ParagraphText text={event.event} className="mt-2 space-y-2 text-sm leading-6 text-rose-50/80" paragraphClassName="" />
                  {event.quote ? <blockquote className="mt-2 border-l-2 border-pink-300/35 pl-3 text-xs leading-5 text-rose-100/50">“{event.quote}”</blockquote> : null}
                  {source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-pink-300 underline underline-offset-4">{source.title} ↗</a> : null}
                </div>
              })}</div> : <p className="text-sm text-rose-100/50">No dated events passed verification. This is a data gap, not evidence that no change occurred.</p>}
            </ReportSection>

            <ReportSection title="Numbers" subtitle="Calculations used to substantiate the discovery">
              {report.calculations.length > 0 ? <div className="space-y-3">{report.calculations.map((calc, index) => <div key={calc.label + '-overview-' + index} className="rounded-xl border border-pink-200/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-rose-50">{calc.label}</p><p className="mt-2 text-2xl font-semibold text-pink-200">{calc.result}</p><p className="mt-2 font-mono text-xs leading-5 text-rose-100/50">{calc.formula}</p><ParagraphText text={calc.interpretation} className="mt-2 space-y-2 text-sm leading-6 text-rose-100/60" paragraphClassName="" />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{calc.inputs.map((input, i) => { const source = report.sources.find(candidate => candidate.id === input.sourceId); return <div key={input.name + i} className="rounded-lg border border-white/[0.07] p-3"><p className="text-[10px] uppercase tracking-wide text-rose-100/35">{input.name}</p><p className="mt-1 text-sm text-rose-50">{input.value}</p>{source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-pink-300 underline underline-offset-4">{source.title} ↗</a> : <p className="mt-1 text-xs text-amber-100/60">Input source unavailable</p>}</div> })}</div>
              </div>)}</div> : <p className="text-sm text-rose-100/50">No calculations passed validation. The report must not imply the metric stayed unchanged.</p>}
            </ReportSection>

            <ReportSection title="Counterargument" subtitle="The strongest alternative explanation">
              {report.counterarguments.length > 0 ? <div className="space-y-3">{report.counterarguments.map((item, index) => { const source = report.sources.find(candidate => candidate.id === item.sourceId); return <div key={item.argument + index} className="rounded-xl border border-amber-200/10 bg-amber-950/10 p-4"><p className="text-sm font-semibold text-rose-50">{item.argument}</p><ParagraphText text={item.assessment} className="mt-2 space-y-2 text-sm leading-6 text-rose-100/60" paragraphClassName="" />{source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-pink-300 underline underline-offset-4">{source.title} ↗</a> : <p className="mt-2 text-xs text-amber-100/60">No linked source for this alternative; it is not independently substantiated.</p>}</div> })}</div> : <p className="text-sm text-amber-100/65">No counterargument was returned. This report is incomplete until a credible alternative explanation is tested.</p>}
            </ReportSection>

            <ReportSection title="Falsification condition" subtitle="What future evidence would make SAKURA reconsider">
              <ParagraphText text={report.falsification.condition} className="space-y-2 text-sm leading-7 text-rose-50/80" paragraphClassName="" />
              {report.falsification.metric ? <p className="mt-2 text-xs text-rose-100/50">Metric to monitor: {report.falsification.metric}</p> : null}
              {report.falsification.checkBy ? <p className="mt-1 text-xs text-rose-100/50">Reassess by: {report.falsification.checkBy}</p> : null}
            </ReportSection>

            <ReportSection title="Source independence & coverage" subtitle="Different links do not always mean independent evidence">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatChip label="Documents" value={String(report.sources.length)} />
                <StatChip label="Distinct publishers" value={String(independentPublisherCount)} />
                <StatChip label="Primary sources" value={String(primaryCount)} />
              </div>
              <p className="mt-3 text-xs leading-6 text-rose-100/45">Publisher diversity is a proxy, not proof of independence. Check whether sources repeat the same original announcement and review the source ledger for provenance.</p>
              <div className="mt-3 space-y-2">{report.sources.map((source, index) => <a key={source.id + '-overview-source'} href={source.url} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.07] p-3 text-xs text-rose-100/70 hover:border-pink-200/25"><span>{source.title}</span><span className="text-pink-300">{source.sourceTier || 'tier unknown'} · {source.publisher || 'publisher unknown'} ↗</span></a>)}</div>
            </ReportSection>
          </div>
        ) : null}
        {active === 'discovery' ? (
          <div className="space-y-4">
            <DiscoveryFlipCard company={research.company} discovery={discovery} report={report} />
            <p className="text-xs leading-5 text-rose-100/45">Flip the card to move between the finding and the reasoning. Source quotations remain linked to their original documents.</p>
          </div>
        ) : null}
        {active === 'evidence' ? (
          <div className="space-y-3">
            <SectionHeading eyebrow="Triangulation" title="Follow each claim to its source" copy="Passages appear here only when the returned quote can be matched against the retrieved source text. Open the source to inspect the full public document." />
            {report.evidence && report.evidence.length > 0 ? report.evidence.map((item, index) => {
              const source = report.sources.find(candidate => candidate.id === item.sourceId)
              return (
                <article key={item.sourceId + '-' + index} className="rounded-2xl border border-pink-200/15 bg-black/45 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pink-300/70">Claim {String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 text-sm font-semibold leading-6 text-rose-50">{item.claim}</h3>
                  <blockquote className="mt-3 border-l-2 border-pink-300/55 pl-4 text-sm leading-6 text-rose-100/65">“{item.quote}”</blockquote>
                  {item.date ? <p className="mt-2 text-xs text-rose-100/35">Date / period: {item.date}</p> : null}
                  {source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-pink-300 underline decoration-pink-300/25 underline-offset-4 hover:text-pink-100">{source.title} <ArrowUpRight size={13} /></a> : null}
                </article>
              )
            }) : (
              <div className="rounded-2xl border border-amber-200/15 bg-amber-950/15 p-5 text-sm leading-6 text-amber-100/65">The model did not return any quotations that passed exact-text verification. Source links are still available under Sources, but the claims should be treated cautiously until the passages can be verified.</div>
            )}
          </div>
        ) : null}

        {active === 'numbers' ? (
          <div className="space-y-3">
            <SectionHeading eyebrow="Calculations" title="Show the maths, not just the metric" copy="A calculation is included only when both values, distinct reporting periods, unit evidence and source quotations pass validation." />
            {report.calculations.length > 0 ? report.calculations.map((calc, index) => (
              <article key={calc.label + index} className="rounded-2xl border border-pink-200/15 bg-black/45 p-5">
                <p className="text-sm font-semibold text-rose-50">{calc.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-pink-200">{calc.result}</p>
                <p className="mt-2 rounded-lg bg-white/[0.035] px-3 py-2 font-mono text-xs leading-5 text-rose-100/50">{calc.formula}</p>
                <ParagraphText text={calc.interpretation} className="mt-3 space-y-2 text-sm leading-6 text-rose-100/65" paragraphClassName="" />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {calc.inputs.map((input, i) => {
                    const source = report.sources.find(candidate => candidate.id === input.sourceId)
                    return <div key={input.name + i} className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] uppercase tracking-[0.15em] text-rose-100/35">{input.name}</p><p className="mt-1 text-sm font-semibold text-rose-50">{input.value}</p>{source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-pink-300 underline underline-offset-4">{source.title} ↗</a> : null}</div>
                  })}
                </div>
              </article>
            )) : <EmptyState title="No verified calculations" copy="No calculation passed SAKURA’s checks. A calculation needs both values, explicit comparable units, distinct reporting periods, and source quotations containing each value. This is an evidence gap—not evidence that the metric stayed unchanged. Review the Evidence Trail and Sources tabs or try another research angle." />}
          </div>
        ) : null}

        {active === 'timeline' ? (
          <div className="space-y-3">
            <SectionHeading eyebrow="Temporal reasoning" title="When did the signal start to change?" copy="A timeline event appears only when its date and supporting passage can be matched to retrieved source text." />
            {report.timeline.length > 0 ? (
              <div className="relative space-y-3 before:absolute before:bottom-5 before:left-[10px] before:top-5 before:w-px before:bg-pink-200/20">
                {report.timeline.map((event, index) => {
                  const source = report.sources.find(candidate => candidate.id === event.sourceId)
                  return <article key={event.date + index} className="relative pl-8"><span className="absolute left-[5px] top-5 size-[11px] rounded-full border border-pink-200/65 bg-[#180c14] shadow-[0_0_12px_rgba(244,114,182,0.25)]" /><div className="rounded-2xl border border-pink-200/12 bg-black/45 p-4"><p className="text-xs font-semibold tracking-wide text-pink-300">{event.date}</p><ParagraphText text={event.event} className="mt-2 space-y-2 text-sm leading-6 text-rose-50/80" paragraphClassName="" />{event.quote ? <blockquote className="mt-3 border-l-2 border-pink-300/40 pl-3 text-xs leading-5 text-rose-100/45">“{event.quote}”</blockquote> : null}{source ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-pink-300 underline underline-offset-4">{source.publisher || source.title} ↗</a> : null}</div></article>
                })}
              </div>
            ) : <EmptyState title="No supported timeline returned" copy="No dated event passed source-quote verification. This does not mean nothing happened; it means SAKURA could not safely establish the sequence from the retrieved excerpts. Try another angle or inspect the source ledger." />}
          </div>
        ) : null}

        {active === 'challenge' ? (
          <div className="space-y-5">
            <SectionHeading eyebrow="Self-falsification" title="Try to break the conclusion" copy="A strong discovery survives plausible alternative explanations—and states what future evidence could overturn it." />
            <div className="rounded-2xl border border-amber-200/15 bg-amber-950/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/65">Falsification condition</p>
              <ParagraphText text={report.falsification.condition} className="mt-2 space-y-2 text-sm leading-7 text-rose-50/80" paragraphClassName="" />
              {report.falsification.metric ? <p className="mt-3 text-xs text-amber-100/55">Monitor: {report.falsification.metric}</p> : null}
              {report.falsification.checkBy ? <p className="mt-1 text-xs text-amber-100/55">Reassess by: {report.falsification.checkBy}</p> : null}
            </div>
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-300/70">Counterarguments</p>
              <CounterargumentExplorer items={report.counterarguments} sources={report.sources} />
            </div>
          </div>
        ) : null}

        {active === 'peers' ? (
          <PeerComparisonPanel research={research} investigation={investigation} />
        ) : null}

        {active === 'followup' ? (
          <FollowupPanel research={research} investigation={investigation} backendMode={backendMode} onBusyChange={onFollowupBusyChange} />
        ) : null}

        {active === 'sources' ? (
          <div className="space-y-3">
            <SectionHeading eyebrow="Public evidence" title="Source ledger" copy="Source classification indicates apparent provenance, not guaranteed accuracy. Independent URLs can still repeat the same underlying claim." />
            {report.sources.map((source, index) => (
              <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="group block rounded-2xl border border-pink-200/12 bg-black/45 p-4 transition hover:border-pink-200/35 hover:bg-pink-950/15 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xs text-rose-100/50">{String(index + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-6 text-rose-50/90 group-hover:text-pink-100">{source.title}</p>
                    <p className="mt-1 break-all text-xs text-pink-300/55">{source.publisher || source.url}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {source.sourceTier ? <span className="rounded-full border border-pink-200/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.13em] text-rose-100/60">{source.sourceTier} source</span> : null}
                      {source.sourceType ? <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.13em] text-rose-100/40">{source.sourceType.replace(/_/g, ' ')}</span> : null}
                      {source.publishedAt ? <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] text-rose-100/40">{source.publishedAt}</span> : null}
                      {cited.has(source.id) ? <span className="rounded-full bg-pink-200/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.13em] text-pink-200">Passage verified</span> : null}
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="mt-1 shrink-0 text-rose-100/25 group-hover:text-pink-200" />
                </div>
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <PeekRating investigationId={investigation.investigationId} backendMode={investigation.mode} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pink-200/10 pt-4">
        <p className="text-xs leading-5 text-rose-100/35">No investment recommendation. Findings may be incomplete or wrong.</p>
        <button type="button" onClick={onExploreAngles} className="inline-flex items-center gap-2 rounded-full border border-pink-200/20 px-4 py-2.5 text-xs font-medium text-pink-100 transition hover:border-pink-200/45 hover:bg-pink-200/[0.05]">Explore another angle <ArrowUpRight size={14} /></button>
      </div>
    </section>
  )
}


function ReportSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-pink-200/12 bg-black/40 p-5 sm:p-6"><div className="mb-4"><h3 className="text-lg font-semibold text-rose-50">{title}</h3><p className="mt-1 text-xs leading-5 text-rose-100/40">{subtitle}</p></div>{children}</section>
}

function StatChip({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-pink-200/12 bg-black/45 px-3 py-2"><p className="text-[9px] uppercase tracking-[0.14em] text-rose-100/35">{label}</p><p className="mt-1 text-sm font-semibold text-rose-50">{value}</p></div>
}

function MiniMetric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-pink-200/12 bg-black/45 p-4"><span className="text-pink-300/75">{icon}</span><p className="mt-3 text-[10px] uppercase tracking-[0.17em] text-rose-100/40">{label}</p><p className="mt-1 text-lg font-semibold text-rose-50">{value}</p><p className="mt-1 text-xs leading-5 text-rose-100/35">{detail}</p></div>
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="pb-2"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-300/70">{eyebrow}</p><h3 className="mt-2 text-xl font-semibold tracking-tight text-rose-50 sm:text-2xl">{title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-rose-100/50">{copy}</p></div>
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/40 p-6"><p className="font-medium text-rose-50/75">{title}</p><p className="mt-2 text-sm leading-6 text-rose-100/45">{copy}</p></div>
}
