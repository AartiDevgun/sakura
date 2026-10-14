'use client'

import { useEffect, useRef } from 'react'

type Petal = {
  x: number
  y: number
  size: number
  speed: number
  drift: number
  phase: number
  rotation: number
  spin: number
  alpha: number
  petal: boolean
}

const PETAL_COUNT = 42

export function SakuraParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 1
    let height = 1
    let pixelRatio = 1
    let frame = 0
    let previous = 0
    let elapsed = 0
    let particles: Petal[] = []

    const createParticle = (initial: boolean): Petal => ({
      x: Math.random() * width,
      y: initial ? Math.random() * height : -12 - Math.random() * 80,
      size: 1.1 + Math.random() * 2.5,
      speed: 8 + Math.random() * 16,
      drift: (Math.random() - 0.5) * 23,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.1,
      alpha: 0.13 + Math.random() * 0.24,
      petal: Math.random() > 0.27,
    })

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      particles = Array.from({ length: PETAL_COUNT }, () => createParticle(true))
      draw(0)
    }

    const drawParticle = (p: Petal, time: number) => {
      const sway = Math.sin(time * 0.00055 + p.phase) * 12
      const x = p.x + sway
      context.save()
      context.translate(x, p.y)
      context.rotate(p.rotation + Math.sin(time * 0.00035 + p.phase) * 0.18)
      context.globalAlpha = p.alpha
      context.shadowBlur = p.size * 0.55
      context.shadowColor = 'rgba(249, 168, 212, 0.34)'

      if (p.petal) {
        const r = p.size
        const gradient = context.createLinearGradient(-r, -r, r, r)
        gradient.addColorStop(0, 'rgba(255, 240, 248, 1)')
        gradient.addColorStop(0.48, 'rgba(249, 168, 212, 0.96)')
        gradient.addColorStop(1, 'rgba(219, 39, 119, 0.82)')
        context.fillStyle = gradient
        context.beginPath()
        context.moveTo(0, r * 1.35)
        context.bezierCurveTo(-r * 1.75, r * 0.2, -r * 1.5, -r * 1.4, 0, -r * 1.2)
        context.bezierCurveTo(r * 1.5, -r * 1.4, r * 1.75, r * 0.2, 0, r * 1.35)
        context.fill()
      } else {
        context.fillStyle = 'rgba(255, 240, 248, 1)'
        context.beginPath()
        context.arc(0, 0, p.size * 0.52, 0, Math.PI * 2)
        context.fill()
      }

      context.restore()
    }

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'source-over'
      for (const particle of particles) drawParticle(particle, now)
      context.globalAlpha = 1
    }

    const animate = (now: number) => {
      frame = 0
      const delta = previous ? Math.min((now - previous) / 1000, 0.04) : 0
      previous = now
      elapsed = now
      context.clearRect(0, 0, width, height)
      for (const p of particles) {
        p.y += p.speed * delta
        p.x += p.drift * delta * 0.32
        p.rotation += p.spin * delta
        if (p.y > height + 18 || p.x < -30 || p.x > width + 30) {
          Object.assign(p, createParticle(false))
          if (p.y > height + 18) p.x = Math.random() * width
        }
        drawParticle(p, elapsed)
      }
      if (!reduceMotion) frame = window.requestAnimationFrame(animate)
    }

    resize()
    if (reduceMotion) {
      // Keep the atmosphere visible without continuous motion.
      draw(0)
    } else {
      frame = window.requestAnimationFrame(animate)
    }

    const onResize = () => resize()
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 12% 18%, rgba(120, 28, 64, 0.08), transparent 43%), radial-gradient(ellipse at 88% 72%, rgba(160, 58, 104, 0.06), transparent 40%)',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ opacity: 0.72 }}
      />
    </div>
  )
}
