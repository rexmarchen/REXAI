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

const SS = "'Segoe UI', Calibri, Arial, sans-serif"
const SE = "Georgia, 'Times New Roman', serif"
const PA = "'Palatino Linotype', Palatino, serif"
const GI = "'Gill Sans', 'Trebuchet MS', sans-serif"
const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const CO = "'Courier New', monospace"
const CA = "Cambria, Georgia, serif"

export const RECOMMENDED_TEMPLATES = [
  {
    id: 'rec-1',
    num: 1,
    name: 'Executive Navy',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 1,
    heading: 1,
    accent: '#1e3a5f',
    headerBg: '#1e3a5f',
    headerText: '#ffffff',
    sideBg: '#1e3a5f',
    sideText: '#ffffff',
    font: SS,
    flags: 'bars',
    description: 'Corporate executive split sidebar with live skill proficiency bars and deep navy tone.',
  },
  {
    id: 'rec-2',
    num: 2,
    name: 'Modern Teal',
    label: 'Recommended',
    category: 'Modern',
    isRecommended: true,
    collection: 'recommended',
    layout: 3,
    heading: 2,
    accent: '#0f766e',
    headerBg: '#0f766e',
    headerText: '#ffffff',
    sideBg: '#f0fdfa',
    sideText: '#134e4a',
    font: SS,
    flags: 'pill',
    description: 'Crisp teal banner with mint sidebar and pill-rounded badges for tech product designers.',
  },
  {
    id: 'rec-3',
    num: 3,
    name: 'Charcoal Pro',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 1,
    heading: 4,
    accent: '#111111',
    headerBg: '#1f2937',
    headerText: '#ffffff',
    sideBg: '#1f2937',
    sideText: '#e5e7eb',
    font: HN,
    flags: 'bars ph',
    description: 'Onyx charcoal palette with initial monogram avatar and uppercase tracked headings.',
  },
  {
    id: 'rec-4',
    num: 4,
    name: 'Classic Serif',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 5,
    heading: 5,
    accent: '#222222',
    headerBg: '#ffffff',
    headerText: '#111111',
    sideBg: '#ffffff',
    sideText: '#222222',
    font: SE,
    flags: 'ctr',
    description: 'Centered single-column layout with Georgia typography and balanced 3-column footer aside.',
  },
  {
    id: 'rec-5',
    num: 5,
    name: 'Harvard ATS',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 5,
    heading: 4,
    accent: '#000000',
    headerBg: '#ffffff',
    headerText: '#000000',
    sideBg: '#ffffff',
    sideText: '#000000',
    font: PA,
    flags: 'ctr',
    description: 'Gold-standard Ivy League single column format favored by enterprise ATS scanners.',
  },
  {
    id: 'rec-6',
    num: 6,
    name: 'Crimson Edge',
    label: 'Recommended',
    category: 'Minimal',
    isRecommended: true,
    collection: 'recommended',
    layout: 2,
    heading: 3,
    accent: '#b91c1c',
    headerBg: '#ffffff',
    headerText: '#111111',
    sideBg: '#fef2f2',
    sideText: '#7f1d1d',
    font: SS,
    flags: 'pill',
    description: 'Content-first right sidebar with vertical crimson border accent and pill tags.',
  },
  {
    id: 'rec-7',
    num: 7,
    name: 'Slate Timeline',
    label: 'Recommended',
    category: 'Tech',
    isRecommended: true,
    collection: 'recommended',
    layout: 3,
    heading: 3,
    accent: '#475569',
    headerBg: '#f1f5f9',
    headerText: '#0f172a',
    sideBg: '#ffffff',
    sideText: '#334155',
    font: SS,
    flags: 'tl',
    description: 'Top banner layout with connected timeline node dots tracking career progression.',
  },
  {
    id: 'rec-8',
    num: 8,
    name: 'Violet Studio',
    label: 'Recommended',
    category: 'Creative',
    isRecommended: true,
    collection: 'recommended',
    layout: 1,
    heading: 6,
    accent: '#7c3aed',
    headerBg: '#5b21b6',
    headerText: '#ffffff',
    sideBg: '#f5f3ff',
    sideText: '#3b0764',
    font: GI,
    flags: 'ph pill',
    description: 'Vibrant royal purple header with avatar circle and bullet dot heading accents.',
  },
  {
    id: 'rec-9',
    num: 9,
    name: 'Midnight Gold',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 1,
    heading: 1,
    accent: '#b45309',
    headerBg: '#0f172a',
    headerText: '#ffffff',
    sideBg: '#0f172a',
    sideText: '#e2e8f0',
    font: SE,
    flags: 'bars',
    description: 'Midnight navy rail with rich amber gold section accents and skill proficiency bars.',
  },
  {
    id: 'rec-10',
    num: 10,
    name: 'Forest Green',
    label: 'Recommended',
    category: 'Modern',
    isRecommended: true,
    collection: 'recommended',
    layout: 4,
    heading: 2,
    accent: '#166534',
    headerBg: '#166534',
    headerText: '#ffffff',
    sideBg: '#f0fdf4',
    sideText: '#14532d',
    font: SS,
    flags: 'pill',
    description: 'Top banner with right sidebar, solid emerald block heading badges, and mint skill pills.',
  },
  {
    id: 'rec-11',
    num: 11,
    name: 'ATS Clean Blue',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 5,
    heading: 1,
    accent: '#1d4ed8',
    headerBg: '#ffffff',
    headerText: '#111111',
    sideBg: '#ffffff',
    sideText: '#222222',
    font: HN,
    flags: '',
    description: 'High readability single-column format with royal blue underlines for ATS compliance.',
  },
  {
    id: 'rec-12',
    num: 12,
    name: 'Orange Pop',
    label: 'Recommended',
    category: 'Creative',
    isRecommended: true,
    collection: 'recommended',
    layout: 3,
    heading: 2,
    accent: '#ea580c',
    headerBg: '#ea580c',
    headerText: '#ffffff',
    sideBg: '#fff7ed',
    sideText: '#7c2d12',
    font: GI,
    flags: 'ph',
    description: 'Warm terracotta orange banner with avatar monogram and block heading badges.',
  },
  {
    id: 'rec-13',
    num: 13,
    name: 'Minimal Light',
    label: 'Recommended',
    category: 'Minimal',
    isRecommended: true,
    collection: 'recommended',
    layout: 5,
    heading: 4,
    accent: '#6b7280',
    headerBg: '#ffffff',
    headerText: '#111111',
    sideBg: '#ffffff',
    sideText: '#333333',
    font: HN,
    flags: 'ctr thin',
    description: 'Ultra-refined 300 font-weight centered letterhead with delicate uppercase rules.',
  },
  {
    id: 'rec-14',
    num: 14,
    name: 'Ocean Blue',
    label: 'Recommended',
    category: 'Modern',
    isRecommended: true,
    collection: 'recommended',
    layout: 1,
    heading: 3,
    accent: '#0369a1',
    headerBg: '#0c4a6e',
    headerText: '#ffffff',
    sideBg: '#0c4a6e',
    sideText: '#e0f2fe',
    font: SS,
    flags: 'pill ph',
    description: 'Deep ocean blue sidebar with avatar monogram circle, left border headings, and pills.',
  },
  {
    id: 'rec-15',
    num: 15,
    name: 'Rose Elegant',
    label: 'Recommended',
    category: 'Creative',
    isRecommended: true,
    collection: 'recommended',
    layout: 2,
    heading: 5,
    accent: '#be185d',
    headerBg: '#fdf2f8',
    headerText: '#831843',
    sideBg: '#fdf2f8',
    sideText: '#831843',
    font: SE,
    flags: 'ph',
    description: 'Editorial rose aesthetic with right-hand sidebar, sentence-case headings, and avatar.',
  },
  {
    id: 'rec-16',
    num: 16,
    name: 'Tech Mono',
    label: 'Recommended',
    category: 'Tech',
    isRecommended: true,
    collection: 'recommended',
    layout: 3,
    heading: 3,
    accent: '#16a34a',
    headerBg: '#0a0a0a',
    headerText: '#4ade80',
    sideBg: '#f4f4f5',
    sideText: '#18181b',
    font: CO,
    flags: 'bars',
    description: 'Hacker terminal aesthetic with monospace type, dark banner, neon green, and skill bars.',
  },
  {
    id: 'rec-17',
    num: 17,
    name: 'Coral Banner',
    label: 'Recommended',
    category: 'Creative',
    isRecommended: true,
    collection: 'recommended',
    layout: 4,
    heading: 2,
    accent: '#e11d48',
    headerBg: '#e11d48',
    headerText: '#ffffff',
    sideBg: '#fff1f2',
    sideText: '#881337',
    font: SS,
    flags: 'pill',
    description: 'Vivid coral red top banner with right rail and modern rounded skill badges.',
  },
  {
    id: 'rec-18',
    num: 18,
    name: 'Indigo Executive',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 1,
    heading: 4,
    accent: '#4338ca',
    headerBg: '#312e81',
    headerText: '#ffffff',
    sideBg: '#312e81',
    sideText: '#e0e7ff',
    font: CA,
    flags: 'bars',
    description: 'Cambria serif with deep royal indigo header, tracked uppercase rules, and progress meters.',
  },
  {
    id: 'rec-19',
    num: 19,
    name: 'Sand Parchment',
    label: 'Recommended',
    category: 'Minimal',
    isRecommended: true,
    collection: 'recommended',
    layout: 5,
    heading: 5,
    accent: '#92400e',
    headerBg: '#fef3c7',
    headerText: '#451a03',
    sideBg: '#fffbeb',
    sideText: '#451a03',
    font: SE,
    flags: 'ctr',
    description: 'Warm sandy parchment palette with centered letterhead and 3-column footer aside.',
  },
  {
    id: 'rec-20',
    num: 20,
    name: 'Steel Timeline',
    label: 'Recommended',
    category: 'Tech',
    isRecommended: true,
    collection: 'recommended',
    layout: 3,
    heading: 6,
    accent: '#2563eb',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    sideBg: '#eff6ff',
    sideText: '#1e3a8a',
    font: SS,
    flags: 'tl ph',
    description: 'Cobalt blue connected timeline dots with avatar monogram and soft ice-blue sidebar.',
  },
  {
    id: 'rec-21',
    num: 21,
    name: 'Plum Editorial',
    label: 'Recommended',
    category: 'Creative',
    isRecommended: true,
    collection: 'recommended',
    layout: 2,
    heading: 4,
    accent: '#86198f',
    headerBg: '#ffffff',
    headerText: '#4a044e',
    sideBg: '#fae8ff',
    sideText: '#4a044e',
    font: PA,
    flags: 'pill',
    description: 'Right-split layout with Palatino serif type, plum highlights, and pill tags.',
  },
  {
    id: 'rec-22',
    num: 22,
    name: 'Mint Fresh',
    label: 'Recommended',
    category: 'Modern',
    isRecommended: true,
    collection: 'recommended',
    layout: 1,
    heading: 2,
    accent: '#059669',
    headerBg: '#047857',
    headerText: '#ffffff',
    sideBg: '#ecfdf5',
    sideText: '#064e3b',
    font: GI,
    flags: 'pill ph',
    description: 'Fresh mint green header with avatar circle, solid block headings, and pill badges.',
  },
  {
    id: 'rec-23',
    num: 23,
    name: 'Black & White Bold',
    label: 'Recommended',
    category: 'Executive',
    isRecommended: true,
    collection: 'recommended',
    layout: 3,
    heading: 2,
    accent: '#000000',
    headerBg: '#000000',
    headerText: '#ffffff',
    sideBg: '#ffffff',
    sideText: '#000000',
    font: HN,
    flags: '',
    description: 'Stark black banner with block headings and pure monochrome high-impact contrast.',
  },
  {
    id: 'rec-24',
    num: 24,
    name: 'Copper Modern',
    label: 'Recommended',
    category: 'Modern',
    isRecommended: true,
    collection: 'recommended',
    layout: 4,
    heading: 3,
    accent: '#c2410c',
    headerBg: '#1c1917',
    headerText: '#fafaf9',
    sideBg: '#fafaf9',
    sideText: '#292524',
    font: SS,
    flags: 'bars',
    description: 'Charcoal top banner with right sidebar, rich copper rust accents, and skill bars.',
  },
]

