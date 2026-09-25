'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import StaticBixfindLogo from './StaticBixfindLogo'

/**
 * 3D product showcase — React Three Fiber v8 on React 18.
 *
 * The visitor can drag to rotate WITHOUT hijacking page scroll (vertical
 * touch scrolling passes through; zoom/pan are disabled). Description and
 * purchase CTA stay outside the canvas — see app/(marketing)/showcase/page.tsx.
 *
 * ── TUNABLE ─────────────────────────────────────────────────────────
 *  objectSize        overall model scale (default 1)
 *  lightIntensity    main key light (default 1.2)
 *  rimIntensity      accent light   (default 0.7)
 *  autoRotateSpeed   idle spin; 0 = off (default 0.35)
 *  cameraPosition    [x,y,z] camera placement
 *  colors            brand tint pair for the materials
 * ────────────────────────────────────────────────────────────────────
 */

const TUNABLE = {
  objectSize: 1,
  lightIntensity: 1.2,
  rimIntensity: 0.7,
  autoRotateSpeed: 0.35,
  cameraPosition: [0, 0.6, 4.6] as [number, number, number],
  colors: { primary: '#2563EB', secondary: '#9333EA', accent: '#22D3EE' },
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(max-width: 768px)').matches ?? false
}

/** Rotating placeholder "product" — clearly labelled until a real GLB exists. */
function PlaceholderProduct({
  reducedMotion,
  objectSize = TUNABLE.objectSize,
  dragRef,
}: {
  reducedMotion: boolean
  objectSize?: number
  dragRef: React.MutableRefObject<{ x: number; y: number }>
}) {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    if (!reducedMotion) g.rotation.y += TUNABLE.autoRotateSpeed * 0.01
    g.rotation.y += (dragRef.current.x - g.userData.targetY || 0) * 0
    // Apply drag offsets (smoothed)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, dragRef.current.y, 0.12)
    g.rotation.z = 0
    g.userData.spin = (g.userData.spin || 0) + (reducedMotion ? 0 : TUNABLE.autoRotateSpeed * 0.01)
    g.rotation.y = g.userData.spin + dragRef.current.x
  })

  const seg = isMobileDevice() ? 24 : 40
  return (
    <group ref={group} scale={objectSize} rotation={[0.15, 0, 0]}>
      {/* Crate — the "package" */}
      <mesh position={[0, -0.55, 0]} castShadow>
        <boxGeometry args={[1.7, 0.85, 1.7, seg > 24 ? 4 : 2, 2, 2]} />
        <meshStandardMaterial color={TUNABLE.colors.primary} roughness={0.35} metalness={0.25} />
      </mesh>
      {/* Ring — the "marketplace" */}
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.95, 0.16, seg / 4, seg * 2]} />
        <meshStandardMaterial color={TUNABLE.colors.secondary} roughness={0.2} metalness={0.65} />
      </mesh>
      {/* Orb — the "delivery" */}
      <mesh position={[0, 1.15, 0]}>
        <icosahedronGeometry args={[0.42, 2]} />
        <meshStandardMaterial color={TUNABLE.colors.accent} roughness={0.15} metalness={0.4} emissive={TUNABLE.colors.accent} emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

export default function ProductShowcase({ height = 380 }: { height?: number }) {
  const [supported, setSupported] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ready, setReady] = useState(false)
  const dragRef = useRef({ x: 0, y: 0 })
  const dragging = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 })

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

  // Drag-to-rotate: horizontal drags rotate; vertical touch stays with the page
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { active: true, lastX: e.clientX, lastY: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current.active) return
    const dx = e.clientX - dragging.current.lastX
    const dy = e.clientY - dragging.current.lastY
    dragging.current.lastX = e.clientX
    dragging.current.lastY = e.clientY
    dragRef.current.x += dx * 0.008
    dragRef.current.y = THREE.MathUtils.clamp(dragRef.current.y + dy * 0.005, -0.6, 0.6)
  }
  const onPointerUp = () => {
    dragging.current.active = false
  }

  if (!supported) {
    // Static fallback image (pure SVG — also the reduced-motion poster)
    return (
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center" style={{ height }}>
        <StaticBixfindLogo size={96} />
        <p className="mt-3 text-sm text-gray-500">3D preview unavailable — static view shown</p>
      </div>
    )
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-50"
      style={{ height, touchAction: 'pan-y', cursor: dragging.current.active ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      aria-label="3D product preview, drag to rotate"
    >
      <Canvas
        camera={{ position: TUNABLE.cameraPosition, fov: 40 }}
        dpr={isMobileDevice() ? [1, 1.5] : [1, 2]}
        gl={{ alpha: true, antialias: !isMobileDevice(), powerPreference: 'low-power' }}
        frameloop={reducedMotion ? 'demand' : 'always'}
        onCreated={() => setReady(true)}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 5]} intensity={TUNABLE.lightIntensity} />
        <directionalLight position={[-5, -2, 4]} intensity={TUNABLE.rimIntensity} color={TUNABLE.colors.accent} />
        <Suspense fallback={null}>
          <PlaceholderProduct reducedMotion={reducedMotion} dragRef={dragRef} />
        </Suspense>
      </Canvas>

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <span className="text-xs text-gray-500">Loading 3D preview…</span>
          </div>
        </div>
      )}

      <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wide text-gray-400 select-none pointer-events-none">
        Placeholder model · drag to rotate
      </span>
    </div>
  )
}
