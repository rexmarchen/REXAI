import type { TemplateDefinition } from '../types/resume';

export const TEMPLATES: TemplateDefinition[] = [
  // 1-2. Plain ATS-Friendly Templates (Single column, no colour, no icons)
  {
    id: 'ats-classic',
    name: 'ATS Standard',
    description: '100% compliant plain monochrome single column layout optimized for legacy & modern ATS parsers.',
    layout: 'single-column',
    headingStyle: 'underline',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: false,
    isAtsClassic: true,
    category: 'ATS Minimal'
  },
  {
    id: 'ats-minimal',
    name: 'ATS Clean Courier',
    description: 'Monochrome minimalist single-column typography designed for flawless OCR and screening algorithms.',
    layout: 'single-column',
    headingStyle: 'spaced-caps',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: false,
    isAtsClassic: true,
    category: 'ATS Minimal'
  },

  // 3-7. Left Sidebar Layouts
  {
    id: 'modern-left',
    name: 'Modern Executive',
    description: 'Sleek left sidebar with accent skill bars, underline headings, and crisp typography.',
    layout: 'left-sidebar',
    headingStyle: 'underline',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Modern'
  },
  {
    id: 'tech-left',
    name: 'Silicon Valley',
    description: 'Technical left sidebar with skill pills, left-border accents, and interactive timeline.',
    layout: 'left-sidebar',
    headingStyle: 'left-border',
    skillStyle: 'pills',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Technical'
  },
  {
    id: 'nordic-left',
    name: 'Nordic Clean',
    description: 'Scandinavian minimal left-sidebar layout with dot-marker headings and soft borders.',
    layout: 'left-sidebar',
    headingStyle: 'dot-marker',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: false,
    category: 'Modern'
  },
  {
    id: 'slate-left',
    name: 'Corporate Slate',
    description: 'Professional left sidebar with filled bar headers and structured experience timeline.',
    layout: 'left-sidebar',
    headingStyle: 'filled-bar',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Executive'
  },
  {
    id: 'editorial-left',
    name: 'Editorial Serif',
    description: 'Elegant serif typography with left sidebar and sentence-case headers.',
    layout: 'left-sidebar',
    headingStyle: 'serif-sentence',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: false,
    category: 'Creative'
  },

  // 8-12. Right Sidebar Layouts
  {
    id: 'right-modern',
    name: 'Pacific Blue',
    description: 'Right sidebar layout prioritizing work experience on the left and skills on the right.',
    layout: 'right-sidebar',
    headingStyle: 'underline',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Modern'
  },
  {
    id: 'right-tech',
    name: 'Full Stack Pro',
    description: 'Right sidebar with skill badges, left border headers, and concise project highlights.',
    layout: 'right-sidebar',
    headingStyle: 'left-border',
    skillStyle: 'pills',
    hasTimeline: true,
    hasAvatar: false,
    category: 'Technical'
  },
  {
    id: 'right-filled',
    name: 'Executive Accent',
    description: 'High-contrast right sidebar with bold filled headings and metrics focus.',
    layout: 'right-sidebar',
    headingStyle: 'filled-bar',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Executive'
  },
  {
    id: 'right-spaced',
    name: 'Monolith Right',
    description: 'Clean spaced uppercase headers with right-aligned competencies panel.',
    layout: 'right-sidebar',
    headingStyle: 'spaced-caps',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: false,
    category: 'Modern'
  },
  {
    id: 'right-dot',
    name: 'Dot Focus',
    description: 'Right sidebar layout featuring clean circular dot indicators and timeline.',
    layout: 'right-sidebar',
    headingStyle: 'dot-marker',
    skillStyle: 'pills',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Creative'
  },

  // 13-16. Banner + Left Sidebar Layouts
  {
    id: 'banner-left-lead',
    name: 'Director Banner',
    description: 'Full-width top header banner with left sidebar for skills and credentials.',
    layout: 'banner-left-sidebar',
    headingStyle: 'underline',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Executive'
  },
  {
    id: 'banner-left-filled',
    name: 'Starlight Banner',
    description: 'Full banner header with filled block section titles and left sidebar.',
    layout: 'banner-left-sidebar',
    headingStyle: 'filled-bar',
    skillStyle: 'pills',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Modern'
  },
  {
    id: 'banner-left-tech',
    name: 'Cloud Architect',
    description: 'Prominent header banner with technical sidebar and left-border markers.',
    layout: 'banner-left-sidebar',
    headingStyle: 'left-border',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: false,
    category: 'Technical'
  },
  {
    id: 'banner-left-spaced',
    name: 'Vanguard Banner',
    description: 'Modern banner layout with spaced caps typography and skill badges.',
    layout: 'banner-left-sidebar',
    headingStyle: 'spaced-caps',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: true,
    category: 'Creative'
  },

  // 17-20. Banner + Right Sidebar Layouts
  {
    id: 'banner-right-lead',
    name: 'Apex Banner',
    description: 'Top banner layout with right sidebar displaying competencies and certifications.',
    layout: 'banner-right-sidebar',
    headingStyle: 'underline',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Executive'
  },
  {
    id: 'banner-right-filled',
    name: 'Quantum Banner',
    description: 'Header banner with filled category accents and right sidebar skill pills.',
    layout: 'banner-right-sidebar',
    headingStyle: 'filled-bar',
    skillStyle: 'pills',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Modern'
  },
  {
    id: 'banner-right-border',
    name: 'Metro Banner',
    description: 'Dynamic header banner with clean left-border headings and right sidebar.',
    layout: 'banner-right-sidebar',
    headingStyle: 'left-border',
    skillStyle: 'bars',
    hasTimeline: false,
    hasAvatar: false,
    category: 'Technical'
  },
  {
    id: 'banner-right-serif',
    name: 'Heritage Banner',
    description: 'Refined editorial banner with serif title typography and right sidebar.',
    layout: 'banner-right-sidebar',
    headingStyle: 'serif-sentence',
    skillStyle: 'pills',
    hasTimeline: true,
    hasAvatar: false,
    category: 'Creative'
  },

  // 21-24. Single Column Layouts
  {
    id: 'single-classic',
    name: 'Classic Ivy',
    description: 'Prestigious single-column layout with centered header and underlined sections.',
    layout: 'single-column',
    headingStyle: 'underline',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: false,
    category: 'Executive'
  },
  {
    id: 'single-modern-timeline',
    name: 'Timeline Horizon',
    description: 'Linear single-column format with connected timeline nodes and skill bars.',
    layout: 'single-column',
    headingStyle: 'dot-marker',
    skillStyle: 'bars',
    hasTimeline: true,
    hasAvatar: true,
    category: 'Modern'
  },
  {
    id: 'single-filled',
    name: 'Bold Block',
    description: 'Single-column structure featuring solid accent banner titles and skill badges.',
    layout: 'single-column',
    headingStyle: 'filled-bar',
    skillStyle: 'pills',
    hasTimeline: false,
    hasAvatar: false,
    category: 'Creative'
  },
  {
    id: 'single-tech-border',
    name: 'Code Stream',
    description: 'Streamlined single column with left-border indicators for developer resumes.',
    layout: 'single-column',
    headingStyle: 'left-border',
    skillStyle: 'pills',
    hasTimeline: true,
    hasAvatar: false,
    category: 'Technical'
  }
];