export const TEMPLATE_OPTIONS = [
  ...RECOMMENDED_TEMPLATES,
  {
    id: 't1',
    num: 1,
    name: 'Classic Navy',
    label: 'Classic',
    category: 'Executive',
    accent: '#1f3a5f',
    bg: '#ffffff',
    side: '#f1f1f1',
    font: 'Georgia, serif',
    description: 'Timeless navy accents with a balanced editorial executive layout.',
  },
  {
    id: 't2',
    num: 2,
    name: 'Teal Sidebar',
    label: 'Modern Teal',
    category: 'Modern',
    accent: '#0f766e',
    bg: '#ffffff',
    side: '#0f766e',
    font: 'system-ui, sans-serif',
    description: 'Deep dark teal sidebar with high-contrast inverted white typography.',
  },
  {
    id: 't3',
    num: 3,
    name: 'Black Executive',
    label: 'Monochrome',
    category: 'Executive',
    accent: '#111111',
    bg: '#ffffff',
    side: '#111111',
    font: "'Helvetica Neue', Arial, sans-serif",
    description: 'High-contrast black sidebar for senior leadership and engineering leads.',
  },
  {
    id: 't4',
    num: 4,
    name: 'Crimson Serif',
    label: 'Editorial',
    category: 'Minimal',
    accent: '#b91c1c',
    bg: '#ffffff',
    side: '#ffffff',
    font: 'Georgia, serif',
    description: 'Refined crimson serif typography with clean vertical divider line.',
  },
  {
    id: 't5',
    num: 5,
    name: 'Violet Soft',
    label: 'Creative',
    category: 'Creative',
    accent: '#7c3aed',
    bg: '#ffffff',
    side: '#f5f3ff',
    font: 'system-ui, sans-serif',
    description: 'Soft lilac tinted rail with vibrant violet headers and tags.',
  },
  {
    id: 't6',
    num: 6,
    name: 'Slate Banner',
    label: 'Top Banner',
    category: 'Modern',
    accent: '#334155',
    bg: '#ffffff',
    side: '#334155',
    font: 'Georgia, serif',
    description: 'Full-width slate header banner with spacious horizontal layout.',
  },
  {
    id: 't7',
    num: 7,
    name: 'Orange Top',
    label: 'Warm Minimal',
    category: 'Minimal',
    accent: '#ea580c',
    bg: '#ffffff',
    side: '#ffffff',
    font: 'system-ui, sans-serif',
    description: 'Energizing top border bar in warm orange with modern sans type.',
  },
  {
    id: 't8',
    num: 8,
    name: 'Typewriter',
    label: 'Monospace',
    category: 'Tech',
    accent: '#000000',
    bg: '#ffffff',
    side: '#ffffff',
    font: "'Courier New', monospace",
    description: 'Tech retro aesthetic with dashed borders and typewriter font.',
  },
  {
    id: 't9',
    num: 9,
    name: 'Rose Italic',
    label: 'Design',
    category: 'Creative',
    accent: '#be185d',
    bg: '#ffffff',
    side: '#fdf2f8',
    font: 'Georgia, serif',
    description: 'Subtle blush tone with italicized headline and rose highlights.',
  },
  {
    id: 't10',
    num: 10,
    name: 'Forest Sidebar',
    label: 'Green Tech',
    category: 'Modern',
    accent: '#15803d',
    bg: '#ffffff',
    side: '#15803d',
    font: 'system-ui, sans-serif',
    description: 'Deep emerald sidebar with light-mint contrast text.',
  },
  {
    id: 't11',
    num: 11,
    name: 'Block Headings',
    label: 'Structured',
    category: 'Executive',
    accent: '#1e293b',
    bg: '#ffffff',
    side: '#ffffff',
    font: "'Trebuchet MS', sans-serif",
    description: 'Solid block heading badges for maximum visual section division.',
  },
  {
    id: 't12',
    num: 12,
    name: 'Sky Blue',
    label: 'Compact',
    category: 'Modern',
    accent: '#0369a1',
    bg: '#ffffff',
    side: '#e0f2fe',
    font: 'Verdana, sans-serif',
    description: 'Soft sky-blue rail with compact typography for dense experience.',
  },
  {
    id: 't13',
    num: 13,
    name: 'Centered Formal',
    label: 'Formal',
    category: 'Executive',
    accent: '#111111',
    bg: '#ffffff',
    side: '#ffffff',
    font: 'Georgia, serif',
    description: 'Centered letterhead with tracking and spaced contact row.',
  },
  {
    id: 't14',
    num: 14,
    name: 'Gold on Black',
    label: 'Luxury',
    category: 'Executive',
    accent: '#facc15',
    bg: '#ffffff',
    side: '#18181b',
    font: 'system-ui, sans-serif',
    description: 'Onyx dark sidebar with warm gold lettering and tags.',
  },
  {
    id: 't15',
    num: 15,
    name: 'Indigo Right Bar',
    label: 'Right Split',
    category: 'Creative',
    accent: '#4338ca',
    bg: '#ffffff',
    side: '#ffffff',
    font: 'system-ui, sans-serif',
    description: 'Content-first layout with sidebar placed on the right border.',
  },
  {
    id: 't16',
    num: 16,
    name: 'Parchment',
    label: 'Warm Antique',
    category: 'Minimal',
    accent: '#9a3412',
    bg: '#fffbeb',
    side: '#fef3c7',
    font: 'Georgia, serif',
    description: 'Warm antique parchment background with rich copper and amber.',
  },
  {
    id: 't17',
    num: 17,
    name: 'Ocean Deep',
    label: 'Deep Cyan',
    category: 'Modern',
    accent: '#0891b2',
    bg: '#ffffff',
    side: '#164e63',
    font: "'Trebuchet MS', sans-serif",
    description: 'Deep petrol-blue sidebar with vibrant cyan accents.',
  },
  {
    id: 't18',
    num: 18,
    name: 'Light Minimal',
    label: 'Ultra Light',
    category: 'Minimal',
    accent: '#525252',
    bg: '#ffffff',
    side: '#ffffff',
    font: "'Helvetica Neue', Arial, sans-serif",
    description: 'Swiss minimalist styling with airy typography and delicate lines.',
  },
  {
    id: 't19',
    num: 19,
    name: 'Sunset Gradient',
    label: 'Vibrant',
    category: 'Creative',
    accent: '#db2777',
    bg: '#ffffff',
    side: '#db2777',
    font: 'system-ui, sans-serif',
    description: 'Full-width sunset pink-to-orange gradient banner.',
  },
  {
    id: 't20',
    num: 20,
    name: 'Mint Paper',
    label: 'Fresh Tint',
    category: 'Minimal',
    accent: '#065f46',
    bg: '#f0fdf4',
    side: '#d1fae5',
    font: 'Georgia, serif',
    description: 'Soft mint paper background with pine green section headings.',
  },
  {
    id: 't21',
    num: 21,
    name: 'Royal Blue Curve',
    label: 'Rounded Edge',
    category: 'Modern',
    accent: '#1d4ed8',
    bg: '#ffffff',
    side: '#1d4ed8',
    font: "'Segoe UI', sans-serif",
    description: 'Curved top-corner royal blue sidebar for modern software eng.',
  },
  {
    id: 't22',
    num: 22,
    name: 'Code Red',
    label: 'Hacker/Terminal',
    category: 'Tech',
    accent: '#ef4444',
    bg: '#ffffff',
    side: '#ffffff',
    font: "'Courier New', monospace",
    description: 'Crimson vertical accent borders with clean monospaced layout.',
  },
  {
    id: 't23',
    num: 23,
    name: 'Plum Editorial',
    label: 'Magazine',
    category: 'Creative',
    accent: '#6b21a8',
    bg: '#ffffff',
    side: '#faf5ff',
    font: 'Georgia, serif',
    description: 'Large editorial title with delicate top rule and royal plum tones.',
  },
  {
    id: 't24',
    num: 24,
    name: 'Steel Pills',
    label: 'Rounded Tags',
    category: 'Modern',
    accent: '#0f172a',
    bg: '#ffffff',
    side: '#e2e8f0',
    font: 'Arial, sans-serif',
    description: 'Cool slate gray sidebar with modern pill-rounded skill badges.',
  },
  {
    id: 'modern',
    num: 1,
    name: 'Classic Navy (Modern)',
    label: 'Modern',
    category: 'Executive',
    accent: '#1f3a5f',
    isLegacy: true,
  },
  {
    id: 'professional',
    num: 2,
    name: 'Teal Sidebar (PDF Style)',
    label: 'PDF Style',
    category: 'Modern',
    accent: '#0f766e',
    isLegacy: true,
  },
  {
    id: 'creative',
    num: 5,
    name: 'Violet Soft (Creative)',
    label: 'Creative',
    category: 'Creative',
    accent: '#7c3aed',
    isLegacy: true,
  },
]

