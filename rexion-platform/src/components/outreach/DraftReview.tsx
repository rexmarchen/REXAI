'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Edit, FileText, Send, Sparkles, UserCheck } from 'lucide-react'
import type { OutreachContact } from '@/types/outreach'

interface Draft {
  contactId: string
  subject: string
  body: string
}

interface DraftReviewProps {
  selectedContacts: OutreachContact[]
  onDraftsApproved: (drafts: Draft[]) => void
  onBack: () => void
}

export default function DraftReview({ selectedContacts, onDraftsApproved, onBack }: DraftReviewProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Fetch drafts when component mounts
  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/outreach/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactIds: selectedContacts.map((c) => c.id),
          }),
        })

        if (!res.ok) {
          throw new Error('Failed to generate email drafts.')
        }

        const data = await res.json()
        setDrafts(data.drafts || [])
      } catch (err: any) {
        setError(err.message || 'An error occurred while generating drafts.')
      } finally {
        setLoading(false)
      }
    }

    fetchDrafts()
  }, [selectedContacts])

  const handleSubjectChange = (val: string) => {
    const updated = [...drafts]
    if (updated[currentIndex]) {
      updated[currentIndex].subject = val
      setDrafts(updated)
    }
  }

  const handleBodyChange = (val: string) => {
    const updated = [...drafts]
    if (updated[currentIndex]) {
      updated[currentIndex].body = val
      setDrafts(updated)
    }
  }

  const handleProceed = () => {
    onDraftsApproved(drafts)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="p-4 bg-blue-500/5 rounded-full border border-blue-500/10 text-blue-400 animate-pulse">
          <Sparkles size={32} />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold text-slate-200">Claude is drafting personalized emails...</h3>
          <p className="text-xs text-slate-400">Customizing short, high-impact messages for {selectedContacts.length} contacts.</p>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-8 text-center space-y-4">
        <div className="flex justify-center text-red-400">
          <AlertCircle size={32} />
        </div>
        <p className="text-slate-200">{error}</p>
        <div className="flex justify-center gap-3">
          <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm transition">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentContact = selectedContacts[currentIndex]
  const currentDraft = drafts[currentIndex]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar List */}
      <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-4 space-y-4 shadow-lg">
        <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase px-2">Contacts Queue</h3>
        <div className="space-y-1 overflow-y-auto max-h-[480px]">
          {selectedContacts.map((contact, idx) => (
            <button
              key={contact.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between border transition ${
                idx === currentIndex
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-emerald-500/[0.02]'
              }`}
            >
              <div className="truncate pr-2">
                <div className="font-medium truncate">{contact.firstName} {contact.lastName}</div>
                <div className="text-xs opacity-75 truncate">{contact.companyName}</div>
              </div>
              {drafts[idx] && <UserCheck size={14} className="text-emerald-400 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Edit Form */}
      {currentContact && currentDraft && (
        <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Contact details context bar */}
            <div className="bg-[#0b1210]/95 border border-emerald-500/5 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-400">
              <div>
                Recipient: <span className="font-semibold text-slate-200">{currentContact.firstName} {currentContact.lastName}</span> &middot; {currentContact.jobTitle} &middot; <span className="font-semibold text-slate-200">{currentContact.companyName}</span>
              </div>
              <div className="text-blue-400 flex items-center gap-1">
                <Edit size={12} /> Live Preview
              </div>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Email Subject</label>
              <input
                type="text"
                value={currentDraft.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Email Body textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">Email Body (Markdown supported)</label>
                <span className="text-[10px] text-slate-500">
                  {currentDraft.body.split(/\s+/).filter(Boolean).length} / 120 words max
                </span>
              </div>
              <textarea
                value={currentDraft.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                rows={10}
                className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl p-4 text-sm text-slate-200 outline-none focus:border-blue-500 transition resize-none font-mono"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-emerald-500/5">
            <button
              onClick={onBack}
              className="bg-transparent hover:bg-slate-800 text-slate-400 font-medium px-5 py-2.5 rounded-xl text-sm transition"
            >
              Back to Search
            </button>

            <div className="flex items-center gap-3">
              {currentIndex < selectedContacts.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-5 py-2.5 rounded-xl text-sm transition"
                >
                  Next Contact
                </button>
              ) : (
                <button
                  onClick={handleProceed}
                  className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md shadow-blue-900/10 transition"
                >
                  Proceed to Send
                  <Send size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
