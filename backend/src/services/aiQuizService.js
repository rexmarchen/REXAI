import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { GEMINI_API_KEY, GEMINI_TEXT_MODEL, OPENAI_API_KEY } from '../config/env.js'
import { Quiz } from '../models/Quiz.js'

// Initialize AI clients
const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

/**
 * Domain-specific contextual question templates for procedural fallback
 */
const DOMAIN_TEMPLATES = {
  ai: [
    {
      q: (t) => `In production systems leveraging ${t}, what is the primary architectural mitigation against latency bottlenecks?`,
      opts: [
        "Asynchronous batching, response streaming, and semantic caching",
        "Disabling all safety filters and prompt templates",
        "Converting neural weights to plaintext JSON files",
        "Running all model inferences synchronously on single CPU cores"
      ],
      ans: 0,
      exp: (t) => `For ${t}, semantic caching and asynchronous batch processing with streaming minimize time-to-first-token (TTFT) and scale throughput efficiently.`,
      tip: "Caching embedding queries avoids redundant LLM inferences."
    },
    {
      q: (t) => `When evaluating the performance and reliability of a ${t} workflow, which metric best captures factual fidelity?`,
      opts: [
        "Hallucination rate and ground-truth retrieval context precision",
        "Total line count of the prompt template",
        "Memory footprint of the frontend web browser",
        "CSS transition render speed"
      ],
      ans: 0,
      exp: (t) => `In ${t}, precision and retrieval grounding directly prevent factual hallucinations and ensure reliable outputs.`,
      tip: "Context precision measures the signal-to-noise ratio in retrieved prompt context."
    },
    {
      q: (t) => `Which design pattern is best suited for complex multi-step reasoning tasks in ${t}?`,
      opts: [
        "ReAct (Reasoning + Acting) with dynamic tool execution and self-reflection loops",
        "Monolithic single-pass zero-shot prompting without validation",
        "Hardcoding static regex lookup tables",
        "Disabling conversational context windows"
      ],
      ans: 0,
      exp: (t) => `ReAct interleaves reasoning traces with tool actions, allowing ${t} systems to plan, verify, and correct mistakes adaptively.`,
      tip: "Breaking tasks into Plan-Execute-Reflect loops drastically improves agentic accuracy."
    },
    {
      q: (t) => `What security vulnerability specifically targets ${t} applications accepting untrusted user inputs?`,
      opts: [
        "Prompt Injection and Indirect Context Poisoning",
        "Buffer overflow in CSS stylesheets",
        "SQL injection in static markdown files",
        "Cross-site scripting in disconnected offline scripts"
      ],
      ans: 0,
      exp: (t) => `Prompt injection can override system instructions in ${t}, requiring strict input sanitization and prompt firewalls.`,
      tip: "Always isolate untrusted user data from privileged system directives."
    },
    {
      q: (t) => `How should state and memory be managed across long multi-turn conversations in ${t}?`,
      opts: [
        "Hierarchical summarization with sliding window memory and vector retrieval",
        "Storing every raw token forever until context limits crash the model",
        "Clearing conversation history after every single user query",
        "Dumping full chat logs into client cookies"
      ],
      ans: 0,
      exp: (t) => `Hierarchical memory and semantic retrieval summarize old turns while keeping immediate relevant context within budget.`,
      tip: "Sliding window memory keeps the last K turns while vector memory retrieves older relevant facts."
    }
  ],
  dev: [
    {
      q: (t) => `When scaling a high-throughput backend service using ${t}, which strategy best prevents cascading failures?`,
      opts: [
        "Circuit Breaker pattern with fallback responses and exponential backoff retry",
        "Infinite aggressive retries without jitter",
        "Storing all request payloads in global memory arrays",
        "Disabling timeout limits on external API calls"
      ],
      ans: 0,
      exp: (t) => `Circuit breakers prevent overwhelmed downstream dependencies in ${t} from taking down the entire system during outages.`,
      tip: "Use exponential backoff with randomized jitter to avoid thundering herd problems."
    },
    {
      q: (t) => `What is the primary advantage of implementing strict type safety and static analysis in ${t}?`,
      opts: [
        "Catching type mismatches, null pointers, and contract bugs at compile time before production",
        "Doubling raw CPU execution speed automatically",
        "Eliminating the need to write unit or integration tests",
        "Compressing network packet size"
      ],
      ans: 0,
      exp: (t) => `Static analysis catches structural bugs and missing properties in ${t} early in the development lifecycle.`,
      tip: "Strict type boundaries ensure reliable refactoring and clear API contracts."
    },
    {
      q: (t) => `In modern ${t} architectures, how should sensitive credentials and API keys be handled?`,
      opts: [
        "Injected via environment variables / secret managers and never committed to source code",
        "Hardcoded in frontend client components",
        "Committed into public GitHub repositories for team sharing",
        "Stored in plaintext client localStorage"
      ],
      ans: 0,
      exp: (t) => `Environment variables and dedicated secret managers (like Vault or AWS Secrets Manager) keep credentials secure in ${t}.`,
      tip: "Never commit .env files containing real production keys."
    },
    {
      q: (t) => `What is the role of idempotency when designing REST or event-driven endpoints in ${t}?`,
      opts: [
        "Ensuring duplicate requests with identical idempotency keys do not cause duplicate mutations",
        "Making all HTTP requests complete in under 5 milliseconds",
        "Converting relational tables into wide-column stores",
        "Bypassing authentication for repeated requests"
      ],
      ans: 0,
      exp: (t) => `Idempotency ensures network retries in ${t} (e.g. payment processing or resource creation) execute safely without side effects.`,
      tip: "Use UUID idempotency keys stored in Redis with short TTLs for mutation endpoints."
    },
    {
      q: (t) => `Which observability practice is critical for diagnosing microservice performance bottlenecks in ${t}?`,
      opts: [
        "Distributed tracing with correlation IDs propagated across HTTP/gRPC boundaries",
        "Only checking server uptime once per month",
        "Printing console.log statements without timestamps",
        "Storing logs exclusively on local ephemeral disks"
      ],
      ans: 0,
      exp: (t) => `Distributed tracing tracks request lifecycles across distributed ${t} services to isolate latency spikes and failures.`,
      tip: "OpenTelemetry standards allow vendor-neutral tracing across microservices."
    }
  ],
  data: [
    {
      q: (t) => `When processing massive datasets with ${t}, what technique prevents out-of-memory (OOM) crashes?`,
      opts: [
        "Chunked iterator streaming and lazy evaluation / memory mapping",
        "Loading the entire 50GB file into a single RAM variable at once",
        "Converting numbers to strings to reduce byte sizes",
        "Disabling garbage collection in the runtime"
      ],
      ans: 0,
      exp: (t) => `Streaming chunks and lazy computation in ${t} allow processing datasets far larger than available RAM.`,
      tip: "Use chunksize in Pandas/NumPy or distributed frameworks like Spark for massive scale."
    },
    {
      q: (t) => `What is the difference between normalization and standardization in ${t} preprocessing?`,
      opts: [
        "Normalization scales data to [0, 1]; standardization transforms data to mean=0 and variance=1",
        "They are mathematically identical operations",
        "Standardization only works on text data",
        "Normalization deletes all outlier rows"
      ],
      ans: 0,
      exp: (t) => `In ${t}, Min-Max normalization bounds features between 0 and 1, while Z-score standardization centers data around zero.`,
      tip: "Standardization is more robust when features contain extreme outliers."
    },
    {
      q: (t) => `Which database index structure is optimal for range queries (e.g. date intervals) in ${t}?`,
      opts: [
        "B-Tree (Balanced Tree) index",
        "Hash index",
        "Bitwise inverted index",
        "Unsorted linked list"
      ],
      ans: 0,
      exp: (t) => `B-Tree indexes maintain sorted order, enabling fast O(log N) range scans and interval queries in ${t}.`,
      tip: "Hash indexes only support exact equality (=) lookups, not range comparisons."
    }
  ],
  frontend: [
    {
      q: (t) => `In modern ${t} architectures, what is the primary benefit of CSS Grid over Flexbox?`,
      opts: [
        "CSS Grid is inherently two-dimensional (controlling rows and columns simultaneously)",
        "Flexbox only functions on mobile screens",
        "CSS Grid eliminates the need for HTML markup",
        "Flexbox requires heavy JavaScript polyfills"
      ],
      ans: 0,
      exp: (t) => `In ${t}, CSS Grid manages both horizontal rows and vertical columns at once, whereas Flexbox aligns content along a single primary axis.`,
      tip: "Use Grid for global layout scaffolding and Flexbox for linear component alignment."
    },
    {
      q: (t) => `When optimizing Core Web Vitals in ${t}, which approach best prevents Cumulative Layout Shift (CLS)?`,
      opts: [
        "Setting explicit width, height, or aspect-ratio CSS properties on all images and media containers",
        "Removing all CSS transition effects from buttons",
        "Importing JavaScript bundles synchronously in <head>",
        "Disabling web font rendering"
      ],
      ans: 0,
      exp: (t) => `Explicit aspect ratios reserve bounding box geometry before assets download in ${t}, eliminating sudden content shifts.`,
      tip: "Use aspect-ratio: 16/9 or fixed dimensions on responsive media tags."
    },
    {
      q: (t) => `What is the primary architectural purpose of semantic HTML5 elements in ${t}?`,
      opts: [
        "Providing accessibility landmarks for screen readers and structural clarity for search crawlers",
        "Doubling JavaScript execution speed in browser V8 engines",
        "Eliminating the need to write CSS rules",
        "Compressing network payloads automatically"
      ],
      ans: 0,
      exp: (t) => `Semantic tags like <main>, <nav>, <article>, and <header> establish meaningful landmark hierarchies for accessibility and SEO.`,
      tip: "Screen reader users navigate complex pages primarily via landmark elements."
    },
    {
      q: (t) => `How does 'content-visibility: auto' optimize rendering performance in large ${t} pages?`,
      opts: [
        "It skips rendering and layout calculations for off-screen elements until they enter the viewport",
        "It converts vector SVGs into compressed WebP bitmaps",
        "It forces CPU rendering instead of GPU acceleration",
        "It caches DOM nodes in Redis"
      ],
      ans: 0,
      exp: (t) => `content-visibility: auto treats off-screen DOM trees as empty containers for layout until scrolled near, boosting render times.`,
      tip: "Apply content-visibility to long article cards or dynamic list items for massive rendering gains."
    },
    {
      q: (t) => `In ${t}, what is the best practice for ensuring accessible custom controls?`,
      opts: [
        "Implementing correct ARIA attributes, keyboard focus management, and handling Space/Enter key events",
        "Replacing native buttons with un-focusable <div> tags",
        "Removing all outline focus rings with outline: none",
        "Disabling screen reader support"
      ],
      ans: 0,
      exp: (t) => `Accessible custom controls in ${t} must manage focus (tabindex), reflect dynamic state (aria-expanded), and trigger on keyboard events.`,
      tip: "Always prefer native semantic HTML elements over custom accessible divs when possible."
    }
  ],
  dsa: [
    {
      q: (t) => `What is the optimal time complexity to find a target value in a sorted array using ${t}?`,
      opts: [
        "O(log N) using Binary Search",
        "O(N) linear iteration",
        "O(N^2) nested loops",
        "O(1) constant time"
      ],
      ans: 0,
      exp: (t) => `Binary search repeatedly halves the search space, achieving logarithmic O(log N) time on sorted collections.`,
      tip: "Always check if the input array is sorted before choosing search algorithms."
    },
    {
      q: (t) => `Which core condition distinguishes Dynamic Programming from simple Divide & Conquer in ${t}?`,
      opts: [
        "Overlapping subproblems whose intermediate results can be memoized or tabulated",
        "Strictly random traversal order",
        "Zero memory usage requirements",
        "Linear O(1) space guarantees"
      ],
      ans: 0,
      exp: (t) => `Dynamic Programming caches solutions to overlapping subproblems to prevent exponential recomputations.`,
      tip: "Identify base cases and state transition equations early."
    }
  ]
}

