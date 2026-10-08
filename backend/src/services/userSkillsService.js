import CandidateProfile from '../models/CandidateProfile.js'
import User from '../models/User.js'
import { ProblemSubmission } from '../models/ProblemSubmission.js'
import { QuizAttempt } from '../models/Quiz.js'
import { TopicMastery } from '../models/TutorQuiz.js'
import logger from '../utils/logger.js'

// Standard catalog of 32 industry-relevant skills with subtopics and action targets
export const MASTER_SKILLS_CATALOG = [
  // ── DEVELOPMENT (9 Skills) ──
  {
    id: 'skill-python',
    name: 'Python',
    category: 'Development',
    categoryLabel: 'Development',
    subTopics: ['Syntax', 'OOP', 'Functions', 'AsyncIO', 'Decorators', 'Generators'],
    themeColor: '#387EB8',
    quizSlug: 'python-basics',
    challengeSlugs: ['ch-1', 'ch-2', 'ch-3', 'ch-9'],
    tutorTopic: 'Python Programming and Core Concepts',
    desc: 'Core language for modern AI engineering, backend APIs, data manipulation, and automation pipelines.'
  },
  {
    id: 'skill-javascript',
    name: 'JavaScript',
    category: 'Development',
    categoryLabel: 'Development',
    subTopics: ['ES6+', 'DOM', 'Async/Await', 'Event Loop', 'Closures', 'Prototypes'],
    themeColor: '#D97706',
    quizSlug: 'javascript-basics',
    challengeSlugs: ['ch-2', 'ch-4'],
    tutorTopic: 'Modern JavaScript and Event Loop',
    desc: 'The ubiquitous language of the web, powering frontend UI reactivity and modern Node.js full-stack runtimes.'
  },
  {
    id: 'skill-typescript',
    name: 'TypeScript',
    category: 'Development',
    categoryLabel: 'Development',
    subTopics: ['Generics', 'Interfaces', 'Union Types', 'Utility Types', 'Strict Mode'],
    themeColor: '#3178C6',
    quizSlug: 'typescript-basics',
    challengeSlugs: ['ch-4', 'ch-7'],
    tutorTopic: 'TypeScript Generics and Advanced Typing',
    desc: 'Strongly typed superset of JavaScript that enhances code quality, refactoring safety, and scalability.'
  },
  {
    id: 'skill-react',
    name: 'React',
    category: 'Development',
    categoryLabel: 'Development',
    subTopics: ['Hooks', 'State', 'Context', 'Suspense', 'Custom Hooks', 'Reconciliation'],
    themeColor: '#0284C7',
    quizSlug: 'react-basics',
    challengeSlugs: ['ch-4', 'ch-7'],
    tutorTopic: 'React Component Architecture and State Management',
    desc: 'Industry-standard declarative UI library for crafting scalable, component-driven user interfaces.'
  },
  {
    id: 'skill-nextjs',
    name: 'Next.js',
    category: 'Development',
    categoryLabel: 'Development',
    subTopics: ['App Router', 'Server Components', 'SSR / SSG', 'Route Handlers', 'Optimization'],
    themeColor: '#000000',
    quizSlug: 'nextjs-basics',
    challengeSlugs: ['ch-4'],
    tutorTopic: 'Next.js App Router and Server Components',
    desc: 'Full-stack React framework featuring hybrid rendering, server-side data fetching, and production routing.'
  },
  {
    id: 'skill-nodejs',
    name: 'Node.js',
    category: 'Development',
    categoryLabel: 'Development',
    subTopics: ['Event Loop', 'Streams', 'Buffers', 'Express / Fastify', 'Middleware'],
    themeColor: '#16A34A',
    quizSlug: 'nodejs-basics',
    challengeSlugs: ['ch-2', 'ch-10'],
    tutorTopic: 'Node.js Backend Architecture and Performance',
    desc: 'Server-side V8 JavaScript runtime built for high-throughput, non-blocking asynchronous network services.'
  },
  {
    id: 'skill-fastapi',
    name: 'FastAPI',
    category: 'Development',
    categoryLabel: 'Backend Architecture',
    subTopics: ['Pydantic Models', 'Async Endpoints', 'Dependency Injection', 'OpenAPI / Swagger'],
    themeColor: '#059669',
    quizSlug: 'fastapi-basics',
    challengeSlugs: ['ch-10'],
    tutorTopic: 'FastAPI REST Architecture and Asynchronous Endpoints',
    desc: 'High-performance Python web framework engineered for building production RESTful APIs and ML serving.'
  },
  {
    id: 'skill-system-design',
    name: 'System Design',
    category: 'Development',
    categoryLabel: 'System Design',
    subTopics: ['Scalability', 'Caching', 'Load Balancing', 'Microservices', 'Message Queues'],
    themeColor: '#EF4444',
    quizSlug: 'system-design',
    challengeSlugs: ['ch-6'],
    tutorTopic: 'Distributed System Design and Scalability',
    desc: 'Distributed systems architecture, high-availability tradeoffs, CAP theorem, caching strategies, and scaling.'
  },
  {
    id: 'skill-git',
    name: 'Git & Version Control',
    category: 'Development',
    categoryLabel: 'Version Control',
    subTopics: ['Branching', 'Rebase', 'Interactive Staging', 'Merge Conflict Resolution', 'Git Hooks'],
    themeColor: '#F05032',
    quizSlug: 'git-basics',
    challengeSlugs: [],
    tutorTopic: 'Git Version Control and Collaborative Workflows',
    desc: 'Distributed version control system standard for tracking source changes, branching strategies, and CI/CD.'
  },

  // ── AI / ML (6 Skills) ──
  {
    id: 'skill-machine-learning',
    name: 'Machine Learning',
    category: 'AI / ML',
    categoryLabel: 'AI / ML',
    subTopics: ['Regression', 'Classification', 'Evaluation', 'Scikit-Learn', 'Feature Engineering'],
    themeColor: '#8B5CF6',
    quizSlug: 'ml-fundamentals',
    challengeSlugs: ['ch-5'],
    tutorTopic: 'Machine Learning Fundamentals and Supervised Models',
    desc: 'Supervised and unsupervised learning, model loss optimization, cross-validation, and production inference.'
  },
  {
    id: 'skill-deep-learning',
    name: 'Deep Learning',
    category: 'AI / ML',
    categoryLabel: 'Deep Learning',
    subTopics: ['Neural Networks', 'Backprop', 'PyTorch', 'Transformers', 'Attention Mechanisms'],
    themeColor: '#A855F7',
    quizSlug: 'deep-learning',
    challengeSlugs: ['ch-5'],
    tutorTopic: 'Deep Learning Neural Networks and PyTorch',
    desc: 'Multi-layer neural representations, gradient descent backpropagation, and transformer architectures.'
  },
  {
    id: 'skill-llms',
    name: 'LLMs & Generative AI',
    category: 'AI / ML',
    categoryLabel: 'Generative AI',
    subTopics: ['Tokenization', 'Context Windows', 'Fine-Tuning', 'OpenAI / Gemini APIs', 'Prompt Chaining'],
    themeColor: '#E27D60',
    quizSlug: 'llm-engineering',
    challengeSlugs: ['ch-5'],
    tutorTopic: 'Large Language Model Architecture and Prompt Optimization',
    desc: 'Generative foundation models, token mechanics, prompt chaining, function calling, and structured outputs.'
  },
  {
    id: 'skill-rag',
    name: 'RAG',
    category: 'AI / ML',
    categoryLabel: 'Generative AI',
    subTopics: ['Embeddings', 'Vector DB', 'Retrieval', 'Reranking', 'Hybrid Search'],
    themeColor: '#0D9488',
    quizSlug: 'rag-systems',
    challengeSlugs: ['ch-5'],
    tutorTopic: 'Retrieval Augmented Generation and Vector Databases',
    desc: 'Retrieval Augmented Generation architecture integrating semantic vector stores with LLM prompt context.'
  },
  {
    id: 'skill-prompt-engineering',
    name: 'Prompt Engineering',
    category: 'AI / ML',
    categoryLabel: 'Generative AI',
    subTopics: ['Few-Shot', 'Chain-of-Thought', 'System Prompts', 'Format Enforcement', 'Guardrails'],
    themeColor: '#EC4899',
    quizSlug: 'prompt-engineering',
    challengeSlugs: [],
    tutorTopic: 'Prompt Engineering and Reasoning Techniques',
    desc: 'Systematic prompting methodologies to elicit deterministic, high-reasoning responses from LLMs.'
  },
  {
    id: 'skill-vector-db',
    name: 'Vector Databases',
    category: 'AI / ML',
    categoryLabel: 'Vector Stores',
    subTopics: ['Pinecone', 'ChromaDB', 'Similarity Metrics', 'HNSW Indexing', 'Metadata Filtering'],
    themeColor: '#06B6D4',
    quizSlug: 'vector-databases',
    challengeSlugs: ['ch-5'],
    tutorTopic: 'Vector Embeddings and Semantic Search Indexing',
    desc: 'High-dimensional embedding storage, cosine similarity indexing, and sub-millisecond nearest neighbor search.'
  },

  // ── DATA SCIENCE (4 Skills) ──
  {
    id: 'skill-pandas',
    name: 'Pandas & Analytics',
    category: 'Data Science',
    categoryLabel: 'Data Science',
    subTopics: ['DataFrames', 'Cleaning', 'Exploration', 'GroupBy', 'Pivot Tables', 'Missing Data'],
    themeColor: '#10B981',
    quizSlug: 'pandas-data-wrangling',
    challengeSlugs: [],
    tutorTopic: 'Pandas Data Wrangling and Exploratory Data Analysis',
    desc: 'Tabular data analysis, data wrangling, missing data imputation, and exploratory analytical workflows.'
  },
  {
    id: 'skill-numpy',
    name: 'NumPy',
    category: 'Data Science',
    categoryLabel: 'Data Science',
    subTopics: ['Arrays', 'Vectorization', 'Broadcasting', 'Linear Algebra', 'Slicing'],
    themeColor: '#0EA5E9',
    quizSlug: 'numpy-basics',
    challengeSlugs: [],
    tutorTopic: 'NumPy Multi-Dimensional Array Operations',
    desc: 'High-performance N-dimensional array manipulation, broadcasting semantics, and numerical computation.'
  },
  {
    id: 'skill-statistics',
    name: 'Statistics & Probability',
    category: 'Data Science',
    categoryLabel: 'Mathematics & Stats',
    subTopics: ['Distributions', 'Hypothesis Testing', 'P-Values', 'Bayes Theorem', 'Confidence Intervals'],
    themeColor: '#6366F1',
    quizSlug: 'statistics-fundamentals',
    challengeSlugs: [],
    tutorTopic: 'Statistical Inference and Probability Distributions',
    desc: 'Core probability distributions, statistical significance testing, hypothesis formulation, and variance modeling.'
  },
  {
    id: 'skill-data-viz',
    name: 'Data Visualization',
    category: 'Data Science',
    categoryLabel: 'Visualization',
    subTopics: ['Matplotlib', 'Seaborn', 'Interactive Charts', 'Color Palettes', 'Storytelling'],
    themeColor: '#F59E0B',
    quizSlug: 'data-visualization',
    challengeSlugs: [],
    tutorTopic: 'Data Visualization and Visual Analytics',
    desc: 'Visual communication of data distributions, time series trajectories, and executive dashboard metrics.'
  },

  // ── DSA (4 Skills) ──
  {
    id: 'skill-dsa',
    name: 'DSA',
    category: 'DSA',
    categoryLabel: 'Algorithm & Logic',
    subTopics: ['Arrays', 'Strings', 'Graphs', 'Trees', 'DP', 'Two Pointers'],
    themeColor: '#D96B43',
    quizSlug: 'dsa-fundamentals',
    challengeSlugs: ['ch-1', 'ch-3', 'ch-9'],
    tutorTopic: 'Data Structures and Algorithms Problem Solving',
    desc: 'Data structures & algorithms benchmark solving real software bottlenecks and technical interview rounds.'
  },
  {
    id: 'skill-dynamic-programming',
    name: 'Dynamic Programming',
    category: 'DSA',
    categoryLabel: 'Algorithms',
    subTopics: ['Memoization', 'Tabulation', 'State Transitions', 'Subproblems', 'Knapsack'],
    themeColor: '#DC2626',
    quizSlug: 'dynamic-programming',
    challengeSlugs: ['ch-3'],
    tutorTopic: 'Dynamic Programming Optimization and State Transitions',
    desc: 'Recursive problem breakdown with optimal substructure caching, eliminating exponential time complexities.'
  },
  {
    id: 'skill-tree-graphs',
    name: 'Trees & Graph Traversal',
    category: 'DSA',
    categoryLabel: 'Data Structures',
    subTopics: ['BFS / DFS', 'BST Validation', 'Dijkstra', 'Topological Sort', 'Cycle Detection'],
    themeColor: '#059669',
    quizSlug: 'trees-and-graphs',
    challengeSlugs: ['ch-9'],
    tutorTopic: 'Graph Algorithms and Tree Traversals',
    desc: 'Hierarchical and networked data representation, shortest path computation, and tree traversal invariants.'
  },
  {
    id: 'skill-big-o',
    name: 'Big-O & Complexity',
    category: 'DSA',
    categoryLabel: 'Complexity Analysis',
    subTopics: ['Time Complexity', 'Space Complexity', 'Amortized Analysis', 'Trade-offs', 'Limits'],
    themeColor: '#475569',
    quizSlug: 'big-o-complexity',
    challengeSlugs: ['ch-1', 'ch-3'],
    tutorTopic: 'Big-O Asymptotic Complexity Analysis',
    desc: 'Asymptotic performance bounds governing algorithmic execution time and memory footprint under scale.'
  },

  // ── DATABASE (3 Skills) ──
  {
    id: 'skill-sql',
    name: 'SQL',
    category: 'Database',
    categoryLabel: 'Database',
    subTopics: ['Joins', 'Aggregation', 'Window Functions', 'Indexing', 'Transactions', 'ACID'],
    themeColor: '#2563EB',
    quizSlug: 'sql-mastery',
    challengeSlugs: [],
    tutorTopic: 'Relational Database Design and SQL Optimization',
    desc: 'Relational data query mastery, relational schemas, indexing, and high-performance analytical queries.'
  },
  {
    id: 'skill-mongodb',
    name: 'MongoDB',
    category: 'Database',
    categoryLabel: 'NoSQL Database',
    subTopics: ['Aggregation Pipeline', 'Document Modeling', 'Indexes', 'Replica Sets', 'Sharding'],
    themeColor: '#10B981',
    quizSlug: 'mongodb-basics',
    challengeSlugs: [],
    tutorTopic: 'MongoDB Schema Design and Aggregation Pipelines',
    desc: 'Flexible JSON document database architecture, embedded vs referenced schemas, and pipeline aggregations.'
  },
  {
    id: 'skill-redis',
    name: 'Redis',
    category: 'Database',
    categoryLabel: 'In-Memory Cache',
    subTopics: ['In-Memory Caching', 'Pub/Sub', 'TTL Expiry', 'Session Store', 'Rate Limiting'],
    themeColor: '#DC2626',
    quizSlug: 'redis-caching',
    challengeSlugs: ['ch-3', 'ch-10'],
    tutorTopic: 'Redis Caching Strategies and Pub Sub Messaging',
    desc: 'Ultra-low latency in-memory data store for caching, distributed locking, pub/sub messaging, and sessions.'
  },

  // ── CLOUD & DEVOPS (5 Skills) ──
  {
    id: 'skill-docker',
    name: 'Docker',
    category: 'Cloud & DevOps',
    categoryLabel: 'Containerization',
    subTopics: ['Containers', 'Images', 'Volumes', 'Dockerfile', 'Multi-Stage', 'Compose'],
    themeColor: '#2496ED',
    quizSlug: 'docker-basics',
    challengeSlugs: ['ch-8'],
    tutorTopic: 'Docker Containerization and Dockerfile Best Practices',
    desc: 'Containerization, reproducible multi-stage Docker builds, container networking, and microservice orchestration.'
  },
  {
    id: 'skill-kubernetes',
    name: 'Kubernetes',
    category: 'Cloud & DevOps',
    categoryLabel: 'Orchestration',
    subTopics: ['Pods', 'Deployments', 'Services', 'Ingress', 'ConfigMaps', 'Auto-scaling'],
    themeColor: '#326CE5',
    quizSlug: 'kubernetes-basics',
    challengeSlugs: [],
    tutorTopic: 'Kubernetes Cluster Architecture and Pod Orchestration',
    desc: 'Production container clustering, declarative self-healing deployments, load balancing, and rolling updates.'
  },
  {
    id: 'skill-aws',
    name: 'AWS Cloud',
    category: 'Cloud & DevOps',
    categoryLabel: 'Cloud Infrastructure',
    subTopics: ['S3', 'EC2', 'Lambda Serverless', 'IAM Security', 'CloudFront CDN', 'ECS'],
    themeColor: '#FF9900',
    quizSlug: 'aws-cloud-foundations',
    challengeSlugs: [],
    tutorTopic: 'AWS Cloud Services and Serverless Architecture',
    desc: 'Cloud infrastructure provisioning, serverless execution, scalable object storage, and secure IAM roles.'
  },
  {
    id: 'skill-cicd',
    name: 'CI/CD Pipelines',
    category: 'Cloud & DevOps',
    categoryLabel: 'DevOps & Automation',
    subTopics: ['GitHub Actions', 'Test Automation', 'Build Artifacts', 'Deployment Gates', 'Secrets'],
    themeColor: '#2088FF',
    quizSlug: 'cicd-automation',
    challengeSlugs: ['ch-8'],
    tutorTopic: 'CI CD Pipeline Automation with GitHub Actions',
    desc: 'Automated continuous integration build checks, test matrices, and zero-downtime deployment pipelines.'
  },
  {
    id: 'skill-linux',
    name: 'Linux & Bash',
    category: 'Cloud & DevOps',
    categoryLabel: 'Systems & Shell',
    subTopics: ['Bash Scripting', 'File Permissions', 'Process Management', 'SSH', 'Networking'],
    themeColor: '#FCC624',
    quizSlug: 'linux-bash',
    challengeSlugs: ['ch-8'],
    tutorTopic: 'Linux Administration and Bash Automation',
    desc: 'UNIX operating system fundamentals, POSIX shell automation, permission models, and process inspection.'
  },

  // ── CYBERSECURITY (1 Skill) ──
  {
    id: 'skill-cybersec-owasp',
    name: 'OWASP & Web Security',
    category: 'Cybersecurity',
    categoryLabel: 'Cybersecurity',
    subTopics: ['XSS', 'CSRF', 'SQL Injection', 'Auth & JWT', 'CORS', 'Content Security Policy'],
    themeColor: '#E11D48',
    quizSlug: 'web-security-owasp',
    challengeSlugs: ['ch-10'],
    tutorTopic: 'Web Application Security and OWASP Vulnerabilities',
    desc: 'Identification and mitigation of critical web application vulnerabilities, threat modeling, and secure authentication.'
  }
]

