import { useRef, useEffect } from 'react'

export const useEarthAnimation = (particlesRef) => {
  const intervalRef = useRef()

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Dispatch custom event that ParticleEarth component listens to
      window.dispatchEvent(new CustomEvent('scatter-reform'))
    }, 3000)

    return () => clearInterval(intervalRef.current)
  }, [])
}