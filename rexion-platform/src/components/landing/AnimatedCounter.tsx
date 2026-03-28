'use client'

import { useEffect, useState } from 'react'

export function AnimatedCounter({
  value,
  suffix = '',
}: {
  value: number
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setDisplayValue(Math.round(value * progress))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <>
      {displayValue}
      {suffix}
    </>
  )
}
