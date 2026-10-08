'use client'

import { useRef } from 'react'
import { segmentText } from '@/lib/outreach/variables'

interface MessageEditorProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Simple textarea editor. Variables are highlighted in the overlay div beneath
 * (classic contenteditable-free approach: textarea + overlay).
 * The overlay is not interactive; the textarea captures all input.
 */
export function MessageEditor({ value, onChange }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const segments = segmentText(value)

  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
        Message
      </label>

      {/* Overlay with variable highlights */}
      <div className="relative">
        {/* Transparent overlay showing colored variables */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 min-h-[200px] rounded-xl border border-transparent px-3 py-2.5 text-sm leading-relaxed"
          style={{ fontFamily: 'inherit', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
        >
          {segments.map((seg, i) =>
            seg.isVariable ? (
              <mark
                key={i}
                className="rounded bg-[var(--blue)]/20 px-0.5 text-[var(--blue)]"
                style={{ background: 'transparent' }}
              >
                <span
                  className="rounded px-0.5"
                  style={{ background: 'rgba(77,141,255,0.18)', color: '#4d8dff' }}
                >
                  {seg.text}
                </span>
              </mark>
            ) : (
              <span key={i} style={{ color: 'transparent' }}>
                {seg.text}
              </span>
            )
          )}
        </div>

        {/* Actual textarea (transparent text, so overlay shows through) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder={`Hello {{firstName}},\n\nI came across {{companyName}} and wanted to reach out...\n\nBest,\nYour Name`}
          className="relative min-h-[200px] w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-relaxed text-white caret-white placeholder-[var(--text-dim)] outline-none transition focus:border-[var(--blue)]/50 focus:bg-white/[0.07]"
          aria-label="Email message body"
          spellCheck
        />
      </div>
    </div>
  )
}
