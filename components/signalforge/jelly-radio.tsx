'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { ResearchAngle } from '@/lib/research/schema'

interface JellyRadioProps {
  angles: ResearchAngle[]
  company: string
  onSelect: (angleId: string) => void
  disabled?: boolean
}

export function JellyRadio({ angles, company, onSelect, disabled = false }: JellyRadioProps) {
  const reduce = useReducedMotion()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div role="radiogroup" aria-label={`Research angles for ${company}`} className="grid gap-3">
      {angles.map((angle, index) => (
        <motion.button
          key={angle.id}
          type="button"
          role="radio"
          aria-checked={selectedId === angle.id}
          disabled={disabled}
          whileHover={reduce || disabled ? undefined : { scale: 1.012, y: -2 }}
          whileTap={reduce || disabled ? undefined : { scale: 0.975, borderRadius: 28 }}
          transition={{ type: 'spring', stiffness: 360, damping: 18, mass: 0.7 }}
          onClick={() => {
            setSelectedId(angle.id)
            onSelect(angle.id)
          }}
          className="group relative w-full overflow-hidden rounded-2xl border border-pink-200/15 bg-gradient-to-br from-pink-950/35 to-black/80 p-5 text-left outline-none transition-colors hover:border-pink-300/60 focus-visible:ring-2 focus-visible:ring-pink-300 disabled:cursor-wait disabled:opacity-60"
        >
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1 origin-center bg-pink-300"
            initial={false}
            animate={{ opacity: 0.25, scaleY: 0.4 }}
            whileHover={reduce || disabled ? undefined : { opacity: 1, scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <div className="flex items-start gap-4">
            <motion.span
              aria-hidden="true"
              className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-pink-300/60"
              whileHover={reduce || disabled ? undefined : { scale: 1.16 }}
              transition={{ type: 'spring', stiffness: 420, damping: 12 }}
            >
              <span className="size-2 rounded-full bg-pink-300/80" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-pink-300/80">
                <span>{String(index + 1).padStart(2, '0')} / {angle.label}</span>
                {angle.signalStrength ? <span className="rounded-full border border-pink-200/15 px-2 py-0.5 text-[9px] tracking-[0.12em]">{angle.signalStrength} signal</span> : null}
              </div>
              <h3 className="font-semibold leading-6 text-pink-50 transition-colors group-hover:text-pink-200">{angle.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-rose-100/60">{angle.rationale.split('\n\nSources to examine:')[0]}</p>
            </div>
            <motion.span
              aria-hidden="true"
              className="text-lg text-pink-300"
              whileHover={reduce || disabled ? undefined : { x: 3, y: -3 }}
            >
              ↗
            </motion.span>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
