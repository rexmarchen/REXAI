import OpenAI from 'openai'
import { OPENAI_API_KEY } from '../config/env.js'
import AppError from '../utils/AppError.js'
import { observeOpenAI } from '../config/telemetry.js'

const rawOpenai = new OpenAI({ apiKey: OPENAI_API_KEY })
const openai = observeOpenAI(rawOpenai, {
  tags: ['backend', 'ai-service']
})

export const generatePrediction = async (resumeText) => {
  try {
    const prompt = `
      Based on the following resume, predict the person's most likely career path in 5 years, 
      including possible job titles, industry, and confidence level.
      Resume: ${resumeText}
      Provide a concise response with:
      - prediction: short career prediction
      - confidence: percentage (0-100)
      - details: brief explanation
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    })

    const content = response.choices[0].message.content
    // Parse the response (simplified)
    const prediction = content.split('\n')[0].replace('prediction:', '').trim()
    const confidenceMatch = content.match(/confidence:\s*(\d+)/i)
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 85
    const details = content

    return { prediction, confidence, details }
  } catch (error) {
    console.error('OpenAI error:', error)
    throw new AppError('Failed to generate prediction', 500)
  }
}

export const generateWebsite = async (prompt) => {
  try {
    const systemPrompt = `
      You are an expert web developer. Generate a complete, modern, responsive website based on the user's description.
      Output only the HTML, CSS, and JavaScript code. The code should be self-contained and work in a browser.
      Use semantic HTML5, CSS3, and modern JavaScript. Make it visually appealing and production-ready.
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
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