import React, { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [hovered, setHovered] = useState(false)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    // Respect prefers-reduced-motion or touch devices
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || 'ontouchstart' in window) {
      setEnabled(false)
      return
    }

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const onMouseOver = (e) => {
      const target = e.target.closest('button, a, input, [role="button"], .clickable')
      setHovered(Boolean(target))
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseover', onMouseOver, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: hovered ? 36 : 14,
        height: hovered ? 36 : 14,
        borderRadius: '50%',
        backgroundColor: hovered ? 'rgba(233, 120, 82, 0.22)' : 'rgba(233, 120, 82, 0.75)',
        border: hovered ? '1.5px solid rgba(233, 120, 82, 0.85)' : 'none',
        pointerEvents: 'none',
        zIndex: 99999,
        transform: 'translate(-50%, -50%)',
        transition: 'width 0.2s ease, height 0.2s ease, background-color 0.2s ease, border 0.2s ease',
        mixBlendMode: 'normal'
      }}
    />
  )
}
