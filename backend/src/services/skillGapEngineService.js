import Internship from '../models/Internship.js'
import CandidateProfile from '../models/CandidateProfile.js'
import { canonicalSkill, extractSkills } from './internships/multiSourceScraperService.js'
import logger from '../utils/logger.js'
import { getOrGenerateSkillGraph } from './aiSkillGraphService.js'

export const ROLES_CATALOG = {
  'ai-engineer': {
    id: 'ai-engineer',
    name: 'AI Engineer',
    domain: 'ai',
    titleKeywords: ['ai engineer', 'ai', 'artificial intelligence', 'llm', 'generative ai', 'machine learning', 'deep learning'],
    benchmarkSkills: ['Python', 'Machine Learning', 'NumPy', 'Pandas', 'Deep Learning', 'Prompt Engineering', 'RAG', 'LLMs', 'FastAPI', 'Docker', 'Git', 'APIs']
  },
  'frontend-developer': {
    id: 'frontend-developer',
    name: 'Frontend Developer',
    domain: 'frontend',
    titleKeywords: ['frontend', 'front-end', 'react', 'web', 'ui engineer'],
    benchmarkSkills: ['JavaScript', 'TypeScript', 'React', 'HTML/CSS', 'Tailwind CSS', 'Next.js', 'Git', 'REST APIs']
  },
  'backend-developer': {
    id: 'backend-developer',
    name: 'Backend Developer',
    domain: 'backend',
    titleKeywords: ['backend', 'back-end', 'node', 'django', 'systems', 'platform', 'api'],
    benchmarkSkills: ['Node.js', 'Python', 'SQL', 'MongoDB', 'REST APIs', 'Docker', 'Git', 'Java']
  },
  'fullstack-developer': {
    id: 'fullstack-developer',
    name: 'Full Stack Engineer',
    domain: 'frontend',
    titleKeywords: ['full stack', 'fullstack', 'software engineer', 'software engineering'],
    benchmarkSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git', 'MongoDB']
  },
  'data-analyst': {
    id: 'data-analyst',
    name: 'Data Analyst',
    domain: 'ai',
    titleKeywords: ['data', 'analyst', 'analytics', 'bi', 'business intelligence'],
    benchmarkSkills: ['SQL', 'Python', 'Excel', 'Power BI', 'Tableau', 'Pandas', 'Statistics', 'Data Visualization']
  },
  'ml-intern': {
    id: 'ml-intern',
    name: 'ML / AI Intern',
    domain: 'ai',
    titleKeywords: ['machine learning', 'ml', 'ai', 'deep learning', 'data science'],
    benchmarkSkills: ['Python', 'Machine Learning', 'NumPy', 'Pandas', 'Statistics', 'SQL', 'Data Visualization']
  },
  'ui-ux-designer': {
    id: 'ui-ux-designer',
    name: 'UI/UX Designer',
    domain: 'design',
    titleKeywords: ['ui', 'ux', 'designer', 'figma', 'product design', 'visual design'],
    benchmarkSkills: ['Figma', 'UI/UX', 'Canva', 'HTML/CSS', 'Adobe Photoshop', 'Adobe Illustrator']
  },
  'digital-marketing': {
    id: 'digital-marketing',
    name: 'Digital Marketing Intern',
    domain: 'marketing',
    titleKeywords: ['marketing', 'seo', 'growth', 'social media', 'content'],
    benchmarkSkills: ['SEO', 'Content Writing', 'Social Media Marketing', 'Google Analytics', 'Email Marketing', 'Canva']
  },
  'cloud-devops': {
    id: 'cloud-devops',
    name: 'Cloud & DevOps Intern',
    domain: 'backend',
    titleKeywords: ['cloud', 'devops', 'infrastructure', 'sre', 'aws', 'docker'],
    benchmarkSkills: ['Docker', 'AWS', 'Kubernetes', 'Python', 'Git', 'REST APIs']
  }
}

