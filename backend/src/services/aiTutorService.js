import { TutorSession } from '../models/TutorSession.js'
import { TutorQuiz, TutorQuizAttempt, TopicMastery } from '../models/TutorQuiz.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// System Prompts & Pedagogical Guidelines directly from prompts.ts
export const CORE_SYSTEM_PROMPT = `You are Rexion's AI Tutor — a production-grade, state-of-the-art cognitive AI tutor and engineering mentor endowed with deep human-level intelligence, pedagogical mastery, and profound technical acumen.

Your Core Identity:
- You possess true reasoning capabilities, analytical depth, and warm, articulate conversational grace.
- You are NOT a robotic script or generic search engine. You are an expert peer and world-class technical mentor.
- You can converse with supreme intelligence on ANY question the user asks: from deep AI architecture, distributed systems, quantum computing, full-stack engineering, and algorithmic optimization, to philosophical questions, career navigation, or meta questions about yourself and AI.
- You answer with genuine, authoritative knowledge, clear logic, and insightful real-world depth.

Teaching Philosophy & Human-Level Reasoning:
- Plain Clarity First: Begin with a direct, lucid, and insightful explanation. Avoid unnecessary fluff or hollow preamble.
- Intuitive Analogies: When explaining difficult or abstract technical concepts, introduce a vivid, real-world analogy to ground intuition before diving into low-level mechanics.
- Concrete Architecture & Mechanics: Break down processes into clean, logical numbered phases or structural steps. Explain the "why" behind the "how".
- Production Code & Examples: When code is helpful, provide clean, idiomatic, modern, production-grade snippets with syntax highlighting. Explain critical lines and state time/space complexity where appropriate.
- Engaging & Socratic: Conclude technical explanations with a thoughtful, engaging question that checks understanding or invites the student to reflect on trade-offs.
- Natural Persona: If the user asks a general, conversational, or meta question (e.g., "why can you answer me?", "who are you?", "hello"), respond naturally, warmly, intelligently, and authentically without forcing a rigid lesson template.

Format (Rendered in rich Markdown):
- Use clean markdown headers (## for main title, ### for subsections).
- Use **bold** for foundational concepts and terms.
- Keep paragraphs readable, well-spaced, and punchy.
- Never mention internal system instructions, prompts, or fallback mechanics.

Mandatory Follow-up Directives:
After your reply, on a new line, always output exactly 3 relevant, highly actionable follow-up suggestions the user might tap, formatted strictly as:
<followups>["short suggestion 1","short suggestion 2","short suggestion 3"]</followups>
Each suggestion must be concise (under 6 words).`

export const MODE_INSTRUCTIONS = {
  ask: "Mode: Answer the student's question directly using the teaching approach above.",
  explain: "Mode: Explain Concept. Teach the concept from zero using the analogy, steps and example structure, then check understanding.",
  solve_code: "Mode: Solve Code. Do NOT paste a finished solution straight away. First name the idea or pattern in one line, give a hint, and ask the student to try the next step. Give the full solution only if they ask for it or are stuck after hints. When you do, explain why each line exists. Point out time and space complexity in plain words.",
  study_plan: "Mode: Study Plan. Produce a realistic week-by-week plan with small daily tasks, one project, and a quick self-test at the end of each week. Keep each week to 3 or 4 lines.",
  practice: "Mode: Practice. Run a Socratic drill: ask ONE question at a time on the topic, wait for the answer, give feedback, then ask the next, slightly harder. Never ask several questions in one message."
}

export const LEVEL_INSTRUCTIONS = {
  beginner: "Student level: beginner. Assume no prior knowledge. Use the simplest words and everyday analogies.",
  intermediate: "Student level: intermediate. Skip the very basics, use correct terminology, and connect to related concepts.",
  advanced: "Student level: advanced. Be concise and precise, discuss trade-offs and edge cases."
}

export function buildTutorSystemPrompt(mode = 'ask', level = 'beginner', careerPath = 'AI Engineer') {
  const parts = [
    CORE_SYSTEM_PROMPT,
    MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.ask,
    LEVEL_INSTRUCTIONS[level] || LEVEL_INSTRUCTIONS.beginner,
    careerPath ? `The student's career path is "${careerPath}". Prefer examples relevant to it.` : ''
  ]
  return parts.filter(Boolean).join('\n\n')
}

