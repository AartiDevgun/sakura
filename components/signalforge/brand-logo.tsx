'use client'

import { useReducedMotion } from 'motion/react'
import ElectricLogo from '@/components/ElectricLogo'
import { cn } from '@/lib/utils'

const MARK_SRC = '/signalforge-mark.svg'

interface BrandLogoProps {
  docked: boolean
  /** Mounts the WebGL Electric Logo. When false a static mark is shown and no animation loop runs. */
  electrified: boolean
  onDocked?: () => void
}

export function BrandLogo({ docked, electrified, onDocked }: BrandLogoProps) {
  const reduce = useReducedMotion()
  const live = electrified && !reduce

  return (
    <div
      aria-hidden="true"
      data-docked={docked ? '' : undefined}
      onTransitionEnd={event => {
        if (event.propertyName === 'width' && docked) onDocked?.()
      }}
      className={cn(
        'pointer-events-none fixed z-50',
        'top-[calc(50%-112px)] right-[calc(50%-84px)] size-[168px]',
        'data-[docked]:top-3 data-[docked]:right-4 data-[docked]:size-10',
        'transition-[top,right,width,height] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MARK_SRC}
        alt=""
        className={cn(
          'absolute inset-[18%] size-[64%] drop-shadow-[0_0_8px_rgba(244,114,182,0.75)] transition-opacity duration-300',
          live ? 'opacity-0' : 'opacity-100',
        )}
      />
      {live ? (
        <ElectricLogo
          src={MARK_SRC}
          color="#fff0f7"
          glowColor="#f472b6"
          theme="dark"
          scale={0.62}
          thickness={docked ? 1.2 : 1.8}
          interactive={false}
          className="absolute inset-0"
        />
      ) : null}
    </div>
  )
}
