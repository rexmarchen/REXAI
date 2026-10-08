'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Mail, Sparkles, Send, BarChart2, AlertCircle } from 'lucide-react'
import ContactSearch from '@/components/outreach/ContactSearch'
import DraftReview from '@/components/outreach/DraftReview'
import AppTracker from '@/components/outreach/AppTracker'
import type { OutreachContact } from '@/types/outreach'

type Step = 'search' | 'draft' | 'confirm' | 'tracker'

interface Draft {
  contactId: string
  subject: string
  body: string
}

interface ConnectedMailbox {
  id: string
  provider: 'google' | 'microsoft'
  email: string
  status: 'active' | 'disconnected'
}

export default function OutreachPage() {
  const [step, setStep] = useState<Step>('search')
  const [selectedContacts, setSelectedContacts] = useState<OutreachContact[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [campaignName, setCampaignName] = useState('Outreach Campaign')
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [bodyTemplate, setBodyTemplate] = useState('')

  // SMTP / Mail Configuration State (User's own mail credentials)
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [resendApiKey, setResendApiKey] = useState('')
  const [physicalAddress, setPhysicalAddress] = useState('')
  const [mailboxes, setMailboxes] = useState<ConnectedMailbox[]>([])
  const [selectedMailboxId, setSelectedMailboxId] = useState('')

  // Suppression Preview States
  const [checkingSuppression, setCheckingSuppression] = useState(false)
  const [suppressedCount, setSuppressedCount] = useState(0)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMailboxes = async () => {
      try {
        const response = await fetch('/api/outreach/mailboxes')
        if (!response.ok) return
        const data = await response.json()
        const activeMailboxes = (data.mailboxes || []).filter((mailbox: ConnectedMailbox) => mailbox.status === 'active')
        setMailboxes(activeMailboxes)
        if (activeMailboxes.length === 1) {
          setSelectedMailboxId(activeMailboxes[0].id)
          setFromEmail(activeMailboxes[0].email)
        }
      } catch (mailboxError) {
        console.error('Could not load connected mailboxes.', mailboxError)
      }
    }
    loadMailboxes()
  }, [])

  // Trigger suppression check preview when entering the confirmation step
  useEffect(() => {
    if (step === 'confirm' && selectedContacts.length > 0) {
      const checkSuppression = async () => {
        setCheckingSuppression(true)
        try {
          // Verify with backend suppression entries
          const emails = selectedContacts.map((c) => c.email.toLowerCase().trim())
          const res = await fetch('/api/outreach/suppression/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails }),
          })
          if (res.ok) {
            const data = await res.json()
            setSuppressedCount(data.suppressedCount || 0)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setCheckingSuppression(false)
        }
      }
      checkSuppression()
    }
  }, [step, selectedContacts])

  const handleContactsSelected = (contacts: OutreachContact[]) => {
    if (contacts.length > 20) {
      setError('Select no more than 20 contacts per campaign.')
      return
    }
    setSelectedContacts(contacts)
    setStep('draft')
  }

  const handleDraftsApproved = (approvedDrafts: Draft[]) => {
    setDrafts(approvedDrafts)
    if (approvedDrafts.length > 0) {
      setSubjectTemplate(approvedDrafts[0].subject)
      setBodyTemplate(approvedDrafts[0].body)
    }
    setStep('confirm')
  }

  const handleSendCampaign = async () => {
    if (!fromEmail) {
      setError('Please provide a valid sender email address (fromEmail).')
      return
    }

    setSending(true)
    setError(null)

    try {
      const payload = {
        name: campaignName,
        subject: subjectTemplate || drafts[0]?.subject || 'Cold Outreach',
        bodyTemplate: bodyTemplate || drafts[0]?.body || '',
        drafts: drafts.map((d) => ({
          contactId: d.contactId,
          subject: d.subject,
          body: d.body,
        })),
        mailConfig: {
          mailboxId: selectedMailboxId || undefined,
          fromEmail,
          fromName,
          smtpHost: smtpHost || undefined,
          smtpPort: smtpPort || undefined,
          smtpUser: smtpUser || undefined,
          smtpPass: smtpPass || undefined,
          smtpSecure,
          resendApiKey: resendApiKey || undefined,
          physicalAddress: physicalAddress || undefined,
        },
      }

      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send campaign.')
      }

      // Success - transition to tracker step
      setStep('tracker')
    } catch (err: any) {
      setError(err.message || 'An error occurred while launching campaign.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#070d0a] text-slate-100 p-6 md:p-10 space-y-8">
      {/* Navigation & Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-emerald-500/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Outreach Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build and track direct outreach queues to founders and recruitment leads.
          </p>
        </div>

        {/* Steper Navigation */}
        <div className="flex items-center gap-2 bg-[#111c18]/90 border border-emerald-500/10 px-4 py-2 rounded-2xl text-xs">
          <button
            onClick={() => setStep('search')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              step === 'search' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Search
          </button>
          <span className="text-slate-600">&rarr;</span>
          <button
            disabled={selectedContacts.length === 0}
            onClick={() => setStep('draft')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              step === 'draft' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            2. AI Draft
          </button>
          <span className="text-slate-600">&rarr;</span>
          <button
            disabled={drafts.length === 0}
            onClick={() => setStep('confirm')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              step === 'confirm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            3. Send
          </button>
          <span className="text-slate-600">&rarr;</span>
          <button
            onClick={() => setStep('tracker')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              step === 'tracker' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Tracker
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {step === 'search' && (
          <ContactSearch onContactsSelected={handleContactsSelected} />
        )}

        {step === 'draft' && (
          <DraftReview
            selectedContacts={selectedContacts}
            onDraftsApproved={handleDraftsApproved}
            onBack={() => setStep('search')}
          />
        )}

        {step === 'confirm' && (
          <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-lg max-w-3xl mx-auto">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" /> Confirm Outreach Campaign
              </h2>
              <p className="text-sm text-slate-400">
                You are about to launch a campaign with <span className="font-semibold text-slate-200">{drafts.length} personalized drafts</span>.
              </p>
            </div>

            {/* Campaign Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Suppression Check Alert Box */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex items-center gap-3">
              <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
              <div className="text-xs text-slate-300">
                {checkingSuppression ? (
                  <span>Checking suppression database for bounces or unsubscribes...</span>
                ) : (
                  <span>
                    Suppression check complete: {suppressedCount} of {selectedContacts.length} selected contacts are suppressed and will be skipped on send.
                  </span>
                )}
              </div>
            </div>

            {/* Sender Credentials Form (SMTP settings) */}
            <div className="border-t border-emerald-500/5 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Mail size={16} className="text-blue-400" /> Your Mail Credentials
              </h3>
              <p className="text-xs text-slate-400">
                Send through a connected Gmail or Microsoft mailbox, or use SMTP and Resend as a fallback.
              </p>

              <div className="space-y-3 border-b border-emerald-500/10 pb-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1 space-y-1">
                    <span className="block text-xs font-medium text-slate-400">Connected mailbox</span>
                    <select
                      value={selectedMailboxId}
                      onChange={(event) => {
                        const mailboxId = event.target.value
                        setSelectedMailboxId(mailboxId)
                        const mailbox = mailboxes.find((entry) => entry.id === mailboxId)
                        if (mailbox) setFromEmail(mailbox.email)
                      }}
                      className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                    >
                      <option value="">Use SMTP or Resend</option>
                      {mailboxes.map((mailbox) => (
                        <option key={mailbox.id} value={mailbox.id}>
                          {mailbox.provider === 'google' ? 'Gmail' : 'Microsoft'} - {mailbox.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <a href="/api/outreach/mailboxes/google" className="rounded-xl border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/10">
                      Connect Gmail
                    </a>
                    <a href="/api/outreach/mailboxes/microsoft" className="rounded-xl border border-blue-400/20 px-3.5 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/10">
                      Connect Microsoft
                    </a>
                  </div>
                </div>
                {selectedMailboxId && (
                  <p className="text-xs text-emerald-300">This campaign will send through the selected mailbox using OAuth.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">From Name</label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g. Sagar Sagar"
                    className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">From Email Address *</label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="e.g. sagar@yourdomain.com"
                    className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Tabs for SMTP vs Resend */}
              <div className="space-y-4 bg-[#0b1210]/60 p-4 border border-emerald-500/5 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">SMTP Port</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">SMTP Username</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="e.g. username@gmail.com"
                      className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="secure-smtp"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <label htmlFor="secure-smtp" className="text-xs text-slate-400">Use secure SMTP (SSL/TLS on port 465)</label>
                </div>

                <div className="text-center text-xs text-slate-500 font-semibold py-1">OR</div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Custom Resend API Key</label>
                  <input
                    type="password"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_••••••••••••"
                    className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Physical Address */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Your Physical Mailing Address (CAN-SPAM compliance)</label>
                <input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="e.g. 123 Tech St, Suite A, San Francisco, CA 94107"
                  className="w-full bg-[#0b1210] border border-emerald-500/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-950/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Action Row */}
            <div className="flex items-center justify-between border-t border-emerald-500/5 pt-6">
              <button
                onClick={() => setStep('draft')}
                className="bg-transparent hover:bg-slate-800 text-slate-400 font-medium px-5 py-2.5 rounded-xl text-sm transition"
              >
                Edit Drafts
              </button>

              <button
                onClick={handleSendCampaign}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"
              >
                {sending ? 'Launching...' : `Send ${drafts.length} Emails`}
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {step === 'tracker' && <AppTracker />}
      </div>
    </main>
  )
}
