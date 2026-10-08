import assert from 'assert'
import { chunkTextWithMetadata } from '../src/services/resume/resumeIngestionService.js'
import { classifyCareerDomains, extractContactInfo } from '../src/services/resume/candidateProfileService.js'
import { rankChunksInMemory } from '../src/services/resume/scopedVectorStore.js'
import { CAREER_DOMAINS } from '../src/config/constants.js'

console.log('--- RUNNING RESUME INGESTION & DOMAIN INTELLIGENCE TEST SUITE ---')

const SAMPLE_RESUME_TEXT = `
ALEX REXION
Email: alex.rexion@example.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/alex-rexion | GitHub: github.com/alexrexion

PROFESSIONAL SUMMARY
Innovative Senior Machine Learning & Fullstack Engineer with 5+ years of experience designing scalable AI systems, distributed microservices, and modern web applications. Expert in PyTorch, LLMs, LangChain, React, Node.js, and AWS cloud infrastructure.

WORK EXPERIENCE
Senior AI Engineer | NeuralCorp (2022 - Present)
- Architected and deployed production RAG pipelines using PyTorch, Hugging Face transformers, and vector databases, reducing latency by 40%.
- Integrated machine learning models with FastAPI microservices and React frontends handling 2M daily active users.
- Implemented CI/CD pipelines with Docker, Kubernetes, and AWS ECS.

Software Engineer | DevStream (2019 - 2022)
- Built high-throughput backend services using Node.js, Express, PostgreSQL, and Redis.
- Developed interactive web dashboards in React and TypeScript.

TECHNICAL SKILLS
Languages & Frameworks: Python, JavaScript, TypeScript, PyTorch, TensorFlow, React, Node.js, Express, FastAPI
Databases & Cloud: PostgreSQL, MongoDB, Redis, AWS, Docker, Kubernetes, Git
AI / ML: Large Language Models (LLMs), RAG, LangChain, Hugging Face, NLP, Transformers

EDUCATION
Bachelor of Science in Computer Science | Stanford University
`

// Test 1: Chunking & Token estimation
{
  const chunks = chunkTextWithMetadata(SAMPLE_RESUME_TEXT, { targetChunkWords: 80, overlapWords: 15 })
  assert(chunks.length >= 2, 'Should create at least 2 structured chunks')
  for (const chunk of chunks) {
    assert(chunk.chunkId, 'Every chunk must have a chunkId')
    assert(chunk.text.length > 0, 'Chunk text must not be empty')
    assert(chunk.section, 'Chunk section must be identified')
    assert(chunk.tokenCount > 0, 'Token count must be estimated')
  }
  console.log(`✓ Test 1 Passed: Successfully created ${chunks.length} structured chunks with section metadata`)
}

// Test 2: Contact Info Extraction
{
  const contact = extractContactInfo(SAMPLE_RESUME_TEXT, { name: 'Alex Rexion' })
  assert.strictEqual(contact.fullName, 'Alex Rexion')
  assert.strictEqual(contact.email, 'alex.rexion@example.com')
  assert.strictEqual(contact.phone, '(555) 123-4567')
  assert.strictEqual(contact.linkedinUrl, 'https://linkedin.com/in/alex-rexion')
  assert.strictEqual(contact.githubUrl, 'https://github.com/alexrexion')
  console.log('✓ Test 2 Passed: Contact information parsed with precision')
}

// Test 3: Domain Classification
{
  const classification = classifyCareerDomains(SAMPLE_RESUME_TEXT, ['Python', 'PyTorch', 'React', 'Node.js', 'LLM'])
  assert.strictEqual(classification.primaryDomain, CAREER_DOMAINS.AI_ML, 'Primary domain must be AI_ML')
  assert(classification.domainScores.length > 0, 'Should have multiple domain confidence scores')
  console.log(`✓ Test 3 Passed: Domain classified as ${classification.primaryDomain} with ${classification.domainScores[0].confidence} confidence`)
}

// Test 4: Scoped Vector Store Retrieval
{
  const chunks = chunkTextWithMetadata(SAMPLE_RESUME_TEXT, { targetChunkWords: 80, overlapWords: 15 })
  const searchResults = rankChunksInMemory(chunks, 'RAG pipelines and transformers', { topK: 2 })
  assert(searchResults.length > 0, 'Should retrieve relevant chunks for RAG query')
  assert(searchResults[0].text.includes('RAG') || searchResults[0].text.includes('AI'), 'Top chunk should be relevant to AI/RAG')
  console.log('✓ Test 4 Passed: Scoped semantic ranking retrieved relevant context chunk')
}

console.log('ALL RESUME INGESTION & DOMAIN TESTS PASSED PERFECTLY!')
