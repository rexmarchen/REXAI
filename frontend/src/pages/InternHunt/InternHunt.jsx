import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './InternHunt.module.css'

const PARTICLE_RINGS = [
  { radius: 88, count: 32, speed: 0.006, size: [1.4, 2.2], alpha: [0.3, 0.8] },
  { radius: 142, count: 44, speed: -0.0045, size: [1.1, 2.5], alpha: [0.25, 0.65] },
  { radius: 196, count: 56, speed: 0.0032, size: [0.8, 2.2], alpha: [0.2, 0.55] }
]

const INTERNSHIPS = [
  {
    id: 1,
    title: 'Full Stack Engineering Intern',
    company: 'Razorpay',
    location: 'Bengaluru',
    mode: 'Hybrid',
    duration: '6 Months',
    stipend: 'INR 45,000/mo',
    posted: '2 days ago',
    category: 'engineering',
    region: 'india',
    featured: true,
    tags: ['React', 'Node.js', 'PostgreSQL']
  },
  {
    id: 2,
    title: 'AI Product Intern',
    company: 'Openlayer Labs',
    location: 'Remote',
    mode: 'Remote',
    duration: '4 Months',
    stipend: 'USD 1,200/mo',
    posted: '1 day ago',
    category: 'ai',
    region: 'global',
    featured: true,
    tags: ['LLM', 'Prompting', 'Python']
  },
  {
    id: 3,
    title: 'Data Analyst Intern',
    company: 'InMobi',
    location: 'Remote',
    mode: 'Remote',
    duration: '3 Months',
    stipend: 'INR 30,000/mo',
    posted: '3 days ago',
    category: 'data',
    region: 'india',
    featured: false,
    tags: ['SQL', 'Looker', 'Experimentation']
  },
  {
    id: 4,
    title: 'Product Design Intern',
    company: 'Notion',
    location: 'San Francisco',
    mode: 'Remote',
    duration: '5 Months',
    stipend: 'USD 1,400/mo',
    posted: '5 days ago',
    category: 'design',
    region: 'global',
    featured: false,
    tags: ['Figma', 'Design Systems', 'UX Research']
  },
  {
    id: 5,
    title: 'SDE Intern - Platform',
    company: 'Meesho',
    location: 'Bengaluru',
    mode: 'In-Office',
    duration: '6 Months',
    stipend: 'INR 40,000/mo',
    posted: '1 week ago',
    category: 'engineering',
    region: 'india',
    featured: false,
    tags: ['Java', 'Distributed Systems', 'Redis']
  },
  {
    id: 6,
    title: 'Machine Learning Intern',
    company: 'Hugging Face',
    location: 'Global Remote',
    mode: 'Remote',
    duration: '4 Months',
    stipend: 'USD 1,500/mo',
    posted: '4 days ago',
    category: 'ai',
    region: 'global',
    featured: false,
    tags: ['Transformers', 'PyTorch', 'MLOps']
  },
  {
    id: 7,
    title: 'Growth Data Intern',
    company: 'CRED',
    location: 'Bengaluru',
    mode: 'Hybrid',
    duration: '4 Months',
    stipend: 'INR 35,000/mo',
    posted: '6 days ago',
    category: 'data',
    region: 'india',
    featured: false,
    tags: ['Python', 'SQL', 'Dashboards']
  },
  {
    id: 8,
    title: 'Product Intern',
    company: 'Miro',
    location: 'Amsterdam',
    mode: 'Remote',
    duration: '5 Months',
    stipend: 'EUR 1,000/mo',
    posted: '2 days ago',
    category: 'design',
    region: 'global',
    featured: true,
    tags: ['Roadmaps', 'Analytics', 'User Interviews']
  }
]

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'data', label: 'Data' },
  { value: 'ai', label: 'AI / ML' },
  { value: 'design', label: 'Design' },
  { value: 'remote', label: 'Remote' }
]

