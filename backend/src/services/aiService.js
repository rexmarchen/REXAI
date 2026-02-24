import OpenAI from 'openai'
import { OPENAI_API_KEY } from '../config/env.js'
import AppError from '../utils/AppError.js'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

export const generatePrediction = async (resumeText) => {
  try {
    const prompt = `Based on the resume, predict career path in 5 years including job titles and industry. Resume: ${resumeText}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('OpenAI error:', error)
    throw new AppError('Failed to generate prediction', 500)
  }
}

export const generateWebsite = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert web developer. Generate complete HTML, CSS, and JavaScript code.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('OpenAI error:', error)
    throw new AppError('Failed to generate website', 500)
  }
}
