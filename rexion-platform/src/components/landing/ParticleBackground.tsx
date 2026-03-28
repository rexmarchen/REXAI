'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PointMaterial, Points } from '@react-three/drei'
import type { Group } from 'three'

function Field() {
  const ref = useRef<Group>(null)
  const positions = useMemo(() => {
    const values: number[] = []
    for (let index = 0; index < 800; index += 1) {
      values.push((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 3)
    }
    return new Float32Array(values)
  }, [])

  useFrame(({ clock, mouse }) => {
    if (!ref.current) {
      return
    }

    ref.current.rotation.y = clock.elapsedTime * 0.03 + mouse.x * 0.08
    ref.current.rotation.x = mouse.y * 0.05
  })

  return (
    <group ref={ref}>
      <Points positions={positions} stride={3}>
        <PointMaterial transparent color="#42d38a" size={0.05} sizeAttenuation depthWrite={false} opacity={0.6} />
      </Points>
    </group>
  )
}

export function ParticleBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.42,
        pointerEvents: 'none',
      }}
    >
      <Canvas camera={{ position: [0, 0, 6] }}>
        <Field />
      </Canvas>
    </div>
  )
}
