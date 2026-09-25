'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import StaticBixfindLogo from './StaticBixfindLogo'

/**
 * Animated brand mark (React Three Fiber v8, React 18).
 * A soft morphing blob (icosahedron + simplex-ish vertex wobble) behind a
 * crisp static "b" mark. Slow, recognizable, respectful of reduced motion.
 *
 * Tuning:
 *  - speed:   overall animation tempo (default 0.6 — keep low)
 *  - scale:   blob size (default 1.15)
 *  - colors:  brand tint pair for the two lights + material
 *  - intensity: light strength (default 1.1)
 */
function MorphingBlob({ speed = 0.6, scale = 1.15, colorA = '#2563EB', colorB = '#9333EA', reducedMotion = false }: {
  speed?: number
  scale?: number
  colorA?: string
  colorB?: string
  reducedMotion?: boolean
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const base = useRef<Float32Array | null>(null)

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    if (reducedMotion) return // static frame
    const t = clock.getElapsedTime() * speed

    const geometry = m.geometry as THREE.IcosahedronGeometry
    const pos = geometry.attributes.position
    if (!base.current) base.current = Float32Array.from(pos.array as Float32Array)

    const arr = pos.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      const ox = base.current[i]
      const oy = base.current[i + 1]
      const oz = base.current[i + 2]
      const n = Math.sin(ox * 1.4 + t) * Math.cos(oy * 1.2 + t * 0.8) * Math.sin(oz * 1.6 + t * 0.6)
      const wobble = 1 + n * 0.12
      arr[i] = ox * wobble
      arr[i + 1] = oy * wobble
      arr[i + 2] = oz * wobble
    }
    pos.needsUpdate = true
    m.rotation.y = t * 0.25
  })

  return (
    <mesh ref={mesh} scale={scale}>
      <icosahedronGeometry args={[1.35, 12]} />
      <meshStandardMaterial color={colorA} roughness={0.18} metalness={0.55} emissive={colorB} emissiveIntensity={0.12} />
    </mesh>
  )
}

export default function LiquidGlassLogo({
  size = 120,
  speed = 0.6,
  scale = 1.15,
  intensity = 1.1,
  colorA = '#2563EB',
  colorB = '#9333EA',
  className = '',
}: {
  size?: number
  speed?: number
  scale?: number
  intensity?: number
  colorA?: string
  colorB?: string
  className?: string
}) {
  const [supported, setSupported] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      setSupported(!!(c.getContext('webgl2') || c.getContext('webgl')))
    } catch {
      setSupported(false)
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  if (!supported) {
    return <StaticBixfindLogo size={size} className={className} />
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Bixfind animated logo"
    >
      {/* Static mark under the blob: always visible = recognizable + fallback */}
      <div className="absolute inset-0 flex items-center justify-center">
        <StaticBixfindLogo size={Math.round(size * 0.52)} />
      </div>
      {!ready && <StaticBixfindLogo size={size} className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden />}
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        frameloop={reducedMotion ? 'demand' : 'always'}
        onCreated={() => setReady(true)}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 4, 5]} intensity={intensity} color={colorA} />
        <directionalLight position={[-4, -2, 3]} intensity={intensity * 0.6} color={colorB} />
        <MorphingBlob speed={speed} scale={scale} colorA={colorA} colorB={colorB} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