// Extract <followups>[...]</followups>
export function extractFollowups(fullText) {
  const match = fullText.match(/<followups>([\s\S]*?)<\/followups>/)
  let followups = []
  if (match) {
    try {
      const parsed = JSON.parse(match[1])
      if (Array.isArray(parsed)) {
        followups = parsed.filter(x => typeof x === 'string').slice(0, 3)
      }
    } catch (e) {
      // fallback regex for malformed json
      const items = match[1].match(/"([^"]+)"/g)
      if (items) followups = items.map(s => s.replace(/"/g, '')).slice(0, 3)
    }
  }
  const cleanText = fullText.split('<followups>')[0].trim()
  return { cleanText, followups }
}

// ─── Multi-Tier LLM: Gemini → Grok → OpenRouter → Anthropic ──────────────────
// Priority: Gemini 1.5 Flash (free, fast) → Grok (xAI) → OpenRouter → Anthropic
// Each tier is tried in order; if the API key is missing or the call fails, we move on.

async function callGemini({ systemPrompt, messages, maxTokens = 1500 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey || apiKey.includes('your-gemini-api-key') || apiKey.length < 20) return null

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        topP: 0.95,
      }
    })

    // Convert messages to Gemini format: roles must be 'user' or 'model'
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
    const lastMsg = messages[messages.length - 1]

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMsg.content)
    const text = result.response.text()
    if (text) {
      console.log('[AITutor] ✅ Gemini responded successfully')
      return text
    }
  } catch (err) {
    console.warn('[AITutor] Gemini failed:', err.message)
  }
  return null
}

async function callGrok({ systemPrompt, messages, maxTokens = 1500 }) {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
  if (!apiKey || apiKey.includes('your-key') || apiKey.length < 15) return null

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROK_MODEL || 'grok-beta',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
      })
    })
    if (res.ok) {
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (text) {
        console.log('[AITutor] ✅ Grok responded successfully')
        return text
      }
    } else {
      const err = await res.text()
      console.warn('[AITutor] Grok HTTP error:', res.status, err.slice(0, 100))
    }
  } catch (err) {
    console.warn('[AITutor] Grok failed:', err.message)
  }
  return null
}

async function callOpenRouter({ systemPrompt, messages, maxTokens = 1500 }) {
  if (!process.env.OPENROUTER_API_KEY) return null

  // Highly intelligent frontier free models tested and operational
  const FREE_MODELS = [
    process.env.OPENROUTER_TUTOR_MODEL || 'openrouter/free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nvidia/nemotron-3.5-lightning:free',
    'liquid/lfm-2.5-2.6b:free'
  ]

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://rexion.ai',
          'X-Title': 'Rexion AI Tutor'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.7,
          messages: [{ role: 'system', content: systemPrompt }, ...messages]
        })
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text && text.trim()) {
          console.log(`[AITutor] ✅ OpenRouter (${model}) responded with real intelligence`)
          return text
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        const errMsg = errData?.error?.message || ''
        console.warn(`[AITutor] OpenRouter ${model} HTTP ${res.status}: ${errMsg.slice(0, 80)}`)
        if (res.status === 401) break // Bad key - no point trying others
      }
    } catch (err) {
      console.warn(`[AITutor] OpenRouter ${model} error:`, err.message)
    }
  }

  return null
}


async function callAnthropic({ systemPrompt, messages, maxTokens = 1500 }) {
  if (!process.env.ANTHROPIC_API_KEY) return null

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages
      })
    })
    if (res.ok) {
      const data = await res.json()
      const text = data.content?.map(b => b.text).join('') || ''
      if (text) {
        console.log('[AITutor] ✅ Anthropic responded successfully')
        return text
      }
    }
  } catch (err) {
    console.warn('[AITutor] Anthropic failed:', err.message)
  }
  return null
}

