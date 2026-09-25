'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  color: string
}

interface InteractiveParticlesProps {
  particleCount?: number
  connectionDistance?: number
  mouseDistance?: number
  colors?: string[]
  speed?: number
}

export default function InteractiveParticles({
  particleCount = 80,
  connectionDistance = 150,
  mouseDistance = 200,
  colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#6366f1', '#22d3ee'],
  speed = 0.5,
}: InteractiveParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const animationRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = container.offsetWidth
    let height = container.offsetHeight
    canvas.width = width * (window.devicePixelRatio || 1)
    canvas.height = height * (window.devicePixelRatio || 1)
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    const initParticles = () => {
      const particles: Particle[] = []
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
      particlesRef.current = particles
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      const particles = particlesRef.current

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Mouse interaction - particles gently repel/attract
        const dx = mouseRef.current.x - p.x
        const dy = mouseRef.current.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < mouseDistance) {
          const force = (mouseDistance - dist) / mouseDistance
          p.x -= dx * force * 0.02
          p.y -= dy * force * 0.02
        }

        // Move particle
        p.x += p.vx
        p.y += p.vy

        // Bounce off edges
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Keep within bounds
        p.x = Math.max(0, Math.min(width, p.x))
        p.y = Math.max(0, Math.min(height, p.y))

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

          if (dist2 < connectionDistance) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color
            ctx.globalAlpha = (1 - dist2 / connectionDistance) * 0.15
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Draw mouse glow
      if (mouseRef.current.x > 0 && mouseRef.current.y > 0) {
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          mouseDistance * 0.8
        )
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.12)')
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.06)')
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(mouseRef.current.x, mouseRef.current.y, mouseDistance * 0.8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
    }

    const handleResize = () => {
      width = container.offsetWidth
      height = container.offsetHeight
      canvas.width = width * (window.devicePixelRatio || 1)
      canvas.height = height * (window.devicePixelRatio || 1)
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)
    }

    initParticles()
    animate()

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationRef.current)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)
    }
  }, [particleCount, connectionDistance, mouseDistance, colors, speed])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
