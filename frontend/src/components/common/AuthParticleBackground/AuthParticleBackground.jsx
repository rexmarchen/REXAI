import React, { useEffect, useRef } from 'react'
import styles from './AuthParticleBackground.module.css'

const AuthParticleBackground = ({
  particleCount = 80,
  particleSize = 2,
  particleColor = 'rgba(200, 230, 255, 0.6)',
  minSpeed = 0.05,
  maxSpeed = 0.2,
  friction = 0.98,
  mouseRadius = 150,
  repulsionForce = 2,
  enableTrails = true,
  trailAlpha = 0.08
}) => {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const sizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctxRef.current = ctx

    const resizeCanvas = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1

      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.width = width * dpr
      canvas.height = height * dpr

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      sizeRef.current = { width, height }
    }

    const createParticles = () => {
      const { width, height } = sizeRef.current
      const nextParticles = []

      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed

        nextParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ax: 0,
          ay: 0
        })
      }

      particlesRef.current = nextParticles
    }

    const applyRepulsion = (particle) => {
      const dx = particle.x - mouseRef.current.x
      const dy = particle.y - mouseRef.current.y
      const distSq = dx * dx + dy * dy
      const radiusSq = mouseRadius * mouseRadius

      if (distSq < radiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq)
        const falloff = 1 - dist / mouseRadius
        const strength = falloff * falloff * repulsionForce
        const angle = Math.atan2(dy, dx)

        particle.ax = Math.cos(angle) * strength
        particle.ay = Math.sin(angle) * strength
      }
    }

    const updateParticle = (particle) => {
      particle.vx += particle.ax
      particle.vy += particle.ay
      particle.ax = 0
      particle.ay = 0

      particle.vx *= friction
      particle.vy *= friction

      particle.x += particle.vx
      particle.y += particle.vy

      const { width, height } = sizeRef.current
      if (particle.x < 0) particle.x = width
      if (particle.x > width) particle.x = 0
      if (particle.y < 0) particle.y = height
      if (particle.y > height) particle.y = 0

      if (mouseRef.current.active) {
        applyRepulsion(particle)
      }
    }

    const drawParticle = (particle) => {
      ctx.fillStyle = particleColor
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2)
      ctx.fill()
    }

    const animate = () => {
      const { width, height } = sizeRef.current

      if (enableTrails) {
        ctx.fillStyle = `rgba(15, 15, 25, ${trailAlpha})`
        ctx.fillRect(0, 0, width, height)
      } else {
        ctx.clearRect(0, 0, width, height)
      }

      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        updateParticle(particles[i])
        drawParticle(particles[i])
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (event) => {
      mouseRef.current.x = event.clientX
      mouseRef.current.y = event.clientY
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    const handleMouseEnter = () => {
      mouseRef.current.active = true
    }

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        mouseRef.current.x = event.touches[0].clientX
        mouseRef.current.y = event.touches[0].clientY
        mouseRef.current.active = true
      }
    }

    const handleTouchEnd = () => {
      mouseRef.current.active = false
    }

    resizeCanvas()
    createParticles()
    animate()

    window.addEventListener('resize', resizeCanvas)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    particleCount,
    particleSize,
    particleColor,
    minSpeed,
    maxSpeed,
    friction,
    mouseRadius,
    repulsionForce,
    enableTrails,
    trailAlpha
  ])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}

export default AuthParticleBackground
