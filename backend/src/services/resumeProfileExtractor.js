const KNOWN_SKILLS = [
  ['Python', ['python', 'python programming', 'python3']],
  ['Generative AI', ['generative ai', 'genai', 'gen ai', 'llm', 'llms', 'prompt engineering']],
  ['Machine Learning', ['machine learning', 'ml']],
  ['Artificial Intelligence', ['artificial intelligence', 'ai engineer', 'ai & machine learning']],
  ['AI Chatbots', ['ai chatbots', 'chatbot', 'chatbots', 'bot integration']],
  ['C Programming', ['c programming', 'c language', 'c coder']],
  ['C++', ['c++', 'cpp']],
  ['Java', ['java', 'core java']],
  ['Android Studio', ['android studio', 'android development']],
  ['Data Structures', ['data structures', 'dsa']],
  ['Algorithms', ['algorithms']],
  ['No-Code Tools', ['no code', 'no-code', 'no code tools']],
  ['CRUD Operations', ['crud operations', 'crud']],
  ['JavaScript', ['javascript', 'js']],
  ['TypeScript', ['typescript', 'ts']],
  ['React', ['react', 'react.js', 'reactjs']],
  ['Next.js', ['next.js', 'nextjs', 'next js']],
  ['Node.js', ['node', 'nodejs', 'node.js']],
  ['Express.js', ['express', 'expressjs', 'express.js']],
  ['FastAPI', ['fastapi', 'fast api']],
  ['Django', ['django']],
  ['PostgreSQL', ['postgresql', 'postgres']],
  ['SQL', ['sql', 'mysql', 'sqlite']],
  ['MongoDB', ['mongodb', 'mongo']],
  ['HTML', ['html', 'html5']],
  ['CSS', ['css', 'css3']],
  ['AWS', ['aws', 'amazon web services']],
  ['Docker', ['docker']],
  ['Kubernetes', ['kubernetes', 'k8s']],
  ['Git', ['git', 'github']],
  ['Deep Learning', ['deep learning', 'neural networks']],
  ['TensorFlow', ['tensorflow']],
  ['PyTorch', ['pytorch']],
  ['NLP', ['nlp', 'natural language processing']],
  ['Data Analysis', ['data analysis', 'analytics']],
  ['Scikit-learn', ['scikit-learn', 'sklearn']],
  ['Pandas', ['pandas']],
  ['NumPy', ['numpy']],
  ['REST APIs', ['rest api', 'restful', 'apis']]
]

const SECTION_ALIASES = {
  skills: ['skills', 'technical skills', 'core skills', 'technologies', 'competencies'],
  education: ['education', 'academic', 'academics', 'qualification', 'qualifications'],
  certifications: ['certification', 'certifications', 'licenses', 'license'],
  projects: ['project', 'projects', 'key projects', 'personal projects'],
  experience: ['experience', 'work experience', 'professional experience', 'employment']
}

const EXPERIENCE_REGEX = /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/gi
const EXPERIENCE_RANGE_REGEX = /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/gi

const SECTION_BREAKERS = new Set(
  Object.values(SECTION_ALIASES).flat().map((value) => value.toLowerCase())
)

const PREDICTED_ROLE_RULES = [
  {
    role: 'Machine Learning Engineer',
    skills: ['machine learning', 'tensorflow', 'pytorch', 'nlp', 'deep learning', 'scikit-learn']
  },
  {
    role: 'Data Scientist',
    skills: ['data analysis', 'sql', 'pandas', 'numpy', 'power bi', 'tableau']
  },
  {
    role: 'Full Stack Developer',
    skills: ['react', 'node.js', 'javascript', 'typescript', 'html', 'css']
  },
  {
    role: 'Backend Developer',
    skills: ['node.js', 'express.js', 'java', 'sql', 'mongodb', 'rest apis']
  },
  {
    role: 'DevOps Engineer',
    skills: ['aws', 'docker', 'kubernetes', 'git']
  }
]

