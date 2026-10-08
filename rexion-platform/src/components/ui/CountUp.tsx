'use client'

import { useEffect, useState } from 'react'
import { useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

export function CountUp({
  from = 0,
  to,
  duration = 1.2,
  prefix = '',
  suffix = '',
}: {
  from?: number
  to: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const motionValue = useMotionValue(from)
  const spring = useSpring(motionValue, {
    damping: 28,
    stiffness: 120,
    mass: 0.8,
  })
  const rounded = useTransform(spring, (latest) => Math.round(latest))
  const [value, setValue] = useState(from)

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(to)
      return
    }

    const timeout = window.setTimeout(() => {
      motionValue.set(to)
    }, 16)

    const unsubscribe = rounded.on('change', (latest) => setValue(latest))
    const finish = window.setTimeout(() => setValue(to), duration * 1000)

    return () => {
      window.clearTimeout(timeout)
      window.clearTimeout(finish)
      unsubscribe()
    }
  }, [duration, motionValue, prefersReducedMotion, rounded, to])

  return (
    <span>
      {prefix}
      {value.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}
