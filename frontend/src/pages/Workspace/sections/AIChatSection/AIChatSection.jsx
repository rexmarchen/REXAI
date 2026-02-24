import React, { useEffect, useRef, useState } from 'react'
import styles from '../../WorkspaceSection.module.css'

const AI_RESPONSES = [
  {
    text: 'Great request. I generated a clean API handler and included validation.',
    code: `export async function createProject(req, res) {\n  const payload = validateSchema(req.body)\n  const result = await service.create(payload)\n  return res.status(201).json({ data: result })\n}`
  },
  {
    text: 'Your query can be optimized with indexed filters and pagination.',
    code: `SELECT id, title, status\nFROM tasks\nWHERE team_id = $1\nORDER BY created_at DESC\nLIMIT 25 OFFSET $2;`
  },
  {
    text: 'I found two bottlenecks: repeated network calls and redundant re-renders.',
    code: `const cached = useMemo(() => buildMap(data), [data])\nconst load = useCallback(async () => {\n  if (cache.current[id]) return cache.current[id]\n  const result = await api.get(id)\n  cache.current[id] = result\n  return result\n}, [id])`
  }
]

const initialMessages = [
  {
    id: 'welcome',
    role: 'ai',
    text: 'Hello. I am your REXION AI assistant. Ask for code generation, debugging, architecture, or deployment help.',
    code: '// Try: "generate a secure auth endpoint with tests"'
  }
]

const AIChatSection = () => {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, typing])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const sendMessage = () => {
    const trimmed = input.trim()
    if (!trimmed || typing) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setTyping(true)

    timeoutRef.current = setTimeout(() => {
      const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)]
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: response.text,
        code: response.code
      }
      setMessages((prev) => [...prev, aiMessage])
      setTyping(false)
    }, 900)
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>AI Chat</h2>
      <p className={styles.pageSubtitle}>
        Context-aware chat for coding tasks. Ask, iterate and ship faster.
      </p>

      <div className={styles.chatWrap}>
        <div ref={scrollRef} className={styles.chatMessages}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={`${styles.chatMessage} ${message.role === 'user' ? styles.chatMessageUser : ''}`}
            >
              <div className={`${styles.chatAvatar} ${message.role === 'user' ? styles.chatAvatarUser : ''}`}>
                {message.role === 'user' ? 'U' : 'Rx'}
              </div>
              <div className={`${styles.chatBubble} ${message.role === 'user' ? styles.chatBubbleUser : ''}`}>
                <p>{message.text}</p>
                {message.code && <pre className={styles.codeBlock}>{message.code}</pre>}
              </div>
            </article>
          ))}

          {typing && (
            <article className={styles.chatMessage}>
              <div className={styles.chatAvatar}>Rx</div>
              <div className={styles.chatBubble}>
                <span className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </article>
          )}
        </div>

        <div className={styles.chatInputArea}>
          <textarea
            className={styles.chatInput}
            value={input}
            rows={1}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask AI anything — code, debug, explain..."
          />
          <button type="button" className={styles.chatSend} onClick={sendMessage} disabled={typing}>
            Send
          </button>
        </div>
      </div>
    </section>
  )
}

export default AIChatSection