function normalizeText(rawText) {
  return String(rawText || '')
    .replace(/\u0000/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toDecodableText(resumeData) {
  if (typeof resumeData === 'string') {
    return resumeData
  }

  const utf8 = String(resumeData?.toString('utf8') || '')
  const latin = String(resumeData?.toString('latin1') || '')
  const utf8Score = normalizeText(utf8).length
  const latinScore = normalizeText(latin).length
  return utf8Score >= latinScore ? utf8 : latin
}

function normalizeLine(line) {
  return String(line || '')
    .replace(/^[\s*.,;:|/\\()[\]{}<>-]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitLines(resumeData) {
  const text = toDecodableText(resumeData).replace(/\r/g, '\n')
  const rawLines = text.split('\n').map(normalizeLine).filter(Boolean)

  if (rawLines.length > 0) {
    return rawLines
  }

  return normalizeText(text)
    .split(/[.;]/)
    .map(normalizeLine)
    .filter(Boolean)
}

function sanitizeHeader(line) {
  return normalizeLine(line).toLowerCase().replace(/[:\s]+$/g, '')
}

function findSectionIndex(lines, aliases) {
  const aliasSet = new Set(aliases.map((value) => value.toLowerCase()))

  for (let index = 0; index < lines.length; index += 1) {
    const cleaned = sanitizeHeader(lines[index])
    if (aliasSet.has(cleaned)) {
      return index
    }
  }

  return -1
}

function findNextSectionIndex(lines, fromIndex) {
  for (let index = fromIndex + 1; index < lines.length; index += 1) {
    const cleaned = sanitizeHeader(lines[index])
    if (SECTION_BREAKERS.has(cleaned)) {
      return index
    }
  }

  return lines.length
}

function extractSectionLines(lines, sectionName, maxItems = 8) {
  const aliases = SECTION_ALIASES[sectionName] || []
  const sectionIndex = findSectionIndex(lines, aliases)
  if (sectionIndex === -1) {
    return []
  }

  const endIndex = findNextSectionIndex(lines, sectionIndex)
  const rows = []
  for (let index = sectionIndex + 1; index < endIndex; index += 1) {
    const item = normalizeLine(lines[index])
    if (item) {
      rows.push(item)
    }
    if (rows.length >= maxItems) {
      break
    }
  }

  return rows
}

function tokenizeSkills(skillsLines) {
  const tokens = []
  const invalidSkillRegex = /\b(learned|how to|integrate|use of|school|technology|university|bangalore|karnataka|punjab|himachal|experience|intern|b\.tech|pursuing|college)\b/i

  for (const line of skillsLines) {
    const parts = String(line)
      .split(/[,|/;]+/)
      .map((part) => normalizeLine(part).replace(/[•*]/g, '').trim())
      .filter(Boolean)

    for (const part of parts) {
      if (part.length < 2 || part.length > 30 || invalidSkillRegex.test(part)) {
        continue
      }
      tokens.push(part)
    }
  }

  return tokens
}

function findKnownSkills(normalizedLowerText) {
  const result = []

  for (const [label, aliases] of KNOWN_SKILLS) {
    const found = aliases.some((alias) => normalizedLowerText.includes(alias.toLowerCase()))
    if (found) {
      result.push(label)
    }
  }

  return result
}

function uniqList(values, maxItems = 20) {
  const map = new Map()
  for (const value of values) {
    const clean = normalizeLine(value)
    if (!clean) {
      continue
    }
    const key = clean.toLowerCase()
    if (!map.has(key)) {
      map.set(key, clean)
    }
    if (map.size >= maxItems) {
      break
    }
  }
  return Array.from(map.values())
}

const SECTION_BLOCKED_WORDS = new Set([
  'resume', 'curriculum vitae', 'cv', 'profile', 'summary', 'professional summary',
  'objective', 'career objective', 'skills', 'technical skills', 'core skills',
  'education', 'academics', 'academic background', 'experience', 'work experience',
  'professional experience', 'employment', 'employment history', 'career history',
  'projects', 'key projects', 'certifications', 'certification', 'licenses',
  'contact', 'contact info', 'contact information', 'languages', 'hobbies',
  'interests', 'declaration', 'references', 'about me'
])

function pickName(lines, rawText = '') {
  const textStr = String(rawText || lines.join(' '))
  const emailMatch = textStr.match(/([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const emailPrefix = emailMatch ? emailMatch[1].toLowerCase().replace(/[\d._%+-]+/g, '') : ''
  const linkedinMatch = textStr.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i)
  const linkedinSlug = linkedinMatch ? linkedinMatch[1].toLowerCase().replace(/-\w+/g, '') : ''

  const topLines = lines.slice(0, 15)

  // 1. Check if any top line strongly matches email username or linkedin handle
  for (const line of topLines) {
    const value = normalizeLine(line).replace(/[•*|]/g, '').trim()
    const lower = value.toLowerCase()
    if (!value || value.length < 2 || value.length > 35) continue
    if (SECTION_BLOCKED_WORDS.has(lower)) continue
    if (/\b(experience|education|skills|contact|profile|university|college|school|intern|engineer|developer|pursuing|graduate)\b/i.test(lower)) continue

    if (emailPrefix.length >= 3 && (lower === emailPrefix || lower.startsWith(emailPrefix) || emailPrefix.startsWith(lower))) {
      return value.split(/\s+/).slice(0, 3).join(' ')
    }
    if (linkedinSlug.length >= 3 && (lower === linkedinSlug || lower.startsWith(linkedinSlug) || linkedinSlug.startsWith(lower))) {
      return value.split(/\s+/).slice(0, 3).join(' ')
    }
  }

  // 2. First prominent non-header title line (1-3 words, purely alphabetic)
  for (const line of topLines) {
    const value = normalizeLine(line).replace(/[•*|]/g, '').trim()
    const lower = value.toLowerCase()
    const words = value.split(/\s+/)

    if (
      !value ||
      value.length < 2 ||
      value.length > 35 ||
      /\d/.test(value) ||
      /[@:/\\]/.test(value) ||
      words.length < 1 ||
      words.length > 3 ||
      SECTION_BLOCKED_WORDS.has(lower) ||
      /\b(experience|education|skills|contact|profile|university|college|school|intern|engineer|developer|pursuing|graduate|management|system|project|innovator|masterclass|technologies|bangalore|karnataka|punjab|himachal)\b/i.test(lower)
    ) {
      continue
    }

    const alphaWords = words.every((word) => /^[A-Za-z.'-]+$/.test(word))
    if (!alphaWords) continue

    return value
  }

  return ''
}

function pickEducation(lines) {
  const educationPattern =
    /\b(b\.?\s?tech|bachelor|master|m\.?\s?tech|phd|mba|b\.?\s?e\.?|m\.?\s?e\.?|bca|mca|university|college|institute)\b/i

  for (const line of lines) {
    if (educationPattern.test(line)) {
      return normalizeLine(line)
    }
  }

  const educationSection = extractSectionLines(lines, 'education', 3)
  return educationSection[0] || ''
}

function pickCertifications(lines) {
  const sectionItems = extractSectionLines(lines, 'certifications', 8)
  if (sectionItems.length > 0) {
    return uniqList(sectionItems, 8)
  }

  const fallback = lines
    .filter((line) => /\b(certified|certification|certificate)\b/i.test(line))
    .slice(0, 8)

  return uniqList(fallback, 8)
}

function pickProjects(lines) {
  const sectionItems = extractSectionLines(lines, 'projects', 8)
  if (sectionItems.length > 0) {
    return uniqList(sectionItems, 8)
  }

  const fallback = lines
    .filter((line) => /\b(project|built|developed|designed|implemented)\b/i.test(line))
    .slice(0, 8)

  return uniqList(fallback, 8)
}

function pickExperienceYears(normalizedLowerText) {
  let maxYears = 0

  for (const match of normalizedLowerText.matchAll(EXPERIENCE_REGEX)) {
    const years = Number.parseFloat(match[1])
    if (Number.isFinite(years)) {
      maxYears = Math.max(maxYears, years)
    }
  }

  for (const match of normalizedLowerText.matchAll(EXPERIENCE_RANGE_REGEX)) {
    const rangeHigh = Number.parseFloat(match[2])
    if (Number.isFinite(rangeHigh)) {
      maxYears = Math.max(maxYears, rangeHigh)
    }
  }

  return Math.max(0, Math.round(maxYears))
}

function pickPredictedRole(skills) {
  const normalizedSkills = new Set(skills.map((item) => item.toLowerCase()))

  let bestRole = 'Software Engineer'
  let bestScore = 0

  for (const rule of PREDICTED_ROLE_RULES) {
    let score = 0
    for (const keyword of rule.skills) {
      if (normalizedSkills.has(keyword)) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestRole = rule.role
    }
  }

  return bestRole
}

export function extractResumeProfile(resumeData) {
  const lines = splitLines(resumeData)
  const normalizedLowerText = normalizeText(lines.join(' ')).toLowerCase()
  const skillSectionItems = tokenizeSkills(extractSectionLines(lines, 'skills', 12))
  const knownSkills = findKnownSkills(normalizedLowerText)
  const mergedSkills = uniqList([...skillSectionItems, ...knownSkills], 20)

  return {
    name: pickName(lines, normalizedLowerText),
    skills: mergedSkills,
    education: pickEducation(lines),
    certifications: pickCertifications(lines),
    projects: pickProjects(lines),
    experience_years: pickExperienceYears(normalizedLowerText),
    predicted_role: pickPredictedRole(mergedSkills)
  }
}
