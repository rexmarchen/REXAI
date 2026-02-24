import { readFileSync } from 'node:fs'
import path from 'node:path'

const normalizeText = (rawText) =>
  String(rawText || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const extractText = async (filePath, mimetype = '') => {
  try {
    const extension = path.extname(String(filePath || '')).toLowerCase()
    const isTextFirst = extension === '.txt' || String(mimetype || '').startsWith('text/')
    const fileBuffer = readFileSync(filePath)

    if (isTextFirst) {
      return normalizeText(fileBuffer.toString('utf8'))
    }

    const utf8Text = normalizeText(fileBuffer.toString('utf8'))
    const latinText = normalizeText(fileBuffer.toString('latin1'))
    return utf8Text.length >= latinText.length ? utf8Text : latinText
  } catch (error) {
    throw new Error('Unable to parse resume')
  }
}

export const parseResume = extractText
