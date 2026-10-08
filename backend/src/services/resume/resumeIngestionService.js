import crypto from 'crypto'
import fs from 'fs/promises'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import AppError from '../../utils/AppError.js'
import { extractResumeProfile } from '../resumeProfileExtractor.js'

/**
 * Section header detection regex patterns
 */
const SECTION_PATTERNS = {
  summary: /^(professional\s+summary|summary|objective|about\s+me|profile)/i,
  experience: /^(work\s+experience|professional\s+experience|experience|employment\s+history|career\s+history)/i,
  education: /^(education|academic\s+background|academics|qualifications)/i,
  skills: /^(technical\s+skills|core\s+skills|skills\s*&?\s*competencies|skills|technologies|tools)/i,
  projects: /^(projects|key\s+projects|personal\s+projects|academic\s+projects)/i,
  certifications: /^(certifications|licenses|courses\s*&?\s*certifications|training)/i,
  awards: /^(honors|awards|achievements|publications)/i
}

/**
 * Tokenize text by words (approx 1 token ~= 0.75 words, so 300-800 tokens ~= 225-600 words)
 * Target chunk size: ~350-500 words with 50 word overlap
 */
export function chunkTextWithMetadata(rawText, { targetChunkWords = 400, overlapWords = 60 } = {}) {
  const normalized = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  if (!normalized) {
    return []
  }

  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)
  const chunks = []
  let currentSection = 'general'
  let currentChunkLines = []
  let currentChunkWords = 0
  let chunkIndex = 0

  function detectSection(line) {
    for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(line.replace(/[:*#_-]/g, '').trim())) {
        return sectionName
      }
    }
    return null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const detected = detectSection(line)
    if (detected) {
      currentSection = detected
    }

    const wordsInLine = line.split(/\s+/).length
    currentChunkLines.push({ text: line, section: currentSection })
    currentChunkWords += wordsInLine

    // If chunk size reached or next line is a major section break and chunk is large enough
    if (currentChunkWords >= targetChunkWords || (detected && currentChunkWords >= targetChunkWords / 2)) {
      const chunkText = currentChunkLines.map((item) => item.text).join('\n')
      const dominantSection = currentChunkLines[0]?.section || currentSection

      const chunkId = `chunk_${chunkIndex++}_${crypto.createHash('sha256').update(chunkText).digest('hex').slice(0, 8)}`
      chunks.push({
        chunkId,
        text: chunkText,
        section: dominantSection,
        tokenCount: Math.round(currentChunkWords * 1.33), // rough estimate
        metadata: {
          wordCount: currentChunkWords,
          created_at: new Date().toISOString()
        }
      })

      // Carry over overlap
      const overlapLines = []
      let overlapWordsCount = 0
      for (let j = currentChunkLines.length - 1; j >= 0; j--) {
        const itemWords = currentChunkLines[j].text.split(/\s+/).length
        if (overlapWordsCount + itemWords <= overlapWords) {
          overlapLines.unshift(currentChunkLines[j])
          overlapWordsCount += itemWords
        } else {
          break
        }
      }

      currentChunkLines = [...overlapLines]
      currentChunkWords = overlapWordsCount
    }
  }

  // Final flush
  if (currentChunkLines.length > 0) {
    const chunkText = currentChunkLines.map((item) => item.text).join('\n')
    const dominantSection = currentChunkLines[0]?.section || currentSection
    const chunkId = `chunk_${chunkIndex++}_${crypto.createHash('sha256').update(chunkText).digest('hex').slice(0, 8)}`
    chunks.push({
      chunkId,
      text: chunkText,
      section: dominantSection,
      tokenCount: Math.round(currentChunkWords * 1.33),
      metadata: {
        wordCount: currentChunkWords,
        created_at: new Date().toISOString()
      }
    })
  }

  return chunks
}

/**
 * Extract text from file path or buffer
 */
export async function parseResumeFile(filePathOrBuffer, mimetype = 'application/pdf') {
  let rawText = ''
  let buffer = null

  if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer
  } else if (typeof filePathOrBuffer === 'string') {
    buffer = await fs.readFile(filePathOrBuffer)
  } else {
    throw new AppError('Invalid resume input format', 400)
  }

  if (mimetype === 'application/pdf' || mimetype.includes('pdf')) {
    const parser = new PDFParse({ data: buffer })
    try {
      const data = await parser.getText()
      rawText = data.text || ''
    } finally {
      await parser.destroy()
    }
  } else if (
    mimetype.includes('wordprocessingml') ||
    mimetype.includes('docx') ||
    mimetype.includes('msword')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    rawText = result.value || ''
  } else if (mimetype.includes('text/plain') || mimetype.includes('text')) {
    rawText = buffer.toString('utf-8')
  } else {
    // Fallback attempt text decoding
    rawText = buffer.toString('utf-8')
  }

  return rawText.trim()
}

/**
 * Ingest resume, chunk semantically, extract profile metadata
 */
export async function ingestResume({ filePath, buffer, mimetype, userId }) {
  const rawText = await parseResumeFile(buffer || filePath, mimetype)
  if (!rawText || rawText.length < 20) {
    throw new AppError('Uploaded resume contains insufficient readable text', 400)
  }

  const chunks = chunkTextWithMetadata(rawText)
  const extracted = extractResumeProfile(rawText)
  const fileHash = crypto.createHash('sha256').update(rawText).digest('hex')

  return {
    userId,
    fileHash,
    rawText,
    chunks,
    extracted,
    totalTokens: chunks.reduce((acc, c) => acc + (c.tokenCount || 0), 0)
  }
}
