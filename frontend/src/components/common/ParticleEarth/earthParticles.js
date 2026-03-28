import * as THREE from 'three'

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

const DEFAULT_CONFIG = {
  color: 0x528bff,
  count: 5000,
  depth: 0.7,
  floatMs: 1400,
  holdMs: 2200,
  opacity: 0.92,
  pointSize: 0.05,
  radius: 5,
  reformMs: 1800,
  ringThickness: 0.2,
  scatterMs: 1600,
  scatterScaleMax: 5,
  scatterScaleMin: 2.4,
  shape: 'sphere'
}

const getInitialPoint = (config) => {
  if (config.shape === 'ring') {
    const angle = Math.random() * Math.PI * 2
    const radius = config.radius + (Math.random() - 0.5) * config.ringThickness * 2
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    const z = (Math.random() - 0.5) * config.depth

    return { x, y, z }
  }

  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const radius = config.radius

  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi)
  }
}

export function createEarthParticles(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }
  const geometry = new THREE.BufferGeometry()
  const count = config.count
  const positions = new Float32Array(count * 3)
  const scatterVectors = new Float32Array(count * 3)
  const repelOffsets = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const { x, y, z } = getInitialPoint(config)

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    const scatterScale =
      config.scatterScaleMin +
      Math.random() * (config.scatterScaleMax - config.scatterScaleMin)
    scatterVectors[i * 3] = (Math.random() - 0.5) * scatterScale
    scatterVectors[i * 3 + 1] = (Math.random() - 0.5) * scatterScale
    scatterVectors[i * 3 + 2] = (Math.random() - 0.5) * scatterScale
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: config.color,
    opacity: config.opacity,
    size: config.pointSize,
    sizeAttenuation: true,
    transparent: true,
    blending: THREE.AdditiveBlending
  })

  const particles = new THREE.Points(geometry, material)

  particles.userData.config = config
  particles.userData.originalPositions = positions.slice()
  particles.userData.scatterVectors = scatterVectors
  particles.userData.repelOffsets = repelOffsets
  particles.userData.phase = 'hold'
  particles.userData.phaseStart = performance.now()

  return particles
}

function updatePhase(particles, now) {
  const { config, phase, phaseStart } = particles.userData
  const elapsed = now - phaseStart

  if (phase === 'hold' && elapsed >= config.holdMs) {
    particles.userData.phase = 'scatter'
    particles.userData.phaseStart = now
  } else if (phase === 'scatter' && elapsed >= config.scatterMs) {
    particles.userData.phase = 'float'
    particles.userData.phaseStart = now
  } else if (phase === 'float' && elapsed >= config.floatMs) {
    particles.userData.phase = 'reform'
    particles.userData.phaseStart = now
  } else if (phase === 'reform' && elapsed >= config.reformMs) {
    particles.userData.phase = 'hold'
    particles.userData.phaseStart = now
  }
}

function getScatterFactor(particles, now) {
  const { config, phase, phaseStart } = particles.userData
  const elapsed = now - phaseStart

  if (phase === 'hold') return 0
  if (phase === 'scatter') return easeInOutCubic(clamp01(elapsed / config.scatterMs))
  if (phase === 'float') return 1
  return 1 - easeInOutCubic(clamp01(elapsed / config.reformMs))
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
