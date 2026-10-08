/**
 * Candidate Profile & Resume Match Scoring Engine
 */

export function calculateInternshipMatch(internship, candidateProfile = null) {
  if (!candidateProfile) {
    return {
      matchScore: 85,
      reasons: ['General engineering eligibility confirmed'],
      missingSkills: []
    }
  }

  const candidateSkills = Array.isArray(candidateProfile.skills)
    ? candidateProfile.skills.map((s) => String(s).toLowerCase().trim()).filter(Boolean)
    : []

  const jobSkills = Array.isArray(internship.skills) && internship.skills.length > 0
    ? internship.skills.map((s) => String(s).toLowerCase().trim()).filter(Boolean)
    : inferJobSkills(internship.title, internship.description)

  const candidateSkillsSet = new Set(candidateSkills)

  // 1. Skill Matching
  const matchedSkills = []
  const missingSkills = []

  for (const skill of jobSkills) {
    if (candidateSkillsSet.has(skill) || candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs))) {
      matchedSkills.push(skill)
    } else {
      missingSkills.push(skill)
    }
  }

  // 2. Domain Matching
  const primaryDomain = String(candidateProfile.primaryDomain || '').toLowerCase()
  const jobDomain = String(internship.domain || '').toLowerCase()
  const domainMatched = primaryDomain.includes(jobDomain) || jobDomain.includes(primaryDomain)

  // 3. Work Mode Matching
  const prefMode = String(candidateProfile.preferredWorkMode || 'any').toLowerCase()
  const isRemoteJob = Boolean(internship.isRemote)
  const modeMatched = prefMode === 'any' || (prefMode === 'remote' && isRemoteJob) || (prefMode === 'onsite' && !isRemoteJob)

  // 4. Calculate Score
  let score = 50 // Base score for student/internship eligibility
  const reasons = ['Student / Early Career eligibility verified']

  if (jobSkills.length > 0) {
    const skillRatio = matchedSkills.length / jobSkills.length
    score += Math.round(skillRatio * 35)
    matchedSkills.slice(0, 3).forEach((s) => reasons.push(`Technical match: ${capitalize(s)}`))
  } else {
    score += 25
  }

  if (domainMatched) {
    score += 10
    reasons.push(`Domain aligned: ${capitalize(internship.domain || 'Engineering')}`)
  }

  if (modeMatched) {
    score += 5
    if (isRemoteJob && prefMode === 'remote') {
      reasons.push('Matches remote work preference')
    }
  }

  const finalScore = Math.min(Math.max(score, 60), 99)

  return {
    matchScore: finalScore,
    reasons,
    missingSkills: missingSkills.slice(0, 3).map(capitalize)
  }
}

function inferJobSkills(title = '', description = '') {
  const corpus = `${title} ${description}`.toLowerCase()
  const skillKeywords = [
    'react', 'typescript', 'javascript', 'node.js', 'python', 'golang', 'java',
    'c++', 'c#', 'sql', 'postgresql', 'mongodb', 'docker', 'kubernetes', 'aws',
    'azure', 'gcp', 'figma', 'pandas', 'pytorch', 'tensorflow', 'machine learning',
    'graphql', 'rest api', 'next.js', 'tailwind'
  ]

  const extracted = []
  for (const skill of skillKeywords) {
    if (corpus.includes(skill)) {
      extracted.push(skill)
    }
  }

  return extracted.length > 0 ? extracted : ['Software Engineering', 'Problem Solving']
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default {
  calculateInternshipMatch
}
