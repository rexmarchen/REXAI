export function splitIntoChunks(text, chunkSize = 800, overlap = 100) {
  const cleaned = String(text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!cleaned) return []

  const chunks = []
  let start = 0

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length)

    if (end < cleaned.length) {
      const paragraphBreak = cleaned.lastIndexOf('\n\n', end)
      const sentenceBreak = cleaned.lastIndexOf('. ', end)
      const boundary = Math.max(paragraphBreak, sentenceBreak)
      if (boundary > start + chunkSize * 0.5) {
        end = boundary + 1
      }
    }

    const chunk = cleaned.slice(start, end).trim()
    if (chunk) chunks.push(chunk)

    if (end >= cleaned.length) break
    start = Math.max(0, end - overlap)
  }

  return chunks
}

export function keywordScore(query, text) {
  const terms = String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .filter((term) => term.length > 2)

  if (!terms.length) return 0
  const haystack = String(text || '').toLowerCase()
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0) / terms.length
}

export function cleanMarkdown(mdText) {
  return String(mdText || '')
    .replace(/<[^>]*>/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\r?\n\s*\r?\n/g, '\n')
    .trim()
}