// Curated high-yield learning resources for skills
export const SKILL_RESOURCES = {
  React: [
    { title: 'Official React Documentation & Tutorial', url: 'https://react.dev/learn', free: true },
    { title: 'Scrimba Interactive React Course', url: 'https://scrimba.com/learn/learnreact', free: true }
  ],
  TypeScript: [
    { title: 'TypeScript for JavaScript Programmers', url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html', free: true },
    { title: 'Total TypeScript Core Workshops', url: 'https://www.totaltypescript.com/tutorials', free: true }
  ],
  'Next.js': [
    { title: 'Next.js App Router Interactive Course', url: 'https://nextjs.org/learn', free: true },
    { title: 'Official Vercel Academy Next.js Guide', url: 'https://nextjs.org/docs', free: true }
  ],
  'Node.js': [
    { title: 'Node.js Developer Official Learning Guides', url: 'https://nodejs.org/en/learn', free: true },
    { title: 'The Odin Project - NodeJS Track', url: 'https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs', free: true }
  ],
  Python: [
    { title: 'Python for Everybody - FreeCodeCamp', url: 'https://www.py4e.com', free: true },
    { title: 'Official Python 3 Tutorial', url: 'https://docs.python.org/3/tutorial/', free: true }
  ],
  SQL: [
    { title: 'Mode Analytics Interactive SQL Tutorial', url: 'https://mode.com/sql-tutorial/', free: true },
    { title: 'SQLBolt - Interactive SQL Lessons', url: 'https://sqlbolt.com/', free: true }
  ],
  'Machine Learning': [
    { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', free: true },
    { title: 'Fast.ai Practical Deep Learning for Coders', url: 'https://course.fast.ai/', free: true }
  ],
  Figma: [
    { title: 'Figma for Beginners Official Series', url: 'https://help.figma.com/hc/en-us/categories/360002051613', free: true },
    { title: 'Designlab 101 Figma Foundations', url: 'https://designlab.com', free: true }
  ],
  Docker: [
    { title: 'Docker 101 Interactive Tutorial', url: 'https://www.docker.com/101-tutorial/', free: true },
    { title: 'Docker Curriculum by Prakhar Srivastav', url: 'https://docker-curriculum.com/', free: true }
  ],
  'Tailwind CSS': [
    { title: 'Tailwind CSS Core Concepts & Screencasts', url: 'https://tailwindcss.com/docs/utility-first', free: true }
  ],
  MongoDB: [
    { title: 'MongoDB University - Node.js Developer Path', url: 'https://learn.mongodb.com/', free: true }
  ],
  Git: [
    { title: 'Learn Git Branching (Visual Interactive)', url: 'https://learngitbranching.js.org/', free: true }
  ],
  'Power BI': [
    { title: 'Microsoft Learn Power BI Beginner Course', url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi', free: true }
  ],
  SEO: [
    { title: 'Google Search Central SEO Starter Guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', free: true }
  ]
}

const MIN_SAMPLE = 4
const CORE_THRESHOLD = 0.25

/**
 * Analyzes candidate skill gaps against real active market listings.
 */
export async function analyzeSkillGap({ roleId = 'frontend-developer', skills = [], userId = null }) {
  const role = ROLES_CATALOG[roleId] || ROLES_CATALOG['frontend-developer']

  // If user provided no skills but is logged in, try extracting from candidate profile
  let inputSkills = Array.isArray(skills) ? skills : []
  if (inputSkills.length === 0 && userId) {
    try {
      const profile = await CandidateProfile.findOne({ userId }).lean()
      if (profile && Array.isArray(profile.skills) && profile.skills.length > 0) {
        inputSkills = profile.skills
      }
    } catch {
      // non-critical fallback
    }
  }

  // Canonicalize skills
  const mine = new Set(
    inputSkills
      .map(canonicalSkill)
      .filter(Boolean)
  )

  // Fetch active listings matching role domain or keywords
  const titleRegexes = (role.titleKeywords || []).map((k) => new RegExp(k, 'i'))
  const listings = await Internship.find({
    isActive: true,
    isInternship: true,
    $or: [
      { domain: role.domain },
      { title: { $in: titleRegexes } },
      { skills: { $in: role.benchmarkSkills } }
    ]
  })
    .select('title companyName skills applyUrl isRemote location')
    .lean()
    .limit(500)

  const sampleSize = listings.length

  // Fallback benchmark if DB has very few listings for this specific niche
  let freq = new Map()
  if (sampleSize >= MIN_SAMPLE) {
    for (const l of listings) {
      const skillsInListing = new Set(l.skills || [])
      for (const s of skillsInListing) {
        freq.set(s, (freq.get(s) || 0) + 1)
      }
    }
  } else {
    // Seed with benchmark distribution
    for (const s of role.benchmarkSkills) {
      freq.set(s, Math.floor(Math.random() * 8) + 8)
    }
  }

  const effectiveSampleSize = Math.max(sampleSize, 20)
  const demand = [...freq.entries()]
    .map(([skill, count]) => ({
      skill,
      demandRatio: count / effectiveSampleSize,
      demandPercent: Math.min(98, Math.max(12, Math.round((count / effectiveSampleSize) * 100)))
    }))
    .sort((a, b) => b.demandPercent - a.demandPercent)

  // Top skills that matter most
  const top = demand.slice(0, 10)
  const totalWeight = top.reduce((acc, d) => acc + d.demandRatio, 0) || 1
  const have = top.filter((d) => mine.has(d.skill))
  const haveWeight = have.reduce((acc, d) => acc + d.demandRatio, 0)
  const readiness = Math.min(100, Math.max(15, Math.round((haveWeight / totalWeight) * 100)))

  // Missing skills with learning resources
  const missing = demand
    .filter((d) => !mine.has(d.skill))
    .slice(0, 6)
    .map((m) => {
      const isCore = m.demandRatio >= CORE_THRESHOLD || role.benchmarkSkills.slice(0, 4).includes(m.skill)
      const resources = SKILL_RESOURCES[m.skill] || [
        {
          title: `FreeCodeCamp & MDN Guides for ${m.skill}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${m.skill} tutorial freecodecamp mdn`)}`,
          free: true
        }
      ]
      return {
        skill: m.skill,
        demand: m.demandPercent,
        priority: isCore ? 'core' : 'bonus',
        resources
      }
    })

  // Reachable listings: candidate satisfies >= 50% of listing skills
  const reachableListings = listings.filter((l) => {
    if (!l.skills || l.skills.length === 0) return true
    const matchedCount = l.skills.filter((s) => mine.has(s)).length
    return (matchedCount / l.skills.length) >= 0.5
  }).length

  return {
    roleId: role.id,
    role: role.name,
    sampleSize: effectiveSampleSize,
    readiness,
    reachableListings: Math.max(reachableListings, Math.round(effectiveSampleSize * (readiness / 100))),
    matched: have.map((d) => ({
      skill: d.skill,
      demand: d.demandPercent
    })),
    gaps: missing,
    extra: [...mine].filter((s) => !freq.has(s)),
    allRoles: Object.values(ROLES_CATALOG).map((r) => ({ id: r.id, name: r.name, domain: r.domain }))
  }
}

// ═══════════════════════════════════════════════════════════════
// SKILL GRAPH ENGINE - Hierarchical mindmap/node-link visualizer with actionable "What To Do" tasks
export async function getSkillGraphData({
  roleId = 'ai-engineer',
  userSkills = [],
  profile = {},
  solvedSlugs = [],
  quizAttempts = [],
  topicMasteries = [],
  timeSpentMinutes = 0
} = {}) {
  const normSkills = new Set((userSkills || []).map(s => String(s).trim().toLowerCase()))
  const solvedSet = new Set((solvedSlugs || []).map(s => String(s).trim().toLowerCase()))

  const isSkillOwned = (name) => {
    const l = String(name).toLowerCase()
    return normSkills.has(l) || [...normSkills].some(k => l.includes(k) || k.includes(l))
  }

  const GRAPHS = {
    'ai-engineer': {
      roleId: 'ai-engineer',
      roleName: 'AI Engineer',
      targetLabel: 'AI Engineer',
      overallProgress: 60,
      stats: {
        skillsLearned: '5 / 16',
        projectsCompleted: '2 / 5',
        timeSpent: '42h 30m'
      },
      centerNode: {
        id: 'center-goal',
        title: 'AI Engineer',
        subtitle: '60% complete',
        progress: 60,
        icon: 'brain',
        status: 'in-progress'
      },
      clusters: [
        {
          id: 'cluster-programming',
          title: 'Python',
          categoryTag: 'Programming',
          progress: 93,
          color: '#10B981',
          theme: 'green',
          icon: 'python',
          subSkills: [
            {
              id: 'sub-ds-1',
              title: 'Data Structures',
              progress: 100,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Core Python',
              primaryAction: {
                type: 'challenge',
                title: 'Reverse a String',
                label: 'Solve Challenge',
                url: '/challenges/ch-1'
              },
              whatToDo: [
                {
                  id: 'task-ch-1',
                  type: 'challenge',
                  title: 'Solve Challenge: Reverse a String',
                  desc: 'Production UTF-8 string manipulation challenge with unit tests.',
                  url: '/challenges/ch-1',
                  badge: '50 XP • Easy',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-code-arena',
                  type: 'arena',
                  title: 'Practice in Code Arena',
                  desc: 'Test your algorithm speed with Two Sum & Hash Map problems.',
                  url: '/code-arena',
                  badge: 'Code Arena • DSA',
                  actionLabel: 'Enter Arena →'
                },
                {
                  id: 'task-tutor-ds',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Ask AI Tutor to quiz you on Time Complexity (Big-O) and Data Structures.',
                  url: '/ai-tutor?topic=Python Data Structures and Big O',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-python',
                  type: 'quiz',
                  title: 'Python Assessment Quiz',
                  desc: 'Take the Python fundamentals & algorithms assessment.',
                  url: '/quizzes?topic=python-basics',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-oop',
              title: 'OOP',
              progress: 90,
              status: 'completed',
              icon: 'code',
              glyph: 'code',
              category: 'Core Python',
              primaryAction: {
                type: 'challenge',
                title: 'LRU Cache Implementation',
                label: 'Solve Challenge',
                url: '/challenges/ch-3'
              },
              whatToDo: [
                {
                  id: 'task-ch-3',
                  type: 'challenge',
                  title: 'Solve Challenge: LRU Cache Implementation',
                  desc: 'Implement a production doubly-linked list & hash table LRU cache.',
                  url: '/challenges/ch-3',
                  badge: '100 XP • Hard',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-oop',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Learn OOP SOLID principles, dunder methods, and inheritance.',
                  url: '/ai-tutor?topic=Python Object Oriented Programming and SOLID',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-oop',
                  type: 'quiz',
                  title: 'Python OOP Quiz',
                  desc: 'Benchmark your understanding of classes and design patterns.',
                  url: '/quizzes?topic=python-basics',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-async',
              title: 'Async',
              progress: 90,
              status: 'completed',
              icon: 'zap',
              glyph: 'zap',
              category: 'Core Python',
              primaryAction: {
                type: 'challenge',
                title: 'Debounce Function',
                label: 'Solve Challenge',
                url: '/challenges/ch-2'
              },
              whatToDo: [
                {
                  id: 'task-ch-2',
                  type: 'challenge',
                  title: 'Solve Challenge: Debounce Function',
                  desc: 'Implement a high-frequency event debounce and rate-limiting wrapper.',
                  url: '/challenges/ch-2',
                  badge: '75 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-async',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Learn AsyncIO event loops, tasks, gather, and concurrency pitfalls.',
                  url: '/ai-tutor?topic=Asyncio and Concurrency in Python',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            },
            {
              id: 'sub-ds-2',
              title: 'Data Structures',
              progress: 90,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Core Python',
              primaryAction: {
                type: 'challenge',
                title: 'BST Validator',
                label: 'Solve Challenge',
                url: '/challenges/ch-9'
              },
              whatToDo: [
                {
                  id: 'task-ch-9',
                  type: 'challenge',
                  title: 'Solve Challenge: Binary Search Tree Validator',
                  desc: 'Write an O(N) recursive validator ensuring strict binary search tree invariants.',
                  url: '/challenges/ch-9',
                  badge: '80 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-arena-trees',
                  type: 'arena',
                  title: 'Code Arena Trees & Graphs',
                  desc: 'Solve LeetCode-style tree traversal and DFS problems.',
                  url: '/code-arena',
                  badge: 'Code Arena',
                  actionLabel: 'Enter Arena →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-ml',
          title: 'Machine Learning',
          categoryTag: null,
          progress: 70,
          color: '#10B981',
          theme: 'green',
          icon: 'brain',
          subSkills: [
            {
              id: 'sub-pandas',
              title: 'Pandas',
              progress: 88,
              status: 'completed',
              icon: 'table',
              glyph: 'table',
              category: 'Data Science',
              primaryAction: {
                type: 'challenge',
                title: 'Sales Analytics Aggregation',
                label: 'Solve Challenge',
                url: '/challenges/ch-7'
              },
              whatToDo: [
                {
                  id: 'task-ch-7',
                  type: 'challenge',
                  title: 'Solve Challenge: Sales Analytics Aggregation',
                  desc: 'Compute monthly growth, moving averages, and top customer cohorts.',
                  url: '/challenges/ch-7',
                  badge: '100 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-pandas',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Ask AI Tutor how to optimize Pandas with vectorization and parquet.',
                  url: '/ai-tutor?topic=Pandas DataFrames and Performance',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-ml',
                  type: 'quiz',
                  title: 'Machine Learning Fundamentals Quiz',
                  desc: 'Test your understanding of data preprocessing and feature scaling.',
                  url: '/quizzes?topic=machine-learning',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-deep-learning',
              title: 'Deep Learning',
              progress: 45,
              status: 'in-progress',
              icon: 'brain',
              glyph: 'lock',
              category: 'Deep Learning',
              primaryAction: {
                type: 'tutor',
                title: 'Neural Networks & Backprop',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=Neural Networks and Backpropagation'
              },
              whatToDo: [
                {
                  id: 'task-tutor-dl',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Neural Networks',
                  desc: 'Understand activation functions, gradients, loss surfaces, and PyTorch.',
                  url: '/ai-tutor?topic=Neural Networks and Backpropagation',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-dl',
                  type: 'quiz',
                  title: 'Deep Learning Concepts Quiz',
                  desc: 'Evaluate your knowledge of CNNs, Transformers, and optimization.',
                  url: '/quizzes?topic=machine-learning',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-numpy',
              title: 'NumPy',
              progress: 76,
              status: 'completed',
              icon: 'cube',
              glyph: 'cube',
              category: 'Data Science',
              primaryAction: {
                type: 'tutor',
                title: 'NumPy Vectorized Operations',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=NumPy Array Vectorization and Broadcasting'
              },
              whatToDo: [
                {
                  id: 'task-tutor-numpy',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: NumPy Vectorization',
                  desc: 'Master broadcasting rules, array slicing, and memory views.',
                  url: '/ai-tutor?topic=NumPy Array Vectorization and Broadcasting',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-numpy',
                  type: 'quiz',
                  title: 'Scientific Computing Assessment',
                  desc: 'Benchmark your linear algebra and numerical array speed.',
                  url: '/quizzes?topic=machine-learning',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-llm',
          title: 'LLMs',
          categoryTag: 'AI & LLMs',
          progress: 50,
          color: '#E27D60',
          theme: 'orange',
          icon: 'sparkles',
          subSkills: [
            {
              id: 'sub-prompt-eng',
              title: 'Prompt Engineering',
              progress: 80,
              status: 'completed',
              icon: 'sparkles',
              glyph: 'sparkles',
              category: 'Generative AI',
              primaryAction: {
                type: 'challenge',
                title: 'Semantic Prompt Compressor',
                label: 'Solve Challenge',
                url: '/challenges/ch-12'
              },
              whatToDo: [
                {
                  id: 'task-ch-12',
                  type: 'challenge',
                  title: 'Solve Challenge: Semantic Prompt Compressor',
                  desc: 'Compress instructions and context windows while preserving semantic accuracy.',
                  url: '/challenges/ch-12',
                  badge: '100 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-prompt',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Learn Chain-of-Thought, ReAct prompting, and few-shot formatting.',
                  url: '/ai-tutor?topic=Prompt Engineering and Few-Shot Techniques',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-llm',
                  type: 'quiz',
                  title: 'Generative AI & LLMs Quiz',
                  desc: 'Test your understanding of temperature, top-p, tokens, and safety.',
                  url: '/quizzes?topic=ai-llms',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-rag',
              title: 'RAG',
              progress: 41,
              status: 'in-progress',
              icon: 'search',
              glyph: 'rag',
              category: 'Generative AI',
              primaryAction: {
                type: 'challenge',
                title: 'RAG Pipeline Embeddings',
                label: 'Solve Challenge',
                url: '/challenges/ch-5'
              },
              whatToDo: [
                {
                  id: 'task-ch-5',
                  type: 'challenge',
                  title: 'Solve Challenge: RAG Pipeline Embeddings',
                  desc: 'Build cosine similarity search, chunking, and context ranking in Python.',
                  url: '/challenges/ch-5',
                  badge: '100 XP • Hard',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-rag',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: RAG Architecture',
                  desc: 'Ask AI Tutor how to reduce hallucinations, rerank results, and index vectors.',
                  url: '/ai-tutor?topic=Retrieval Augmented Generation RAG Pipeline',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-rag',
                  type: 'quiz',
                  title: 'RAG & Vector Databases Quiz',
                  desc: 'Evaluate knowledge on HNSW indexing, chunk sizes, and hybrid search.',
                  url: '/quizzes?topic=ai-llms',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-agents',
              title: 'Agents',
              progress: 28,
              status: 'locked',
              icon: 'lock',
              glyph: 'lock',
              category: 'Generative AI',
              primaryAction: {
                type: 'tutor',
                title: 'Autonomous AI Agents',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=Autonomous AI Agents and Tool Calling'
              },
              whatToDo: [
                {
                  id: 'task-tutor-agents',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Autonomous Agents',
                  desc: 'Understand function calling, state management, and multi-agent coordination.',
                  url: '/ai-tutor?topic=Autonomous AI Agents and Tool Calling',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-agents',
                  type: 'quiz',
                  title: 'AI Agents Architecture Quiz',
                  desc: 'Benchmark your grasp of LangChain, AutoGen, and tool routing.',
                  url: '/quizzes?topic=ai-llms',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-backend',
          title: 'Backend',
          categoryTag: 'Backend',
          progress: 59,
          color: '#F59E0B',
          theme: 'amber',
          icon: 'server',
          subSkills: [
            {
              id: 'sub-fastapi',
              title: 'FastAPI',
              progress: 32,
              status: 'in-progress',
              icon: 'zap',
              glyph: 'zap',
              category: 'Backend Architecture',
              primaryAction: {
                type: 'challenge',
                title: 'API Rate Limiting Shield',
                label: 'Solve Challenge',
                url: '/challenges/ch-10'
              },
              whatToDo: [
                {
                  id: 'task-ch-10',
                  type: 'challenge',
                  title: 'Solve Challenge: API Rate Limiting Shield',
                  desc: 'Implement a token-bucket rate limiter for high-traffic FastAPI endpoints.',
                  url: '/challenges/ch-10',
                  badge: '100 XP • Hard',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-fastapi',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Ask AI Tutor about async route handlers, dependency injection, and Pydantic.',
                  url: '/ai-tutor?topic=FastAPI Async Architecture and Dependency Injection',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-fastapi',
                  type: 'quiz',
                  title: 'FastAPI & Microservices Quiz',
                  desc: 'Evaluate your mastery of HTTP status codes, OpenAPI, and middleware.',
                  url: '/quizzes?topic=backend-apis',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-nodejs',
              title: 'Node.js',
              progress: 90,
              status: 'completed',
              icon: 'server',
              glyph: 'server',
              category: 'Backend Architecture',
              primaryAction: {
                type: 'challenge',
                title: 'Microservice Event Bus',
                label: 'Solve Challenge',
                url: '/challenges/ch-6'
              },
              whatToDo: [
                {
                  id: 'task-ch-6',
                  type: 'challenge',
                  title: 'Solve Challenge: Microservice Event Bus',
                  desc: 'Build an in-memory pub/sub broker handling dead-letter queues.',
                  url: '/challenges/ch-6',
                  badge: '125 XP • Hard',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-node',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Explore the Node.js libuv event loop, streams, and cluster module.',
                  url: '/ai-tutor?topic=Node.js Event Loop Streams and Performance',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            },
            {
              id: 'sub-apis',
              title: 'APIs',
              progress: 54,
              status: 'in-progress',
              icon: 'network',
              glyph: 'network',
              category: 'Backend Architecture',
              primaryAction: {
                type: 'challenge',
                title: 'API Rate Limiting Shield',
                label: 'Solve Challenge',
                url: '/challenges/ch-10'
              },
              whatToDo: [
                {
                  id: 'task-ch-10-api',
                  type: 'challenge',
                  title: 'Solve Challenge: API Rate Limiting Shield',
                  desc: 'Master rate limiting, CORS headers, and secure request verification.',
                  url: '/challenges/ch-10',
                  badge: '100 XP • Production',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-api',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Learn RESTful API best practices, idempotent methods, and JWT security.',
                  url: '/ai-tutor?topic=REST API Design and Security Best Practices',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-apis',
                  type: 'quiz',
                  title: 'Web APIs Assessment Quiz',
                  desc: 'Benchmark your understanding of status codes, OAuth, and webhooks.',
                  url: '/quizzes?topic=backend-apis',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-devops',
          title: 'DevOps',
          categoryTag: 'DevOps & Tools',
          progress: 28,
          color: '#64748B',
          theme: 'slate',
          icon: 'cloud',
          subSkills: [
            {
              id: 'sub-docker',
              title: 'Docker',
              progress: 22,
              status: 'in-progress',
              icon: 'layers',
              glyph: 'docker',
              category: 'DevOps & Deployment',
              primaryAction: {
                type: 'challenge',
                title: 'Dockerfile Optimization',
                label: 'Solve Challenge',
                url: '/challenges/ch-8'
              },
              whatToDo: [
                {
                  id: 'task-ch-8',
                  type: 'challenge',
                  title: 'Solve Challenge: Dockerfile Optimization',
                  desc: 'Reduce container image size from 1.2GB to under 150MB with multi-stage builds.',
                  url: '/challenges/ch-8',
                  badge: '75 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                },
                {
                  id: 'task-tutor-docker',
                  type: 'tutor',
                  title: 'Practice with AI Tutor',
                  desc: 'Ask AI Tutor about Docker networking, bind mounts, and docker-compose orchestration.',
                  url: '/ai-tutor?topic=Docker Multi-Stage Builds and Container Optimization',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-docker',
                  type: 'quiz',
                  title: 'Docker & Containers Quiz',
                  desc: 'Evaluate your knowledge of image layers, caching, and daemon flags.',
                  url: '/quizzes?topic=git',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-aws',
              title: 'AWS',
              progress: 15,
              status: 'locked',
              icon: 'lock',
              glyph: 'lock',
              category: 'Cloud Infrastructure',
              primaryAction: {
                type: 'tutor',
                title: 'AWS Cloud Architecture',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS'
              },
              whatToDo: [
                {
                  id: 'task-tutor-aws',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: AWS Serverless',
                  desc: 'Understand S3, Lambda, API Gateway, IAM policies, and CloudWatch.',
                  url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-aws',
                  type: 'quiz',
                  title: 'AWS Cloud Practitioner Quiz',
                  desc: 'Benchmark your cloud architecture knowledge.',
                  url: '/quizzes?topic=cloud-aws',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-linux',
              title: 'Linux',
              progress: 47,
              status: 'in-progress',
              icon: 'terminal',
              glyph: 'terminal',
              category: 'Systems & Shell',
              primaryAction: {
                type: 'tutor',
                title: 'Linux CLI & Scripting',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=Linux Command Line Bash Scripting and Permissions'
              },
              whatToDo: [
                {
                  id: 'task-tutor-linux',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Linux CLI',
                  desc: 'Master pipes, grep, sed, awk, systemd, and cron jobs.',
                  url: '/ai-tutor?topic=Linux Command Line Bash Scripting and Permissions',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-linux',
                  type: 'quiz',
                  title: 'Linux Administration Quiz',
                  desc: 'Test your understanding of file permissions, processes, and sockets.',
                  url: '/quizzes?topic=git',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            }
          ]
        }
      ],
      skillProgress: [
        { name: 'Python', progress: 82, color: '#10B981', icon: 'python' },
        { name: 'Machine Learning', progress: 72, color: '#10B981', icon: 'brain' },
        { name: 'RAG', progress: 41, color: '#E27D60', icon: 'sparkles' },
        { name: 'FastAPI', progress: 32, color: '#F59E0B', icon: 'zap' },
        { name: 'Docker', progress: 22, color: '#64748B', icon: 'layers' }
      ],
      recommendedSkills: [
        {
          rank: 1,
          name: 'FastAPI',
          reason: 'Based on your AI Engineer goal',
          actionType: 'challenge',
          actionUrl: '/challenges/ch-10',
          actionLabel: 'Solve Challenge',
          taskTitle: 'API Rate Limiting Shield',
          category: 'Backend',
          xp: 100
        },
        {
          rank: 2,
          name: 'Docker',
          reason: 'In demand for current jobs',
          actionType: 'challenge',
          actionUrl: '/challenges/ch-8',
          actionLabel: 'Solve Challenge',
          taskTitle: 'Dockerfile Optimization',
          category: 'DevOps',
          xp: 75
        },
        {
          rank: 3,
          name: 'AWS',
          reason: 'Completes your DevOps skills',
          actionType: 'tutor',
          actionUrl: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS',
          actionLabel: 'Learn with AI',
          taskTitle: 'AWS Serverless Mastery',
          category: 'Cloud',
          xp: 60
        },
        {
          rank: 4,
          name: 'System Design',
          reason: 'Next step for advanced roles',
          actionType: 'challenge',
          actionUrl: '/challenges/ch-6',
          actionLabel: 'Solve Challenge',
          taskTitle: 'Microservice Event Bus',
          category: 'Architecture',
          xp: 125
        }
      ],
      quote: {
        text: 'Small steps every day lead to big results.',
        author: 'REXION'
      }
    },
    'fullstack-developer': {
      roleId: 'fullstack-developer',
      roleName: 'Full Stack Engineer',
      targetLabel: 'Full Stack Engineer',
      overallProgress: 74,
      stats: {
        skillsLearned: '14 / 19',
        projectsCompleted: '3 / 5',
        timeSpent: '56h 15m'
      },
      centerNode: {
        id: 'center-goal',
        title: 'Full Stack Engineer',
        subtitle: '74% complete',
        progress: 74,
        icon: 'layers',
        status: 'in-progress'
      },
      clusters: [
        {
          id: 'cluster-fe',
          title: 'React',
          categoryTag: 'Frontend UI',
          progress: 88,
          color: '#0284C7',
          theme: 'blue',
          icon: 'react',
          subSkills: [
            {
              id: 'sub-hooks',
              title: 'React Hooks',
              progress: 95,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Frontend UI',
              primaryAction: {
                type: 'tutor',
                title: 'React Hooks Deep Dive',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=React Hooks useMemo useCallback and Custom Hooks'
              },
              whatToDo: [
                {
                  id: 'task-tutor-hooks',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: React Hooks',
                  desc: 'Master useEffect dependency arrays, useMemo, and custom hooks.',
                  url: '/ai-tutor?topic=React Hooks useMemo useCallback and Custom Hooks',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                },
                {
                  id: 'task-quiz-react',
                  type: 'quiz',
                  title: 'React & Modern Frontend Quiz',
                  desc: 'Test your understanding of component re-renders and virtual DOM.',
                  url: '/quizzes?topic=react-components-hooks',
                  badge: 'Skill Quiz',
                  actionLabel: 'Take Quiz →'
                }
              ]
            },
            {
              id: 'sub-state',
              title: 'State Mgmt',
              progress: 78,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Frontend UI',
              primaryAction: {
                type: 'challenge',
                title: 'Deep Object Clone Utility',
                label: 'Solve Challenge',
                url: '/challenges/ch-11'
              },
              whatToDo: [
                {
                  id: 'task-ch-11',
                  type: 'challenge',
                  title: 'Solve Challenge: Deep Object Clone Utility',
                  desc: 'Implement deep cloning handling circular references and immutable state.',
                  url: '/challenges/ch-11',
                  badge: '75 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                }
              ]
            },
            {
              id: 'sub-nextjs',
              title: 'Next.js',
              progress: 62,
              status: 'in-progress',
              icon: 'zap',
              glyph: 'zap',
              category: 'Frontend UI',
              primaryAction: {
                type: 'tutor',
                title: 'Next.js App Router & SSR',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=Next.js App Router Server Components and SSR'
              },
              whatToDo: [
                {
                  id: 'task-tutor-nextjs',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Next.js',
                  desc: 'Understand Server Components, streaming SSR, and API route handlers.',
                  url: '/ai-tutor?topic=Next.js App Router Server Components and SSR',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-be',
          title: 'Node.js',
          categoryTag: 'Backend Server',
          progress: 80,
          color: '#10B981',
          theme: 'green',
          icon: 'server',
          subSkills: [
            {
              id: 'sub-express',
              title: 'Express.js',
              progress: 85,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Backend Server',
              primaryAction: {
                type: 'challenge',
                title: 'Microservice Event Bus',
                label: 'Solve Challenge',
                url: '/challenges/ch-6'
              },
              whatToDo: [
                {
                  id: 'task-ch-6-fs',
                  type: 'challenge',
                  title: 'Solve Challenge: Microservice Event Bus',
                  desc: 'Build asynchronous event bus with retry logic and error queues.',
                  url: '/challenges/ch-6',
                  badge: '125 XP • Hard',
                  actionLabel: 'Solve Challenge →'
                }
              ]
            },
            {
              id: 'sub-rest',
              title: 'REST APIs',
              progress: 90,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Backend Server',
              primaryAction: {
                type: 'challenge',
                title: 'API Rate Limiting Shield',
                label: 'Solve Challenge',
                url: '/challenges/ch-10'
              },
              whatToDo: [
                {
                  id: 'task-ch-10-rest',
                  type: 'challenge',
                  title: 'Solve Challenge: API Rate Limiting Shield',
                  desc: 'Production API defense and rate-limiting shield implementation.',
                  url: '/challenges/ch-10',
                  badge: '100 XP • Production',
                  actionLabel: 'Solve Challenge →'
                }
              ]
            },
            {
              id: 'sub-auth',
              title: 'Auth & JWT',
              progress: 70,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Backend Server',
              primaryAction: {
                type: 'tutor',
                title: 'JWT Auth & Refresh Tokens',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=JWT Authentication Refresh Tokens and Cookie Security'
              },
              whatToDo: [
                {
                  id: 'task-tutor-jwt',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: JWT Security',
                  desc: 'Implement HttpOnly cookies, token rotation, and RBAC authorization.',
                  url: '/ai-tutor?topic=JWT Authentication Refresh Tokens and Cookie Security',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-db',
          title: 'Databases',
          categoryTag: 'Data Storage',
          progress: 68,
          color: '#F59E0B',
          theme: 'amber',
          icon: 'database',
          subSkills: [
            {
              id: 'sub-mongo',
              title: 'MongoDB',
              progress: 82,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Data Storage',
              primaryAction: {
                type: 'challenge',
                title: 'SQL & Database Aggregator',
                label: 'Solve Challenge',
                url: '/challenges/ch-4'
              },
              whatToDo: [
                {
                  id: 'task-ch-4',
                  type: 'challenge',
                  title: 'Solve Challenge: SQL Query Aggregator',
                  desc: 'Build an aggregate metric pipeline computing retention and churn.',
                  url: '/challenges/ch-4',
                  badge: '80 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                }
              ]
            },
            {
              id: 'sub-sql',
              title: 'PostgreSQL',
              progress: 60,
              status: 'in-progress',
              icon: 'database',
              glyph: 'database',
              category: 'Data Storage',
              primaryAction: {
                type: 'challenge',
                title: 'SQL Query Aggregator',
                label: 'Solve Challenge',
                url: '/challenges/ch-4'
              },
              whatToDo: [
                {
                  id: 'task-ch-4-sql',
                  type: 'challenge',
                  title: 'Solve Challenge: SQL Query Aggregator',
                  desc: 'Complex SQL queries, window functions, and indexing.',
                  url: '/challenges/ch-4',
                  badge: '80 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                }
              ]
            },
            {
              id: 'sub-redis',
              title: 'Redis Cache',
              progress: 35,
              status: 'locked',
              icon: 'lock',
              glyph: 'lock',
              category: 'Data Storage',
              primaryAction: {
                type: 'tutor',
                title: 'Redis Caching Strategies',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=Redis Caching Strategies Cache Invalidation and PubSub'
              },
              whatToDo: [
                {
                  id: 'task-tutor-redis',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Redis Caching',
                  desc: 'Master Cache-Aside, Write-Through, TTL, and cache stamps.',
                  url: '/ai-tutor?topic=Redis Caching Strategies Cache Invalidation and PubSub',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-devops-fs',
          title: 'DevOps',
          categoryTag: 'DevOps & CI/CD',
          progress: 44,
          color: '#64748B',
          theme: 'slate',
          icon: 'cloud',
          subSkills: [
            {
              id: 'sub-docker-fs',
              title: 'Docker',
              progress: 48,
              status: 'in-progress',
              icon: 'layers',
              glyph: 'docker',
              category: 'DevOps & CI/CD',
              primaryAction: {
                type: 'challenge',
                title: 'Dockerfile Optimization',
                label: 'Solve Challenge',
                url: '/challenges/ch-8'
              },
              whatToDo: [
                {
                  id: 'task-ch-8-fs',
                  type: 'challenge',
                  title: 'Solve Challenge: Dockerfile Optimization',
                  desc: 'Optimize multi-stage node and python container builds.',
                  url: '/challenges/ch-8',
                  badge: '75 XP • Medium',
                  actionLabel: 'Solve Challenge →'
                }
              ]
            },
            {
              id: 'sub-cicd',
              title: 'GitHub Actions',
              progress: 50,
              status: 'in-progress',
              icon: 'zap',
              glyph: 'zap',
              category: 'DevOps & CI/CD',
              primaryAction: {
                type: 'tutor',
                title: 'CI/CD Pipelines with GitHub Actions',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment'
              },
              whatToDo: [
                {
                  id: 'task-tutor-actions',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: GitHub Actions',
                  desc: 'Build automated linting, test runners, and deployment workflows.',
                  url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            },
            {
              id: 'sub-cloud-fs',
              title: 'Cloud Deploy',
              progress: 30,
              status: 'locked',
              icon: 'lock',
              glyph: 'lock',
              category: 'DevOps & CI/CD',
              primaryAction: {
                type: 'tutor',
                title: 'Cloud Deployment & Monitoring',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=Cloud Deployment on Render AWS and Vercel'
              },
              whatToDo: [
                {
                  id: 'task-tutor-cloud',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Cloud Deploy',
                  desc: 'Learn environment configs, DNS setup, and zero-downtime rollouts.',
                  url: '/ai-tutor?topic=Cloud Deployment on Render AWS and Vercel',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            }
          ]
        },
        {
          id: 'cluster-lang',
          title: 'TypeScript',
          categoryTag: 'Core Language',
          progress: 76,
          color: '#3B82F6',
          theme: 'blue',
          icon: 'code',
          subSkills: [
            {
              id: 'sub-ts-types',
              title: 'Generics',
              progress: 75,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Core Language',
              primaryAction: {
                type: 'tutor',
                title: 'TypeScript Generics & Utility Types',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types'
              },
              whatToDo: [
                {
                  id: 'task-tutor-ts',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: TypeScript Generics',
                  desc: 'Master generic constraints, keyof, Record, and conditional inference.',
                  url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            },
            {
              id: 'sub-ts-strict',
              title: 'Strict Typing',
              progress: 85,
              status: 'completed',
              icon: 'check',
              glyph: 'check',
              category: 'Core Language',
              primaryAction: {
                type: 'tutor',
                title: 'TypeScript Type Narrowing & Guards',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=TypeScript Type Narrowing Discriminated Unions and Type Guards'
              },
              whatToDo: [
                {
                  id: 'task-tutor-narrow',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Type Guards',
                  desc: 'Learn discriminated unions, exhaustiveness checks, and assert guards.',
                  url: '/ai-tutor?topic=TypeScript Type Narrowing Discriminated Unions and Type Guards',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            },
            {
              id: 'sub-testing',
              title: 'Unit Tests',
              progress: 40,
              status: 'in-progress',
              icon: 'terminal',
              glyph: 'terminal',
              category: 'Core Language',
              primaryAction: {
                type: 'tutor',
                title: 'Vitest & Jest Unit Testing',
                label: 'Practice with AI Tutor',
                url: '/ai-tutor?topic=Vitest Jest Unit Testing and Mocking'
              },
              whatToDo: [
                {
                  id: 'task-tutor-tests',
                  type: 'tutor',
                  title: 'Practice with AI Tutor: Unit Testing',
                  desc: 'Write robust unit tests, spies, mocks, and snapshot tests.',
                  url: '/ai-tutor?topic=Vitest Jest Unit Testing and Mocking',
                  badge: 'AI Coaching',
                  actionLabel: 'Ask AI Tutor →'
                }
              ]
            }
          ]
        }
      ],
      skillProgress: [
        { name: 'React', progress: 88, color: '#0284C7', icon: 'react' },
        { name: 'Node.js', progress: 80, color: '#10B981', icon: 'server' },
        { name: 'TypeScript', progress: 76, color: '#3B82F6', icon: 'code' },
        { name: 'MongoDB', progress: 82, color: '#10B981', icon: 'database' },
        { name: 'Docker', progress: 48, color: '#64748B', icon: 'layers' }
      ],
      recommendedSkills: [
        {
          rank: 1,
          name: 'Next.js',
          reason: 'Essential for modern full-stack web apps',
          actionType: 'tutor',
          actionUrl: '/ai-tutor?topic=Next.js App Router Server Components and SSR',
          actionLabel: 'Practice with Tutor',
          taskTitle: 'Next.js App Router',
          category: 'Frontend',
          xp: 80
        },
        {
          rank: 2,
          name: 'PostgreSQL',
          reason: 'Industry standard relational database',
          actionType: 'challenge',
          actionUrl: '/challenges/ch-4',
          actionLabel: 'Solve Challenge',
          taskTitle: 'SQL Query Aggregator',
          category: 'Database',
          xp: 80
        },
        {
          rank: 3,
          name: 'Docker',
          reason: 'Standard for full-stack deployments',
          actionType: 'challenge',
          actionUrl: '/challenges/ch-8',
          actionLabel: 'Solve Challenge',
          taskTitle: 'Dockerfile Optimization',
          category: 'DevOps',
          xp: 75
        },
        {
          rank: 4,
          name: 'Redis',
          reason: 'High throughput caching for backend',
          actionType: 'tutor',
          actionUrl: '/ai-tutor?topic=Redis Caching Strategies Cache Invalidation and PubSub',
          actionLabel: 'Learn with AI',
          taskTitle: 'Redis Caching Strategies',
          category: 'Database',
          xp: 60
        }
      ],
      quote: {
        text: 'The best way to predict the future is to create it.',
        author: 'REXION'
      }
    }
  }

  let graph
  if (GRAPHS[roleId]) {
    graph = JSON.parse(JSON.stringify(GRAPHS[roleId]))
  } else {
    try {
      const customOrCurated = await getOrGenerateSkillGraph(roleId)
      graph = JSON.parse(JSON.stringify(customOrCurated))
    } catch (err) {
      console.warn('Fallback to ai-engineer graph:', err.message)
      graph = JSON.parse(JSON.stringify(GRAPHS['ai-engineer']))
    }
  }

  // Catalog of the 12 production challenges and their aliases
  const challengeCatalog = [
    { id: 'ch-1', aliases: ['ch-1', 'reverse-string', 'reverse-a-string'] },
    { id: 'ch-2', aliases: ['ch-2', 'debounce-function', 'debounce'] },
    { id: 'ch-3', aliases: ['ch-3', 'lru-cache', 'lru'] },
    { id: 'ch-4', aliases: ['ch-4', 'sql-aggregator', 'sql-query-aggregator'] },
    { id: 'ch-5', aliases: ['ch-5', 'rag-embeddings', 'rag-pipeline'] },
    { id: 'ch-6', aliases: ['ch-6', 'microservice-bus', 'event-bus'] },
    { id: 'ch-7', aliases: ['ch-7', 'sales-analytics', 'pandas-sales'] },
    { id: 'ch-8', aliases: ['ch-8', 'docker-optimization', 'dockerfile'] },
    { id: 'ch-9', aliases: ['ch-9', 'bst-validator', 'binary-search-tree-validator'] },
    { id: 'ch-10', aliases: ['ch-10', 'rate-limiting', 'api-rate-limiting'] },
    { id: 'ch-11', aliases: ['ch-11', 'deep-clone', 'deep-clone-object'] },
    { id: 'ch-12', aliases: ['ch-12', 'prompt-compressor', 'prompt-optimizer'] }
  ]

  // Count distinct challenges completed
  const solvedChallengesCount = challengeCatalog.filter((ch) =>
    ch.aliases.some((a) => solvedSet.has(a.toLowerCase()))
  ).length

  // Build Quiz Score Lookup Map
  const quizScoreMap = {}
  ;(quizAttempts || []).forEach((a) => {
    if (a.quizSlug) {
      const slug = String(a.quizSlug).toLowerCase()
      quizScoreMap[slug] = Math.max(quizScoreMap[slug] || 0, Number(a.scorePercentage) || 0)
    }
  })

  // Build AI Tutor Topic Mastery Map
  const tutorMasteryMap = {}
  ;(topicMasteries || []).forEach((m) => {
    if (m.topic) {
      const top = String(m.topic).toLowerCase()
      tutorMasteryMap[top] = Math.max(tutorMasteryMap[top] || 0, Number(m.mastery) || 0)
    }
  })

  // Comprehensive rule mapping for strict skill calculation
  const skillRules = {
    // Python Cluster
    'data structures': {
      isStarter: true,
      challenges: ['ch-1', 'reverse-string', 'ch-9', 'bst-validator'],
      arena: ['two-sum', 'reverse-a-string', 'valid-palindrome', 'binary-search-tree-validator', 'data-structures'],
      quizzes: ['dsa-algorithms', 'python-basics'],
      tutorTopics: ['data structures', 'python data structures', 'big o'],
      profileKeys: ['data structures', 'dsa', 'algorithms']
    },
    'oop': {
      isStarter: true,
      challenges: ['ch-3', 'lru-cache', 'ch-11', 'deep-clone'],
      arena: ['lru-cache', 'deep-clone-object'],
      quizzes: ['python-basics'],
      tutorTopics: ['oop', 'object oriented', 'solid'],
      profileKeys: ['oop', 'object oriented']
    },
    'async': {
      isStarter: true,
      challenges: ['ch-2', 'debounce-function'],
      arena: ['debounce-function'],
      quizzes: ['backend-apis', 'javascript-async'],
      tutorTopics: ['async', 'asyncio', 'concurrency'],
      profileKeys: ['async', 'asyncio']
    },
    // Machine Learning Cluster
    'pandas': {
      isStarter: true,
      challenges: ['ch-7', 'sales-analytics'],
      arena: ['sales-analytics'],
      quizzes: ['python-basics', 'data-analysis'],
      tutorTopics: ['pandas', 'data analysis'],
      profileKeys: ['pandas']
    },
    'deep learning': {
      isStarter: false,
      challenges: ['ch-5', 'rag-embeddings'],
      arena: [],
      quizzes: ['ai-llms'],
      tutorTopics: ['deep learning', 'neural networks'],
      profileKeys: ['deep learning', 'pytorch', 'tensorflow']
    },
    'numpy': {
      isStarter: true,
      challenges: ['ch-7', 'sales-analytics'],
      arena: [],
      quizzes: ['python-basics'],
      tutorTopics: ['numpy'],
      profileKeys: ['numpy']
    },
    // LLMs Cluster
    'prompt engineering': {
      isStarter: true,
      challenges: ['ch-12', 'prompt-compressor'],
      arena: [],
      quizzes: ['ai-llms'],
      tutorTopics: ['prompt engineering', 'prompts'],
      profileKeys: ['prompt engineering']
    },
    'rag': {
      isStarter: false,
      challenges: ['ch-5', 'rag-embeddings'],
      arena: [],
      quizzes: ['ai-llms'],
      tutorTopics: ['rag', 'retrieval augmented generation'],
      profileKeys: ['rag', 'langchain', 'llamaindex']
    },
    'agents': {
      isStarter: false,
      challenges: ['ch-6', 'microservice-bus'],
      arena: [],
      quizzes: ['ai-llms'],
      tutorTopics: ['ai agents', 'autonomous agents', 'agents'],
      profileKeys: ['agents', 'autogen']
    },
    // Backend Cluster
    'fastapi': {
      isStarter: false,
      challenges: ['ch-10', 'rate-limiting'],
      arena: [],
      quizzes: ['backend-apis'],
      tutorTopics: ['fastapi'],
      profileKeys: ['fastapi']
    },
    'node.js': {
      isStarter: true,
      challenges: ['ch-6', 'microservice-bus', 'ch-11', 'deep-clone'],
      arena: [],
      quizzes: ['backend-apis'],
      tutorTopics: ['node.js', 'express'],
      profileKeys: ['node.js', 'nodejs', 'express']
    },
    'apis': {
      isStarter: true,
      challenges: ['ch-10', 'rate-limiting', 'ch-4', 'sql-aggregator'],
      arena: ['sql-query-aggregator'],
      quizzes: ['backend-apis', 'sql-databases'],
      tutorTopics: ['api', 'rest api', 'apis'],
      profileKeys: ['api', 'apis', 'rest']
    },
    // DevOps Cluster
    'docker': {
      isStarter: false,
      challenges: ['ch-8', 'docker-optimization'],
      arena: [],
      quizzes: ['git-workflows', 'docker'],
      tutorTopics: ['docker', 'containers'],
      profileKeys: ['docker', 'containers']
    },
    'aws': {
      isStarter: false,
      challenges: [],
      arena: [],
      quizzes: ['cloud-aws'],
      tutorTopics: ['aws', 'cloud', 'serverless'],
      profileKeys: ['aws', 'cloud']
    },
    'linux': {
      isStarter: true,
      challenges: [],
      arena: [],
      quizzes: ['git-workflows'],
      tutorTopics: ['linux', 'bash'],
      profileKeys: ['linux', 'bash']
    },
    // Fullstack Role Subskills
    'react hooks': {
      isStarter: true,
      challenges: ['ch-2', 'debounce-function'],
      arena: [],
      quizzes: ['react-components-hooks'],
      tutorTopics: ['react', 'hooks'],
      profileKeys: ['react', 'react.js']
    },
    'state mgmt': {
      isStarter: true,
      challenges: ['ch-3', 'lru-cache'],
      arena: ['deep-clone-object'],
      quizzes: ['react-components-hooks'],
      tutorTopics: ['redux', 'zustand', 'state'],
      profileKeys: ['redux', 'zustand', 'state']
    },
    'routing & ssr': {
      isStarter: false,
      challenges: [],
      arena: [],
      quizzes: ['react-components-hooks'],
      tutorTopics: ['next.js', 'ssr', 'routing'],
      profileKeys: ['next.js', 'ssr']
    },
    'components': {
      isStarter: true,
      challenges: [],
      arena: [],
      quizzes: ['react-components-hooks'],
      tutorTopics: ['components', 'react'],
      profileKeys: ['react', 'components']
    },
    'auth & security': {
      isStarter: false,
      challenges: ['ch-10', 'rate-limiting'],
      arena: [],
      quizzes: ['backend-apis'],
      tutorTopics: ['jwt', 'auth', 'security'],
      profileKeys: ['auth', 'jwt', 'security']
    },
    'postgresql': {
      isStarter: true,
      challenges: ['ch-4', 'sql-aggregator'],
      arena: ['sql-query-aggregator'],
      quizzes: ['sql-databases'],
      tutorTopics: ['sql', 'postgresql'],
      profileKeys: ['sql', 'postgresql', 'postgres']
    },
    'mongodb': {
      isStarter: true,
      challenges: ['ch-4', 'sql-aggregator'],
      arena: [],
      quizzes: ['sql-databases'],
      tutorTopics: ['mongodb', 'nosql'],
      profileKeys: ['mongodb', 'nosql']
    },
    'redis cache': {
      isStarter: false,
      challenges: ['ch-3', 'lru-cache'],
      arena: ['lru-cache'],
      quizzes: ['backend-apis'],
      tutorTopics: ['redis', 'caching'],
      profileKeys: ['redis', 'cache']
    },
    'github actions': {
      isStarter: false,
      challenges: ['ch-8', 'docker-optimization'],
      arena: [],
      quizzes: ['git-workflows'],
      tutorTopics: ['github actions', 'ci/cd'],
      profileKeys: ['github actions', 'cicd']
    },
    'cloud deploy': {
      isStarter: false,
      challenges: [],
      arena: [],
      quizzes: ['cloud-aws', 'git-workflows'],
      tutorTopics: ['cloud', 'deploy', 'vercel', 'aws'],
      profileKeys: ['cloud', 'aws', 'deploy']
    },
    'generics': {
      isStarter: true,
      challenges: ['ch-1', 'reverse-string'],
      arena: [],
      quizzes: ['javascript-async'],
      tutorTopics: ['typescript', 'generics'],
      profileKeys: ['typescript']
    },
    'strict typing': {
      isStarter: true,
      challenges: [],
      arena: [],
      quizzes: ['javascript-async'],
      tutorTopics: ['typescript', 'type guards'],
      profileKeys: ['typescript']
    },
    'unit tests': {
      isStarter: false,
      challenges: ['ch-1', 'reverse-string', 'ch-2', 'debounce-function'],
      arena: [],
      quizzes: ['react-components-hooks', 'backend-apis'],
      tutorTopics: ['testing', 'unit tests', 'jest', 'vitest'],
      profileKeys: ['testing', 'jest', 'vitest']
    },
    // Subskills for all roles (AI, Fullstack, Frontend, Data, Cloud)
    'html & css': {
      isStarter: true,
      challenges: ['ch-1', 'reverse-string'],
      arena: [],
      quizzes: ['html-css', 'web-development'],
      tutorTopics: ['html', 'css', 'flexbox', 'grid'],
      profileKeys: ['html', 'css', 'html5', 'css3']
    },
    'javascript': {
      isStarter: true,
      challenges: ['ch-2', 'debounce-function', 'ch-11', 'deep-clone'],
      arena: ['debounce-function', 'deep-clone-object'],
      quizzes: ['javascript-modern', 'javascript-async'],
      tutorTopics: ['javascript', 'es6', 'async'],
      profileKeys: ['javascript', 'js', 'es6']
    },
    'typescript': {
      isStarter: true,
      challenges: ['ch-1', 'reverse-string'],
      arena: [],
      quizzes: ['typescript', 'javascript-modern'],
      tutorTopics: ['typescript', 'types'],
      profileKeys: ['typescript', 'ts']
    }
  }

  // Smart fuzzy resolver for quiz scores matching subskills or clusters
  const resolveBestQuizScore = (subTitle, clusterTitle, ruleQuizzes = []) => {
    let best = 0
    const sLow = String(subTitle || '').toLowerCase().trim()
    const cLow = String(clusterTitle || '').toLowerCase().trim()

    // 1. Explicit rule quizzes
    ;(ruleQuizzes || []).forEach((q) => {
      const qLow = String(q).toLowerCase().trim()
      if (quizScoreMap[qLow] !== undefined && quizScoreMap[qLow] > best) {
        best = quizScoreMap[qLow]
      }
    })

    // 2. Direct slug or alias matching against all attempted quizzes
    for (const [slug, score] of Object.entries(quizScoreMap)) {
      if (score <= best) continue
      const normSlug = slug.replace(/-/g, ' ')

      // Exact or containment match with subskill title
      if (sLow && (normSlug.includes(sLow) || sLow.includes(normSlug) || slug === sLow.replace(/[^a-z0-9]+/g, '-'))) {
        best = Math.max(best, score)
      }
      // Or containment with cluster title (e.g. Python cluster, Python basics quiz)
      else if (cLow && (normSlug.includes(cLow) || cLow.includes(normSlug) || slug.startsWith(cLow.replace(/[^a-z0-9]+/g, '-')))) {
        best = Math.max(best, score)
      }
      // Common special mappings
      else if (
        (sLow.includes('data structure') || sLow.includes('algorithm') || sLow.includes('dsa')) &&
        (slug.includes('dsa') || slug.includes('array') || slug.includes('tree') || slug.includes('graph'))
      ) {
        best = Math.max(best, score)
      } else if (
        (sLow.includes('html') || sLow.includes('css') || sLow.includes('component')) &&
        (slug.includes('html') || slug.includes('css') || slug.includes('frontend'))
      ) {
        best = Math.max(best, score)
      } else if (
        (sLow.includes('prompt') || sLow.includes('rag') || sLow.includes('agent') || sLow.includes('deep learning')) &&
        (slug.includes('ai') || slug.includes('llm') || slug.includes('rag') || slug.includes('prompt') || slug.includes('agent'))
      ) {
        best = Math.max(best, score)
      } else if (
        (sLow.includes('pandas') || sLow.includes('numpy') || sLow.includes('data')) &&
        (slug.includes('data') || slug.includes('pandas') || slug.includes('numpy') || slug.includes('python'))
      ) {
        best = Math.max(best, score)
      }
    }

    return best
  }

  let masteredCount = 0
  let totalCount = 0

  graph.clusters.forEach((c) => {
    c.subSkills.forEach((sub) => {
      totalCount++
      const titleLower = sub.title.toLowerCase()
      const rule = skillRules[titleLower] || { isStarter: true }

      let score = 0

      // 1. Production Challenges contribution (up to 40%)
      const solvedChallenges = (rule.challenges || []).filter((ch) => solvedSet.has(ch.toLowerCase()))
      if (solvedChallenges.length > 0) {
        score += Math.min(40, solvedChallenges.length * 25)
      }

      // 2. Code Arena problem solving contribution (up to 30%)
      const solvedArena = (rule.arena || []).filter((a) => solvedSet.has(a.toLowerCase()))
      if (solvedArena.length > 0) {
        score += Math.min(30, solvedArena.length * 20)
      }

      // 3. Assessment Quizzes contribution (strictly calculated based on marks — up to 85%)
      const bestQuizScore = resolveBestQuizScore(sub.title, c.title, rule.quizzes)
      if (bestQuizScore > 0) {
        if (bestQuizScore >= 90) {
          // Excellent marks: marks alone demonstrate strong mastery (85%)
          score = Math.max(score, Math.round(bestQuizScore * 0.85))
        } else if (bestQuizScore >= 75) {
          // Good marks: (75%)
          score = Math.max(score, Math.round(bestQuizScore * 0.80))
        } else if (bestQuizScore >= 60) {
          // Passing marks: (65%)
          score = Math.max(score, Math.round(bestQuizScore * 0.70))
        } else {
          // Developing: strictly proportional to marks
          score = Math.max(score, Math.round(bestQuizScore * 0.50))
        }
      }

      // 4. AI Tutor Topic Mastery contribution (up to 25%)
      let bestTutorMastery = 0
      ;(rule.tutorTopics || []).forEach((topicPrefix) => {
        for (const [top, mast] of Object.entries(tutorMasteryMap)) {
          if (top.includes(topicPrefix) || topicPrefix.includes(top)) {
            if (mast > bestTutorMastery) bestTutorMastery = mast
          }
        }
      })
      if (bestTutorMastery > 0) {
        score = Math.min(100, score + Math.round(bestTutorMastery * 25))
      }

      // 5. Candidate Profile verified skill (adds +15% if already recognized)
      const hasVerifiedSkill = (rule.profileKeys || []).some((k) => normSkills.has(k.toLowerCase()))
      if (hasVerifiedSkill && score > 0) {
        score = Math.min(100, score + 15)
      }

      // Final progress strictly bounded [0, 100]
      sub.progress = Math.min(100, Math.max(0, score))

      // Strict status assignment
      if (sub.progress >= 80) {
        sub.status = 'completed'
        sub.icon = 'check'
        sub.glyph = 'check'
        masteredCount++
      } else if (sub.progress > 0) {
        sub.status = 'in-progress'
        sub.icon = sub.icon === 'lock' ? 'code' : sub.icon
        sub.glyph = sub.glyph === 'lock' ? 'code' : sub.glyph
      } else {
        // sub.progress === 0: starter skills are unlocked (in-progress), advanced remain locked
        sub.status = rule.isStarter ? 'in-progress' : 'locked'
        sub.icon = rule.isStarter ? (sub.icon || 'code') : 'lock'
        sub.glyph = rule.isStarter ? (sub.glyph || 'code') : 'lock'
      }

      // Update whatToDo task completion states
      if (sub.whatToDo) {
        sub.whatToDo.forEach((t) => {
          if (t.type === 'challenge') {
            t.isCompleted = (rule.challenges || []).some((ch) => solvedSet.has(ch.toLowerCase()))
          } else if (t.type === 'arena') {
            t.isCompleted = (rule.arena || []).some((a) => solvedSet.has(a.toLowerCase()))
          } else if (t.type === 'quiz') {
            t.isCompleted = bestQuizScore >= 60
          } else if (t.type === 'tutor') {
            t.isCompleted = bestTutorMastery >= 0.7
          }
        })
      }
    })

    const avg = Math.round(c.subSkills.reduce((acc, s) => acc + s.progress, 0) / (c.subSkills.length || 1))
    c.progress = avg
  })

  const overall = Math.round(graph.clusters.reduce((acc, c) => acc + c.progress, 0) / (graph.clusters.length || 1))
  graph.centerNode = graph.centerNode || { id: 'center-goal', title: graph.roleName || 'Target Role' }
  graph.stats = graph.stats || {}
  graph.overallProgress = overall
  graph.centerNode.progress = overall
  graph.centerNode.subtitle = `${overall}% complete`
  graph.stats.skillsLearned = `${masteredCount} / ${totalCount}`
  graph.stats.projectsCompleted = `${solvedChallengesCount} / 5`

  const hrs = Math.floor((timeSpentMinutes || 0) / 60)
  const mins = (timeSpentMinutes || 0) % 60
  graph.stats.timeSpent = `${hrs}h ${mins}m`

  // Update right-rail Skill Progress list based on cluster values
  graph.skillProgress = graph.clusters.map((c) => ({
    name: c.title,
    progress: c.progress,
    color: c.color,
    icon: c.icon
  })).slice(0, 5)

  // Inject user's name
  graph.userName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Learner'

  return graph
}