export const getTemplateConfig = (templateId) => {
  const match = TEMPLATE_OPTIONS.find((t) => t.id === templateId)
  if (match) return match
  if (templateId === 'modern') return TEMPLATE_OPTIONS[0]
  if (templateId === 'professional') return TEMPLATE_OPTIONS[1]
  if (templateId === 'creative') return TEMPLATE_OPTIONS[4]
  return TEMPLATE_OPTIONS[0]
}

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

export const exportAtsPlainText = (resume) => {
  const formData = normalizeFormData(resume?.formData)
  const personal = formData.personal || {}
  const lines = []

  lines.push((personal.name || 'YOUR NAME').toUpperCase())
  const contactParts = [personal.role, personal.email, personal.phone, personal.location].filter(Boolean)
  if (contactParts.length > 0) lines.push(contactParts.join(' | '))
  const links = [personal.website, personal.linkedin].filter(Boolean)
  if (links.length > 0) lines.push(links.join(' | '))
  lines.push('')

  if (formData.summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push('--------------------')
    lines.push(formData.summary)
    lines.push('')
  }

  if (formData.skills?.length > 0) {
    lines.push('CORE TECHNICAL SKILLS & COMPETENCIES')
    lines.push('-------------------------------------')
    lines.push(formData.skills.join(', '))
    lines.push('')
  }

  if (formData.experience?.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE')
    lines.push('-----------------------')
    formData.experience.forEach((entry) => {
      const dates = [entry.startDate, entry.endDate, entry.location].filter(Boolean).join(' - ')
      lines.push(`${(entry.role || 'ROLE').toUpperCase()} | ${entry.company || 'Company'} (${dates})`)
      if (Array.isArray(entry.bullets)) {
        entry.bullets.filter(Boolean).forEach((b) => {
          lines.push(`• ${b}`)
        })
      }
      lines.push('')
    })
  }

  if (formData.projects?.length > 0) {
    lines.push('KEY PROJECTS')
    lines.push('------------')
    formData.projects.forEach((entry) => {
      lines.push(`${entry.name || 'Project'} - ${entry.role || ''}`)
      if (entry.url) lines.push(`Link: ${entry.url}`)
      if (entry.description) lines.push(entry.description)
      if (entry.technologies?.length > 0) {
        lines.push(`Technologies: ${entry.technologies.join(', ')}`)
      }
      lines.push('')
    })
  }

  if (formData.education?.length > 0) {
    lines.push('EDUCATION')
    lines.push('---------')
    formData.education.forEach((entry) => {
      const dates = [entry.startDate, entry.endDate, entry.location].filter(Boolean).join(' - ')
      lines.push(`${entry.degree || 'Degree'} | ${entry.institution || 'Institution'} (${dates})`)
      if (entry.grade) lines.push(`Grade / GPA: ${entry.grade}`)
      lines.push('')
    })
  }

  if (formData.certifications?.length > 0) {
    lines.push('CERTIFICATIONS')
    lines.push('--------------')
    formData.certifications.forEach((entry) => {
      lines.push(`${entry.name}${entry.issuer ? ` - ${entry.issuer}` : ''}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

export const estimatePageFit = (resume) => {
  const formData = normalizeFormData(resume?.formData)
  let score = 0

  score += 150
  if (formData.summary) score += Math.min(200, formData.summary.length * 0.4)
  score += (formData.skills?.length || 0) * 15

  if (Array.isArray(formData.experience)) {
    formData.experience.forEach((e) => {
      score += 70
      score += (e.bullets?.length || 0) * 45
    })
  }

  if (Array.isArray(formData.projects)) {
    formData.projects.forEach((p) => {
      score += 60
      if (p.description) score += p.description.length * 0.25
    })
  }

  score += (formData.education?.length || 0) * 55
  score += (formData.certifications?.length || 0) * 35

  const isOnePage = score <= 1050
  const pages = Math.ceil(score / 1050)

  return {
    isOnePage,
    pages: Math.max(1, pages),
    score,
    statusText: isOnePage ? '1 Page (Clean Fit)' : `${pages} Pages (Long Form)`,
  }
}

