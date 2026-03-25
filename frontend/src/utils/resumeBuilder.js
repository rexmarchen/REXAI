const SECTION_LIBRARY = [
  {
    id: 'summary',
    label: 'Summary',
    description: 'Your positioning statement and career value.',
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Core tools, platforms, and capabilities.',
  },
  {
    id: 'experience',
    label: 'Experience',
    description: 'Work history with measurable achievements.',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Academic background and credentials.',
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Portfolio work, case studies, or side builds.',
  },
  {
    id: 'certifications',
    label: 'Certifications',
    description: 'Industry credentials and licenses.',
  },
]

export const SECTION_LABELS = SECTION_LIBRARY.reduce((accumulator, section) => {
  accumulator[section.id] = section.label
  return accumulator
}, {})

export const RESUME_SECTION_LIBRARY = SECTION_LIBRARY

export const RESUME_STEPS = [
  {
    id: 'personal',
    title: 'Personal Info',
    eyebrow: 'Step 1',
    description: 'Set the core identity and contact details recruiters will see first.',
  },
  {
    id: 'summary',
    title: 'Summary',
    eyebrow: 'Step 2',
    description: 'Craft a clear, ATS-ready introduction tailored to your role.',
  },
  {
    id: 'skills',
    title: 'Skills',
    eyebrow: 'Step 3',
    description: 'Highlight the technical and transferable strengths that matter most.',
  },
  {
    id: 'experience',
    title: 'Experience',
    eyebrow: 'Step 4',
    description: 'Add impact-driven roles, responsibilities, and accomplishments.',
  },
  {
    id: 'education',
    title: 'Education',
    eyebrow: 'Step 5',
    description: 'Show relevant academic history and specialization.',
  },
  {
    id: 'projects',
    title: 'Projects',
    eyebrow: 'Step 6',
    description: 'Showcase portfolio work, launches, and standout initiatives.',
  },
  {
    id: 'certifications',
    title: 'Certifications',
    eyebrow: 'Step 7',
    description: 'Add trust signals that strengthen your expertise.',
  },
]

export const TEMPLATE_OPTIONS = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    label: 'Modern',
    accent: '#00e5ff',
    description: 'Clean hierarchy, calm spacing, and a sharp ATS-friendly presentation.',
  },
  {
    id: 'professional',
    name: 'Profile Sheet',
    label: 'PDF Style',
    accent: '#8ccbad',
    description: 'Profile-led two-column sheet inspired by the uploaded PDF resume layout.',
  },
  {
    id: 'creative',
    name: 'Creative',
    label: 'Creative',
    accent: '#ffc857',
    description: 'Bold layout accents with polished readability for design-forward roles.',
  },
]

export const PREVIEW_MODES = [
  { id: 'light', label: 'Light Preview' },
  { id: 'dark', label: 'Dark Preview' },
]

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const createEmptyExperience = () => ({
  id: createId('experience'),
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  bullets: [''],
})

export const createEmptyEducation = () => ({
  id: createId('education'),
  institution: '',
  degree: '',
  location: '',
  startDate: '',
  endDate: '',
  grade: '',
})

export const createEmptyProject = () => ({
  id: createId('project'),
  name: '',
  role: '',
  url: '',
  description: '',
  technologies: [],
})

export const createEmptyCertification = () => ({
  id: createId('certification'),
  name: '',
  issuer: '',
  date: '',
  credentialId: '',
  url: '',
})

export const createInitialFormData = () => ({
  personal: {
    name: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    role: '',
    years: '',
  },
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
})

export const createInitialAtsReport = () => ({
  score: 0,
  keywordMatch: 0,
  completeness: 0,
  matchedKeywords: [],
  missingKeywords: [],
  formattingIssues: [],
  strengths: [],
  suggestions: ['Add role-specific details to unlock ATS recommendations.'],
})

export const DEFAULT_RESUME_SEED_ID = 'default-resume-1'

const DEFAULT_RESUME_SEED = {
  seedId: DEFAULT_RESUME_SEED_ID,
  name: 'Default Resume 1',
  template: 'professional',
  formData: {
    personal: {
      name: 'Rohit Kumar',
      email: 'rohitpatiyal616@gmail.com',
      phone: '8894459240',
      location: 'Himachal Pradesh, India',
      website: '',
      linkedin: '',
      role: 'B.Tech CSE (AI&ML) | Aspiring AI Engineer | Creative Thinker & Explorer',
      years: '0',
    },
    summary:
      'Enthusiastic and creative B.Tech AI & ML student at CGC Mohali with a strong interest in artificial intelligence, travel, photography, and storytelling. Passionate about technology and innovation, aiming to grow skills and build toward a future role at top global tech companies.',
    skills: [
      'Programming Basics',
      'Python',
      'C++',
      'Problem-solving',
      'Logical Thinking',
      'Communication',
      'Time Management',
      'Creative Content',
      'Travel Storytelling',
      'Machine Learning',
    ],
    experience: [],
    education: [
      {
        institution: 'Chandigarh Group of Colleges (CGC)',
        degree: 'B.Tech in Computer Science (AI&ML)',
        location: 'Jhanjeri - Mohali',
        startDate: '08/2025',
        endDate: '05/2029',
        grade: '',
      },
      {
        institution: 'H.P Board',
        degree: '12th - Non-Medical Stream',
        location: 'Himachal Pradesh',
        startDate: '01/2021',
        endDate: '05/2025',
        grade: '',
      },
    ],
    projects: [
      {
        name: 'Travel Vlog Concept',
        role: 'Creator',
        url: '',
        description: 'Created and shared travel moments to engage audiences online.',
        technologies: ['Content Creation', 'Storytelling'],
      },
      {
        name: 'Basic Programming Practice',
        role: 'Student Developer',
        url: '',
        description: 'Developed small programs in C and C++ to improve logic.',
        technologies: ['C', 'C++'],
      },
    ],
    certifications: [],
  },
}