export const ACCENT_COLORS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Slate Gray', hex: '#475569' },
  { name: 'Obsidian Black', hex: '#18181b' },
];

export const FONT_OPTIONS = [
  { name: 'Inter (Clean & Modern)', value: "'Inter', sans-serif" },
  { name: 'Outfit (Tech & Contemporary)', value: "'Outfit', sans-serif" },
  { name: 'Merriweather (Classic Editorial)', value: "'Merriweather', serif" },
  { name: 'Playfair Display (Executive Serif)', value: "'Playfair Display', serif" },
  { name: 'JetBrains Mono (Technical Code)', value: "'JetBrains Mono', monospace" },
];

export const DEFAULT_RESUME_DATA = {
  contact: {
    full_name: 'Alex Rivera',
    job_title: 'Lead Software Architect',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 382-9104',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alex-rivera-dev',
    github: 'github.com/alexrivera',
    website: 'https://alexrivera.dev'
  },
  summary: 'Strategic Senior Software Architect with 8+ years leading cloud-native infrastructure and distributed systems. Expert in architecting microservices, boosting throughput by 45%, and guiding high-performance engineering teams.',
  experience: [
    {
      id: 'exp-1',
      company: 'Apex Cloud Solutions',
      title: 'Principal Software Architect',
      location: 'San Francisco, CA',
      start_date: 'Jan 2022',
      end_date: 'Present',
      current: true,
      bullets: [
        'Architected high-scale distributed event streaming platform handling 60,000 requests/sec with 99.99% uptime.',
        'Spearheaded enterprise cloud migration to AWS ECS & Kubernetes, reducing monthly cloud expenditure by $115,000.',
        'Mentored 14 senior engineers, standardizing design patterns and improving sprint velocity by 32%.',
        'Optimized core PostgreSQL database queries and Redis caching layers, cutting P99 latency by 40%.'
      ]
    },
    {
      id: 'exp-2',
      company: 'FinScale Technologies',
      title: 'Senior Backend Engineer',
      location: 'New York, NY',
      start_date: 'Mar 2018',
      end_date: 'Dec 2021',
      current: false,
      bullets: [
        'Engineered real-time algorithmic fraud prevention service processing over $30M daily transactions.',
        'Built automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing release cycle from 3 hours to 10 minutes.',
        'Authored developer SDKs and RESTful APIs adopted by over 180 external enterprise partner teams.'
      ]
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Distributed Event Queue Engine',
      description: 'Fault-tolerant distributed queue processing 15k messages per second with Go and Kafka.',
      technologies: ['Go', 'Kafka', 'Docker', 'Prometheus'],
      link: 'github.com/alexrivera/queue-engine'
    },
    {
      id: 'proj-2',
      title: 'AI Resume Analyzer Core',
      description: 'High-speed deterministic ATS parser evaluating grammar, formatting, and keyword relevance.',
      technologies: ['Python', 'FastAPI', 'PostgreSQL', 'React'],
      link: 'github.com/alexrivera/resume-core'
    }
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      location: 'Berkeley, CA',
      start_date: '2014',
      end_date: '2018',
      gpa: '3.85 / 4.0'
    }
  ],
  skills: [
    { id: 'sk-1', name: 'Go', level: 95, category: 'Technical' },
    { id: 'sk-2', name: 'Python', level: 90, category: 'Technical' },
    { id: 'sk-3', name: 'TypeScript', level: 88, category: 'Technical' },
    { id: 'sk-4', name: 'Kubernetes', level: 92, category: 'DevOps' },
    { id: 'sk-5', name: 'AWS Cloud', level: 90, category: 'DevOps' },
    { id: 'sk-6', name: 'PostgreSQL', level: 85, category: 'Databases' },
    { id: 'sk-7', name: 'System Architecture', level: 95, category: 'Leadership' }
  ],
  languages: [
    { id: 'lang-1', name: 'English', proficiency: 'Native / Bilingual' },
    { id: 'lang-2', name: 'Spanish', proficiency: 'Professional Working' }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      issue_date: '2023',
      url: 'https://aws.amazon.com'
    },
    {
      id: 'cert-2',
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      issue_date: '2022',
      url: 'https://cncf.io'
    }
  ]
};
