'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface EvidenceFlipCardProps {
  argument: string
  assessment: string
  sourceUrl?: string
  sourceLabel?: string
}

export function EvidenceFlipCard({
  argument,
  assessment,
  sourceUrl,
  sourceLabel,
}: EvidenceFlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const reduce = useReducedMotion()

  return (
    <div className="perspective-[1000px]">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: reduce ? 0 : 0.55, ease: [0.2, 0.75, 0.25, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative min-h-44"
      >
        <div
          className="absolute inset-0 flex min-h-44 flex-col items-start rounded-xl border border-pink-200/15 bg-gradient-to-br from-pink-950/30 to-black p-4"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-300/75">
            Alternative explanation
          </p>
          <p className="text-sm font-medium leading-6 text-pink-50">{argument}</p>
          <button
            type="button"
            onClick={() => setFlipped(true)}
            aria-expanded={flipped}
            className="mt-auto pt-4 text-xs text-pink-300 underline decoration-pink-300/30 underline-offset-4 hover:text-pink-100 focus-visible:outline-2 focus-visible:outline-pink-300"
          >
            Examine the evidence ↗
          </button>
        </div>

        <div
          className="absolute inset-0 flex min-h-44 flex-col items-start rounded-xl border border-pink-300/25 bg-zinc-950 p-4"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-300/75">
            Evidence assessment
          </p>
          <p className="text-sm leading-6 text-rose-100/70">{assessment}</p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs text-pink-300 underline decoration-pink-300/30 underline-offset-4 hover:text-pink-100"
            >
              {sourceLabel || 'Open supporting source'} ↗
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setFlipped(false)}
            aria-expanded={flipped}
            className="mt-auto pt-3 text-xs text-pink-300 underline decoration-pink-300/30 underline-offset-4 hover:text-pink-100 focus-visible:outline-2 focus-visible:outline-pink-300"
          >
            Back to argument
          </button>
        </div>
      </motion.div>
    </div>
  )
}
