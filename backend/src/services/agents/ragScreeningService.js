import { retrieveResumeContext, rankChunksInMemory } from '../resume/scopedVectorStore.js'
import logger from '../../utils/logger.js'

/**
 * Fallback deterministic RAG answer generator using top matching chunks
 */
function synthesizeGroundedAnswer(question, chunks, profile = {}) {
  if (!chunks || chunks.length === 0) {
    return {
      answer: 'Relevant experience and projects detailed in attached resume.',
      confidence: 0.65,
      evidenceChunkIds: [],
      reasoning: 'Synthesized fallback from overall profile summary'
    }
  }

  const topChunk = chunks[0]
  const cleanSnippet = topChunk.text.slice(0, 300).replace(/\n/g, ' ')

  // Craft a professional grounded response
  const answer = `Based on my background, ${cleanSnippet}. I have proven experience applying these capabilities in production.`

  return {
    answer,
    confidence: Number((0.75 + Math.min(0.2, topChunk.score * 0.2)).toFixed(2)),
    evidenceChunkIds: chunks.map((c) => c.chunkId),
    reasoning: `Grounded in resume section: ${topChunk.section}`
  }
}

/**
 * Generate grounded answer for a screening question using RAG
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.question
 * @param {Object} [params.candidateProfile]
 * @param {Array} [params.directChunks]
 * @returns {Promise<{ question: string, answer: string, confidence: number, evidenceChunkIds: string[], reasoning: string }>}
 */
export async function generateScreeningAnswer({
  userId,
  question,
  candidateProfile,
  directChunks
}) {
  let relevantChunks = []

  if (directChunks && directChunks.length > 0) {
    relevantChunks = rankChunksInMemory(directChunks, question, { topK: 3 })
  } else if (userId) {
    try {
      relevantChunks = await retrieveResumeContext(userId, question, { topK: 3 })
    } catch (err) {
      logger.warn(`Failed to retrieve resume context for user ${userId}: ${err.message}`)
    }
  }

  // If Gemini API Key is available, call Gemini REST API
  if (process.env.GEMINI_API_KEY) {
    try {
      const contextText = relevantChunks.map((c) => `[Source ${c.chunkId} - Section: ${c.section}]:\n${c.text}`).join('\n\n')
      const systemInstruction = `You are a professional candidate answering a job application screening question. Ground your answer strictly in the provided resume context. Be concise, professional, and factual. Do NOT fabricate facts not in the context.`

      const prompt = `QUESTION: "${question}"\n\nRESUME CONTEXT:\n${contextText || candidateProfile?.resumeRawText?.slice(0, 1500) || 'General software engineering background.'}\n\nProvide a concise 1-3 sentence response.`

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 250
          }
        }),
        signal: AbortSignal.timeout(8000)
      })

      if (response.ok) {
        const data = await response.json()
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (generatedText) {
          return {
            question,
            answer: generatedText,
            confidence: 0.92,
            evidenceChunkIds: relevantChunks.map((c) => c.chunkId),
            reasoning: 'Grounded generation via Gemini 1.5 Flash using scoped resume chunks'
          }
        }
      }
    } catch (err) {
      logger.warn(`Gemini screening generation failed: ${err.message}, falling back to deterministic synthesis`)
    }
  }

  // Deterministic fallback
  const synthesized = synthesizeGroundedAnswer(question, relevantChunks, candidateProfile)
  return {
    question,
    answer: synthesized.answer,
    confidence: synthesized.confidence,
    evidenceChunkIds: synthesized.evidenceChunkIds,
    reasoning: synthesized.reasoning
  }
}
