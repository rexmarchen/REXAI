import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  CheckCircle2,
  Clock3,
  GitBranch,
  Network,
  PenLine,
  Play,
  RefreshCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react'
import apiClient from '../../services/apiClient'
import LinkedInSetupModal from './LinkedInSetupModal'
import styles from './LinkedInAutomation.module.css'

const panelMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: 'easeOut' }
}

const emptyData = {
  linkedin: { connected: false },
  settings: {
    scheduleEnabled: false,
    approvalMode: 'draft_approve',
    cronTime: '',
    cronTimezone: 'UTC',
    fullAutoEnabled: false,
    dailyPostLimit: 1,
    githubUsername: ''
  },
  knowledge: [],
  repos: [],
  drafts: [],
  history: []
}

const formatDate = (value) => {
  if (!value) return 'Not yet'
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function NetworkBrandMark({ size = 28 }) {
  return <Network size={size} aria-hidden="true" />
}

export default function LinkedInAutomation() {
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState('')
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [data, setData] = useState(emptyData)
  const [successBanner, setSuccessBanner] = useState('')
  const [errorBanner, setErrorBanner] = useState('')
  const [topic, setTopic] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [settingsDraft, setSettingsDraft] = useState(emptyData.settings)

  const syncStatus = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const response = await apiClient.get('/linkedin-automation/status', {
        __preserveAuthOnUnauthorized: true
      })
      setData({ ...emptyData, ...response })
      setSettingsDraft({ ...emptyData.settings, ...(response.settings || {}) })
      setErrorBanner('')
    } catch (err) {
      setErrorBanner(err.response?.data?.message || 'LinkedIn automation status could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    syncStatus()
  }, [])

  const connected = Boolean(data.linkedin?.connected)
  const draftCount = data.drafts.filter((draft) => draft.status === 'draft' || draft.status === 'failed').length
  const publishedCount = data.history.filter((item) => item.status === 'published').length
  const latestDraft = data.drafts[0]

  const connectionText = useMemo(() => {
    if (loading) return 'Checking LinkedIn OAuth'
    if (connected) return 'LinkedIn connected with user-scoped token storage'
    return 'Connect LinkedIn to activate posting'
  }, [connected, loading])

  const runAction = async (name, fn, successMessage) => {
    setBusyAction(name)
    setErrorBanner('')
    try {
      await fn()
      await syncStatus({ silent: true })
      setSuccessBanner(successMessage)
      window.setTimeout(() => setSuccessBanner(''), 6500)
    } catch (err) {
      setErrorBanner(err.response?.data?.message || err.message || 'Action failed.')
    } finally {
      setBusyAction('')
    }
  }

  const handleConnectLinkedIn = () => runAction(
    'connect',
    async () => {
      const response = await apiClient.post('/linkedin-automation/connect-session')
      window.location.assign(response.connectUrl || '/connect/auth/linkedin/connect')
    },
    'Opening LinkedIn OAuth.'
  )

  const handleSaveSettings = () => runAction(
    'settings',
    () => apiClient.patch('/linkedin-automation/settings', settingsDraft),
    'Automation settings saved.'
  )

  const handlePostNow = () => runAction(
    'post-now',
    () => apiClient.post('/linkedin-automation/post-now', { topic }),
    'Draft generated. Review it before publishing.'
  )

  const handleAddNote = () => runAction(
    'note',
    async () => {
      await apiClient.post('/linkedin-automation/knowledge/notes', {
        title: noteTitle,
        content: noteContent
      })
      setNoteTitle('')
      setNoteContent('')
    },
    'Knowledge note added to your private automation memory.'
  )

  const handleSyncGitHub = () => runAction(
    'github',
    () => apiClient.post('/linkedin-automation/github/sync', {
      username: settingsDraft.githubUsername
    }),
    'GitHub repositories synced into your private knowledge base.'
  )

  const handleApproveDraft = (draftId) => runAction(
    `approve-${draftId}`,
    () => apiClient.post(`/linkedin-automation/drafts/${draftId}/approve`),
    'Draft approved and published to LinkedIn.'
  )

  const handleRejectDraft = (draftId) => runAction(
    `reject-${draftId}`,
    () => apiClient.post(`/linkedin-automation/drafts/${draftId}/reject`),
    'Draft rejected.'
  )

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {successBanner && (
          <motion.div className={styles.noticeSuccess} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <CheckCircle2 size={16} />
            <span>{successBanner}</span>
          </motion.div>
        )}
        {errorBanner && (
          <motion.div className={styles.noticeError} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Activity size={16} />
            <span>{errorBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section className={styles.commandPanel} {...panelMotion}>
        <div className={styles.commandCopy}>
          <div className={styles.statusLine}>
            <span className={`${styles.liveDot} ${connected ? styles.liveDotConnected : styles.liveDotMuted}`} />
            <span>{connectionText}</span>
          </div>
          <h2>LinkedIn automation agent</h2>
          <p>
            Generate posts from your own notes and GitHub work, keep drafts private by default, and publish only after approval unless full automation is enabled.
          </p>
          <div className={styles.commandActions}>
            <button type="button" className={styles.primaryButton} onClick={() => setSetupModalOpen(true)}>
              <NetworkBrandMark size={16} />
              <span>{connected ? 'Manage Agent & Keys' : 'Connect LinkedIn Agent'}</span>
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => syncStatus()}>
              <RefreshCcw size={15} />
              <span>{loading ? 'Checking' : 'Sync dashboard'}</span>
            </button>
          </div>
        </div>

        <div className={styles.connectionPanel}>
          <div className={styles.connectionRing}>
            <NetworkBrandMark size={62} />
          </div>
          <span className={`${styles.connectionBadge} ${connected ? styles.connectionBadgeOn : styles.connectionBadgeOff}`}>
            {connected ? 'OAuth Connected' : 'Not connected'}
          </span>
          <strong>{connected ? 'Per-user LinkedIn token ready' : 'No LinkedIn account connected'}</strong>
          <p>{connected ? `Expires ${formatDate(data.linkedin.expiresAt)}` : 'Connect once, then the agent fetches your encrypted token only for your runs.'}</p>
          <div className={styles.syncMeta}>
            <span>Approval mode: {data.settings.approvalMode === 'auto_publish' ? 'Full automation' : 'Draft and approve'}</span>
            <span>Last run: {formatDate(data.settings.lastRunAt)}</span>
          </div>
        </div>
      </motion.section>

      <motion.section className={styles.telemetryPanel} {...panelMotion}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Private Agent State</span>
            <h3>Isolation and safety</h3>
          </div>
          <div className={styles.headerStatus}>
            <ShieldCheck size={16} />
            <span>User-scoped knowledge, vectors, drafts, and post history</span>
          </div>
        </div>

        <div className={styles.telemetryGrid}>
          <article className={styles.telemetryItem}>
            <span>Drafts waiting</span>
            <strong>{draftCount}</strong>
            <p>New accounts stay in approval mode until explicitly changed.</p>
          </article>
          <article className={styles.telemetryItem}>
            <span>Knowledge items</span>
            <strong>{data.knowledge.length}</strong>
            <p>Notes and GitHub content are stored under your own user id.</p>
          </article>
          <article className={styles.telemetryItem}>
            <span>Synced repos</span>
            <strong>{data.repos.length}</strong>
            <p>{settingsDraft.githubUsername ? `GitHub: ${settingsDraft.githubUsername}` : 'Add a GitHub username to sync.'}</p>
          </article>
          <article className={styles.telemetryItem}>
            <span>Published</span>
            <strong>{publishedCount}</strong>
            <p>History is separated per account and never mixed across users.</p>
          </article>
        </div>
      </motion.section>

      <div className={styles.workGrid}>
        <motion.section className={styles.sequencePanel} {...panelMotion}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Scheduler</span>
              <h3>Per-user automation controls</h3>
            </div>
            <span className={`${styles.statePill} ${settingsDraft.scheduleEnabled ? styles.statePillActive : ''}`}>
              {settingsDraft.scheduleEnabled ? 'Enabled' : 'Off'}
            </span>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={settingsDraft.scheduleEnabled}
                onChange={(event) => setSettingsDraft((prev) => ({ ...prev, scheduleEnabled: event.target.checked }))}
              />
              <span>Run scheduled drafts</span>
            </label>
            <label>
              <span>Daily time</span>
              <input
                type="time"
                value={settingsDraft.cronTime || ''}
                onChange={(event) => setSettingsDraft((prev) => ({ ...prev, cronTime: event.target.value }))}
              />
            </label>
            <label>
              <span>Timezone</span>
              <input
                value={settingsDraft.cronTimezone || 'UTC'}
                onChange={(event) => setSettingsDraft((prev) => ({ ...prev, cronTimezone: event.target.value }))}
              />
            </label>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={settingsDraft.fullAutoEnabled && settingsDraft.approvalMode === 'auto_publish'}
                onChange={(event) => setSettingsDraft((prev) => ({
                  ...prev,
                  fullAutoEnabled: event.target.checked,
                  approvalMode: event.target.checked ? 'auto_publish' : 'draft_approve'
                }))}
              />
              <span>Full autopost after generation</span>
            </label>
          </div>

          <div className={styles.controlRow}>
            <button type="button" className={styles.primaryButton} onClick={handleSaveSettings} disabled={busyAction === 'settings'}>
              <Settings2 size={16} />
              <span>{busyAction === 'settings' ? 'Saving' : 'Save controls'}</span>
            </button>
          </div>
        </motion.section>

        <motion.section className={styles.queuePanel} {...panelMotion}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Post Pipeline</span>
              <h3>Generate a private draft</h3>
            </div>
          </div>

          <div className={styles.composeBox}>
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Optional topic, repo name, or angle for the next post"
              rows={4}
            />
            <button type="button" className={styles.primaryButton} onClick={handlePostNow} disabled={busyAction === 'post-now' || !connected}>
              <Sparkles size={16} />
              <span>{busyAction === 'post-now' ? 'Generating' : 'Post now as draft'}</span>
            </button>
          </div>
        </motion.section>
      </div>

      <div className={styles.workGrid}>
        <motion.section className={styles.sequencePanel} {...panelMotion}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Knowledge Base</span>
              <h3>Notes and GitHub sync</h3>
            </div>
          </div>

          <div className={styles.composeBox}>
            <input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="Note title"
            />
            <textarea
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              placeholder="Add a lesson, project detail, opinion, or writing preference"
              rows={5}
            />
            <button type="button" className={styles.secondaryButton} onClick={handleAddNote} disabled={busyAction === 'note' || !noteContent.trim()}>
              <PenLine size={16} />
              <span>{busyAction === 'note' ? 'Adding note' : 'Add private note'}</span>
            </button>
          </div>

          <div className={styles.githubRow}>
            <input
              value={settingsDraft.githubUsername || ''}
              onChange={(event) => setSettingsDraft((prev) => ({ ...prev, githubUsername: event.target.value }))}
              placeholder="GitHub username"
            />
            <button type="button" className={styles.secondaryButton} onClick={handleSyncGitHub} disabled={busyAction === 'github'}>
              <GitBranch size={16} />
              <span>{busyAction === 'github' ? 'Syncing' : 'Sync GitHub'}</span>
            </button>
          </div>
        </motion.section>

        <motion.section className={styles.queuePanel} {...panelMotion}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Approval Queue</span>
              <h3>Drafts</h3>
            </div>
            <span className={styles.queueCount}>{data.drafts.length} total</span>
          </div>

          <div className={styles.queueList}>
            {data.drafts.length > 0 ? data.drafts.map((draft) => (
              <article key={draft.id} className={styles.draftItem}>
                <div className={styles.draftHeader}>
                  <strong>{draft.topic || 'Generated post'}</strong>
                  <span className={styles.leadStatus}>{draft.status}</span>
                </div>
                <p>{draft.post_text}</p>
                {draft.error && <span className={styles.errorText}>{draft.error}</span>}
                {(draft.status === 'draft' || draft.status === 'failed') && (
                  <div className={styles.controlRow}>
                    <button type="button" className={styles.primaryButton} onClick={() => handleApproveDraft(draft.id)} disabled={busyAction === `approve-${draft.id}` || !connected}>
                      <Send size={15} />
                      <span>{busyAction === `approve-${draft.id}` ? 'Publishing' : 'Approve and publish'}</span>
                    </button>
                    <button type="button" className={styles.ghostButton} onClick={() => handleRejectDraft(draft.id)} disabled={busyAction === `reject-${draft.id}`}>
                      <X size={15} />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </article>
            )) : (
              <div className={styles.emptyState}>
                <PenLine size={22} />
                <strong>No drafts yet</strong>
                <p>Generate a draft from your private knowledge base.</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <motion.section className={styles.campaignPanel} {...panelMotion}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>History</span>
            <h3>Recent automation activity</h3>
          </div>
          {latestDraft && (
            <div className={styles.headerStatus}>
              <Clock3 size={16} />
              <span>Latest draft: {formatDate(latestDraft.generated_at)}</span>
            </div>
          )}
        </div>

        <div className={styles.campaignTable}>
          {data.history.length > 0 ? data.history.map((item) => (
            <article key={item.id} className={styles.campaignRow}>
              <div>
                <strong>{item.topic || 'LinkedIn post'}</strong>
                <p>{item.post_text}</p>
              </div>
              <span>{item.status}</span>
              <span>{formatDate(item.published_at || item.created_at)}</span>
              <span>{item.linkedin_post_id || '--'}</span>
            </article>
          )) : (
            <div className={styles.emptyState}>
              <Play size={22} />
              <strong>No post history yet</strong>
              <p>Approved posts and failures appear here for this user only.</p>
            </div>
          )}
        </div>
      </motion.section>

      <LinkedInSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onConnected={() => syncStatus()}
        currentGithub={data.settings?.githubUsername}
      />
    </div>
  )
}