export const getDefaultSectionOrder = () => SECTION_LIBRARY.map((section) => section.id)

const normalizeTextArray = (items = []) =>
  Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  )

const normalizeExperienceEntries = (items = []) =>
  (Array.isArray(items) ? items : []).map((entry) => ({
    ...createEmptyExperience(),
    ...entry,
    id: entry?.id || createId('experience'),
    bullets:
      Array.isArray(entry?.bullets) && entry.bullets.length > 0
        ? entry.bullets.map((bullet) => String(bullet || ''))
        : [''],
  }))

const normalizeEducationEntries = (items = []) =>
  (Array.isArray(items) ? items : []).map((entry) => ({
    ...createEmptyEducation(),
    ...entry,
    id: entry?.id || createId('education'),
  }))

const normalizeProjectEntries = (items = []) =>
  (Array.isArray(items) ? items : []).map((entry) => ({
    ...createEmptyProject(),
    ...entry,
    id: entry?.id || createId('project'),
    technologies: normalizeTextArray(entry?.technologies || entry?.tech || []),
  }))

const normalizeCertificationEntries = (items = []) =>
  (Array.isArray(items) ? items : []).map((entry) => ({
    ...createEmptyCertification(),
    ...entry,
    id: entry?.id || createId('certification'),
  }))

export const normalizeFormData = (formData = {}) => {
  const initial = createInitialFormData()

  return {
    ...initial,
    ...formData,
    personal:
      formData.personal && typeof formData.personal === 'object'
        ? { ...initial.personal, ...formData.personal }
        : initial.personal,
    summary: typeof formData.summary === 'string' ? formData.summary : initial.summary,
    skills: normalizeTextArray(formData.skills),
    experience: normalizeExperienceEntries(formData.experience),
    education: normalizeEducationEntries(formData.education),
    projects: normalizeProjectEntries(formData.projects),
    certifications: normalizeCertificationEntries(formData.certifications),
  }
}

const normalizeSectionOrder = (sectionOrder = []) => {
  const allowed = new Set(getDefaultSectionOrder())
  const incoming = (Array.isArray(sectionOrder) ? sectionOrder : []).filter((item) =>
    allowed.has(item)
  )
  const missing = getDefaultSectionOrder().filter((item) => !incoming.includes(item))
  return [...incoming, ...missing]
}

export const createResumeVersion = (overrides = {}) => {
  const now = new Date().toISOString()

  return {
    id: overrides.id || createId('resume'),
    seedId: typeof overrides.seedId === 'string' ? overrides.seedId : null,
    name: overrides.name || 'Primary Resume',
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    template: overrides.template || 'modern',
    previewMode: overrides.previewMode || 'light',
    sectionOrder: normalizeSectionOrder(overrides.sectionOrder),
    jobDescription: typeof overrides.jobDescription === 'string' ? overrides.jobDescription : '',
    atsReport: {
      ...createInitialAtsReport(),
      ...(overrides.atsReport || {}),
    },
    formData: normalizeFormData(overrides.formData),
  }
}

export const createDefaultSeedResume = (overrides = {}) =>
  createResumeVersion({
    ...DEFAULT_RESUME_SEED,
    ...overrides,
    formData: {
      ...DEFAULT_RESUME_SEED.formData,
      ...(overrides.formData || {}),
      personal: {
        ...DEFAULT_RESUME_SEED.formData.personal,
        ...(overrides.formData?.personal || {}),
      },
    },
  })

export const normalizeResumeVersion = (resume = {}) =>
  createResumeVersion({
    ...resume,
    formData: normalizeFormData(resume.formData),
    sectionOrder: normalizeSectionOrder(resume.sectionOrder),
    atsReport: {
      ...createInitialAtsReport(),
      ...(resume.atsReport || {}),
    },
  })

export const arrayMove = (items, fromIndex, toIndex) => {
  const list = [...items]

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length ||
    fromIndex === toIndex
  ) {
    return list
  }

  const [movedItem] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, movedItem)
  return list
}

export const formatRelativeTime = (timestamp) => {
  const source = new Date(timestamp)

  if (Number.isNaN(source.getTime())) {
    return 'just now'
  }

  const difference = Date.now() - source.getTime()
  const minutes = Math.round(difference / 60000)

  if (minutes <= 0) {
    return 'just now'
  }

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export const buildResumeText = (resume) => {
  const formData = normalizeFormData(resume?.formData)
  const personal = formData.personal

  return [
    personal.name,
    personal.role,
    personal.location,
    personal.website,
    personal.linkedin,
    formData.summary,
    formData.skills.join(' '),
    formData.experience
      .map((entry) =>
        [entry.role, entry.company, entry.location, entry.startDate, entry.endDate, entry.bullets.join(' ')].join(
          ' '
        )
      )
      .join(' '),
    formData.education
      .map((entry) =>
        [entry.degree, entry.institution, entry.location, entry.startDate, entry.endDate].join(' ')
      )
      .join(' '),
    formData.projects
      .map((entry) =>
        [entry.name, entry.role, entry.description, entry.url, entry.technologies.join(' ')].join(' ')
      )
      .join(' '),
    formData.certifications
      .map((entry) => [entry.name, entry.issuer, entry.credentialId, entry.url].join(' '))
      .join(' '),
  ]
    .filter(Boolean)
    .join(' ')
}
