/**
 * Target-Qualification Scoring Engine for Backend Node.js
 * Evaluates candidate leads, discards public figures & oversized founders,
 * and prioritizes real hiring managers & talent acquisition partners.
 */

const PUBLIC_FIGURE_DENYLIST = new Set([
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

function parseCompanySize(size) {
  if (typeof size === 'number') return size
  if (!size) return 250

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

export function qualifyContact(
  candidate,
  userProfile = { targetRole: 'Software & ML Engineer', targetDomain: 'Technology' },
  threshold = 60
) {
  const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim().toLowerCase() ||
                   (candidate.name || '').toLowerCase()
  const title = (candidate.jobTitle || candidate.headline || candidate.role || '').toLowerCase()
  const company = (candidate.companyName || candidate.company || '').toLowerCase()
  const industry = (candidate.companyIndustry || candidate.industry || '').toLowerCase()
  const targetRoleLower = (userProfile.targetRole || 'software engineer').toLowerCase()

  const badges = []
  let roleScore = 0
  let companySizeScore = 0
  let domainRelevanceScore = 0
  let activeHiringScore = 0

  // 1. PUBLIC FIGURE & CELEBRITY EXCLUSION
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

  // Mass follower heuristic
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

  // 2. UNRELATED ROLE REJECTION
  for (const unrelated of UNRELATED_ROLES_DENYLIST) {
    if (title.includes(unrelated)) {
      return {
        score: 15,
        qualified: false,
        verdict: 'Disqualified',
        reasoning: `Unrelated business function (${candidate.jobTitle || candidate.role}) without hiring authority for engineering`,
        disqualificationReason: 'UNRELATED_DEPARTMENT',
        breakdown: { roleScore: 0, companySizeScore: 0, domainRelevanceScore: 0, activeHiringScore: 0 },
        badges: ['🚫 Unrelated Function']
      }
    }
  }

  // 3. ROLE MATCH & COMPANY SIZE GUARDRAIL
  const isRecruiter = RECRUITER_KEYWORDS.some((kw) => title.includes(kw))
  const isHiringManager = HIRING_MANAGER_KEYWORDS.some((kw) => title.includes(kw))
  const isFounder = FOUNDER_KEYWORDS.some((kw) => title.includes(kw))
  const employeeCount = parseCompanySize(candidate.companySize)

  if (isFounder) {
    if (employeeCount > 800) {
      console.log(`[Disqualified: Oversized Founder] Founder at company with ${employeeCount} employees.`)
      return {
        score: 20,
        qualified: false,
        verdict: 'Disqualified',
        reasoning: `Founder at enterprise (${employeeCount}+ employees) — outreach will be ignored as spam`,
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
    companySizeScore = 15
    badges.push('🎯 Talent Acquisition / HR')
  } else if (isHiringManager) {
    roleScore = 24
    companySizeScore = 14
    badges.push('🛠️ Engineering Hiring Manager')
  } else {
    roleScore = 10
    companySizeScore = 8
  }

  // 4. DOMAIN & TECH ALIGNMENT
  const techKeywords = ['software', 'technology', 'tech', 'internet', 'ai', 'machine learning', 'saas', 'data', 'cloud', 'fintech']
  const isTechDomain = techKeywords.some((kw) => industry.includes(kw) || company.includes(kw) || title.includes(kw))

  if (isTechDomain) {
    domainRelevanceScore += 18
    badges.push('💻 Tech Domain')
  }

  if (
    (targetRoleLower.includes('ml') || targetRoleLower.includes('ai')) &&
    (title.includes('ml') || title.includes('ai') || title.includes('data'))
  ) {
    domainRelevanceScore += 7
    badges.push('🧠 AI/ML Alignment')
  } else if (
    (targetRoleLower.includes('software') || targetRoleLower.includes('full stack') || targetRoleLower.includes('engineer')) &&
    (title.includes('software') || title.includes('engineer') || title.includes('tech') || isRecruiter)
  ) {
    domainRelevanceScore += 7
    badges.push('⚡ Engineering Alignment')
  }

  // 5. ACTIVE HIRING SIGNAL
  const hiringIndicators = ['hiring', "we're hiring", 'growing team', 'building team', 'looking for engineers', 'open roles']
  const hasHiringSignal = candidate.isHiring || hiringIndicators.some((kw) => title.includes(kw) || (candidate.headline || '').toLowerCase().includes(kw))

  if (hasHiringSignal) {
    activeHiringScore = 35
    badges.push('🔥 Active Hiring Signal')
  } else if (isRecruiter) {
    activeHiringScore = 28
    badges.push('📋 Active Talent Pipeline')
  } else if (isHiringManager) {
    activeHiringScore = 22
  } else {
    activeHiringScore = 10
  }

  const totalScore = Math.min(100, Math.max(0, roleScore + companySizeScore + domainRelevanceScore + activeHiringScore))
  const isQualified = totalScore >= threshold

  let verdict = 'Moderate Match'
  let reasoning = ''

  if (totalScore >= 85) {
    verdict = 'Excellent Match'
    reasoning = `Top-tier outreach target: ${isRecruiter ? 'Active Technical Recruiter' : 'Hiring Leader'} with high ${userProfile.targetRole} relevance`
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

export function filterAndRankCandidates(candidates, userProfile, minThreshold = 60) {
  return candidates
    .map((cand) => {
      const qualification = qualifyContact(cand, userProfile, minThreshold)
      return {
        ...cand,
        qualification
      }
    })
    .filter((c) => c.qualification.qualified)
    .sort((a, b) => b.qualification.score - a.qualification.score)
}
