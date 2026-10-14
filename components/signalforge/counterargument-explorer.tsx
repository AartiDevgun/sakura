'use client'

import { useState } from 'react'
import type { Counterargument, Source } from '@/lib/research/schema'
import { EvidenceFlipCard } from './evidence-flip-card'

interface CounterargumentExplorerProps {
  items: Counterargument[]
  sources: Source[]
}

export function CounterargumentExplorer({ items, sources }: CounterargumentExplorerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (items.length === 0) {
    return (
      <p className="text-sm text-rose-100/60">
        No counterarguments were returned. Treat the conclusion as incomplete until alternatives are assessed.
      </p>
    )
  }

  const selected = selectedIndex === null ? null : items[selectedIndex]
  const selectedSource = selected?.sourceId
    ? sources.find(source => source.id === selected.sourceId)
    : undefined

  return (
    <div className="space-y-3">
      <p className="text-xs leading-5 text-rose-100/45">Choose an alternative explanation to inspect its evidence.</p>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <button
            key={`${item.argument}-${index}`}
            type="button"
            aria-pressed={selectedIndex === index}
            onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${selectedIndex === index ? 'border-pink-300/55 bg-pink-950/35' : 'border-pink-200/10 bg-black/30 hover:border-pink-200/30'}`}
          >
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs ${selectedIndex === index ? 'border-pink-300 bg-pink-300 text-black' : 'border-pink-200/25 text-pink-200/65'}`}>
              {selectedIndex === index ? '−' : '+'}
            </span>
            <span className="text-sm leading-6 text-pink-50/85">{item.argument}</span>
          </button>
        ))}
      </div>
      {selected ? (
        <EvidenceFlipCard
          key={selectedIndex}
          argument={selected.argument}
          assessment={selected.assessment}
          sourceUrl={selectedSource?.url}
          sourceLabel={selectedSource ? `Source: ${selectedSource.publisher || selectedSource.title}` : undefined}
        />
      ) : null}
    </div>
  )
}
