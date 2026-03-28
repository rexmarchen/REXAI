'use client'

import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOutreachCampaigns } from '@/hooks/useOutreach'
import { formatRelativeDate } from '@/lib/utils'
import type { OutreachCampaignDetailShape } from '@/types'
import styles from '@/styles/outreach.module.css'

function statusClassName(status: string) {
  if (status === 'failed') return `${styles.statusChip} ${styles.statusError}`
  if (status === 'partial_failed') return `${styles.statusChip} ${styles.statusWarning}`
  return styles.statusChip
}

export function CampaignHistory() {
  const { data, isLoading, isError, refetch } = useOutreachCampaigns()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, OutreachCampaignDetailShape>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const campaigns = useMemo(
    () =>
      (data || []).filter((campaign) => {
        const matchesSearch = campaign.company.name.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [data, search, statusFilter]
  )

  const toggleRow = async (campaignId: string) => {
    if (expanded === campaignId) {
      setExpanded(null)
      return
    }

    setExpanded(campaignId)
    if (details[campaignId]) {
      return
    }

    setLoadingId(campaignId)
    const response = await fetch(`/api/outreach/campaigns/${campaignId}`)
    if (response.ok) {
      const payload = (await response.json()) as OutreachCampaignDetailShape
      setDetails((current) => ({ ...current, [campaignId]: payload }))
    }
    setLoadingId(null)
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Outreach Campaigns</h1>
          <p className={styles.copy}>Review sent campaigns, inspect the underlying contacts, and spot failures worth resending.</p>
        </div>
        <button className={styles.buttonGhost} onClick={() => refetch()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className={styles.surface}>
        <div className={styles.filterRow}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="queued">Queued</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="partial_failed">Partially Failed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {isLoading ? (
          <div className={styles.historyList}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : null}

        {!isLoading && isError ? (
          <div className={styles.emptyState}>Campaign history failed to load. Try refreshing the page.</div>
        ) : null}

        {!isLoading && !campaigns.length ? (
          <div className={styles.emptyState}>No campaigns yet. Start your first outreach from the main module.</div>
        ) : null}

        {!isLoading && campaigns.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contacts</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th>Opened</th>
                  <th>Replies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, index) => (
                  <Fragment key={campaign.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                    >
                      <td>{campaign.company.name}</td>
                      <td>{campaign.totalContacts}</td>
                      <td>{formatRelativeDate(campaign.createdAt)}</td>
                      <td>
                        <span className={statusClassName(campaign.status)}>{campaign.status}</span>
                      </td>
                      <td>{campaign.openCount}</td>
                      <td>{Math.max(0, campaign.openCount - 1)}</td>
                      <td>
                        <button className={styles.buttonSubtle} onClick={() => toggleRow(campaign.id)}>
                          <ChevronDown size={14} /> {expanded === campaign.id ? 'Hide' : 'Expand'}
                        </button>
                      </td>
                    </motion.tr>

                    {expanded === campaign.id ? (
                      <tr>
                        <td colSpan={7} className={styles.historyExpanded}>
                          {loadingId === campaign.id ? (
                            <div className={styles.skeleton} />
                          ) : details[campaign.id] ? (
                            <div className={styles.summaryCard}>
                              <div className={styles.metaText}>{campaign.subject}</div>
                              <table className={styles.detailTable}>
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {details[campaign.id].contacts.map((contact) => (
                                    <tr key={contact.id}>
                                      <td>{contact.name}</td>
                                      <td>{contact.email}</td>
                                      <td>{contact.role}</td>
                                      <td>
                                        <span className={statusClassName(contact.status || 'queued')}>
                                          {contact.status || 'queued'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}
