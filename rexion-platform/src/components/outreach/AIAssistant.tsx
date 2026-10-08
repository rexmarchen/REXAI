'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const AI_ACTIONS = [
  { id: 'improve', label: 'Improve writing' },
  { id: 'shorter', label: 'Make shorter' },
  { id: 'professional', label: 'Make more professional' },
  { id: 'conversational', label: 'Make more conversational' },
  { id: 'subject', label: 'Generate subject line' },
]

interface AIAssistantProps {
  body: string
  onApply: (newBody: string) => void
}

export function AIAssistant({ body, onApply }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const runAction = async (actionId: string) => {
    if (!body.trim()) {
      toast.error('Write a message first before using AI assistance')
      setOpen(false)
      return
    }
    setLoading(actionId)
    setOpen(false)

    // Mock AI processing — replace with real API call: POST /api/ai/outreach-assist
    // { action: actionId, body } → { result: string }
    await new Promise((r) => setTimeout(r, 1200))

    // Return slightly modified mock (real backend would return AI result)
    const improved =
      actionId === 'shorter'
        ? body.split('\n').slice(0, 3).join('\n') + '\n\nBest,\nYour Name'
        : body

    onApply(improved)
    toast.success('AI suggestion applied')
    setLoading(null)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition hover:border-white/20 hover:text-white disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {loading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white" />
            Improving...
          </>
        ) : (
          <>
            <Sparkles size={12} />
            Improve with AI
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-0 z-50 mb-1.5 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0f1419] shadow-xl"
            role="menu"
          >
            <div className="p-1">
              {AI_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => void runAction(action.id)}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                  role="menuitem"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