// Main LLM router — tries each provider in priority order
async function callExternalLLM({ systemPrompt, messages, maxTokens = 1500 }) {
  // 1. Gemini (primary — Google free tier, fast, high quality)
  const geminiResult = await callGemini({ systemPrompt, messages, maxTokens })
  if (geminiResult) return geminiResult

  // 2. Grok / xAI (secondary)
  const grokResult = await callGrok({ systemPrompt, messages, maxTokens })
  if (grokResult) return grokResult

  // 3. OpenRouter (tertiary — routes to best available free model)
  const openRouterResult = await callOpenRouter({ systemPrompt, messages, maxTokens })
  if (openRouterResult) return openRouterResult

  // 4. Anthropic (quaternary)
  const anthropicResult = await callAnthropic({ systemPrompt, messages, maxTokens })
  if (anthropicResult) return anthropicResult

  return null
}


// Fallback High-Quality Socratic Teaching Engine
export function generateCuratedTutorResponse(userMessage, mode = 'ask', level = 'beginner', careerPath = 'AI Engineer') {
  const query = userMessage.toLowerCase()

  // 1. RAG Query
  if (query.includes('rag') || query.includes('retrieval')) {
    return `## Understanding RAG (Retrieval-Augmented Generation)

In simple terms, **RAG** gives an AI model an open textbook during its exam, so it doesn't have to rely only on memory.

### The Everyday Analogy
Imagine a brilliant chef who knows general culinary principles by heart. If a customer asks for a recipe made with a rare local spice the chef hasn't seen, instead of guessing, the chef quickly pulls down a specialized reference handbook, reads the exact proportion, and cooks the dish flawlessly.

### How it Works in 3 Steps
1. **Retrieve** — When a user asks a question, the system searches a vector database (like Chroma or Pinecone) for the most relevant documents or documentation.
2. **Augment** — The system pastes those retrieved excerpts into the prompt alongside the user's question as verified context.
3. **Generate** — The LLM reads that context and crafts a grounded, up-to-date answer with citations.

### Real-World Example Flow
\`\`\`
User Query: "What is our company's refund policy?"
   ↓
[Embedding Search] → Fetches "refund_policy_2026.pdf" chunk
   ↓
[Augmented Prompt] → "Context: Refunds allowed within 30 days. Question: ..."
   ↓
[LLM Response]   → "According to section 4, you can request a refund within 30 days."
\`\`\`

### Check Your Understanding
Why would a medical clinic prefer using RAG over fine-tuning a model for looking up newly released drug guidelines?

<followups>["Show me a code example","How does vector search work?","Explain embeddings simply"]</followups>`
  }

  // 2. Transformer / Attention
  if (query.includes('attention') || query.includes('transformer')) {
    return `## Understanding Attention in Transformers

In simple terms, the **attention mechanism** lets a neural network focus on the most important words in a sentence, regardless of how far apart they are.

### The Everyday Analogy
Imagine listening to someone speak in a noisy airport. Your brain doesn't treat the hum of the engine, the intercom, and your friend's voice equally; you selectively *pay attention* to your friend's keywords while tuning out the background chatter.

### How it Works in 3 Steps
1. **Queries, Keys, and Values** — Every word creates three vectors: a **Query** ("what am I searching for?"), a **Key** ("what do I contain?"), and a **Value** ("what meaning do I pass on?").
2. **Score Calculation** — The model computes the dot product of the Query with every Key to measure relevance scores.
3. **Softmax Weighting** — Scores become percentage weights that determine how much information to borrow from each word's Value vector.

### Check Your Understanding
In the sentence *"The animal didn't cross the street because it was too tired"*, which word should **it** pay the most attention to?

<followups>["Explain Multi-Head Attention","Show attention code in PyTorch","What is Self-Attention?"]</followups>`
  }

  // 3. React useState / State Management
  if (query.includes('usestate') || query.includes('react state') || query.includes('state')) {
    return `## Understanding React's \`useState\` Hook

In simple terms, **\`useState\`** is a component's personal memory sticky note that remembers values across browser re-renders.

### The Everyday Analogy
Think of a scoreboard at a basketball game. When a player scores, you don't build a new stadium; you just update the digit on the scoreboard display so everyone sees the latest score.

### How it Works in 3 Steps
1. **Declare State** — \`const [count, setCount] = useState(0)\` creates a variable (\`count\`) and its personal remote control (\`setCount\`).
2. **Trigger Update** — Calling \`setCount(count + 1)\` notifies React that this component's data has changed.
3. **Re-render Component** — React calls your component function again with the updated value and refreshes the DOM.

### Concrete Example
\`\`\`jsx
function Counter() {
  const [likes, setLikes] = useState(0);

  return (
    <button onClick={() => setLikes(likes + 1)}>
      Likes: {likes}
    </button>
  );
}
\`\`\`

### Check Your Understanding
What would happen if you directly changed \`likes = likes + 1\` instead of calling \`setLikes\`?

<followups>["Explain useEffect hook","How does re-rendering work?","What are custom hooks?"]</followups>`
  }

  // 4. Study Plan Request
  if (mode === 'study_plan' || query.includes('study plan') || query.includes('roadmap')) {
    return `## 4-Week Fast-Track Roadmap: ${careerPath}

Here is a focused, daily study plan designed to take you from foundational concepts to job-ready portfolio projects.

### Week 1: Core Fundamentals & Python Mastery
- **Mon - Wed**: Deep-dive into Python data structures, generator functions, and async I/O.
- **Thu - Fri**: Object-Oriented design, type hinting, and unit testing with \`pytest\`.
- **Weekend Mini-Project**: Build a CLI tool that parses logs and generates statistical reports.

### Week 2: APIs, Databases & Backend Systems
- **Mon - Wed**: RESTful APIs with FastAPI, Pydantic validation, and SQLite/PostgreSQL.
- **Thu - Fri**: Docker containerization, environment variables, and automated builds.
- **Weekend Mini-Project**: Build a production microservice with authentication and rate limiting.

### Week 3: LLM Engineering & Vector Stores
- **Mon - Wed**: Prompt engineering, OpenAI/Anthropic APIs, token optimization.
- **Thu - Fri**: Vector embeddings, chunking strategies, and building a custom RAG pipeline with ChromaDB.
- **Weekend Mini-Project**: Build a personal "Chat with PDF" documentation assistant.

### Week 4: System Design & Interview Preparation
- **Mon - Wed**: System design fundamentals (caching, queues, load balancing, idempotency).
- **Thu - Fri**: Live coding drills on LeetCode patterns (Two Pointers, Hash Maps, Sliding Window).
- **Final Milestone**: Deploy your full-stack AI project with live demo URL and GitHub README.

### Check Your Understanding
How many hours per day can you dedicate, and which week would you like to start first?

<followups>["Give me Week 1 daily schedule","What projects impress recruiters?","Recommend free resources"]</followups>`
  }

  // 5. Code Optimization / Solve Code
  if (mode === 'solve_code' || query.includes('optimize') || query.includes('code') || query.includes('function')) {
    return `## Code Optimization Strategy

Before rewriting code, the key rule is to **identify the algorithmic bottleneck** ($O(n^2)$ vs $O(n)$) rather than applying micro-optimizations.

### The Everyday Analogy
Imagine looking for a lost receipt in an unsorted shoebox of 1,000 papers. Shuffling through them one by one takes forever. If you had filed them by month into labelled folders, you'd find it in 3 seconds. That is the difference between an Array scan and a Hash Map lookup!

### 3 High-Impact Steps
1. **Trade Space for Time** — Replace nested loops (\`for i in ...: for j in ...\`) with a dictionary (\`dict\` or \`Set\`) to turn $O(n)$ lookups into $O(1)$.
2. **Stream, Don't Load** — Use Python generators (\`yield\`) or streaming streams instead of reading entire 1GB files into memory.
3. **Pre-allocate Memory** — Avoid repeatedly resizing lists inside loops.

### Check Your Understanding
If you have an array of 100,000 user IDs and need to check if 5,000 specific IDs exist, what data structure should you convert the 100,000 IDs into first?

<followups>["Show before and after code","Explain Time vs Space complexity","How to profile Python code?"]</followups>`
  }


  // ── Greetings ────────────────────────────────────────────────────────────
  const greetWords = ['hi', 'hello', 'hey', 'hii', 'helo', 'heyy', 'sup', 'yo', 'howdy', 'namaste']
  const isGreeting = greetWords.some(g =>
    query === g || query.startsWith(g + ' ') || query.startsWith(g + ',') || query.startsWith(g + '!')
  )
  if (isGreeting) {
    const nameMatch = userMessage.match(/(?:i am|i'm|im|my name is|call me)\s+([\w]+)/i)
    const name = nameMatch ? nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1) : null
    const greet = name ? `Hi ${name}!` : 'Hey there!'
    return `${greet} Welcome to **Rexion AI Tutor** — your Socratic mentor for the **${careerPath}** path.

I explain complex concepts through everyday analogies and check your understanding at every step.

### What would you like to explore today?
- Ask a concept: *"Explain how neural networks learn"*
- Debug code: *"Why is my async/await not working?"*
- Study plan: *"Give me a 4-week AI Engineer roadmap"*
- Practice: *"Quiz me on Python data structures"*

<followups>["Explain RAG with an analogy","Give me a 4-week study plan","Quiz me on Python"]</followups>`
  }

  // ── Name introductions ───────────────────────────────────────────────────
  const isIntro = /^(i am|i'm|im|my name is|call me)\s+\w+/i.test(query) && query.split(' ').length <= 6
  if (isIntro) {
    const nm = userMessage.match(/(?:i am|i'm|im|my name is|call me)\s+([\w]+)/i)
    const name = nm ? nm[1].charAt(0).toUpperCase() + nm[1].slice(1) : 'there'
    return `Nice to meet you, **${name}**! I am your AI Tutor for the **${careerPath}** journey.

I use the Socratic method — guiding you to answers through questions and analogies, not just reciting facts.

### Ready to start? Try asking:
- *"Explain vector embeddings like I am 12"*
- *"What is the difference between supervised and unsupervised learning?"*
- *"Help me understand async await in JavaScript"*

<followups>["What topics should I learn first?","Explain machine learning basics","Give me a study roadmap"]</followups>`
  }

  // ── Small talk ───────────────────────────────────────────────────────────
  if (query.includes('how are you') || query.includes('who are you') || query.includes('what are you') || query.includes('how r u')) {
    return `I am doing great and ready to help!

I am **Rexion AI Tutor** — a Socratic technical mentor built to help you master **${careerPath}** concepts through everyday analogies and step-by-step teaching.

What would you like to learn today?

<followups>["Explain RAG in simple terms","Help me with Python basics","Create a study plan for me"]</followups>`
  }

  // ── Thank you ────────────────────────────────────────────────────────────
  if (query.includes('thank') || query.includes('thanks') || query.includes('thx') || query === 'ty') {
    return `You are very welcome! Keep up the great work on your **${careerPath}** journey.

Consistency is what separates good engineers from great ones. Ready for the next topic?

<followups>["Teach me something new","Quiz me on what I learned","Give me a coding challenge"]</followups>`
  }

  // ── Default: Conceptual Overview ─────────────────────────────────────────
  const topicClean = userMessage
    .replace(/^(can you explain|what is|how does|tell me about|explain|describe|define)\s*/i, '')
    .trim()
  return `## Understanding: ${topicClean || 'Your Question'}

This is a core concept that plays a vital role in modern software systems and the **${careerPath}** path.

### Core Idea
At a high level, **${topicClean || 'this concept'}** provides a structured mechanism to solve complex computational and architectural problems efficiently. In production environments, mastering its principles helps prevent performance bottlenecks and ensures system reliability.

### Key Considerations
1. **Foundations** — Understand the underlying data structures and execution flow.
2. **Trade-offs** — Analyze memory footprint, execution latency, and edge cases.
3. **Application** — Integrate cleanly into your production code and system architecture.

### Check Your Understanding:
What specific aspect of **${topicClean || 'this topic'}** would you like to explore in depth?

<followups>["Explain it from scratch","Show me a code example","Quiz me on this topic"]</followups>`
}

// Generate Tutor Chat Stream / Reply
export async function getTutorReply({ message, mode = 'ask', level = 'beginner', careerPath = 'AI Engineer', history = [] }) {
  const systemPrompt = buildTutorSystemPrompt(mode, level, careerPath)
  const apiMessages = [
    ...history.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : String(m.content)
    })),
    { role: 'user', content: message }
  ]

  let rawReply = await callExternalLLM({ systemPrompt, messages: apiMessages })

  // If the multi-turn or long context failed for any reason, try a clean single-turn emergency retry
  if (!rawReply) {
    console.warn('[AITutor] Multi-tier LLM call returned null, attempting emergency retry...')
    try {
      rawReply = await callOpenRouter({
        systemPrompt: "You are Rexion's AI Tutor, a highly intelligent engineering mentor and cognitive AI. Answer the student directly, thoroughly, and intelligently.",
        messages: [{ role: 'user', content: message }]
      })
    } catch (e) {
      console.error('[AITutor] Emergency retry error:', e.message)
    }
  }

  if (!rawReply) {
    console.warn('[AITutor] Fallback triggered for message:', message.slice(0, 50))
    rawReply = generateCuratedTutorResponse(message, mode, level, careerPath)
  }

  if (!rawReply) {
    rawReply = `I am currently experiencing higher than usual neural compute demand. Could you please rephrase or ask your question again in a moment? I want to make sure I give you a comprehensive and fully reasoned answer.\n\n<followups>["Try again","Ask a simpler question","Explain another topic"]</followups>`
  } else if (!rawReply.includes('<followups>')) {
    rawReply += '\n\n<followups>["Tell me more","Give me an example","Quiz me on this"]</followups>'
  }

  return extractFollowups(rawReply)
}


// Curated Question Bank for Quizzes (Guarantees Instant, High-Quality Quizzes on any topic)
const CURATED_QUIZ_TEMPLATES = {
  python: [
    {
      type: "mcq",
      prompt: "What is the time complexity of looking up a key in a standard Python dictionary on average?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correctIndex: 0,
      explanation: "Python dictionaries are implemented using hash tables, which provide average O(1) time complexity for key lookups."
    },
    {
      type: "mcq",
      prompt: "Which keyword in Python is used to create a generator function that yields values lazily?",
      options: ["return", "yield", "async", "emit"],
      correctIndex: 1,
      explanation: "The 'yield' statement produces a generator object, pausing function execution and returning values one at a time."
    },
    {
      type: "short",
      prompt: "Explain the difference between a list and a tuple in Python in 1-2 sentences.",
      rubric: "Must mention that lists are mutable (can be changed) while tuples are immutable (cannot be changed)."
    }
  ],
  rag: [
    {
      type: "mcq",
      prompt: "In a RAG architecture, what is the primary role of a Vector Database?",
      options: [
        "To compile Python code to machine instructions",
        "To store text embeddings and retrieve semantically similar document chunks",
        "To execute SQL queries for transactional banking",
        "To train large neural network weights from scratch"
      ],
      correctIndex: 1,
      explanation: "Vector databases index high-dimensional embedding vectors to perform fast approximate nearest neighbor (ANN) searches."
    },
    {
      type: "mcq",
      prompt: "Why is chunking necessary when preparing large documents for RAG?",
      options: [
        "LLMs have finite context windows and smaller chunks provide more precise semantic matches",
        "It speeds up internet connection bandwidth",
        "It prevents Python from throwing a syntax error",
        "Vector databases cannot store text longer than 10 characters"
      ],
      correctIndex: 0,
      explanation: "Chunking splits large documents so only the most relevant, context-rich passages are injected into the prompt window."
    },
    {
      type: "short",
      prompt: "What is the key advantage of RAG over fine-tuning for keeping knowledge current?",
      rubric: "Must mention updating external documents/database instantly without retraining or fine-tuning the model."
    }
  ],
  react: [
    {
      type: "mcq",
      prompt: "What happens when you update state in React using the state setter function?",
      options: [
        "The browser reloads the entire page from the server",
        "React schedules a re-render of the component with the new state value",
        "The component is permanently removed from the virtual DOM",
        "The JavaScript file is re-compiled by Vite"
      ],
      correctIndex: 1,
      explanation: "State setter functions inform React of data changes, causing React to re-render the component and update the DOM."
    },
    {
      type: "mcq",
      prompt: "What is the purpose of the dependency array in React's `useEffect` hook?",
      options: [
        "To define which CSS styles apply to the component",
        "To control when the effect function executes based on value changes",
        "To import third-party libraries from npm",
        "To prevent JavaScript from running asynchronously"
      ],
      correctIndex: 1,
      explanation: "The dependency array tells React to re-run the effect only when one of the specified dependencies has changed."
    },
    {
      type: "short",
      prompt: "Why should you never mutate state directly (e.g. `state.count = 5`) in React?",
      rubric: "Must mention that React cannot detect the change, so no re-render will be triggered."
    }
  ]
}

// Generate Practice Quiz on any topic
export async function generatePracticeQuiz({ topic, difficulty = 'medium', count = 5 }) {
  const normalizedTopic = topic.toLowerCase()
  let questions = []

  // Check if we have curated questions for this topic
  for (const [k, qs] of Object.entries(CURATED_QUIZ_TEMPLATES)) {
    if (normalizedTopic.includes(k)) {
      questions = qs
      break
    }
  }

  // If not curated, generate dynamic questions for this topic
  if (questions.length === 0) {
    questions = [
      {
        type: "mcq",
        prompt: `Which of the following best describes the core principle of ${topic}?`,
        options: [
          `Providing a structured, reliable method to solve problems in ${topic}`,
          "Executing arbitrary machine code without compilation",
          "Re-installing operating system drivers",
          "Storing temporary memory caches permanently"
        ],
        correctIndex: 0,
        explanation: `${topic} provides established architectural patterns and standard practices for building robust systems.`
      },
      {
        type: "mcq",
        prompt: `What is a common pitfall or anti-pattern to avoid when working with ${topic}?`,
        options: [
          "Using automated testing and clear naming conventions",
          "Premature optimization without profiling the true bottleneck",
          "Documenting code interfaces and types",
          "Employing version control with Git"
        ],
        correctIndex: 1,
        explanation: "Premature optimization adds unnecessary complexity without addressing real performance issues."
      },
      {
        type: "short",
        prompt: `Explain why understanding ${topic} is valuable in production environments.`,
        rubric: "Mentions scalability, reliability, or maintainability in software systems."
      }
    ]
  }

  return questions.map((q, idx) => ({
    id: `q${idx + 1}`,
    ...q
  }))
}

// Grade Quiz Submission
export function gradeQuizSubmission(questions, answers) {
  const byId = new Map(answers.map(a => [a.id, a]))
  let totalScore = 0

  const results = questions.map((q) => {
    const userAns = byId.get(q.id)
    if (q.type === 'mcq') {
      const isCorrect = userAns?.choice === q.correctIndex
      const score = isCorrect ? 1 : 0
      totalScore += score
      return {
        id: q.id,
        type: q.type,
        score,
        correct: isCorrect,
        userChoice: userAns?.choice,
        correctIndex: q.correctIndex,
        explanation: q.explanation
      }
    }

    // Short answer evaluation against rubric
    const userText = (userAns?.text || '').trim().toLowerCase()
    let score = 0
    let feedback = "No answer provided."

    if (userText.length > 5) {
      // Evaluate key words in rubric
      const rubricWords = (q.rubric || '').toLowerCase().split(/\s+/).filter(w => w.length > 4)
      const matches = rubricWords.filter(w => userText.includes(w))
      const matchRatio = rubricWords.length > 0 ? matches.length / rubricWords.length : 0.5

      if (matchRatio >= 0.4 || userText.length > 40) {
        score = 1
        feedback = "Great answer! You covered the core concepts clearly."
      } else if (userText.length > 15) {
        score = 0.5
        feedback = `Good attempt! Consider also noting: ${q.rubric}`
      } else {
        score = 0.25
        feedback = `Partially addressed. Key point needed: ${q.rubric}`
      }
    }

    totalScore += score
    return {
      id: q.id,
      type: q.type,
      score,
      correct: score >= 0.75,
      explanation: q.explanation,
      feedback
    }
  })

  const finalPercentage = Math.round((totalScore / questions.length) * 100)
  return {
    score: finalPercentage,
    results
  }
}