const InternHunt = () => {
  const canvasRef = useRef(null)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [region, setRegion] = useState('all')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: 0, y: 0, active: false }
    let width = 0
    let height = 0
    let dpr = 1
    let frameId = 0

    const particles = []

    const randRange = (min, max) => min + Math.random() * (max - min)

    const createParticles = () => {
      particles.length = 0
      const centerX = width * 0.78
      const centerY = Math.max(220, height * 0.34)

      PARTICLE_RINGS.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i += 1) {
          const angle = (Math.PI * 2 * i) / ring.count + Math.random() * 0.4
          const orbitRadius = ring.radius + randRange(-16, 16)
          const x = centerX + Math.cos(angle) * orbitRadius
          const y = centerY + Math.sin(angle) * orbitRadius
          particles.push({
            ringIndex,
            angle,
            orbitRadius,
            orbitSpeed: ring.speed + randRange(-0.0009, 0.0009),
            size: randRange(ring.size[0], ring.size[1]),
            alpha: randRange(ring.alpha[0], ring.alpha[1]),
            x,
            y,
            vx: 0,
            vy: 0
          })
        }
      })
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      createParticles()
    }

    const movePointer = (x, y) => {
      pointer.x = x
      pointer.y = y
      pointer.active = true
    }

    const handleMouseMove = (event) => movePointer(event.clientX, event.clientY)
    const handleTouchMove = (event) => {
      if (!event.touches || event.touches.length === 0) return
      const touch = event.touches[0]
      movePointer(touch.clientX, touch.clientY)
    }
    const clearPointer = () => {
      pointer.active = false
    }

    const drawFrame = () => {
      context.clearRect(0, 0, width, height)
      const centerX = width * 0.78
      const centerY = Math.max(220, height * 0.34)

      context.lineWidth = 1
      context.strokeStyle = 'rgba(0, 229, 255, 0.15)'
      for (let i = 0; i < PARTICLE_RINGS.length; i += 1) {
        context.beginPath()
        context.arc(centerX, centerY, PARTICLE_RINGS[i].radius, 0, Math.PI * 2)
        context.stroke()
      }

      const repelRadius = 120
      const repelRadiusSquared = repelRadius * repelRadius

      particles.forEach((particle) => {
        const ring = PARTICLE_RINGS[particle.ringIndex]
        particle.angle += particle.orbitSpeed
        const targetX = centerX + Math.cos(particle.angle) * particle.orbitRadius
        const targetY = centerY + Math.sin(particle.angle) * particle.orbitRadius

        particle.vx += (targetX - particle.x) * 0.018
        particle.vy += (targetY - particle.y) * 0.018

        if (pointer.active) {
          const dx = particle.x - pointer.x
          const dy = particle.y - pointer.y
          const distanceSquared = dx * dx + dy * dy

          if (distanceSquared < repelRadiusSquared) {
            const distance = Math.sqrt(distanceSquared) || 1
            const force = (repelRadius - distance) / repelRadius
            particle.vx += (dx / distance) * force * 1.3
            particle.vy += (dy / distance) * force * 1.3
          }
        }

        particle.vx *= 0.91
        particle.vy *= 0.91
        particle.x += particle.vx
        particle.y += particle.vy

        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fillStyle = `rgba(0, 229, 255, ${particle.alpha})`
        context.fill()

        if (ring.radius === PARTICLE_RINGS[0].radius) {
          context.beginPath()
          context.arc(particle.x, particle.y, particle.size + 1.8, 0, Math.PI * 2)
          context.fillStyle = 'rgba(0, 229, 255, 0.08)'
          context.fill()
        }
      })

      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(drawFrame)
      }
    }

    resize()
    drawFrame()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('mouseleave', clearPointer)
    window.addEventListener('touchend', clearPointer)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseleave', clearPointer)
      window.removeEventListener('touchend', clearPointer)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  const filteredInternships = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return INTERNSHIPS.filter((internship) => {
      const searchableText = [
        internship.title,
        internship.company,
        internship.location,
        internship.mode,
        internship.category,
        ...internship.tags
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery)

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'remote' && internship.mode.toLowerCase() === 'remote') ||
        internship.category === activeFilter

      const matchesRegion = region === 'all' || internship.region === region

      return matchesQuery && matchesFilter && matchesRegion
    })
  }, [activeFilter, query, region])

  return (
    <section className={styles.page}>
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
      <div className={styles.scanLine} aria-hidden="true" />

      <div className={styles.hero}>
        <div className={styles.heroBadge}>Internship Intelligence Engine</div>
        <h1>
          Discover curated <span>internships</span> with precision filters
        </h1>
        <p>
          Imported into your Intern Hunt route with live-style cards, fast search, and skill-relevant
          listings tuned for your profile.
        </p>

        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{INTERNSHIPS.length}</span>
            <span className={styles.statLabel}>Active Listings</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>3</span>
            <span className={styles.statLabel}>Region Modes</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>24h</span>
            <span className={styles.statLabel}>Sync Window</span>
          </div>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by role, skill, company, location"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className={styles.divider} />
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="all">All regions</option>
            <option value="india">India</option>
            <option value="global">International</option>
          </select>
        </div>

        <div className={styles.filterRow}>
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`${styles.filterChip} ${activeFilter === filter.value ? styles.activeChip : ''}`}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sectionHeading}>
        <h2>Intern Hunt Live Feed</h2>
        <span className={styles.liveCount}>{filteredInternships.length} matching roles</span>
      </div>

      <div className={styles.mainGrid}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3>Realtime Filters</h3>
            <p>
              Results update instantly by role keywords, category, and region. Cursor-interactive
              particle rings are rendered separately for smooth UI performance.
            </p>
          </div>
          <div className={styles.sidebarCard}>
            <h3>Intern Match AI</h3>
            <p>Resume-to-role ranking, auto fit scores, and recruiter-style feedback are coming next.</p>
            <button type="button" className={styles.comingSoon}>
              Coming Soon
            </button>
          </div>
        </aside>

        <div className={styles.cardsGrid}>
          {filteredInternships.length === 0 && (
            <div className={styles.emptyState}>
              No internship matched the current filters. Try broader keywords or switch region.
            </div>
          )}

          {filteredInternships.map((internship, index) => (
            <article
              key={internship.id}
              className={`${styles.card} ${internship.featured ? styles.featuredCard : ''}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={styles.logo}>{internship.company.charAt(0)}</div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <h3>{internship.title}</h3>
                  {internship.featured && <span className={`${styles.badge} ${styles.badgeFeatured}`}>Featured</span>}
                  <span className={`${styles.badge} ${styles.badgeLive}`}>Live</span>
                </div>
                <p className={styles.companyLine}>
                  <strong>{internship.company}</strong> | {internship.location} | {internship.mode}
                </p>
                <p className={styles.metaLine}>
                  {internship.duration} | Posted {internship.posted}
                </p>
                <div className={styles.tagRow}>
                  {internship.tags.map((tag) => (
                    <span key={`${internship.id}-${tag}`} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.cardActions}>
                <span className={styles.stipend}>{internship.stipend}</span>
                <button type="button" className={styles.saveBtn} aria-label={`Save ${internship.title}`}>
                  Save
                </button>
                <a
                  className={styles.applyBtn}
                  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(internship.title)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apply
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className={styles.resumeSection}>
        <div className={styles.resumeCard}>
          <div>
            <span className={styles.resumeBadge}>AI Powered</span>
            <h2>Resume Match Assistant</h2>
            <p>
              Upload resume, parse skills, and map profile gaps against active internships. This block
              is connected to Intern Hunt and prepared for backend integration.
            </p>
          </div>
          <button type="button" className={styles.resumeComingSoon}>
            Coming Soon
          </button>
        </div>
      </section>
    </section>
  )
}

export default InternHunt
