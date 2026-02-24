import * as THREE from 'three'

const HOLD_MS = 2200
const SCATTER_MS = 1600
const FLOAT_MS = 1400
const REFORM_MS = 1800

const REPEL_RADIUS = 1.1
const REPEL_STRENGTH = 8.5
const REPEL_DAMPING = 0.9
const REPEL_MAX = 2.0

const tmpPoint = new THREE.Vector3()
const tmpClosest = new THREE.Vector3()
const tmpDir = new THREE.Vector3()

const easeInOutCubic = (t) => {
  if (t < 0.5) return 4 * t * t * t
  return 1 - Math.pow(-2 * t + 2, 3) / 2
}

const clamp01 = (value) => Math.max(0, Math.min(1, value))

export function createEarthParticles() {
  const geometry = new THREE.BufferGeometry()
  const count = 5000
  const positions = new Float32Array(count * 3)
  const scatterVectors = new Float32Array(count * 3)
  const repelOffsets = new Float32Array(count * 3)

  // Create a sphere of points
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 5

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    const scatterScale = 2.4 + Math.random() * 2.6
    scatterVectors[i * 3] = (Math.random() - 0.5) * scatterScale
    scatterVectors[i * 3 + 1] = (Math.random() - 0.5) * scatterScale
    scatterVectors[i * 3 + 2] = (Math.random() - 0.5) * scatterScale
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0x00f5ff,
    size: 0.05,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  })

  const particles = new THREE.Points(geometry, material)

  // Store base data for smooth animation and interaction.
  particles.userData.originalPositions = positions.slice()
  particles.userData.scatterVectors = scatterVectors
  particles.userData.repelOffsets = repelOffsets
  particles.userData.phase = 'hold'
  particles.userData.phaseStart = performance.now()

  return particles
}

function updatePhase(particles, now) {
  const { phase, phaseStart } = particles.userData
  const elapsed = now - phaseStart

  if (phase === 'hold' && elapsed >= HOLD_MS) {
    particles.userData.phase = 'scatter'
    particles.userData.phaseStart = now
  } else if (phase === 'scatter' && elapsed >= SCATTER_MS) {
    particles.userData.phase = 'float'
    particles.userData.phaseStart = now
  } else if (phase === 'float' && elapsed >= FLOAT_MS) {
    particles.userData.phase = 'reform'
    particles.userData.phaseStart = now
  } else if (phase === 'reform' && elapsed >= REFORM_MS) {
    particles.userData.phase = 'hold'
    particles.userData.phaseStart = now
  }
}

function getScatterFactor(particles, now) {
  const { phase, phaseStart } = particles.userData
  const elapsed = now - phaseStart

  if (phase === 'hold') return 0
  if (phase === 'scatter') return easeInOutCubic(clamp01(elapsed / SCATTER_MS))
  if (phase === 'float') return 1
  return 1 - easeInOutCubic(clamp01(elapsed / REFORM_MS))
}

export function updateEarthParticles(particles, deltaSeconds, ray, isPointerActive) {
  if (!particles) return

  const now = performance.now()
  updatePhase(particles, now)

  const positions = particles.geometry.attributes.position.array
  const original = particles.userData.originalPositions
  const scatterVectors = particles.userData.scatterVectors
  const repelOffsets = particles.userData.repelOffsets
  const scatterFactor = getScatterFactor(particles, now)

  for (let i = 0; i < positions.length; i += 3) {
    const baseX = original[i] + scatterVectors[i] * scatterFactor
    const baseY = original[i + 1] + scatterVectors[i + 1] * scatterFactor
    const baseZ = original[i + 2] + scatterVectors[i + 2] * scatterFactor

    // Natural return to origin after repulsion.
    repelOffsets[i] *= REPEL_DAMPING
    repelOffsets[i + 1] *= REPEL_DAMPING
    repelOffsets[i + 2] *= REPEL_DAMPING

    if (isPointerActive && ray) {
      tmpPoint.set(baseX, baseY, baseZ)
      ray.closestPointToPoint(tmpPoint, tmpClosest)
      tmpDir.copy(tmpPoint).sub(tmpClosest)
      const distance = tmpDir.length()

      if (distance < REPEL_RADIUS) {
        const influence = 1 - distance / REPEL_RADIUS
        const force = influence * influence * REPEL_STRENGTH * deltaSeconds

        if (distance < 0.0001) {
          tmpDir.copy(tmpPoint).normalize()
        } else {
          tmpDir.multiplyScalar(1 / distance)
        }

        repelOffsets[i] = Math.max(-REPEL_MAX, Math.min(REPEL_MAX, repelOffsets[i] + tmpDir.x * force))
        repelOffsets[i + 1] = Math.max(-REPEL_MAX, Math.min(REPEL_MAX, repelOffsets[i + 1] + tmpDir.y * force))
        repelOffsets[i + 2] = Math.max(-REPEL_MAX, Math.min(REPEL_MAX, repelOffsets[i + 2] + tmpDir.z * force))
      }
    }

    positions[i] = baseX + repelOffsets[i]
    positions[i + 1] = baseY + repelOffsets[i + 1]
    positions[i + 2] = baseZ + repelOffsets[i + 2]
  }

  particles.geometry.attributes.position.needsUpdate = true
}
