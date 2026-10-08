import fs from 'fs/promises'
import mammoth from 'mammoth' // for .docx
import { PDFParse } from 'pdf-parse' // for .pdf
import AppError from '../utils/AppError.js'

export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath)
    const parser = new PDFParse({ data: dataBuffer })
    try {
      const data = await parser.getText()
      return data.text
    } finally {
      await parser.destroy()
    }
  } catch (error) {
    throw new AppError('Failed to parse PDF', 500)
  }
}

export const extractTextFromDocx = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  } catch (error) {
    throw new AppError('Failed to parse DOCX', 500)
  }
}

export const extractText = async (filePath, mimetype = '') => {
  const isPdf = mimetype === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')
  const isDocx =
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    filePath.toLowerCase().endsWith('.docx') ||
    filePath.toLowerCase().endsWith('.doc')
  const isText =
    mimetype.startsWith('text/') ||
    filePath.toLowerCase().endsWith('.txt') ||
    filePath.toLowerCase().endsWith('.md')

  if (isPdf) {
    return await extractTextFromPDF(filePath)
  } else if (isDocx) {
    return await extractTextFromDocx(filePath)
  } else if (isText) {
    return await fs.readFile(filePath, 'utf8')
  } else {
    // Attempt PDF parse then docx then raw utf8 as best-effort fallback
    try {
      return await extractTextFromPDF(filePath)
    } catch {
      try {
        return await extractTextFromDocx(filePath)
      } catch {
        return await fs.readFile(filePath, 'utf8')
      }
    }
  }
}