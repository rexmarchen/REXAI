import React, { useEffect, useState, useRef } from 'react'

/**
 * AnimatedCounter component
 * Smoothly animates numbers from 0 to target value with easing
 */
export default function AnimatedCounter({
  target,
  duration = 1600,
  prefix = '',
  suffix = '',
  decimals = 0,
  delay = 0,
  separator = ','
}) {
  const [current, setCurrent] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.15 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    let startTime = null
    let animationFrame = null

    const timeout = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)

        // Ease out expo for silky smooth deceleration
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const nextValue = easeProgress * target

        setCurrent(nextValue)

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step)
        } else {
          setCurrent(target)
        }
      }

      animationFrame = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [hasStarted, target, duration, delay])

  // Format with commas and decimals
  const formattedNumber = (() => {
    if (decimals > 0) {
      return current.toFixed(decimals)
    }
    const intVal = Math.floor(current)
    return separator ? intVal.toLocaleString('en-US') : intVal.toString()
  })()

  return (
    <span ref={elementRef} style={{ display: 'inline-block' }}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  )
}