/**
 * Generate Procedural AI Questions when external APIs are unavailable
 */
export function generateProceduralQuestions(topic, category = 'General', count = 5) {
  const norm = (String(category) + ' ' + String(topic)).toLowerCase()
  const poolType = (norm.includes('html') || norm.includes('css') || norm.includes('react') || norm.includes('frontend') || norm.includes('web') || norm.includes('design') || norm.includes('ui'))
    ? 'frontend'
    : (norm.includes('ai') || norm.includes('ml') || norm.includes('agent') || norm.includes('mcp') || norm.includes('rag') || norm.includes('llm'))
    ? 'ai'
    : (norm.includes('dsa') || norm.includes('array') || norm.includes('tree') || norm.includes('graph') || norm.includes('dp'))
    ? 'dsa'
    : (norm.includes('data') || norm.includes('pandas') || norm.includes('sql') || norm.includes('stat'))
    ? 'data'
    : 'dev'
  const templates = DOMAIN_TEMPLATES[poolType] || DOMAIN_TEMPLATES.dev
  const availableTemplates = [...templates].sort(() => Math.random() - 0.5)
  const questions = []
  const timestamp = Date.now()

  for (let i = 0; i < count; i++) {
    const template = availableTemplates[i % availableTemplates.length]
    // Shuffle options so correct answer is randomly distributed (0 to 3)
    const originalOptions = [...template.opts]
    const correctOpt = originalOptions[template.ans]
    
    // Seeded/random shuffle
    const shuffled = [...originalOptions].sort(() => Math.random() - 0.5)
    const newCorrectIndex = shuffled.indexOf(correctOpt)

    questions.push({
      id: `ai-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}-${i + 1}-${Math.floor(Math.random()*1000)}`,
      question: template.q(topic),
      code: '',
      language: '',
      options: shuffled,
      correctIndex: newCorrectIndex,
      explanation: template.exp(topic),
      tip: template.tip,
      tags: [topic, category, 'AI-Generated'],
      difficulty: i >= 3 ? 'Hard' : i >= 1 ? 'Medium' : 'Easy'
    })
  }

  return questions
}

