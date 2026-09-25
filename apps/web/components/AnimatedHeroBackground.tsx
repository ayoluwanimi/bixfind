'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = canvas.width = window.innerWidth
    let height = canvas.height = window.innerHeight

    const particles: Particle[] = []
    const particleCount = Math.min(80, Math.floor(width * height / 15000))

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      opacity: number
      color: string
      pulse: number
      pulseSpeed: number

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 3 + 1
        this.opacity = Math.random() * 0.5 + 0.2
        this.pulse = Math.random() * Math.PI * 2
        this.pulseSpeed = Math.random() * 0.02 + 0.01
        const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.pulse += this.pulseSpeed

        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }

      draw() {
        const currentRadius = this.radius + Math.sin(this.pulse) * 1
        const currentOpacity = this.opacity + Math.sin(this.pulse) * 0.1

        ctx.beginPath()
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2)
        ctx.fillStyle = this.color + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const drawConnections = () => {
      const maxDistance = 150
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.15
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    const drawFloatingShapes = (time: number) => {
      const shapes = [
        { x: width * 0.15, y: height * 0.2, size: 60, rotation: time * 0.0003, color: 'rgba(139, 92, 246, 0.08)' },
        { x: width * 0.85, y: height * 0.7, size: 80, rotation: -time * 0.0002, color: 'rgba(59, 130, 246, 0.06)' },
        { x: width * 0.5, y: height * 0.15, size: 40, rotation: time * 0.0004, color: 'rgba(6, 182, 212, 0.07)' },
        { x: width * 0.75, y: height * 0.4, size: 50, rotation: -time * 0.0005, color: 'rgba(16, 185, 129, 0.05)' },
      ]

      shapes.forEach(shape => {
        ctx.save()
        ctx.translate(shape.x, shape.y)
        ctx.rotate(shape.rotation)
        ctx.beginPath()
        
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 / 6) * i
          const x = Math.cos(angle) * shape.size
          const y = Math.sin(angle) * shape.size
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fillStyle = shape.color
        ctx.fill()
        ctx.restore()
      })
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      
      drawFloatingShapes(time)

      particles.forEach(p => {
        p.update()
        p.draw()
      })

      drawConnections()
      animationId = requestAnimationFrame(animate)
    }

    animate(0)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
