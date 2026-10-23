import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  FileText,
  Mail,
  Building,
  UploadCloud,
  ArrowRight,
  Info,
  Check,
  RefreshCw,
  Award
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

export default function FacultyVerificationPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form State
  const [institutionalEmail, setInstitutionalEmail] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [department, setDepartment] = useState('')
  const [facultyIdNumber, setFacultyIdNumber] = useState('')
  const [verificationDocumentUrl, setVerificationDocumentUrl] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await facultyApi.getProfile()
      const data = res?.data || res
      if (data?.success && data.profile) {
        const p = data.profile
        setProfile(p)
        setInstitutionalEmail(p.institutionalEmail || p.userId?.email || '')
        setInstitutionName(p.institutionName || '')
        setDepartment(p.department || '')
        setFacultyIdNumber(p.facultyIdNumber || '')
        setVerificationDocumentUrl(p.verificationDocumentUrl || '')
      }
    } catch (err) {
      setError('Failed to load faculty profile verification data.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!institutionalEmail || !institutionalEmail.trim()) {
      setError('Institutional email is required.')
      return
    }
    if (!institutionName || !institutionName.trim()) {
      setError('Institution name is required.')
      return
    }
    if (!department || !department.trim()) {
      setError('Academic department is required.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        institutionalEmail: institutionalEmail.trim(),
        institutionName: institutionName.trim(),
        department: department.trim(),
        employeeId: (facultyIdNumber || 'FACULTY_ID').trim(),
        facultyIdNumber: facultyIdNumber ? facultyIdNumber.trim() : undefined,
        verificationDocumentUrl: verificationDocumentUrl ? verificationDocumentUrl.trim() : undefined,
        notes: notes ? notes.trim() : undefined
      }

      const res = await facultyApi.submitVerification(payload)
      const data = res?.data || res
      if (data?.success) {
        setSuccessMsg(data.message || 'Verification dossier submitted successfully for review.')
        fetchProfile()
      } else {
        setError(data?.message || 'Verification submission could not be processed.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please check your network and inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
        <div style={{ color: '#8C7B6D', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <RefreshCw size={20} className="spin" /> Loading verification status...
        </div>
      </div>
    )
  }

  const status = profile?.status || 'unverified'
  const isPending = status === 'pending'
  const isVerified = status === 'verified'
  const isRejected = status === 'rejected'
  const isSuspended = status === 'suspended'
  const isUnverified = status === 'unverified'
  const completionPct = typeof profile?.profileCompletion === 'number'
    ? profile.profileCompletion
    : (profile?.profileCompletion?.percentage || 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
          Faculty Verification & Trust
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#8C7B6D', marginTop: 6, margin: 0 }}>
          Verify your academic credentials with REXION administration to unlock quiz publishing on Career Hub and earn the Verified Educator badge.
        </p>
      </div>

      {/* Status Callout Banner */}
      <div style={{
        borderRadius: 16,
        padding: '24px 28px',
        border: '1px solid',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        background: isVerified
          ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
          : isPending
          ? 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 100%)'
          : isRejected
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
          : isSuspended
          ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)'
          : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        borderColor: isVerified
          ? '#86EFAC'
          : isPending
          ? '#FDE047'
          : isRejected
          ? '#FCA5A5'
          : isSuspended
          ? '#FDA4AF'
          : '#FCD34D'
      }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          {isVerified && <CheckCircle2 size={28} color="#16A34A" />}
          {isPending && <Clock size={28} color="#CA8A04" />}
          {isRejected && <XCircle size={28} color="#DC2626" />}
          {isSuspended && <AlertOctagon size={28} color="#BE123C" />}
          {isUnverified && <ShieldCheck size={28} color="#D97706" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 10px',
              borderRadius: 20,
              background: '#FFFFFF',
              color: isVerified ? '#15803D' : isPending ? '#A16207' : isRejected ? '#B91C1C' : isSuspended ? '#9F1239' : '#B45309'
            }}>
              Current Status: {status.toUpperCase()}
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#231C16', margin: '8px 0 4px' }}>
            {isVerified && 'Verified Educator Status Active'}
            {isPending && 'Verification Under Administrative Review'}
            {isRejected && 'Verification Request Not Approved'}
            {isSuspended && 'Faculty Privileges Temporarily Suspended'}
            {isUnverified && 'Unverified Account — Submit Credentials'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#4B3F35', margin: 0, lineHeight: 1.5 }}>
            {isVerified && 'Your institutional affiliation and faculty credentials have been verified by REXION administration. You have full publishing privileges for quizzes and question banks.'}
            {isPending && 'Your credentials and institution details are currently being reviewed by a REXION administrator. Most reviews are finalized within 24 to 48 hours.'}
            {isRejected && (profile?.rejectionReason ? `Reason: "${profile.rejectionReason}". You may update your institutional information below and resubmit for reconsideration.` : 'Your submission did not meet the criteria. Please review the details below and resubmit.')}
            {isSuspended && (profile?.suspendedReason ? `Suspension note: "${profile.suspendedReason}". Please contact administrative support to restore educator credentials.` : 'Access to publishing is currently suspended.')}
            {isUnverified && 'To maintain quality standards and educational trust on REXION Career Hub, quiz publishing is restricted to verified college professors, lecturers, and instructors.'}
          </p>
        </div>
      </div>

      {/* Completion Meter Alert if profile incomplete */}
      {completionPct < 80 && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #ECE4D8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={20} color="#D97706" />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#231C16' }}>
                Profile Completion: {completionPct}%
              </div>
              <div style={{ fontSize: '0.78rem', color: '#8C7B6D' }}>
                Completing your qualifications and bio speeds up administrative approval.
              </div>
            </div>
          </div>
          <Link
            to="/faculty/profile"
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#D97706',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            Edit Profile <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Success / Error alerts */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          background: '#DCFCE7',
          color: '#15803D',
          borderRadius: 12,
          fontSize: '0.88rem',
          fontWeight: 600,
          border: '1px solid #86EFAC'
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          padding: '12px 18px',
          background: '#FEE2E2',
          color: '#B91C1C',
          borderRadius: 12,
          fontSize: '0.88rem',
          fontWeight: 600,
          border: '1px solid #FCA5A5'
        }}>
          {error}
        </div>
      )}

      {/* Verification Submission Form (enabled for unverified, rejected, and pending with edits) */}
      {!isSuspended && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #ECE4D8',
          padding: '28px 32px',
          boxShadow: '0 4px 20px rgba(35,28,22,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
                {isVerified ? 'Verified Dossier Information' : isPending ? 'Submitted Dossier' : 'Submit Credentials for Verification'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#8C7B6D', marginTop: 4, margin: 0 }}>
                {isVerified ? 'Your approved credentials are saved in your institutional dossier.' : 'REXION administrators will cross-reference this information with institutional directories.'}
              </p>
            </div>
            {isVerified && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#DCFCE7',
                color: '#15803D',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                <Award size={16} /> Verified Faculty
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {/* Institutional Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Institutional Email (.edu / .ac.in / official)*
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={institutionalEmail}
                    onChange={(e) => setInstitutionalEmail(e.target.value)}
                    placeholder="professor@university.edu"
                    disabled={isVerified}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: '1px solid #D5C7B7',
                      fontSize: '0.9rem',
                      color: '#231C16',
                      background: isVerified ? '#F9F6F0' : '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Institution Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Institution / University Name*
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Stanford University / IIT Delhi"
                  disabled={isVerified}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1px solid #D5C7B7',
                    fontSize: '0.9rem',
                    color: '#231C16',
                    background: isVerified ? '#F9F6F0' : '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {/* Department */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Academic Department*
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Department of Computer Science & Engineering"
                  disabled={isVerified}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1px solid #D5C7B7',
                    fontSize: '0.9rem',
                    color: '#231C16',
                    background: isVerified ? '#F9F6F0' : '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Faculty ID / Employee ID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Faculty / Employee ID Number (Optional)
                </label>
                <input
                  type="text"
                  value={facultyIdNumber}
                  onChange={(e) => setFacultyIdNumber(e.target.value)}
                  placeholder="e.g. FAC-2024-8841"
                  disabled={isVerified}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1px solid #D5C7B7',
                    fontSize: '0.9rem',
                    color: '#231C16',
                    background: isVerified ? '#F9F6F0' : '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Verification Document URL or Profile Link */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Official Faculty Directory URL or Document Proof Link
              </label>
              <input
                type="url"
                value={verificationDocumentUrl}
                onChange={(e) => setVerificationDocumentUrl(e.target.value)}
                placeholder="https://university.edu/faculty/your-name or secure document link"
                disabled={isVerified}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid #D5C7B7',
                  fontSize: '0.9rem',
                  color: '#231C16',
                  background: isVerified ? '#F9F6F0' : '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#8C7B6D', marginTop: 4, display: 'block' }}>
                Note: Verification documents and private links are confidential and strictly restricted to REXION verification administrators.
              </span>
            </div>

            {/* Additional Notes for Administrator */}
            {!isVerified && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Additional Notes for Admin Review
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide context on your teaching roles, subject domains, or institutional email domains if non-standard..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1px solid #D5C7B7',
                    fontSize: '0.9rem',
                    color: '#231C16',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            {/* Action buttons */}
            {!isVerified && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 28px',
                    background: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={18} className="spin" /> Submitting...
                    </>
                  ) : isRejected ? (
                    'Resubmit Verification Request'
                  ) : isPending ? (
                    'Update Verification Submission'
                  ) : (
                    'Submit Verification Request'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Trust & Policy Info */}
      <div style={{
        background: '#FAF8F5',
        borderRadius: 14,
        padding: '20px 24px',
        border: '1px solid #ECE4D8',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#231C16', marginBottom: 4 }}>
            Zero-Trust Publishing Gate
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8C7B6D', lineHeight: 1.5 }}>
            Quizzes can be drafted at any time, but career hub publication requires explicit verification approval by authorized REXION staff.
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#231C16', marginBottom: 4 }}>
            Confidential Document Handling
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8C7B6D', lineHeight: 1.5 }}>
            Faculty employee numbers and verification links are never exposed on student-facing profiles or search engines.
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#231C16', marginBottom: 4 }}>
            Audited Review Lifecycle
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8C7B6D', lineHeight: 1.5 }}>
            All approval, rejection, and suspension actions are logged immutably with administrator identity and timestamps.
          </div>
        </div>
      </div>
    </div>
  )
}
