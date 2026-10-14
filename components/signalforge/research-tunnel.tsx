'use client'

import LightTunnel from '@/components/LightTunnel'

export function ResearchTunnel() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-dvh w-screen overflow-hidden bg-black"
    >
      <LightTunnel
        className="absolute inset-0 h-full w-full"
        cableColor="#EC4899"
        pulseColor="#F9A8D4"
        tunnelColor="#000000"
        tunnelOpacity={0}
        cableCount={56}
        pulseDensity={0.5}
        flowDirection="inward"
        mouseInteraction={false}
        clickSurge={false}
        speed={0.12}
        pulseSpeed={2}
        pulseLength={0.28}
        pulseBlend={0.6}
        pulseWidth={1}
        thickness={0.35}
        rimWidth={0.15}
        waviness={0.3}
        sway={0.5}
        bend={0.4}
        glow={1.2}
        size={1}
        fadeNear={0.5}
        fadeFar={2}
        brightness={1.15}
        colorVariance
        grain={false}
        intro
        lightMode={false}
        dpr={1.5}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.45) 100%)',
        }}
      />
    </div>
  )
}