'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Save } from 'lucide-react'
import { toast } from 'sonner'
import { contactService } from '@/lib/outreach/contact-service'
import type { CampaignDraft, OutreachContact } from '@/types/outreach'
import { SubjectInput } from './SubjectInput'
import { MessageEditor } from './MessageEditor'
import { VariablePicker } from './VariablePicker'
import { AIAssistant } from './AIAssistant'
import { EmailPreview } from './EmailPreview'

const DEFAULT_BODY = `Hello {{firstName}},

I came across {{companyName}} and was really impressed by what you're building.

I'd love to connect briefly — would you have 15 minutes this week?

Best,
Your Name`

interface CampaignComposerProps {
  contactIds: string[]
}

export function CampaignComposer({ contactIds }: CampaignComposerProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<OutreachContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [previewIndex, setPreviewIndex] = useState(0)

  const [draft, setDraft] = useState<CampaignDraft>({
    name: '',
    contactIds,
    subject: 'Quick introduction to {{companyName}}',
    body: DEFAULT_BODY,
  })

  useEffect(() => {
    void contactService.getByIds(contactIds).then((c) => {
      setContacts(c)
      setIsLoadingContacts(false)
    })
  }, [contactIds])

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Email message body"]')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newBody = draft.body.slice(0, start) + variable + draft.body.slice(end)
      setDraft((d) => ({ ...d, body: newBody }))
      // Restore cursor position after state update
      requestAnimationFrame(() => {
        textarea.setSelectionRange(start + variable.length, start + variable.length)
        textarea.focus()
      })
    } else {
      setDraft((d) => ({ ...d, body: d.body + variable }))
    }
  }

  const saveDraft = () => {
    sessionStorage.setItem('outreach:draft', JSON.stringify(draft))
    toast.success('Draft saved')
  }

  const handleReview = () => {
    if (!draft.subject.trim()) {
      toast.error('Please add a subject line')
      return
    }
    if (!draft.body.trim()) {
      toast.error('Please write a message')
      return
    }
    sessionStorage.setItem('outreach:draft', JSON.stringify(draft))
    router.push('/dashboard/outreach/review')
  }

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Compose */}
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-white">Compose</h2>
          <p className="mt-0.5 text-xs text-[var(--text-dim)]">
            {contacts.length} recipient{contacts.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Campaign name */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
            Campaign name
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Founder Outreach — August"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-[var(--text-dim)] outline-none transition focus:border-[var(--blue)]/50 focus:bg-white/[0.07]"
            aria-label="Campaign name"
          />
        </div>

        <SubjectInput
          value={draft.subject}
          onChange={(subject) => setDraft((d) => ({ ...d, subject }))}
        />

        <MessageEditor
          value={draft.body}
          onChange={(body) => setDraft((d) => ({ ...d, body }))}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <VariablePicker onInsert={insertVariable} />
            <AIAssistant
              body={draft.body}
              onApply={(body) => setDraft((d) => ({ ...d, body }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-dim)] transition hover:text-white"
            >
              <Save size={12} />
              Save draft
            </button>
            <button
              onClick={handleReview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--blue)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Review
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="min-h-[420px]">
        <EmailPreview
          contacts={contacts}
          subject={draft.subject}
          body={draft.body}
          currentIndex={previewIndex}
          onNavigate={setPreviewIndex}
          isLoading={isLoadingContacts}
        />
      </div>
    </div>
  )
}