/**
 * Core AI Generation Prompt Engine
 */
function buildAIPrompt(topic, category, difficulty = 'Medium', count = 5, existingQuestions = []) {
  const existingSummary = existingQuestions.length > 0
    ? `Avoid repeating these existing questions:\n${existingQuestions.slice(0, 10).map((q, i) => `${i + 1}. ${q.question || q}`).join('\n')}`
    : ''

  return `You are REXION's Senior Principal AI Examiner and Staff Engineering Mentor.
Generate exactly ${count} brand new, production-level, insightful multiple choice questions for the topic: "${topic}" (Domain Category: "${category}", Target Difficulty: "${difficulty}").

REQUIREMENTS:
1. Technical Depth: Questions must test real-world architectural design, debugging, best practices, edge cases, modern patterns, and critical reasoning — NOT trivial memorization.
2. Code Snippets: Include clean, formatted code snippets in the "code" field whenever appropriate (e.g. JavaScript, Python, TypeScript, SQL, Docker, Rust, Go, Bash). If no code is needed, use an empty string "".
3. Options: Provide exactly 4 realistic, distinct options. Make the 3 distractors plausible mistakes or common engineering misconceptions.
4. Correct Index: Specify "correctIndex" as an integer (0, 1, 2, or 3) indicating the exact position of the correct answer in the "options" array.
5. In-depth Explanation: In "explanation", write 2-3 sentences explaining WHY the correct option is right, how it works under the hood, and why the alternatives fail.
6. Pro-Tip: In "tip", write a punchy, practical 1-sentence engineering tip.
7. Output format: You MUST output ONLY a valid JSON array of objects. Do not write any markdown preamble, backticks outside json, or chat commentary.

${existingSummary}

JSON SCHEMA:
[
  {
    "id": "unique-slug-id",
    "question": "Question text here...",
    "code": "optional code snippet here...",
    "language": "javascript/python/sql/bash/etc or empty",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Deep architectural explanation...",
    "tip": "Practical tip...",
    "difficulty": "Easy" | "Medium" | "Hard",
    "tags": ["tag1", "tag2"]
  }
]`
}

