import { useState, useRef, useCallback } from 'react'
import { streamTutorMessage, rateTutorMessage } from '../services/aiTutorApi'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: `## Welcome to Rexion AI Tutor! 🎓

I'm your Socratic technical mentor — I explain complex CS and AI concepts through **everyday analogies**, **step-by-step breakdowns**, and **practical code examples**.

### What would you like to explore?
- **Explain a Concept** → *"Explain RAG with an everyday analogy"*
- **Debug My Code** → *"Why is my async function not working?"*
- **Study Plan** → *"Give me a 4-week AI Engineer roadmap"*
- **Practice Quiz** → *"Quiz me on Python data structures"*`,
  followups: [
    'Explain RAG in simple terms',
    'How does React useState work?',
    'Generate a 4-week AI Engineer plan',
  ],
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}

export function useTutorChat(opts = {}) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [followups, setFollowups] = useState(WELCOME_MESSAGE.followups)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const sessionIdRef = useRef(null)
  const abortRef = useRef(null)

  const send = useCallback(
    async (messageText, mode = 'ask', level = opts.level || 'beginner') => {
      const trimmed = (messageText || '').trim()
      if (!trimmed || busy) return

      // Cancel any in-progress stream
      if (abortRef.current) abortRef.current = true
      abortRef.current = false

      setError(null)
      setBusy(true)

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const userMsgId = `u-${Date.now()}`
      const botMsgId = `b-${Date.now()}`

      setMessages(prev => [
        ...prev,
        { id: userMsgId, role: 'user', content: trimmed, time: now },
        { id: botMsgId, role: 'assistant', content: '', isStreaming: true, time: now },
      ])

      try {
        let streamedText = ''
        let resolvedMessageId = botMsgId
        let extractedFollowups = []

        const generator = streamTutorMessage({
          message: trimmed,
          mode,
          level,
          path: opts.path || 'AI Engineer',
          sessionId: sessionIdRef.current,
        })

        for await (const chunk of generator) {
          if (abortRef.current) break // cancelled

          if (chunk.type === 'session' && chunk.id) {
            sessionIdRef.current = chunk.id
          } else if (chunk.type === 'text' && chunk.t) {
            streamedText += chunk.t
            const textSnapshot = streamedText
            setMessages(prev =>
              prev.map(m =>
                m.id === botMsgId ? { ...m, content: textSnapshot, isStreaming: true } : m
              )
            )
          } else if (chunk.type === 'followups' && Array.isArray(chunk.items)) {
            extractedFollowups = chunk.items
          } else if (chunk.type === 'done') {
            if (chunk.messageId) resolvedMessageId = chunk.messageId
          }
        }

        // Finalise the message
        setMessages(prev =>
          prev.map(m =>
            m.id === botMsgId
              ? {
                  ...m,
                  id: resolvedMessageId,
                  content: streamedText,
                  followups: extractedFollowups,
                  isStreaming: false,
                }
              : m
          )
        )
        if (extractedFollowups.length > 0) setFollowups(extractedFollowups)
      } catch (err) {
        console.error('[useTutorChat] error:', err)
        const errMsg =
          err?.message?.includes('401')
            ? 'Please log in to use the AI Tutor.'
            : err?.message?.includes('429') || err?.message?.includes('402')
            ? 'The tutor is busy — please try again in a moment.'
            : err?.message || 'Something went wrong. Please try again.'

        setError(errMsg)
        setMessages(prev =>
          prev.map(m =>
            m.id === botMsgId
              ? { ...m, content: errMsg, isStreaming: false, isError: true }
              : m
          )
        )
      } finally {
        setBusy(false)
        abortRef.current = false
      }
    },
    [busy, opts.level, opts.path]
  )

  const rate = useCallback(async (messageId, rating) => {
    try {
      await rateTutorMessage(messageId, rating, sessionIdRef.current)
      setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, userRating: rating } : m)))
    } catch (e) {
      console.warn('[useTutorChat] rating failed silently:', e.message)
    }
  }, [])

  const reset = useCallback(() => {
    if (abortRef.current !== null) abortRef.current = true
    sessionIdRef.current = null
    setMessages([WELCOME_MESSAGE])
    setFollowups(WELCOME_MESSAGE.followups)
    setError(null)
    setBusy(false)
  }, [])

  return {
    messages,
    followups,
    busy,
    error,
    send,
    rate,
    reset,
    sessionId: sessionIdRef.current,
    setMessages,
  }
}
