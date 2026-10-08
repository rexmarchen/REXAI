/**
 * Target-Qualification Scoring Engine for Cold Outreach & LinkedIn Automation
 * Scores candidates 0-100 based on weighted criteria, filters out public figures,
 * and prioritizes active hiring managers matching user's resume tech field.
 */

export interface CandidateRawData {
  id?: string
  firstName?: string
  lastName?: string
  name?: string
  jobTitle?: string
  headline?: string
  companyName?: string
  companySize?: number | string
  companyIndustry?: string
  followerCount?: number
  isInfluencer?: boolean
  isOpenToWork?: boolean
  isHiring?: boolean
  location?: string
  linkedinUrl?: string
  email?: string
}

export interface UserResumeProfile {
  targetRole?: string // e.g. "Software Engineer", "ML Engineer", "Full Stack Developer"
  targetDomain?: string // e.g. "Artificial Intelligence", "Web Development", "Fintech", "SaaS"
  skills?: string[] // e.g. ["React", "Node.js", "Python", "PyTorch", "TypeScript"]
  preferredCompanySizes?: string[]
}

export interface QualificationResult {
  score: number // 0 - 100
  qualified: boolean // score >= threshold && !disqualified
  verdict: 'Excellent Match' | 'Strong Match' | 'Moderate Match' | 'Weak Match' | 'Disqualified'
  reasoning: string
  disqualificationReason?: string
  breakdown: {
    roleScore: number // max 25
    companySizeScore: number // max 15
    domainRelevanceScore: number // max 25
    activeHiringScore: number // max 35
  }
  badges: string[]
}

// Well-known public figures and billionaire executives who are not realistic cold-DM hiring targets
const PUBLIC_FIGURE_DENYLIST: Set<string> = new Set([
  'bill gates',
  'elon musk',
  'satya nadella',
  'sundar pichai',
  'tim cook',
  'mark zuckerberg',
  'jeff bezos',
  'sam altman',
  'jensen huang',
  'larry page',
  'sergey brin',
  'warren buffett',
  'larry ellison',
  'reed hastings',
  'marc benioff',
  'andy jassy',
  'brian chesky',
  'dara khosrowshahi',
  'jack dorsey',
  'shantanu narayen',
  'arvind krishna'
])

// Target HR and Hiring Titles
const RECRUITER_KEYWORDS = [
  'talent acquisition',
  'technical recruiter',
  'tech recruiter',
  'recruiter',
  'recruitment',
  'people ops',
  'people operations',
  'hr manager',
  'human resources',
  'talent partner',
  'talent lead',
  'hiring'
]

const HIRING_MANAGER_KEYWORDS = [
  'engineering manager',
  'tech lead',
  'head of engineering',
  'vp engineering',
  'vp of engineering',
  'director of engineering',
  'engineering director',
  'lead software engineer',
  'principal engineer',
  'staff engineer',
  'team lead',
  'cto',
  'chief technology officer'
]

const FOUNDER_KEYWORDS = [
  'founder',
  'co-founder',
  'cofounder',
  'ceo',
  'chief executive officer'
]

const UNRELATED_ROLES_DENYLIST = [
  'sales executive',
  'account executive',
  'sales development',
  'accountant',
  'financial analyst',
  'legal counsel',
  'customer support',
  'cashier',
  'marketing intern'
]

/**
 * Normalizes company size string/number to numeric employee count
 */
function parseCompanySize(size?: number | string): number {
  if (typeof size === 'number') return size
  if (!size) return 250 // Default assumed mid-size if unspecified

  const str = String(size).toLowerCase().trim()
  if (str.includes('1-10') || str.includes('1-50')) return 25
  if (str.includes('51-200')) return 120
  if (str.includes('201-500')) return 350
  if (str.includes('501-1000')) return 750
  if (str.includes('1001-5000') || str.includes('1,001-5,000')) return 2500
  if (str.includes('5001-10000') || str.includes('10000+') || str.includes('10,000+')) return 15000

  const numericMatch = str.match(/\d+/)
  return numericMatch ? parseInt(numericMatch[0], 10) : 250
}

/**
 * Evaluates and scores a contact for LinkedIn outreach relevance
 */
