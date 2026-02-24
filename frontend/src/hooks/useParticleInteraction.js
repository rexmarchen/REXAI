import { useEffect } from 'react'
import * as THREE from 'three'

export const useParticleInteraction = (scene, camera, raycaster, mouse, particles) => {
  useEffect(() => {
    if (!scene || !camera || !particles) return

    const onMouseMove = (event) => {
      // Convert mouse to normalized device coordinates (-1 to +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      // Move particles away from ray
      const positions = particles.geometry.attributes.position.array
      const count = positions.length / 3
      const repelStrength = 0.5

      for (let i = 0; i < count; i++) {
        const idx = i * 3
        const point = new THREE.Vector3(positions[idx], positions[idx + 1], positions[idx + 2])
        const distance = raycaster.ray.distanceToPoint(point)
        if (distance < 2) {
          const dir = point.clone().sub(raycaster.ray.origin).normalize()
          const newPos = point.clone().add(dir.multiplyScalar(repelStrength))
          positions[idx] = newPos.x
          positions[idx + 1] = newPos.y
          positions[idx + 2] = newPos.z
        }
      }
      particles.geometry.attributes.position.needsUpdate = true
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [scene, camera, raycaster, mouse, particles])
}