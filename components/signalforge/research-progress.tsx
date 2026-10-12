'use client'

import { useReducedMotion } from 'motion/react'
import LatticeLoader from '@/components/LatticeLoader'
import LightTunnel from '@/components/LightTunnel'
import { Button } from '@/components/ui/button'

interface ResearchProgressProps {
  label: string
  detail: string
  onCancel: () => void
}

/** Mounted only while a request is in flight; unmounting stops the WebGL loop and the loader timer. */
export function ResearchProgress({ label, detail, onCancel }: ResearchProgressProps) {
  const reduce = useReducedMotion()

  return (
    <section aria-label="Research in progress" className="relative isolate overflow-hidden rounded-xl border border-border">
      {reduce ? null : (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <LightTunnel
            cableColor="#0e7490"
            pulseColor="#7dd3fc"
            tunnelColor="#020617"
            speed={0.8}
            opacity={0.9}
            mouseInteraction={false}
            clickSurge={false}
            dpr={1.25}
          />
        </div>
      )}
      <div className="flex min-h-72 flex-col items-center justify-center gap-6 bg-background/40 p-6 text-center sm:min-h-80">
        <div className="rounded-lg border border-border/70 bg-background/85 px-5 py-4 backdrop-blur">
          <LatticeLoader
            label={label}
            status="working"
            pattern="spiral"
            color="#38bdf8"
            glow={!reduce}
            showTimer
          />
        </div>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground">{detail}</p>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  )
}
