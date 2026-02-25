import { useEffect, useMemo, useState } from 'react'

const DEFAULT_RESUME = {
  name: 'Candidate',
  skills: [],
  education: '',
  certifications: [],
  projects: [],
  experience_years: 0,
  role_target: 'Software Engineer'
}

const JOB_BANK = [
  {
    id: 'ml-1',
    title: 'Machine Learning Engineer',
    company: 'Antal International',
    location: 'Hyderabad',
    salary: 'INR 15-20 LPA',
    exp: '2-5 yrs',
    keywords: ['machine learning', 'python', 'tensorflow', 'nlp', 'deep learning'],
    platform: 'naukri',
    naukriUrl: 'https://www.naukri.com/machine-learning-engineer-jobs-in-hyderabad',
    linkedinUrl:
      'https://www.linkedin.com/jobs/search/?keywords=Machine+Learning+Engineer&location=Hyderabad%2C+Telangana%2C+India',
    glassdoorUrl:
      'https://www.glassdoor.co.in/Job/hyderabad-machine-learning-engineer-jobs-SRCH_IL.0,9_IC2937408_KO10,35.htm'
  },
  {
    id: 'ds-1',
    title: 'Data Scientist (NLP)',
    company: 'Jio Platforms',
    location: 'Mumbai',
    salary: 'INR 12-18 LPA',
    exp: '2-5 yrs',
    keywords: ['data science', 'python', 'nlp', 'sql', 'scikit-learn'],
    platform: 'linkedin',
    naukriUrl: 'https://www.naukri.com/data-scientist-jobs-in-mumbai?k=data+scientist+nlp',
    linkedinUrl:
      'https://www.linkedin.com/jobs/search/?keywords=Data+Scientist+NLP&location=Mumbai%2C+Maharashtra%2C+India',
    glassdoorUrl:
      'https://www.glassdoor.co.in/Job/mumbai-data-scientist-jobs-SRCH_IL.0,6_IC2940912_KO7,21.htm'
  },
  {
    id: 'fs-1',
    title: 'Full Stack Developer',
    company: 'Razorpay',
    location: 'Bengaluru',
    salary: 'INR 16-25 LPA',
    exp: '2-5 yrs',
    keywords: ['react', 'node.js', 'javascript', 'typescript', 'sql'],
    platform: 'naukri',
    naukriUrl:
      'https://www.naukri.com/full-stack-developer-jobs-in-bengaluru-bangalore?k=full+stack+developer',
    linkedinUrl:
      'https://www.linkedin.com/jobs/search/?keywords=Full+Stack+Developer&location=Bengaluru%2C+Karnataka%2C+India',
    glassdoorUrl:
      'https://www.glassdoor.co.in/Job/bengaluru-full-stack-developer-jobs-SRCH_IL.0,9_IC2940587_KO10,30.htm'
  },
  {
    id: 'be-1',
    title: 'Backend Developer',
    company: 'PhonePe',
    location: 'Bengaluru',
    salary: 'INR 14-22 LPA',
    exp: '2-6 yrs',
    keywords: ['node.js', 'express.js', 'mongodb', 'api', 'sql'],
    platform: 'naukri',
    naukriUrl:
      'https://www.naukri.com/backend-developer-jobs-in-bengaluru-bangalore?k=backend+developer',
    linkedinUrl:
      'https://www.linkedin.com/jobs/search/?keywords=Backend+Developer&location=Bengaluru%2C+Karnataka%2C+India',
    glassdoorUrl:
      'https://www.glassdoor.co.in/Job/bengaluru-backend-developer-jobs-SRCH_IL.0,9_IC2940587_KO10,27.htm'
  },
  {
    id: 'devops-1',
    title: 'DevOps Engineer',
    company: 'Infosys',
    location: 'Pune',
    salary: 'INR 11-18 LPA',
    exp: '3-6 yrs',
    keywords: ['aws', 'docker', 'kubernetes', 'ci/cd', 'linux'],
    platform: 'linkedin',
    naukriUrl: 'https://www.naukri.com/devops-engineer-jobs-in-pune',
    linkedinUrl:
      'https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Pune%2C+Maharashtra%2C+India',
    glassdoorUrl:
      'https://www.glassdoor.co.in/Job/pune-devops-engineer-jobs-SRCH_IL.0,4_IC2856202_KO5,21.htm'
  },
  {
    id: 'an-1',
    title: 'Senior Data Analyst',
    company: 'Ola Electric',
    location: 'Bengaluru',
    salary: 'INR 12-18 LPA',
    exp: '3-6 yrs',
    keywords: ['data analysis', 'sql', 'python', 'tableau', 'reporting'],
    platform: 'naukri',
    naukriUrl:
      'https://www.naukri.com/senior-data-analyst-jobs-in-bengaluru-bangalore?k=senior+data+analyst',
    linkedinUrl:
      'https://www.linkedin.com/jobs/search/?keywords=Senior+Data+Analyst&location=Bengaluru%2C+Karnataka%2C+India',
    glassdoorUrl:
      'https://www.glassdoor.co.in/Job/bengaluru-senior-data-analyst-jobs-SRCH_IL.0,9_IC2940587_KO10,29.htm'
  }
]

