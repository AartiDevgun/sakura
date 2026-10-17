'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { ResearchAngle } from '@/lib/research/schema'

interface JellyRadioProps {
  angles: ResearchAngle[]
  company: string
  onSelect: (angleId: string) => void
  disabled?: boolean
  heading?: string
  description?: string
  activeId?: string | null
}

export function JellyRadio({
  angles,
  company,
  onSelect,
  disabled = false,
  heading,
  description,
  activeId,
}: JellyRadioProps) {
  const reduce = useReducedMotion()
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const selectedId = activeId !== undefined ? activeId : internalSelectedId
  const strengthRank = { strong: 3, moderate: 2, weak: 1 } as const
  const orderedAngles = [...angles].sort((a, b) =>
    strengthRank[b.signalStrength || 'moderate'] - strengthRank[a.signalStrength || 'moderate'],
  )

  return (
    <section className="space-y-3" aria-label={heading || `Research angles for ${company}`}>
      {heading ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-300/80">{heading}</p>
            {description ? <p className="mt-1.5 max-w-3xl text-xs leading-5 text-rose-100/55">{description}</p> : null}
          </div>
          {angles.length > 1 ? <span className="rounded-full border border-pink-200/15 bg-pink-200/[0.05] px-3 py-1.5 text-[10px] text-pink-100/65">{angles.length} options</span> : null}
        </div>
      ) : null}
      <div role="radiogroup" aria-label={`${heading || 'Research angles'} for ${company}`} className="grid gap-3 sm:grid-cols-2">
        {orderedAngles.map((angle, index) => {
          const selected = selectedId === angle.id
          return (
            <motion.button
              key={angle.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              whileHover={reduce || disabled ? undefined : { scale: 1.012, y: -2 }}
              whileTap={reduce || disabled ? undefined : { scale: 0.975, borderRadius: 28 }}
              transition={{ type: 'spring', stiffness: 360, damping: 18, mass: 0.7 }}
              onClick={() => {
                setInternalSelectedId(angle.id)
                onSelect(angle.id)
              }}
              className={'group relative w-full overflow-hidden rounded-2xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pink-300 disabled:cursor-wait disabled:opacity-60 sm:p-5 ' +
                (selected
                  ? 'border-pink-300/70 bg-gradient-to-br from-pink-900/55 via-pink-950/40 to-black shadow-[0_0_30px_rgba(236,72,153,0.10)]'
                  : 'border-pink-200/15 bg-gradient-to-br from-pink-950/35 to-black/80 hover:border-pink-300/60')}
            >
              <motion.span
                aria-hidden="true"
                className={'absolute inset-y-0 left-0 w-1 origin-center bg-pink-300 ' + (selected ? 'opacity-100' : 'opacity-30')}
                initial={false}
                animate={{ scaleY: selected ? 1 : 0.4 }}
                whileHover={reduce || disabled ? undefined : { opacity: 1, scaleY: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              <div className="flex items-start gap-3">
                <motion.span
                  aria-hidden="true"
                  className={'mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border ' + (selected ? 'border-pink-200 bg-pink-300/15' : 'border-pink-300/60')}
                  whileHover={reduce || disabled ? undefined : { scale: 1.16 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 12 }}
                >
                  <span className={'size-2 rounded-full transition-colors ' + (selected ? 'bg-pink-200' : 'bg-pink-300/55')} />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-pink-300/80">
                    <span>{String(index + 1).padStart(2, '0')} / {angle.label}</span>
                    {angle.signalStrength ? <span className="rounded-full border border-pink-200/15 px-2 py-0.5 text-[9px] tracking-[0.12em]">{angle.signalStrength} signal</span> : null}
                    {selected ? <span className="rounded-full bg-pink-200 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] text-black">Viewing</span> : null}
                  </div>
                  <h3 className="font-semibold leading-6 text-pink-50 transition-colors group-hover:text-pink-200">{angle.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-xs leading-5 text-rose-100/60 sm:text-sm">{angle.rationale.split('\n\nSources to examine:')[0]}</p>
                </div>
                <motion.span aria-hidden="true" className="text-lg text-pink-300" whileHover={reduce || disabled ? undefined : { x: 3, y: -3 }}>
                  ↗
                </motion.span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