/**
 * Real Calculation of User Skills Dashboard Data
 * Strictly computed from candidate profile, problem submissions, quiz attempts, and topic masteries.
 */
export async function getUserSkillsDashboardData({
  userId = null,
  roleId = 'ai-engineer',
  quizScores = null,
  solvedSlugs = null
} = {}) {
  let profile = null
  let user = null
  let profileSkills = []
  const solvedSet = new Set()
  const quizScoresMap = {}
  const tutorMasteryMap = {}

  // 1. Ingest client-provided guest scores and solves
  if (solvedSlugs) {
    String(solvedSlugs)
      .split(',')
      .forEach((s) => {
        if (s.trim()) solvedSet.add(s.trim().toLowerCase())
      })
  }

  if (quizScores) {
    try {
      const parsed = typeof quizScores === 'string' ? JSON.parse(quizScores) : quizScores
      if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([slug, score]) => {
          const num = Number(score) || 0
          if (num > 0) quizScoresMap[slug.toLowerCase()] = num
        })
      }
    } catch (_) {}
  }

  // 2. Fetch authenticated user data from MongoDB
  if (userId && String(userId) !== 'guest') {
    try {
      profile = await CandidateProfile.findOne({ userId }).lean()
      if (!profile) {
        // Try finding by user _id directly
        user = await User.findById(userId).lean()
        if (user?.email) {
          profile = await CandidateProfile.findOne({ email: user.email }).lean()
        }
      }

      if (profile?.skills && Array.isArray(profile.skills)) {
        profileSkills = profile.skills.map((s) => String(s).trim().toLowerCase())
      }

      // Add skills declared in experience
      if (profile?.experience && Array.isArray(profile.experience)) {
        profile.experience.forEach((exp) => {
          if (Array.isArray(exp.skillsUsed)) {
            exp.skillsUsed.forEach((s) => {
              if (s) profileSkills.push(String(s).trim().toLowerCase())
            })
          }
        })
      }

      // Fetch user's ACCEPTED problem submissions
      const submissions = await ProblemSubmission.find({
        userId: String(userId),
        verdict: 'ACCEPTED'
      }).lean()

      submissions.forEach((sub) => {
        if (sub.problemSlug) solvedSet.add(sub.problemSlug.toLowerCase())
      })

      // Fetch user's Quiz attempts
      const attempts = await QuizAttempt.find({ userId: String(userId) }).lean()
      attempts.forEach((att) => {
        if (att.quizSlug && att.scorePercentage !== undefined) {
          const slug = att.quizSlug.toLowerCase()
          const score = Number(att.scorePercentage) || 0
          if (!quizScoresMap[slug] || score > quizScoresMap[slug]) {
            quizScoresMap[slug] = score
          }
        }
      })

      // Fetch user's Topic Masteries from AI Tutor
      const masteries = await TopicMastery.find({ userId: String(userId) }).lean()
      masteries.forEach((m) => {
        if (m.topic) {
          tutorMasteryMap[m.topic.toLowerCase()] = m.mastery || 0
        }
      })
    } catch (err) {
      logger.warn('Error fetching real user records for skills dashboard:', err.message)
    }
  }

  const normProfileSkillsSet = new Set(profileSkills)

  // 3. Compute real progress for each master skill
  const calculatedSkills = MASTER_SKILLS_CATALOG.map((skill) => {
    const skillNameLower = skill.name.toLowerCase()
    let score = 0
    let isDeclared = false
    let solvedCount = 0
    let bestQuizScore = 0
    let bestTutorMastery = 0

    // Component A: Profile Verified Skill (up to 25%)
    // Check if skill or any subtopic is explicitly declared in user profile
    const hasInProfile =
      normProfileSkillsSet.has(skillNameLower) ||
      Array.from(normProfileSkillsSet).some(
        (ps) => ps.includes(skillNameLower) || skillNameLower.includes(ps)
      )

    if (hasInProfile) {
      isDeclared = true
      score += 25
    }

    // Component B: Real Assessment Quizzes (up to 45%)
    // Match quiz slug or partial name in quizScoresMap
    for (const [slug, qScore] of Object.entries(quizScoresMap)) {
      if (
        slug === skill.quizSlug.toLowerCase() ||
        slug.includes(skillNameLower) ||
        skillNameLower.includes(slug.replace(/-basics|-fundamentals|-wrangling|-mastery|-caching|-automation/g, ''))
      ) {
        if (qScore > bestQuizScore) bestQuizScore = qScore
      }
    }

    if (bestQuizScore > 0) {
      // Proportional to quiz marks up to 45%
      const quizContrib = Math.round((bestQuizScore / 100) * 45)
      score += quizContrib
    }

    // Component C: Real Coding Challenges / Problem Submissions (up to 30%)
    const matchingSolves = (skill.challengeSlugs || []).filter((slug) =>
      solvedSet.has(slug.toLowerCase())
    )
    solvedCount = matchingSolves.length

    if (solvedCount > 0) {
      // 15% per solved challenge, capped at 30%
      score += Math.min(30, solvedCount * 15)
    }

    // Component D: Real AI Tutor Practice Sessions (up to 20%)
    for (const [topic, masteryVal] of Object.entries(tutorMasteryMap)) {
      if (topic.includes(skillNameLower) || skillNameLower.includes(topic)) {
        if (masteryVal > bestTutorMastery) bestTutorMastery = masteryVal
      }
    }

    if (bestTutorMastery > 0) {
      score += Math.min(20, Math.round(bestTutorMastery * 20))
    }

    // Strict boundary: 0 to 100%
    const progress = Math.min(100, Math.max(0, score))

    // Real Status Assignment
    let status = 'Not Started'
    let footerIcon = 'play'
    let footerText = 'Begin with basics'

    if (progress >= 70) {
      status = 'Strong'
      footerIcon = 'star'
      footerText = 'Career relevant'
    } else if (progress >= 30) {
      status = 'In Progress'
      footerIcon = 'forward'
      footerText = 'Continue practice'
    } else if (progress > 0) {
      status = 'Needs Practice'
      footerIcon = 'target'
      footerText = 'Practice recommended'
    }

    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      categoryLabel: skill.categoryLabel,
      subTopics: skill.subTopics,
      themeColor: skill.themeColor,
      desc: skill.desc,
      progress,
      status,
      footerIcon,
      footerText,
      isDeclared,
      solvedCount,
      bestQuizScore,
      actionUrl:
        skill.challengeSlugs && skill.challengeSlugs.length > 0
          ? `/challenges/${skill.challengeSlugs[0]}`
          : `/quizzes?topic=${encodeURIComponent(skill.quizSlug)}`
    }
  })

  // 4. Compute Aggregate Real Statistics
  const totalSkills = calculatedSkills.length
  const strongSkills = calculatedSkills.filter((s) => s.status === 'Strong').length
  const inProgressSkills = calculatedSkills.filter((s) => s.status === 'In Progress').length
  const needPracticeSkills = calculatedSkills.filter(
    (s) => s.status === 'Needs Practice' || s.status === 'Not Started'
  ).length

  const sumProgress = calculatedSkills.reduce((acc, curr) => acc + curr.progress, 0)
  const overallProgress = totalSkills > 0 ? Math.round(sumProgress / totalSkills) : 0

  // 5. Identify Weakest & Strongest Skills
  // Prioritize active skills with progress > 0 but lowest, or lowest overall
  const sortedByProgressAsc = [...calculatedSkills].sort((a, b) => a.progress - b.progress)
  const sortedByProgressDesc = [...calculatedSkills].sort((a, b) => b.progress - a.progress)

  // Weakest skill that needs practice (prioritize ones with progress < 50%)
  const weakestSkill =
    sortedByProgressAsc.find((s) => s.progress > 0 && s.progress < 70) ||
    sortedByProgressAsc[0] ||
    calculatedSkills[0]

  const strongestSkill = sortedByProgressDesc[0] || calculatedSkills[0]

  // Target role title
  const targetRoleTitle =
    profile?.targetRole ||
    (roleId === 'ai-engineer' ? 'AI Engineer' : roleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))

  return {
    success: true,
    data: {
      userId: userId || 'guest',
      userName: profile?.fullName || user?.name || 'Learner',
      targetRoleTitle,
      overallProgress,
      kpi: {
        totalSkills,
        strongSkills,
        inProgressSkills,
        needPracticeSkills
      },
      weakestSkill: {
        name: weakestSkill.name,
        category: weakestSkill.category,
        progress: weakestSkill.progress,
        status: weakestSkill.status
      },
      strongestSkill: {
        name: strongestSkill.name,
        progress: strongestSkill.progress
      },
      skills: calculatedSkills
    }
  }
}
