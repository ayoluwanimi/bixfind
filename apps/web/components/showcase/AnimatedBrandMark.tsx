'use client'

import { useState, useEffect } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'
import StaticBixfindLogo from './StaticBixfindLogo'

/**
 * Animated brand mark using Paper Design's MeshGradient shader.
 * The blob drifts slowly behind the crisp static "b" mark so the logo
 * always stays recognizable.
 *
 * ── TUNABLE ────────────────────────────────────────
 *  speed      shader animation speed (keep ≤ 0.35 — slow = premium)
 *  colors     the mesh palette (brand blue → purple → cyan)
 *  markSize   static logo size as a fraction of the container
 * ────────────────────────────────────────────────────
 */
const TUNABLE = {
  speed: 0.25,
  colors: ['#2563EB', '#9333EA', '#22D3EE', '#0EA5E9'],
  markSize: 0.5,
}

export default function AnimatedBrandMark({ size = 140, className = '' }: { size?: number; className?: string }) {
  const [mode, setMode] = useState<'loading' | 'on' | 'off'>('loading')

  useEffect(() => {
    let supported = false
    try {
      const c = document.createElement('canvas')
      supported = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setMode(supported && !reduced ? 'on' : 'off')
  }, [])

  const markSize = Math.round(size * TUNABLE.markSize)

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Bixfind logo"
    >
      {/* Animated shader layer (or solid brand fallback) */}
      {mode === 'on' ? (
        <MeshGradient
          colors={TUNABLE.colors}
          speed={TUNABLE.speed}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `conic-gradient(from 20deg, ${TUNABLE.colors[0]}, ${TUNABLE.colors[1]}, ${TUNABLE.colors[2]}, ${TUNABLE.colors[0]})` }}
        />
      )}
      {/* Soft white halo so the mark pops on any palette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-white/85 backdrop-blur-[1px] p-[14%] flex items-center justify-center">
          <StaticBixfindLogo size={markSize} />
        </div>
      </div>
    </div>
  )
}
