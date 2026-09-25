'use client'

import { useEffect, useRef } from 'react'

/**
 * Restrained glass panel (vendored liquid-glass-js, MIT).
 *
 * Applies WebGL refraction to the panel background ONLY — all children
 * (links, focus rings, text) are real DOM on top, so keyboard focus and
 * mobile menu behaviour are untouched. Falls back to a solid translucent
 * surface whenever WebGL is unavailable.
 *
 * ── TUNABLE ────────────────────────────────────────
 *  tint          brand tint hex (default Bixfind blue)
 *  tintOpacity   tint strength 0–1 (keep ≤ 0.35 for label legibility)
 *  blurRadius    background blur 1–15 (default 5 = subtle)
 *  edgeIntensity refraction at edges 0–0.1 (default 0.015 = restrained)
 * ────────────────────────────────────────────────────
 */
const TUNABLE = {
  tint: '#2563EB',
  tintOpacity: 0.22,
  blurRadius: 5,
  edgeIntensity: 0.015,
  rimIntensity: 0.06,
}

export default function GlassPanel({
  children,
  className = '',
  borderRadius = 20,
}: {
  children: React.ReactNode
  className?: string
  borderRadius?: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let instance: any = null
    // Solid translucent fallback is the default state (also SSR/no-JS safe)
    const fallbackBg = `linear-gradient(135deg, ${TUNABLE.tint}26, rgba(255,255,255,0.55))`

    let supported = false
    try {
      const c = document.createElement('canvas')
      supported = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {}

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!supported || reduced) return // keep fallback background

    ;(async () => {
      try {
        const mod = await import('@/vendor/liquid-glass/container')
        if (disposed) return
        const GlassContainer = mod.default
        instance = new GlassContainer({
          borderRadius,
          type: 'rounded',
          tintOpacity: TUNABLE.tintOpacity,
          blurRadius: TUNABLE.blurRadius,
          edgeIntensity: TUNABLE.edgeIntensity,
          rimIntensity: TUNABLE.rimIntensity,
        })
        if (disposed || !instance?.element) {
          instance?.destroy?.()
          instance = null
          return
        }
        // Mount the glass canvas as the panel background layer
        instance.element.style.position = 'absolute'
        instance.element.style.inset = '0'
        instance.element.style.zIndex = '0'
        instance.element.style.pointerEvents = 'none'
        host.prepend(instance.element)
        instance.updateSizeFromDOM?.()
      } catch {
        // On any failure the CSS fallback stays in place
      }
    })()

    return () => {
      disposed = true
      try {
        instance?.destroy?.()
        instance?.element?.remove()
      } catch {}
    }
  }, [borderRadius])

  return (
    <div ref={hostRef} className={`relative isolate ${className}`} style={{ background: `linear-gradient(135deg, ${TUNABLE.tint}26, rgba(255,255,255,0.55))` }}>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
