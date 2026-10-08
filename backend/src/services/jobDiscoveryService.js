import logger from '../utils/logger.js'

// Simple in-memory cache for fetched postings (5 minutes cache duration)
const cacheStore = new Map()
const CACHE_DURATION_MS = 5 * 60 * 1000

// Target boards/companies for Greenhouse and Lever
const GREENHOUSE_BOARDS = ['github', 'cloudflare']
const LEVER_COMPANIES = ['stackadapt', 'lever']

function getCached(key) {
  const cached = cacheStore.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data
  }
  return null
}

function setCached(key, data) {
  cacheStore.set(key, {
    timestamp: Date.now(),
    data
  })
}

// Fetch Greenhouse listings
async function fetchGreenhouseJobs() {
  const cacheKey = 'greenhouse_raw_jobs'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const allJobs = []
  for (const board of GREENHOUSE_BOARDS) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`, {
        signal: AbortSignal.timeout(6000)
      })
      if (!res.ok) continue
      const data = await res.json()
      const rawJobs = Array.isArray(data?.jobs) ? data.jobs : []
      
      for (const raw of rawJobs) {
        allJobs.push({
          id: `greenhouse-${board}-${raw.id}`,
          title: raw.title,
          company: board.charAt(0).toUpperCase() + board.slice(1),
          location: raw.location?.name || 'Remote',
          description: `Open position at ${board}. Apply using our automated adapter.`,
          posting_url: raw.absolute_url,
          source: 'Greenhouse',
          tier: 1, // Greenhouse hosted is Tier 1
          posted_date: raw.updated_at || new Date().toISOString()
        })
      }
    } catch (err) {
      logger.warn(`Greenhouse board "${board}" fetch failed: ${err.message}`)
    }
  }

  setCached(cacheKey, allJobs)
  return allJobs
}

// Fetch Lever listings
async function fetchLeverJobs() {
  const cacheKey = 'lever_raw_jobs'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const allJobs = []
  for (const company of LEVER_COMPANIES) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`, {
        signal: AbortSignal.timeout(6000)
      })
      if (!res.ok) continue
      const rawPostings = await res.json()
      const list = Array.isArray(rawPostings) ? rawPostings : []

      for (const raw of list) {
        allJobs.push({
          id: `lever-${company}-${raw.id}`,
          title: raw.text,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: raw.categories?.location || 'Remote',
          description: raw.description || `Open position at ${company}. Apply using our automated adapter.`,
          posting_url: raw.hostedUrl,
          source: 'Lever',
          tier: 1, // Lever hosted is Tier 1
          posted_date: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString()
        })
      }
    } catch (err) {
      logger.warn(`Lever company "${company}" fetch failed: ${err.message}`)
    }
  }

  setCached(cacheKey, allJobs)
  return allJobs
}

// Fetch RemoteOK listings
async function fetchRemoteOKJobs() {
  const cacheKey = 'remoteok_raw_jobs'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const jobs = []
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    })
    if (res.ok) {
      const list = await res.json()
      // First item is legal info, skip it
      const rawJobs = Array.isArray(list) ? list.slice(1) : []
      for (const raw of rawJobs) {
        if (!raw.position || !raw.company) continue
        
        // RemoteOK listings are Tier 2 (automated browser session if standard form, else manual link)
        let tier = 2
        const url = raw.url || ''
        if (url.includes('greenhouse.io') || url.includes('lever.co')) {
          tier = 1
        } else if (url.includes('workday') || url.includes('myworkdayjobs')) {
          tier = 3
        }

        jobs.push({
          id: `remoteok-${raw.id}`,
          title: raw.position,
          company: raw.company,
          location: raw.location || 'Remote',
          description: raw.description || `Remote job at ${raw.company}.`,
          posting_url: url,
          source: 'RemoteOK',
          tier,
          posted_date: raw.epoch ? new Date(Number(raw.epoch) * 1000).toISOString() : new Date().toISOString()
        })
      }
    }
  } catch (err) {
    logger.warn(`RemoteOK fetch failed: ${err.message}`)
  }

  setCached(cacheKey, jobs)
  return jobs
}

// Main discover and score function
export async function discoverAndScoreJobs(profile) {
  const skills = Array.isArray(profile?.skills) ? profile.skills.map(s => String(s).toLowerCase()) : []
  const targetRole = String(profile?.targetRole || profile?.predicted_role || '').toLowerCase()
  const experienceYears = Number(profile?.experience_years || 0)

  // Fetch postings in parallel
  const [ghJobs, leverJobs, rokJobs] = await Promise.all([
    fetchGreenhouseJobs(),
    fetchLeverJobs(),
    fetchRemoteOKJobs()
  ])

  const rawAll = [...ghJobs, ...leverJobs, ...rokJobs]
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000

  // Filter for freshness (< 14 days) and normalize
  const freshJobs = rawAll.filter(job => {
    const jobTime = Date.parse(job.posted_date)
    return !Number.isNaN(jobTime) && jobTime >= fourteenDaysAgo
  })

  // Score each job
  const scoredJobs = freshJobs.map(job => {
    let score = 40 // base score

    const titleLower = String(job.title).toLowerCase()
    const descLower = String(job.description).toLowerCase()

    // 1. Role match: check if target role keywords appear in the title
    if (targetRole) {
      const words = targetRole.split(/\s+/)
      let matchedWords = 0
      for (const word of words) {
        if (word.length > 2 && titleLower.includes(word)) {
          matchedWords++
        }
      }
      if (matchedWords > 0) {
        score += Math.min(35, matchedWords * 15)
      }
    }

    // 2. Skills match: check how many candidate skills are present in the job description or title
    if (skills.length > 0) {
      let matchedSkills = 0
      for (const skill of skills) {
        if (skill.length > 1 && (titleLower.includes(skill) || descLower.includes(skill))) {
          matchedSkills++
        }
      }
      const matchRatio = matchedSkills / skills.length
      score += Math.min(20, Math.round(matchRatio * 20))
    }

    // 3. Location preference: if remote-friendly role matches remote preference
    if (titleLower.includes('remote') || job.location.toLowerCase().includes('remote')) {
      score += 4
    }

    // Ensure score is bounded between 45 and 98
    score = Math.max(45, Math.min(98, score))

    return {
      ...job,
      score
    }
  })

  // Sort by score in descending order
  scoredJobs.sort((a, b) => b.score - a.score)

  return scoredJobs
}
