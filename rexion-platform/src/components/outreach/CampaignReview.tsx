'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import type { CampaignContact, CampaignDraft, OutreachContact, PersonalizationResult } from '@/types/outreach'
import { campaignService } from '@/lib/outreach/campaign-service'
import { contactService } from '@/lib/outreach/contact-service'
import { ContactAvatar } from './ContactAvatar'
import { SendConfirmation } from './SendConfirmation'
import { SendProgress } from './SendProgress'
import { CampaignTableSkeleton } from './SkeletonLoader'
import { ErrorState } from './ErrorState'
import { toast } from 'sonner'

export function CampaignReview() {
  const router = useRouter()
  const [draft, setDraft] = useState<CampaignDraft | null>(null)
  const [contacts, setContacts] = useState<OutreachContact[]>([])
  const [previews, setPreviews] = useState<PersonalizationResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Sending state
  const [isSending, setIsSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [sendingContacts, setSendingContacts] = useState<CampaignContact[]>([])
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [sendDone, setSendDone] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('outreach:draft')
    if (!raw) {
      router.push('/dashboard/outreach')
      return
    }
    const d: CampaignDraft = JSON.parse(raw)
    setDraft(d)

    const load = async () => {
      try {
        const [ctcts, prvs] = await Promise.all([
          contactService.getByIds(d.contactIds),
          campaignService.preview(d),
        ])
        setContacts(ctcts)
        setPreviews(prvs)
      } catch {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [router])

  const missingCount = previews.filter((p) => p.hasErrors).length
  const totalContacts = contacts.length

  const handleSend = async () => {
    if (!draft) return
    setShowModal(false)
    setIsSending(true)

    try {
      const campaign = await campaignService.create(draft)
      setCampaignId(campaign.id)
      setSendingContacts(campaign.contacts)

      await campaignService.send(campaign.id, (contactId, status) => {
        setSentCount((n) => n + 1)
        setSendingContacts((prev) =>
          prev.map((cc) => (cc.id === contactId ? { ...cc, status } : cc))
        )
      })

      setSendDone(true)
      sessionStorage.removeItem('outreach:draft')
      sessionStorage.removeItem('outreach:selectedContacts')
      toast.success(`Campaign sent to ${campaign.contacts.length} recipients`)
    } catch {
      toast.error('Failed to send campaign. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) return <CampaignTableSkeleton />
  if (isError) return <ErrorState title="Unable to load preview" />
  if (!draft) return null

  if (isSending || sendDone) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {sendDone ? 'Campaign sent' : 'Sending campaign...'}
          </h1>
          {sendDone && (
            <p className="mt-1 text-xs text-[var(--text-dim)]">
              Check the Campaigns tab to track delivery and replies.
            </p>
          )}
        </div>

        {sendDone ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <p className="text-sm text-white">All emails processed</p>
            <button
              onClick={() => router.push('/dashboard/outreach?tab=campaigns')}
              className="rounded-lg bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              View campaigns
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 bg-[#0b0e13] p-5">
            <SendProgress contacts={sendingContacts} sentCount={sentCount} total={totalContacts} />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)] transition hover:text-white"
        >
          <ArrowLeft size={13} />
          Back to compose
        </button>

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">Review campaign</h1>
          <p className="mt-1 text-xs text-[var(--text-dim)]">{draft.name || 'Untitled Campaign'}</p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 rounded-xl border border-white/8 bg-[#0b0e13] px-5 py-4">
          {[
            { label: 'Recipients', value: totalContacts },
            { label: 'Personalized emails', value: totalContacts - missingCount },
            { label: 'Missing variables', value: missingCount, warn: missingCount > 0 },
            { label: 'Invalid emails', value: 0 },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">{stat.label}</p>
              <p className={`mt-0.5 text-2xl font-semibold tabular-nums ${stat.warn ? 'text-amber-400' : 'text-white'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Personalization table */}
        <div className="overflow-hidden rounded-xl border border-white/8 bg-[#0b0e13]">
          <div className="flex items-center gap-4 border-b border-white/8 px-4 py-2">
            <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Recipient</span>
            <span className="hidden w-40 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] md:block">Personalization</span>
            <span className="w-24 shrink-0 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Status</span>
          </div>
          {contacts.map((contact) => {
            const preview = previews.find((p) => p.contactId === contact.id)
            const hasIssues = preview?.hasErrors ?? false
            return (
              <div
                key={contact.id}
                className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-b-0"
              >
                <div className="flex flex-1 items-center gap-2.5 min-w-0">
                  <ContactAvatar contact={contact} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="truncate text-[11px] text-[var(--text-dim)]">{contact.jobTitle}</p>
                  </div>
                </div>
                <div className="hidden w-40 shrink-0 md:block">
                  {hasIssues ? (
                    <div className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle size={12} />
                      <span className="truncate text-[11px]">
                        Missing {preview?.missingVariables.join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-400">Complete</span>
                  )}
                </div>
                <div className="w-24 shrink-0 flex justify-end">
                  {hasIssues ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                      <AlertTriangle size={11} />
                      Warning
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 size={11} />
                      Ready
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Send button */}
        <div className="flex justify-end">
          {missingCount > 0 && (
            <p className="mr-4 self-center text-xs text-amber-400">
              {missingCount} email{missingCount !== 1 ? 's' : ''} have missing variables
            </p>
          )}
          <button
            onClick={() => setShowModal(true)}
            disabled={missingCount > 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send {totalContacts} email{totalContacts !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <SendConfirmation
        isOpen={showModal}
        recipientCount={totalContacts}
        campaignName={draft.name}
        onConfirm={() => void handleSend()}
        onCancel={() => setShowModal(false)}
      />
    </>
  )
}
