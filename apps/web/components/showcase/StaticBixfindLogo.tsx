import type { CSSProperties } from 'react'

/**
 * Static brand mark — the accessible fallback for every animated logo.
 * A stylized "b" built from a ring + dot (pure SVG, no JS, no WebGL).
 * Mirrors the brand gradient (blue → purple) used across Bixfind.
 */
export default function StaticBixfindLogo({ size = 72, style, className }: { size?: number; style?: CSSProperties; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Bixfind logo"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="bixfind-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="none" stroke="url(#bixfind-mark-grad)" strokeWidth="7" />
      <circle cx="44" cy="20" r="7" fill="url(#bixfind-mark-grad)" />
    </svg>
  )
}