/**
 * Parse and validate AI JSON response safely
 */
function parseAIQuestions(jsonStr, topic, category) {
  try {
    let clean = jsonStr.trim()
    // Strip markdown code fences if model included them
    if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    else if (clean.startsWith('```')) clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '')

    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const timestamp = Date.now()
    return parsed.map((item, idx) => ({
      id: item.id || `ai-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}-${idx + 1}`,
      question: String(item.question || '').trim(),
      code: String(item.code || '').trim(),
      language: String(item.language || '').toLowerCase().trim(),
      options: Array.isArray(item.options) && item.options.length === 4
        ? item.options.map(o => String(o).trim())
        : ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex <= 3
        ? item.correctIndex
        : 0,
      explanation: String(item.explanation || '').trim(),
      tip: String(item.tip || '').trim(),
      difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium',
      tags: Array.isArray(item.tags) ? item.tags : [topic, category, 'AI-Generated']
    })).filter(q => q.question.length > 10)
  } catch (err) {
    console.warn('[AI_QUIZ_SERVICE] JSON parse error:', err.message)
    return null
  }
}

/**
 * Generate fresh AI questions for any topic using multi-provider fallback
 */
export async function generateFreshQuestionsForTopic({
  topic,
  category = 'General',
  difficulty = 'Medium',
  count = 5,
  existingQuestions = []
}) {
  const prompt = buildAIPrompt(topic, category, difficulty, count, existingQuestions)

  // 1. Try Gemini API
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: GEMINI_TEXT_MODEL || 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 2500,
          responseMimeType: 'application/json'
        }
      })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const questions = parseAIQuestions(text, topic, category)
      if (questions && questions.length > 0) {
        console.log(`[AI_QUIZ_SERVICE] Successfully generated ${questions.length} fresh questions for "${topic}" via Gemini`)
        return questions
      }
    } catch (geminiErr) {
      console.warn(`[AI_QUIZ_SERVICE] Gemini generation warning for "${topic}":`, geminiErr.message)
    }
  }

  // 2. Try OpenAI API
  if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are REXION Senior Principal AI Examiner. Output only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      })
      const text = response.choices[0].message.content
      const parsedWrapper = JSON.parse(text)
      const arrayCandidate = Array.isArray(parsedWrapper) ? parsedWrapper : (parsedWrapper.questions || Object.values(parsedWrapper)[0])
      if (Array.isArray(arrayCandidate)) {
        const questions = parseAIQuestions(JSON.stringify(arrayCandidate), topic, category)
        if (questions && questions.length > 0) {
          console.log(`[AI_QUIZ_SERVICE] Successfully generated ${questions.length} fresh questions for "${topic}" via OpenAI`)
          return questions
        }
      }
    } catch (openaiErr) {
      console.warn(`[AI_QUIZ_SERVICE] OpenAI generation warning for "${topic}":`, openaiErr.message)
    }
  }

  // 3. Fallback: Procedural AI question generator
  console.log(`[AI_QUIZ_SERVICE] Using high-quality procedural domain engine for "${topic}"`)
  return generateProceduralQuestions(topic, category, count)
}

