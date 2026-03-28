'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatRelativeDate } from '@/lib/utils'
import { substituteEmailVariables } from '@/lib/outreach/email'
import type { CompanyProfile, OutreachContactShape, OutreachTone } from '@/types'
import styles from '@/styles/outreach.module.css'

interface CampaignStatusPayload {
  campaignId: string
  status: 'queued' | 'sending' | 'sent' | 'partial_failed' | 'failed'
  totalContacts: number
  sentCount: number
  failedCount: number
  openCount: number
}

export function SendConfirmation({
  company,
  contacts,
  subject,
  body,
  tone,
  onBack,
  onRestart,
}: {
  company: CompanyProfile
  contacts: OutreachContactShape[]
  subject: string
  body: string
  tone: OutreachTone
  onBack: () => void
  onRestart: () => void
}) {
  const [openTracking, setOpenTracking] = useState(true)
  const [followUpEnabled, setFollowUpEnabled] = useState(true)
  const [followUpDays, setFollowUpDays] = useState(3)
  const [followUpMessage, setFollowUpMessage] = useState(
    'Sharing a quick follow-up in case my earlier note got buried.'
  )
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatusPayload | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const progress = useMemo(() => {
    if (!campaignStatus || campaignStatus.totalContacts === 0) {
      return 0
    }

    return Math.round(
      ((campaignStatus.sentCount + campaignStatus.failedCount) / campaignStatus.totalContacts) * 100
    )
  }, [campaignStatus])

  useEffect(() => {
    if (!campaignId || !isSending) {
      return
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/outreach/campaigns/${campaignId}/status`)
      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as CampaignStatusPayload
      setCampaignStatus(payload)

      if (payload.status === 'sent' || payload.status === 'partial_failed' || payload.status === 'failed') {
        window.clearInterval(interval)
        setIsSending(false)
        setShowSuccess(true)
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [campaignId, isSending])

  const sendCampaign = async () => {
    setIsSending(true)
    toast.info('Queuing outreach...')

    const response = await fetch('/api/outreach/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company,
        contacts,
        subject,
        body,
        tone,
        openTracking,
        followUp: {
          enabled: followUpEnabled,
          days: followUpDays,
          message: followUpMessage,
        },
      }),
    })

    const payload = (await response.json()) as
      | {
          error?: string
          campaignId: string
          queued: number
          status: CampaignStatusPayload
        }
      | { error: string }

    if (!response.ok || 'error' in payload) {
      setIsSending(false)
      toast.error(payload.error || 'Failed to send campaign.')
      return
    }

    setCampaignId(payload.campaignId)
    setCampaignStatus(payload.status)

    if (payload.status.status === 'sent' || payload.status.status === 'partial_failed') {
      setIsSending(false)
      setShowSuccess(true)
    }

    toast.success('Campaign queued successfully.')
  }

  return (
    <>
      <section className={styles.surface}>
        <div className={styles.campaignHeader}>
          <div>
            <h2 className={styles.strong}>Send and track</h2>
            <p className={styles.copy}>Review each personalized message, then queue the full campaign with follow-up settings and tracking.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.buttonGhost} onClick={onBack}>
              Back
            </button>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.metaText}>Sending to {contacts.length} contacts at {company.name}</div>
          <div className={styles.strong}>{subject}</div>
          <div className={styles.tableWrap}>
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Email Preview</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>
                      <div className={styles.strong}>{contact.name}</div>
                      <div className={styles.metaText}>{contact.role}</div>
                    </td>
                    <td>{substituteEmailVariables(body, company.name, contact)}</td>
                    <td>
                      <span className={styles.statusChip}>{contact.confidence}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.surface}>
          <div className={styles.optionRow}>
            <label className={styles.metaRow}>
              <input
                type="checkbox"
                checked={openTracking}
                onChange={(event) => setOpenTracking(event.target.checked)}
              />
              Enable open tracking
            </label>
            <label className={styles.metaRow}>
              <input
                type="checkbox"
                checked={followUpEnabled}
                onChange={(event) => setFollowUpEnabled(event.target.checked)}
              />
              Auto follow-up after
            </label>
            <select value={followUpDays} onChange={(event) => setFollowUpDays(Number(event.target.value))}>
              {[2, 3, 5, 7].map((value) => (
                <option key={value} value={value}>
                  {value} days
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={followUpMessage}
            onChange={(event) => setFollowUpMessage(event.target.value)}
            disabled={!followUpEnabled}
          />

          {campaignStatus ? (
            <div className={styles.summaryCard}>
              <div className={styles.metaRow}>
                <span className={styles.strong}>
                  {isSending
                    ? `Sending ${campaignStatus.sentCount + campaignStatus.failedCount} of ${campaignStatus.totalContacts}`
                    : 'Campaign summary'}
                </span>
                <span className={styles.statusChip}>{campaignStatus.status}</span>
              </div>
              <div className={styles.progressOuter}>
                <motion.div
                  className={styles.progressInner}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
            </div>
          ) : null}

          <div className={styles.stickyBar}>
            <span className={styles.metaText}>
              {followUpEnabled
                ? `Follow-up scheduled for ${followUpDays} days after send.`
                : 'Follow-up disabled for this campaign.'}
            </span>
            <button className={styles.button} onClick={sendCampaign} disabled={isSending}>
              {isSending ? 'Sending...' : `Send ${contacts.length} Emails`}
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showSuccess ? (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <span className={styles.modalSuccessMark}>
                <CheckCircle2 size={30} />
              </span>
              <div>
                <h3 className={styles.title}>Mission launched</h3>
                <p className={styles.copy}>
                  Emails sent to {contacts.length} contacts at {company.name}. The campaign is now available in history.
                </p>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.metaText}>Company</div>
                <div className={styles.strong}>{company.name}</div>
                <div className={styles.metaText}>Recipients: {contacts.length}</div>
                <div className={styles.metaText}>Subject: {subject}</div>
                <div className={styles.metaText}>Sent at: {formatRelativeDate(new Date().toISOString())}</div>
                <div className={styles.metaText}>
                  Follow-up: {followUpEnabled ? `Enabled in ${followUpDays} days` : 'Disabled'}
                </div>
              </div>

              <div className={styles.actionRow}>
                <Link className={styles.buttonGhost} href={`/dashboard/outreach/history?campaign=${campaignId || ''}`}>
                  View Campaign
                </Link>
                <button className={styles.button} onClick={onRestart}>
                  New Outreach
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
