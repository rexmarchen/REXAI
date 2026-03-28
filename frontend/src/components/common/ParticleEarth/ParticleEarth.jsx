import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { createEarthParticles, updateEarthParticles } from './earthParticles'
import styles from './ParticleEarth.module.css'

const variantConfig = {
  orbit: {
    count: 2600,
    depth: 0.45,
    holdMs: 3000,
    pointSize: 0.06,
    radius: 5.2,
    reformMs: 1700,
    ringThickness: 0.26,
    scatterMs: 1300,
    scatterScaleMax: 4.1,
    scatterScaleMin: 1.9,
    shape: 'ring'
  },
  sphere: {}
}

const ParticleEarth = ({ variant = 'sphere' }) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const particlesRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const pointerActiveRef = useRef(false)

  useEffect(() => {
    const mount = mountRef.current
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 15
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const particles = createEarthParticles(variantConfig[variant] || variantConfig.sphere)
    scene.add(particles)
    particlesRef.current = particles

    if (variant === 'orbit') {
      particles.rotation.x = 0.14
      particles.rotation.z = 0.05
    }

    const clock = new THREE.Clock()
    const animate = () => {
      requestAnimationFrame(animate)
      const deltaSeconds = Math.min(clock.getDelta(), 0.05)

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      updateEarthParticles(
        particles,
        deltaSeconds,
        raycasterRef.current.ray,
        pointerActiveRef.current
      )

      if (variant === 'orbit') {
        particles.rotation.z += 0.0012
        particles.rotation.y += 0.00028
      } else {
        particles.rotation.y += 0.0005
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      pointerActiveRef.current = true
    }

    const handleMouseLeave = () => {
      pointerActiveRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [variant])

  return (
    <div
      ref={mountRef}
      className={`${styles.earthCanvas} ${variant === 'orbit' ? styles.orbitCanvas : ''}`}
    />
  )
}

export default ParticleEarth