/**
 * Refresh a Quiz record in MongoDB by generating fresh questions and appending/updating pool
 */
export async function refreshQuizQuestionPool(quizSlugOrId, count = 5) {
  try {
    let quiz = await Quiz.findOne({
      $or: [
        { slug: quizSlugOrId },
        { _id: quizSlugOrId.match(/^[0-9a-fA-F]{24}$/) ? quizSlugOrId : null }
      ].filter(Boolean)
    })

    if (!quiz) {
      quiz = await getOrProvisionQuizWithAI(quizSlugOrId, quizSlugOrId)
    }

    if (!quiz) {
      return null
    }

    const existingQs = quiz.questionPool || []
    const freshQuestions = await generateFreshQuestionsForTopic({
      topic: quiz.topic || quiz.title,
      category: quiz.category || 'Development',
      difficulty: quiz.difficulty || 'Medium',
      count,
      existingQuestions: existingQs.map(q => q.question)
    })

    // Prepend fresh questions so the next attempt serves the newly generated batch first
    const updatedPool = [...freshQuestions, ...existingQs].slice(0, 60) // keep last 60 questions

    quiz.questionPool = updatedPool
    quiz.lastAIGeneratedAt = new Date()
    quiz.aiVersion = (quiz.aiVersion || 1) + 1
    quiz.totalGeneratedCount = (quiz.totalGeneratedCount || 0) + freshQuestions.length
    await quiz.save()

    console.log(`[AI_QUIZ_SERVICE] Refreshed pool for "${quiz.slug}". Total pool size: ${quiz.questionPool.length}`)
    return {
      success: true,
      quizSlug: quiz.slug,
      freshCount: freshQuestions.length,
      newQuestions: freshQuestions,
      totalPool: quiz.questionPool.length
    }
  } catch (err) {
    console.error(`[AI_QUIZ_SERVICE] Error refreshing quiz pool:`, err)
    return null
  }
}

/**
 * Get or automatically create & provision a Quiz with AI for any arbitrary topic
 */
export async function getOrProvisionQuizWithAI(slug, fallbackTitle, category = 'Development') {
  const normSlug = String(slug).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  let quiz = await Quiz.findOne({ slug: normSlug })

  if (!quiz) {
    const topicTitle = fallbackTitle || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    console.log(`[AI_QUIZ_SERVICE] Auto-provisioning new AI Quiz for topic: "${topicTitle}" (${normSlug})`)
    
    const initialQuestions = await generateFreshQuestionsForTopic({
      topic: topicTitle,
      category,
      difficulty: 'Medium',
      count: 6
    })

    quiz = await Quiz.create({
      slug: normSlug,
      title: `${topicTitle} Quiz`,
      topic: topicTitle,
      category,
      difficulty: 'Medium',
      durationMinutes: 12,
      questionsCount: 5,
      isNewQuiz: true,
      iconType: 'code',
      accentColor: '#D96B43',
      coverTopics: [
        `${topicTitle} Architecture`,
        'Syntax & Patterns',
        'Performance & Edge Cases',
        'Production Best Practices'
      ],
      xpReward: 100,
      questionPool: initialQuestions,
      lastAIGeneratedAt: new Date(),
      aiVersion: 1,
      totalGeneratedCount: initialQuestions.length
    })
  }

  return quiz
}
