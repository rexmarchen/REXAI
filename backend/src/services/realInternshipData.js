import fs from 'node:fs/promises'
import path from 'node:path'

const DATASET_CANDIDATE_PATHS = [
  path.resolve(process.cwd(), '..', 'Downloads', 'Summer2027-Internships-dev', 'Summer2027-Internships-dev', '.github', 'scripts', 'listings.json'),
  path.resolve(process.cwd(), '..', 'Summer2027-Internships-dev', 'Summer2027-Internships-dev', '.github', 'scripts', 'listings.json'),
  path.resolve(process.cwd(), 'Summer2027-Internships-dev', '.github', 'scripts', 'listings.json'),
  path.resolve(process.cwd(), 'data', 'summer2027-internships.json'),
  path.resolve(process.env.USERPROFILE || process.cwd(), 'Downloads', 'Summer2027-Internships-dev', 'Summer2027-Internships-dev', '.github', 'scripts', 'listings.json'),
  path.resolve(process.env.USERPROFILE || process.cwd(), 'Summer2027-Internships-dev', '.github', 'scripts', 'listings.json')
]

const DOMAIN_KEYWORDS = {
  frontend: ['frontend', 'web', 'ui', 'ux', 'react', 'javascript', 'full stack', 'full-stack', 'mobile'],
  backend: ['backend', 'platform', 'infrastructure', 'systems', 'cloud', 'api', 'database', 'security', 'distributed'],
  fullstack: ['full stack', 'full-stack', 'software engineer', 'application developer', 'platform engineer'],
  ai: ['ai', 'machine learning', 'ml', 'data science', 'deep learning', 'vision', 'nlp', 'llm', 'research'],
  data: ['data', 'analytics', 'quant', 'research scientist', 'scientist'],
  design: ['design', 'product design', 'ux', 'ui', 'visual design'],
  engineering: ['hardware', 'systems', 'embedded', 'electrical', 'mechanical', 'firmware', 'cloud', 'infrastructure']
}

function toSentenceCase(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCompanyName(value) {
  return toSentenceCase(value || 'Unknown Company')
}

function normalizeTitle(value) {
  return toSentenceCase(value || 'Internship Role')
}

function normalizeLocation(value) {
  return toSentenceCase(value || 'Remote')
}

function guessDomain(title = '', category = '') {
  const haystack = `${title} ${category}`.toLowerCase()
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return domain
    }
  }
  return 'engineering'
}

function buildDescription(company, title, location) {
  return `${title} at ${company} in ${location}. Real internship listing pulled from the Summer 2027 dataset.`
}

const VERIFIED_COMPANY_LINKEDIN = {
  amazon: 'https://www.linkedin.com/company/amazon/jobs/',
  google: 'https://www.linkedin.com/company/google/jobs/',
  microsoft: 'https://www.linkedin.com/company/microsoft/jobs/',
  zepto: 'https://www.linkedin.com/company/zeptonow/jobs/',
  palantir: 'https://www.linkedin.com/company/palantir-technologies/jobs/',
  'palantir technologies': 'https://www.linkedin.com/company/palantir-technologies/jobs/',
  datadog: 'https://www.linkedin.com/company/datadog/jobs/',
  postman: 'https://www.linkedin.com/company/postman-platform/jobs/',
  razorpay: 'https://www.linkedin.com/company/razorpay/jobs/',
  figma: 'https://www.linkedin.com/company/figma/jobs/',
  cred: 'https://www.linkedin.com/company/cred-club/jobs/',
  groww: 'https://www.linkedin.com/company/groww.in/jobs/',
  swiggy: 'https://www.linkedin.com/company/swiggy-in/jobs/',
  zomato: 'https://www.linkedin.com/company/zomato/jobs/',
  phonepe: 'https://www.linkedin.com/company/phonepe-internet/jobs/',
  duolingo: 'https://www.linkedin.com/company/duolingo/jobs/',
  discord: 'https://www.linkedin.com/company/discord/jobs/',
  scaleai: 'https://www.linkedin.com/company/scaleai/jobs/',
  'scale ai': 'https://www.linkedin.com/company/scaleai/jobs/',
  canonical: 'https://www.linkedin.com/company/canonical/jobs/',
  uber: 'https://www.linkedin.com/company/uber-com/jobs/',
  meta: 'https://www.linkedin.com/company/meta/jobs/',
  stripe: 'https://www.linkedin.com/company/stripe/jobs/'
}

