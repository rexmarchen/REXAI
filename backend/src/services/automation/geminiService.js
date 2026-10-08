import { GEMINI_API_KEY, GEMINI_TEXT_MODEL } from '../../config/env.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function callGeminiJson(prompt) {
  if (!GEMINI_API_KEY) {
    return null
  }

  const candidateModels = Array.from(new Set([
    GEMINI_TEXT_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.0-flash'
  ].filter(Boolean)))

  let lastError = null
  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })

        if (!response.ok) {
          lastError = new Error(`Gemini generateContent error (${response.status}): ${await response.text()}`)
          if ((response.status === 429 || response.status === 503) && attempt < 2) {
            await sleep(1000 * attempt)
            continue
          }
          break
        }

        const data = await response.json()
        const rawText = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text
        if (!rawText) throw new Error('No text returned by Gemini.')

        const jsonMatch = rawText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0])
          } catch {}
        }

        return { post_text: rawText.replace(/```json|```/g, '').trim() }
      } catch (err) {
        lastError = err
        if (attempt < 2) await sleep(1000 * attempt)
      }
    }
  }

  throw lastError || new Error('Gemini generation failed.')
}

export async function testGeminiApiKey(apiKey) {
  if (!apiKey) return { ok: false, message: 'Gemini API key is required.' }
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash']
  for (const model of candidateModels) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with OK' }] }]
        })
      })
      if (response.ok) {
        return { ok: true, model, message: 'Gemini API key is valid and operational.' }
      }
    } catch {}
  }
  return { ok: false, message: 'Could not validate Gemini API key with Google AI Studio.' }
}
