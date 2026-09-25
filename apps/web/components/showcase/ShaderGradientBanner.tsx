'use client'

import { useState, useEffect, useRef } from 'react'
import { Waves } from '@paper-design/shaders-react'

/**
 * Animated wave gradient behind the bottom CTA section.
 * Uses Paper Design's Waves shader (no three.js, no reconciler — safe for
 * prerender). The shader auto-pauses when off-screen or the tab is hidden,
 * and a CSS gradient stands in for reduced-motion / no-WebGL devices.
 *
 * ── TUNABLE ────────────────────────────────────────
 *  colorFront / colorBack  the two brand wave colors
 *  speed    animation speed (0 stops rAF entirely; keep ≤ 0.6 = calm)
 * ────────────────────────────────────────────────────
 */
const TUNABLE = {
  colorFront: '#22D3EE',
  colorBack: '#1D4ED8',
  speed: 0.45,
}

export default function ShaderGradientBanner({ height = 0 }: { height?: number }) {
  const [mode, setMode] = useState<'loading' | 'on' | 'off'>('loading')
  const shaderRef = useRef<any>(null)

  useEffect(() => {
    // Speed is applied imperatively via the element's setSpeed()
    shaderRef.current?.setSpeed?.(TUNABLE.speed)
  }, [mode])

  useEffect(() => {
    let supported = false
    try {
      const c = document.createElement('canvas')
      supported = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setMode(supported && !reduced ? 'on' : 'off')
  }, [])

  // Static fallback doubles as the loading poster (and prerender output)
  if (mode !== 'on') {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{ background: `linear-gradient(120deg, ${TUNABLE.colorBack}, ${TUNABLE.colorFront} 55%, #9333EA)` }}
      />
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <Waves
        ref={shaderRef}
        colorFront={TUNABLE.colorFront}
        colorBack={TUNABLE.colorBack}
        style={{ width: '100%', height: '100%' }}
      />
      {/* Legibility scrim so CTA text always meets contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/40" />
    </div>
  )
}