function toLinkedInSearchUrl(company, title) {
  const normComp = String(company || '').trim().toLowerCase()
  if (VERIFIED_COMPANY_LINKEDIN[normComp]) {
    return VERIFIED_COMPANY_LINKEDIN[normComp]
  }
  for (const [key, url] of Object.entries(VERIFIED_COMPANY_LINKEDIN)) {
    if (normComp.includes(key) || key.includes(normComp)) {
      return url
    }
  }
  const cleanTitle = String(title || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[-–—|/\\].*$/, '')
    .trim()
  const query = `${company} ${cleanTitle}`.trim()
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`
}

async function findDatasetPath() {
  const seen = new Set()
  for (const candidate of DATASET_CANDIDATE_PATHS) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      seen.add(candidate)
    }
  }

  const searchRoots = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    process.env.USERPROFILE || path.resolve(process.cwd(), '..'),
    'C:\\Users',
    'C:\\'
  ]

  for (const root of searchRoots) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const rootPath = path.join(root, entry.name)
        const target = path.join(rootPath, 'Summer2027-Internships-dev', 'Summer2027-Internships-dev', '.github', 'scripts', 'listings.json')
        if (!seen.has(target)) {
          try {
            await fs.access(target)
            return target
          } catch {
            seen.add(target)
          }
        }
      }
    } catch {
      // Ignore unreadable search roots.
    }
  }

  return null
}

export async function loadSummer2027Internships(options = {}) {
  const datasetPath = await findDatasetPath()
  if (!datasetPath) {
    return []
  }

  const {
    limit = 40,
    search = '',
    location = '',
    remote,
    domain
  } = options

  const raw = await fs.readFile(datasetPath, 'utf8')
  const payload = JSON.parse(raw)
  const rows = Array.isArray(payload) ? payload : (Array.isArray(payload.listings) ? payload.listings : [])

  const normalized = rows
    .filter((item) => item && item.title && item.company_name && item.is_visible !== false)
    .map((item, index) => {
      const company = normalizeCompanyName(item.company_name)
      const title = normalizeTitle(item.title)
      const locations = Array.isArray(item.locations) && item.locations.length > 0
        ? item.locations.filter(Boolean).map(normalizeLocation)
        : ['Remote']
      const locationText = locations.join(', ')
      const detectedDomain = guessDomain(title, item.category || '')
      const remoteFlag = /remote|virtual|anywhere|hybrid/i.test(locationText.toLowerCase())
      const cleanUrl = typeof item.url === 'string' ? item.url : ''

      return {
        id: item.id || `summer2027-${index}`,
        company,
        company_stage: 'Real internship dataset',
        title,
        domain: detectedDomain,
        location: locationText,
        is_remote: remoteFlag,
        salary: item.salary || 'Compensation not listed',
        duration: item.terms?.[0] || 'Summer 2027',
        match_score: `${Math.min(99, 88 + (index % 9))}%`,
        skills: [
          detectedDomain,
          ...title.split(/\s+/).filter((word) => word.length > 3).slice(0, 3)
        ].filter(Boolean, true).slice(0, 4),
        description: buildDescription(company, title, locationText),
        posted_hours_ago: Math.max(1, Math.min(720, 24 + (index % 18))),
        apply_link: cleanUrl,
        linkedin_url: toLinkedInSearchUrl(company, title),
        source: 'summer2027',
        sourceLabel: 'Summer 2027 dataset'
      }
    })

  let filtered = normalized

  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase()
    filtered = filtered.filter((item) => (
      item.title.toLowerCase().includes(q) ||
      item.company.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    ))
  }

  if (location && String(location).trim() && String(location).toLowerCase() !== 'all') {
    const locationQuery = String(location).trim().toLowerCase()
    filtered = filtered.filter((item) => item.location.toLowerCase().includes(locationQuery))
  }

  if (remote === 'true' || remote === true) {
    filtered = filtered.filter((item) => item.is_remote)
  }

  if (domain && String(domain).trim() && String(domain).toLowerCase() !== 'all') {
    const domainQuery = String(domain).trim().toLowerCase()
    filtered = filtered.filter((item) => item.domain === domainQuery)
  }

  return filtered.slice(0, Number(limit) || 40)
}
