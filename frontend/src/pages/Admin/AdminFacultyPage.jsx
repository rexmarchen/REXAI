import React, { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Award,
  Mail,
  Building,
  GraduationCap,
  FileText,
  UserX,
  X
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

export default function AdminFacultyPage() {
  const [facultyMembers, setFacultyMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending') // default to pending reviews
  const [searchQuery, setSearchQuery] = useState('')

  // Detail / Moderate Modal
  const [selectedMember, setSelectedMember] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [reasonInput, setReasonInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [actionType, setActionType] = useState('')

  useEffect(() => {
    loadFaculty()
  }, [statusFilter])

  const loadFaculty = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await facultyApi.getAdminFacultyList({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery ? searchQuery.trim() : undefined
      })
      const data = res?.data || res
      if (data?.success) {
        setFacultyMembers(data.facultyMembers || [])
      } else {
        setError(data?.message || 'Failed to load faculty list.')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load faculty profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadFaculty()
  }

  const openDossierModal = async (memberId) => {
    try {
      setModalLoading(true)
      setSelectedMember(null)
      setReasonInput('')
      setNotesInput('')
      setActionType('')
      const res = await facultyApi.getAdminFacultyDetail(memberId)
      const data = res?.data || res
      if (data?.success) {
        setSelectedMember(data)
      } else {
        setFeedback({ type: 'error', message: data?.message || 'Could not load dossier detail.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to fetch faculty detail dossier.' })
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateStatus = async (targetStatus) => {
    if (!selectedMember?.profile?._id) return

    if ((targetStatus === 'rejected' || targetStatus === 'suspended') && !reasonInput.trim()) {
      alert(`A reason is required when setting status to "${targetStatus}".`)
      return
    }

    try {
      setActionLoading(true)
      const res = await facultyApi.updateAdminFacultyStatus(selectedMember.profile._id, {
        status: targetStatus,
        reason: reasonInput.trim(),
        notes: notesInput.trim()
      })

      const data = res?.data || res
      if (data?.success) {
        setFeedback({
          type: 'success',
          message: `Faculty member status successfully updated to "${targetStatus}".`
        })
        setSelectedMember(null)
        loadFaculty()
      } else {
        setFeedback({ type: 'error', message: data?.message || 'Status update failed.' })
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update verification status.'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Verified', icon: ShieldCheck }
      case 'pending':
        return { bg: '#FEF9C3', color: '#854D0E', label: 'Pending Review', icon: Clock }
      case 'rejected':
        return { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected', icon: XCircle }
      case 'suspended':
        return { bg: '#FFE4E6', color: '#9F1239', label: 'Suspended', icon: UserX }
      default:
        return { bg: '#F1F5F9', color: '#475569', label: 'Unverified', icon: Shield }
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: '#FEF3C7', color: '#B45309' }}>
              Admin Moderation Center
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#231C16', margin: '6px 0 0' }}>
            Faculty Verification Dossiers
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#8C7B6D', margin: '4px 0 0' }}>
            Review institutional educator credentials, verify college faculty, and manage publishing privileges.
          </p>
        </div>

        <button
          onClick={loadFaculty}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid #D5C7B7',
            background: '#FFFFFF',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#231C16',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 12,
          fontSize: '0.88rem',
          fontWeight: 600,
          background: feedback.type === 'success' ? '#DCFCE7' : '#FEE2E2',
          color: feedback.type === 'success' ? '#15803D' : '#B91C1C',
          border: `1px solid ${feedback.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '16px 20px',
        border: '1px solid #ECE4D8',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Status Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'verified', label: 'Verified Faculty' },
            { id: 'unverified', label: 'Unverified' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'suspended', label: 'Suspended' },
            { id: 'all', label: 'All Accounts' }
          ].map((tab) => {
            const active = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1px solid',
                  cursor: 'pointer',
                  background: active ? '#D97706' : '#FAF8F5',
                  color: active ? '#FFFFFF' : '#6B5E52',
                  borderColor: active ? '#D97706' : '#ECE4D8',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={16} color="#8C7B6D" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              placeholder="Search by name, email, university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 10,
                border: '1px solid #D5C7B7',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              background: '#231C16',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Faculty List Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #ECE4D8',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(35,28,22,0.02)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
            <div style={{ color: '#8C7B6D', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <RefreshCw size={20} className="spin" /> Loading verification dossiers...
            </div>
          </div>
        ) : facultyMembers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8C7B6D' }}>
            <Shield size={44} color="#D5C7B7" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#231C16', margin: 0 }}>
              No Faculty Dossiers in this Queue
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#8C7B6D', margin: '6px 0 0' }}>
              There are currently no faculty accounts matching the "{statusFilter}" filter.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#FAF8F5', borderBottom: '1px solid #ECE4D8', color: '#8C7B6D', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 20px' }}>Faculty / Educator</th>
                  <th style={{ padding: '14px 20px' }}>Institution & Dept</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Profile Meter</th>
                  <th style={{ padding: '14px 20px' }}>Contact</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {facultyMembers.map((member) => {
                  const badge = getStatusBadge(member.status)
                  const Icon = badge.icon
                  return (
                    <tr key={member._id} style={{ borderBottom: '1px solid #F3EDE4' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#231C16', fontSize: '0.92rem' }}>
                          {member.professionalTitle ? `${member.professionalTitle} ` : ''}{member.fullName || member.userId?.name || 'Faculty Member'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#8C7B6D', marginTop: 2 }}>
                          {member.designation || 'Educator'} • Registered {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#231C16' }}>
                          {member.institutionName || 'Not specified'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#8C7B6D', marginTop: 2 }}>
                          {member.department || 'General'}
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color
                        }}>
                          <Icon size={13} /> {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#231C16' }}>
                          {member.profileCompletion?.percentage || 0}%
                        </div>
                        <div style={{ width: 80, height: 6, background: '#EAE2D7', borderRadius: 4, marginTop: 4, overflow: 'hidden' }}>
                          <div style={{
                            width: `${member.profileCompletion?.percentage || 0}%`,
                            height: '100%',
                            background: '#D97706',
                            borderRadius: 4
                          }} />
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px', color: '#4B3F35', fontSize: '0.82rem' }}>
                        <div>{member.institutionalEmail || member.contactEmail || member.userId?.email}</div>
                        {member.facultyIdNumber && (
                          <div style={{ fontSize: '0.72rem', color: '#8C7B6D', marginTop: 2 }}>
                            ID: {member.facultyIdNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => openDossierModal(member._id)}
                          style={{
                            padding: '8px 14px',
                            background: '#231C16',
                            color: '#FFFFFF',
                            borderRadius: 8,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Inspect Dossier
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dossier Modal */}
      {(selectedMember || modalLoading) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(35,28,22,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            width: '100%',
            maxWidth: 720,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px 32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            {modalLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#8C7B6D' }}>
                <RefreshCw size={24} className="spin" /> Loading full educator dossier...
              </div>
            ) : selectedMember && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: '#FAF8F5', color: '#8C7B6D' }}>
                      Profile ID: {selectedMember.profile?._id}
                    </span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#231C16', margin: '8px 0 2px' }}>
                      {selectedMember.profile?.professionalTitle ? `${selectedMember.profile?.professionalTitle} ` : ''}
                      {selectedMember.profile?.fullName || selectedMember.profile?.userId?.name}
                    </h2>
                    <div style={{ fontSize: '0.88rem', color: '#8C7B6D' }}>
                      {selectedMember.profile?.designation} • {selectedMember.profile?.department}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMember(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7B6D' }}
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Dossier Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#FAF8F5', padding: 18, borderRadius: 12, border: '1px solid #ECE4D8' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>Institution</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#231C16', marginTop: 2 }}>
                      {selectedMember.profile?.institutionName || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#8C7B6D' }}>
                      {selectedMember.profile?.institutionType || 'College'} • {selectedMember.profile?.employmentType || 'Full-time'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>Institutional Email</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#231C16', marginTop: 2 }}>
                      {selectedMember.profile?.institutionalEmail || 'None provided'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#8C7B6D' }}>
                      Account Login: {selectedMember.profile?.userId?.email}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>Faculty / Employee ID</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#231C16', marginTop: 2 }}>
                      {selectedMember.profile?.facultyIdNumber || 'Not submitted'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>Quizzes Created</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#231C16', marginTop: 2 }}>
                      {selectedMember.quizzesCount || 0} quizzes authored
                    </div>
                  </div>
                </div>

                {/* Verification Document URL or Directory Link */}
                {selectedMember.profile?.verificationDocumentUrl && (
                  <div style={{ padding: '12px 16px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="#B45309" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400E' }}>
                        Verification Proof URL submitted
                      </span>
                    </div>
                    <a
                      href={selectedMember.profile.verificationDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      Open Link <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Bio & Subjects */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>
                    Teaching Subjects & Expertise
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {(selectedMember.profile?.teachingSubjects || []).length > 0 ? (
                      selectedMember.profile.teachingSubjects.map((s, i) => (
                        <span key={i} style={{ padding: '3px 9px', borderRadius: 6, background: '#F0EAE1', fontSize: '0.78rem', fontWeight: 600, color: '#4B3F35' }}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#8C7B6D', fontStyle: 'italic' }}>None entered</span>
                    )}
                  </div>
                </div>

                {/* Verification History Log */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase', marginBottom: 6 }}>
                    Administrative Audit Trail ({selectedMember.verificationHistory?.length || 0})
                  </div>
                  <div style={{ maxHeight: 120, overflowY: 'auto', background: '#FAF8F5', borderRadius: 8, padding: 10, fontSize: '0.78rem', color: '#4B3F35', border: '1px solid #ECE4D8' }}>
                    {(!selectedMember.verificationHistory || selectedMember.verificationHistory.length === 0) ? (
                      <div style={{ color: '#8C7B6D', fontStyle: 'italic' }}>No audit history yet.</div>
                    ) : (
                      selectedMember.verificationHistory.map((log) => (
                        <div key={log._id} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #F0EAE1' }}>
                          <span style={{ fontWeight: 700 }}>{log.action}</span> from <span style={{ fontWeight: 600 }}>{log.previousStatus}</span> to <span style={{ fontWeight: 700, color: '#D97706' }}>{log.newStatus}</span> by {log.performedBy?.name || 'Admin'} on {new Date(log.createdAt).toLocaleString()}
                          {log.reason && <div style={{ color: '#8C7B6D', marginTop: 2 }}>Note: {log.reason}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Moderation Actions Box */}
                <div style={{ borderTop: '1px solid #ECE4D8', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#231C16' }}>
                    Update Status & Authorization
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6B5E52', marginBottom: 4 }}>
                      Rejection or Suspension Reason (Required for Reject/Suspend):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Official institutional directory page could not be verified."
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #D5C7B7',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6B5E52', marginBottom: 4 }}>
                      Internal Administrative Notes (Private):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified via Stanford computer science faculty directory."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #D5C7B7',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      onClick={() => setSelectedMember(null)}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '1px solid #D5C7B7',
                        background: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reject Submission
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('suspended')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#9F1239',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Suspend Faculty
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('verified')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <ShieldCheck size={18} /> Approve & Verify Faculty
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
