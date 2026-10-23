import React, { useState, useEffect } from 'react'
import {
  Users, UserCheck, UserX, Mail, Search, Filter,
  CheckCircle2, AlertTriangle, Shield, Plus, RefreshCw, X
} from 'lucide-react'
import developerApi from '../../services/developerApi'
import styles from './AdminDevelopersPage.module.css'

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteTech, setInviteTech] = useState('')
  const [inviting, setInviting] = useState(false)

  const loadDevelopers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await developerApi.getAdminDevelopers({
        status: statusFilter !== 'all' ? statusFilter : undefined
      })
      if (res.success) {
        setDevelopers(res.developers || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load developer profiles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevelopers()
  }, [statusFilter])

  const handleUpdateStatus = async (user, newStatus) => {
    const actionLabel = newStatus === 'active' ? 'Approve/Activate' : newStatus
    const confirm = window.confirm(`Are you sure you want to change status for ${user.name || user.email} to "${newStatus}"?`)
    if (!confirm) return

    try {
      setActionLoading(user._id)
      const res = await developerApi.updateDeveloperStatus(user._id, {
        status: newStatus,
        adminNotes: `Status changed to ${newStatus} by admin.`
      })
      if (res.success) {
        setFeedback({ type: 'success', message: `Status updated to ${newStatus} for ${user.name || user.email}.` })
        loadDevelopers()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update developer status.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      setInviting(true)
      const res = await developerApi.inviteDeveloper({
        email: inviteEmail.trim(),
        displayName: inviteName.trim() || undefined,
        technicalExpertise: inviteTech.split(',').map(s => s.trim()).filter(Boolean)
      })
      if (res.success) {
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteName('')
        setInviteTech('')
        setFeedback({
          type: 'success',
          message: `Developer privileges granted to ${inviteEmail}!`
        })
        loadDevelopers()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to grant developer access.' })
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.adminBadge}>
            <Shield size={14} /> ADMINISTRATOR ACCESS
          </div>
          <h1 className={styles.title}>Developer Management & Approvals</h1>
          <p className={styles.subtitle}>
            Review candidate applications, grant creator permissions, or moderate existing developer accounts.
          </p>
        </div>

        <button
          className={styles.inviteBtn}
          onClick={() => setShowInviteModal(true)}
        >
          <Plus size={16} />
          Invite / Authorize Developer
        </button>
      </div>

      {feedback && (
        <div className={`${styles.feedbackBanner} ${styles[feedback.type]}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.toolbar}>
        <div className={styles.statusTabs}>
          {['all', 'pending', 'active', 'suspended', 'revoked'].map(s => (
            <button
              key={s}
              className={`${styles.statusTab} ${statusFilter === s ? styles.activeTab : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Developers Table */}
      {loading ? (
        <div className={styles.loadingWrapper}>
          <RefreshCw size={24} className={styles.spin} />
          <p>Loading developer accounts...</p>
        </div>
      ) : error ? (
        <div className={styles.errorWrapper}>
          <AlertTriangle size={24} color="#DC2626" />
          <p>{error}</p>
          <button onClick={loadDevelopers} className={styles.retryBtn}>Retry</button>
        </div>
      ) : developers.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <Users size={44} color="#D5C8B8" />
          <h3>No Developers Found</h3>
          <p>No developer accounts match the current filter "{statusFilter}".</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User / Developer</th>
                <th>Role</th>
                <th>Status</th>
                <th>Technical Expertise</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {developers.map(dev => {
                const isActing = actionLoading === dev._id
                const devProfile = dev.developerProfile || {}
                const devStatus = dev.developerStatus || 'none'

                return (
                  <tr key={dev._id}>
                    <td>
                      <div className={styles.devUserCell}>
                        <div className={styles.avatar}>
                          {(dev.name || dev.email || 'D').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.devName}>{dev.name || 'Anonymous User'}</div>
                          <div className={styles.devEmail}>{dev.email}</div>
                          {devProfile.bio && (
                            <div className={styles.devBio}>{devProfile.bio}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.roleBadge}>{dev.role}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[devStatus]}`}>
                        {devStatus}
                      </span>
                    </td>
                    <td>
                      <div className={styles.expertiseWrap}>
                        {Array.isArray(devProfile.technicalExpertise) && devProfile.technicalExpertise.length > 0 ? (
                          devProfile.technicalExpertise.map(t => (
                            <span key={t} className={styles.techTag}>{t}</span>
                          ))
                        ) : (
                          <span className={styles.noExpertise}>General</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.dateCell}>
                        {dev.createdAt ? new Date(dev.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        {devStatus === 'pending' && (
                          <>
                            <button
                              className={styles.approveBtn}
                              onClick={() => handleUpdateStatus(dev, 'active')}
                              disabled={isActing}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.revokeBtn}
                              onClick={() => handleUpdateStatus(dev, 'revoked')}
                              disabled={isActing}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {devStatus === 'active' && (
                          <>
                            <button
                              className={styles.suspendBtn}
                              onClick={() => handleUpdateStatus(dev, 'suspended')}
                              disabled={isActing}
                            >
                              Suspend
                            </button>
                            <button
                              className={styles.revokeBtn}
                              onClick={() => handleUpdateStatus(dev, 'revoked')}
                              disabled={isActing}
                            >
                              Revoke
                            </button>
                          </>
                        )}

                        {devStatus === 'suspended' && (
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleUpdateStatus(dev, 'active')}
                            disabled={isActing}
                          >
                            Reactivate
                          </button>
                        )}

                        {devStatus === 'revoked' && (
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleUpdateStatus(dev, 'active')}
                            disabled={isActing}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Invite Developer */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Authorize / Invite Developer</h2>
              <button onClick={() => setShowInviteModal(false)} className={styles.closeBtn}>×</button>
            </div>
            <form onSubmit={handleInviteSubmit}>
              <div className={styles.formGroup}>
                <label>User Email *</label>
                <input
                  type="email"
                  placeholder="developer@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  autoFocus
                />
                <span className={styles.fieldHint}>
                  If the account exists, it will be upgraded immediately. Otherwise, an invitation record is initialized.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Smith"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Technical Expertise (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, DSA, System Design"
                  value={inviteTech}
                  onChange={e => setInviteTech(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? 'Authorizing...' : 'Grant Developer Access →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