export function qualifyContact(
  candidate: CandidateRawData,
  userProfile: UserResumeProfile = { targetRole: 'Software & ML Engineer', targetDomain: 'Technology' },
  threshold: number = 60
): QualificationResult {
  const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim().toLowerCase() ||
                   (candidate.name || '').toLowerCase()
  const title = (candidate.jobTitle || candidate.headline || '').toLowerCase()
  const company = (candidate.companyName || '').toLowerCase()
  const industry = (candidate.companyIndustry || '').toLowerCase()
  const targetRoleLower = (userProfile.targetRole || 'software engineer').toLowerCase()
  const targetDomainLower = (userProfile.targetDomain || 'technology').toLowerCase()

  const badges: string[] = []
  let roleScore = 0
  let companySizeScore = 0
  let domainRelevanceScore = 0
  let activeHiringScore = 0

  // -------------------------------------------------------------
  // 1. PUBLIC FIGURE & CELEBRITY EXCLUSION (Instant Disqualification)
  // -------------------------------------------------------------
  for (const deniedName of PUBLIC_FIGURE_DENYLIST) {
    if (fullName.includes(deniedName)) {
      console.log(`[Disqualified: Public Figure] Candidate "${fullName}" is in public figure denylist.`)
      return {
        score: 0,
        qualified: false,
        verdict: 'Disqualified',
        reasoning: 'Widely recognized executive / public figure — not a realistic direct cold outreach candidate',
        disqualificationReason: 'PUBLIC_FIGURE_DENYLIST',
        breakdown: { roleScore: 0, companySizeScore: 0, domainRelevanceScore: 0, activeHiringScore: 0 },
        badges: ['🚫 Public Figure']
      }
    }
  }

  // Follower count heuristic (50k+ followers or platform influencer flag indicates media personality)
  if ((candidate.followerCount && candidate.followerCount >= 50000) || candidate.isInfluencer) {
    console.log(`[Disqualified: Mass Follower Count] Candidate "${fullName}" has ${candidate.followerCount} followers.`)
    return {
      score: 10,
      qualified: false,
      verdict: 'Disqualified',
      reasoning: 'High-follower public personality (50k+ followers) — extremely low response rate to job outreach',
      disqualificationReason: 'HIGH_FOLLOWER_PUBLIC_FIGURE',
      breakdown: { roleScore: 0, companySizeScore: 0, domainRelevanceScore: 0, activeHiringScore: 0 },
      badges: ['🚫 High Follower Count']
    }
  }

  // -------------------------------------------------------------
  // 2. UNRELATED ROLE REJECTION
  // -------------------------------------------------------------
  for (const unrelated of UNRELATED_ROLES_DENYLIST) {
    if (title.includes(unrelated)) {
      return {
        score: 15,
        qualified: false,
        verdict: 'Disqualified',
        reasoning: `Unrelated business function (${candidate.jobTitle}) without hiring authority for engineering/product`,
        disqualificationReason: 'UNRELATED_DEPARTMENT',
        breakdown: { roleScore: 0, companySizeScore: 0, domainRelevanceScore: 0, activeHiringScore: 0 },
        badges: ['🚫 Unrelated Function']
      }
    }
  }

  // -------------------------------------------------------------
  // 3. ROLE MATCH & SIZING EVALUATION (max 25 pts)
  // -------------------------------------------------------------
  const isRecruiter = RECRUITER_KEYWORDS.some((kw) => title.includes(kw))
  const isHiringManager = HIRING_MANAGER_KEYWORDS.some((kw) => title.includes(kw))
  const isFounder = FOUNDER_KEYWORDS.some((kw) => title.includes(kw))
  const employeeCount = parseCompanySize(candidate.companySize)

  if (isFounder) {
    // Founder Guardrail: Only at small-to-mid companies (< 750 employees)
    if (employeeCount > 800) {
      console.log(`[Disqualified: Oversized Founder] Founder at company with ${employeeCount} employees.`)
      return {
        score: 20,
        qualified: false,
        verdict: 'Disqualified',
        reasoning: `Founder at large enterprise (${employeeCount}+ employees) — outreach will be ignored as spam`,
        disqualificationReason: 'OVERSIZED_COMPANY_FOUNDER',
        breakdown: { roleScore: 5, companySizeScore: 0, domainRelevanceScore: 0, activeHiringScore: 0 },
        badges: ['🚫 Enterprise Founder']
      }
    } else {
      roleScore = 22
      companySizeScore = 15
      badges.push('👑 Startup Founder / CEO')
    }
  } else if (isRecruiter) {
    roleScore = 25
    companySizeScore = 15 // Recruiter works at any company size
    badges.push('🎯 Talent Acquisition / HR')
  } else if (isHiringManager) {
    roleScore = 24
    companySizeScore = 14
    badges.push('🛠️ Engineering Hiring Manager')
  } else {
    // General match
    roleScore = 10
    companySizeScore = 8
  }

  // -------------------------------------------------------------
  // 4. DOMAIN & RESUME TECH ALIGNMENT (max 25 pts)
  // -------------------------------------------------------------
  const techKeywords = ['software', 'technology', 'tech', 'internet', 'ai', 'machine learning', 'saas', 'data', 'cloud', 'fintech']
  const isTechDomain = techKeywords.some((kw) => industry.includes(kw) || company.includes(kw) || title.includes(kw))

  if (isTechDomain) {
    domainRelevanceScore += 18
    badges.push('💻 Tech Domain')
  }

  // Check specific match against user's resume target role
  if (
    (targetRoleLower.includes('ml') || targetRoleLower.includes('machine learning') || targetRoleLower.includes('ai')) &&
    (title.includes('ml') || title.includes('ai') || title.includes('data') || company.includes('ai'))
  ) {
    domainRelevanceScore += 7
    badges.push('🧠 AI/ML Alignment')
  } else if (
    (targetRoleLower.includes('software') || targetRoleLower.includes('full stack') || targetRoleLower.includes('frontend') || targetRoleLower.includes('backend')) &&
    (title.includes('software') || title.includes('engineering') || title.includes('tech') || isRecruiter)
  ) {
    domainRelevanceScore += 7
    badges.push('⚡ Engineering Alignment')
  }

  // -------------------------------------------------------------
  // 5. ACTIVE HIRING SIGNAL (max 35 pts — Strongest Weight)
  // -------------------------------------------------------------
  const hiringIndicators = ['hiring', "we're hiring", 'growing team', 'building team', 'looking for engineers', 'open roles']
  const hasHiringSignal = candidate.isHiring || hiringIndicators.some((kw) => title.includes(kw) || (candidate.headline || '').toLowerCase().includes(kw))

  if (hasHiringSignal) {
    activeHiringScore = 35
    badges.push('🔥 Active Hiring Signal')
  } else if (isRecruiter) {
    activeHiringScore = 28 // Recruiters by definition have active open requisition queues
    badges.push('📋 Active Talent Pipeline')
  } else if (isHiringManager) {
    activeHiringScore = 22
  } else {
    activeHiringScore = 10
  }

  // Compute Total Weighted Score
  const totalScore = Math.min(100, Math.max(0, roleScore + companySizeScore + domainRelevanceScore + activeHiringScore))
  const isQualified = totalScore >= threshold

  let verdict: QualificationResult['verdict'] = 'Moderate Match'
  let reasoning = ''

  if (totalScore >= 85) {
    verdict = 'Excellent Match'
    reasoning = `Top-tier outreach target: ${isRecruiter ? 'Active Technical Recruiter' : 'Hiring Leader'} with strong ${userProfile.targetRole} relevance`
  } else if (totalScore >= 70) {
    verdict = 'Strong Match'
    reasoning = `Strong fit: ${isRecruiter ? 'Talent Acquisition Partner' : 'Engineering Manager'} in relevant tech domain`
  } else if (totalScore >= 60) {
    verdict = 'Moderate Match'
    reasoning = 'Qualified target: Role and company align with safe outreach parameters'
  } else {
    verdict = 'Weak Match'
    reasoning = 'Low outreach priority: Limited hiring signals or role alignment'
  }

  return {
    score: totalScore,
    qualified: isQualified,
    verdict,
    reasoning,
    breakdown: {
      roleScore,
      companySizeScore,
      domainRelevanceScore,
      activeHiringScore
    },
    badges
  }
}

/**
 * Filter and sort list of candidate leads
 */
export function filterAndRankCandidates(
  candidates: CandidateRawData[],
  userProfile?: UserResumeProfile,
  minThreshold: number = 60
): Array<CandidateRawData & { qualification: QualificationResult }> {
  const scoredList = candidates.map((cand) => {
    const qualification = qualifyContact(cand, userProfile, minThreshold)
    return {
      ...cand,
      qualification
    }
  })

  // Filter only qualified leads and sort descending by score
  return scoredList
    .filter((item) => item.qualification.qualified)
    .sort((a, b) => b.qualification.score - a.qualification.score)
}