const PLATFORM_META = {
  naukri: { label: 'Naukri', color: '#f05537' },
  linkedin: { label: 'LinkedIn', color: '#0a66c2' },
  glassdoor: { label: 'Glassdoor', color: '#0f9b57' }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function sanitizeList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

function sanitizeResume(rawResume) {
  const merged = { ...DEFAULT_RESUME, ...(rawResume || {}) }
  const experienceYears = Number(merged.experience_years)

  return {
    ...merged,
    name: String(merged.name || DEFAULT_RESUME.name).trim() || DEFAULT_RESUME.name,
    role_target:
      String(merged.role_target || DEFAULT_RESUME.role_target).trim() || DEFAULT_RESUME.role_target,
    skills: sanitizeList(merged.skills),
    certifications: sanitizeList(merged.certifications),
    projects: sanitizeList(merged.projects),
    education: String(merged.education || '').trim(),
    experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0
  }
}

function computeMatchScore(job, resume) {
  const roleLower = resume.role_target.toLowerCase()
  const resumeSkills = resume.skills.map((item) => item.toLowerCase())
  const certWords = resume.certifications.map((item) => item.toLowerCase())
  const projectWords = resume.projects.map((item) => item.toLowerCase())
  const corpus = `${job.title} ${job.keywords.join(' ')}`.toLowerCase()

  let score = 35

  for (const skill of resumeSkills) {
    if (skill && corpus.includes(skill)) {
      score += 6
    }
  }

  for (const cert of certWords) {
    const short = cert.split(/\s+/)[0]
    if (short && corpus.includes(short)) {
      score += 2
    }
  }

  for (const project of projectWords) {
    const short = project.split(/\s+/)[0]
    if (short && corpus.includes(short)) {
      score += 1
    }
  }

  if (roleLower && corpus.includes(roleLower.split(/\s+/)[0])) {
    score += 8
  }

  score += clamp(resume.experience_years, 0, 8)

  return clamp(Math.round(score), 20, 98)
}

function readiness(score) {
  if (score >= 75) {
    return { label: 'Highly Ready', color: '#00e5a0' }
  }

  if (score >= 50) {
    return { label: 'Moderately Ready', color: '#f5c518' }
  }

  return { label: 'Needs Prep', color: '#ff4e6a' }
}

function buildJobsForResume(resume) {
  return JOB_BANK.map((job) => ({
    ...job,
    matchScore: computeMatchScore(job, resume),
    primaryUrl:
      job.platform === 'linkedin'
        ? job.linkedinUrl
        : job.platform === 'glassdoor'
          ? job.glassdoorUrl
          : job.naukriUrl
  })).sort((left, right) => right.matchScore - left.matchScore)
}

function scoreBand(score) {
  if (score >= 75) {
    return 'high'
  }
  if (score >= 50) {
    return 'mid'
  }
  return 'low'
}

function meterColor(score) {
  if (score >= 75) {
    return '#00e5a0'
  }
  if (score >= 50) {
    return '#f5c518'
  }
  return '#ff4e6a'
}

function MatchMeter({ score }) {
  const color = meterColor(score)

  return (
    <div style={styles.meterWrap}>
      <div style={styles.meterTrack}>
        <div style={{ ...styles.meterFill, width: `${score}%`, backgroundColor: color }} />
      </div>
      <p style={{ ...styles.meterLabel, color }}>{score}% match</p>
    </div>
  )
}

function JobCard({ job }) {
  const status = readiness(job.matchScore)
  const platform = PLATFORM_META[job.platform] || PLATFORM_META.naukri

  return (
    <article style={styles.card}>
      <div style={styles.cardTopRow}>
        <span style={{ ...styles.platformBadge, borderColor: `${platform.color}66`, color: platform.color }}>
          {platform.label}
        </span>
        <span style={styles.scoreBadge}>{job.matchScore}%</span>
      </div>

      <h3 style={styles.cardTitle}>{job.title}</h3>
      <p style={styles.cardCompany}>{job.company}</p>
      <p style={styles.cardMeta}>
        {job.location} | {job.exp}
      </p>
      <p style={styles.cardSalary}>{job.salary}</p>

      <MatchMeter score={job.matchScore} />

      <div style={{ ...styles.readyBadge, color: status.color, borderColor: `${status.color}4d` }}>
        {status.label}
      </div>

      <div style={styles.linkGrid}>
        <a href={job.naukriUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>
          Naukri Apply
        </a>
        <a href={job.linkedinUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>
          LinkedIn Apply
        </a>
        <a href={job.glassdoorUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>
          Glassdoor Apply
        </a>
      </div>

      <a href={job.primaryUrl} target="_blank" rel="noreferrer" style={styles.primaryApply}>
        Apply Now
      </a>
    </article>
  )
}

export default function JobMatchingEngine({ resume = DEFAULT_RESUME }) {
  const normalizedResume = useMemo(() => sanitizeResume(resume), [resume])
  const [jobs, setJobs] = useState([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    setJobs(buildJobsForResume(normalizedResume))
  }, [normalizedResume])

  const filteredJobs = useMemo(() => {
    const term = query.toLowerCase().trim()

    return jobs.filter((job) => {
      const byBand = activeFilter === 'all' ? true : scoreBand(job.matchScore) === activeFilter
      const byQuery =
        term.length === 0
          ? true
          : `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(term)
      return byBand && byQuery
    })
  }, [jobs, query, activeFilter])

  const averageScore =
    jobs.length === 0
      ? 0
      : Math.round(jobs.reduce((sum, item) => sum + item.matchScore, 0) / jobs.length)

  return (
    <section style={styles.root}>
      <style>{globalCss}</style>

      <header style={styles.header}>
        <p style={styles.kicker}>AI JOB MATCHING</p>
        <h2 style={styles.heading}>Matched Opportunities</h2>
        <p style={styles.subheading}>
          Showing role-fit jobs for <strong>{normalizedResume.name}</strong> targeting{' '}
          <strong>{normalizedResume.role_target}</strong>.
        </p>
      </header>

      <div style={styles.summaryRow}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{jobs.length}</span>
          <span style={styles.summaryLabel}>Jobs Found</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{averageScore}%</span>
          <span style={styles.summaryLabel}>Avg Match</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{normalizedResume.experience_years}</span>
          <span style={styles.summaryLabel}>Years Exp</span>
        </div>
      </div>

      <div style={styles.controls}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search role, company, city"
          style={styles.searchInput}
        />
        <div style={styles.filterRow}>
          {[
            ['all', 'All'],
            ['high', '75%+'],
            ['mid', '50-74%'],
            ['low', '<50%']
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              style={{
                ...styles.filterBtn,
                ...(activeFilter === key ? styles.filterBtnActive : {})
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div style={styles.emptyState}>No jobs matched this filter. Try changing search or score band.</div>
      ) : (
        <div style={styles.grid}>
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  )
}

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=DM+Sans:wght@400;500;700&display=swap');
`

const styles = {
  root: {
    width: '100%',
    backgroundColor: '#090d16',
    border: '1px solid #173040',
    borderRadius: '18px',
    padding: '24px',
    color: '#e8ecf3',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)'
  },
  header: {
    marginBottom: '18px'
  },
  kicker: {
    color: '#00e5a0',
    letterSpacing: '0.16em',
    fontSize: '11px',
    fontWeight: 700,
    marginBottom: '8px'
  },
  heading: {
    margin: 0,
    fontSize: 'clamp(24px, 4vw, 32px)',
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1.15
  },
  subheading: {
    marginTop: '8px',
    color: '#9ea9bc',
    lineHeight: 1.6
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginBottom: '16px'
  },
  summaryItem: {
    backgroundColor: '#0f1623',
    border: '1px solid #1a2d40',
    borderRadius: '12px',
    padding: '12px'
  },
  summaryValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 700,
    color: '#00e5a0',
    fontFamily: "'Syne', sans-serif"
  },
  summaryLabel: {
    color: '#8a94a7',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  controls: {
    display: 'grid',
    gap: '10px',
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    border: '1px solid #1d3345',
    borderRadius: '10px',
    backgroundColor: '#0c1420',
    color: '#e8ecf3',
    padding: '11px 12px',
    outline: 'none',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif"
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    border: '1px solid #2a3f4f',
    borderRadius: '999px',
    backgroundColor: '#0d1521',
    color: '#93a2b6',
    padding: '7px 12px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '12px'
  },
  filterBtnActive: {
    color: '#00e5a0',
    borderColor: '#00e5a0',
    backgroundColor: '#00e5a014'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '14px'
  },
  card: {
    backgroundColor: '#0d1521',
    border: '1px solid #1f3243',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  platformBadge: {
    fontSize: '11px',
    border: '1px solid',
    borderRadius: '999px',
    padding: '4px 8px'
  },
  scoreBadge: {
    color: '#00e5a0',
    fontWeight: 700,
    fontSize: '14px'
  },
  cardTitle: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: '18px',
    lineHeight: 1.2
  },
  cardCompany: {
    margin: 0,
    color: '#d1d7e2',
    fontWeight: 500
  },
  cardMeta: {
    margin: 0,
    color: '#94a0b4',
    fontSize: '13px'
  },
  cardSalary: {
    margin: 0,
    color: '#00e5a0',
    fontSize: '13px'
  },
  meterWrap: {
    marginTop: '2px'
  },
  meterTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#1f3344',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  meterFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.35s ease'
  },
  meterLabel: {
    margin: '5px 0 0',
    fontSize: '12px',
    fontWeight: 700
  },
  readyBadge: {
    alignSelf: 'flex-start',
    border: '1px solid',
    borderRadius: '999px',
    padding: '4px 9px',
    fontSize: '11px',
    fontWeight: 700
  },
  linkGrid: {
    marginTop: '4px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '6px'
  },
  linkBtn: {
    border: '1px solid #2c4152',
    borderRadius: '8px',
    backgroundColor: '#0a111b',
    color: '#9eb0c4',
    fontSize: '11px',
    textAlign: 'center',
    textDecoration: 'none',
    padding: '7px 6px'
  },
  primaryApply: {
    marginTop: '6px',
    textAlign: 'center',
    borderRadius: '9px',
    background: 'linear-gradient(90deg, #00e5a0, #00b4d8)',
    color: '#041017',
    textDecoration: 'none',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    padding: '10px 10px'
  },
  emptyState: {
    border: '1px dashed #2b4153',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#92a2b7',
    padding: '24px'
  }
}
