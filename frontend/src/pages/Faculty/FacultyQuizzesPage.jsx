import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  Search,
  PlusCircle,
  Eye,
  Edit3,
  BarChart2,
  Trash2,
  Archive,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  Clock,
  Layers,
  Copy,
  RotateCcw
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

const FacultyQuizzesPage = () => {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [facultyProfile, setFacultyProfile] = useState(null)
  const [unverifiedModalOpen, setUnverifiedModalOpen] = useState(false)
  const [selectedQuizForPublish, setSelectedQuizForPublish] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      facultyApi.getQuizzes({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: search.trim() || undefined
      }),
      facultyApi.getProfile()
    ])
      .then(([quizRes, profRes]) => {
        setQuizzes(quizRes?.quizzes || [])
        setFacultyProfile(profRes?.profile || null)
      })
      .catch(err => {
        setActionError(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [selectedStatus])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadData()
  }

  const isVerified = facultyProfile?.status === 'verified'

  const handlePublishClick = (quiz) => {
    if (!isVerified) {
      setSelectedQuizForPublish(quiz)
      setUnverifiedModalOpen(true)
      return
    }

    if (!window.confirm(`Are you ready to publish "${quiz.title}" to the student Career Hub?`)) return

    setActionLoading(true)
    setActionMessage(null)
    setActionError(null)

    facultyApi.publishQuiz(quiz._id)
      .then(res => {
        setActionMessage(res.message || 'Quiz published successfully!')
        loadData()
      })
      .catch(err => {
        setActionError(err.response?.data?.message || err.message || 'Failed to publish quiz.')
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  const handleUnpublish = (quiz) => {
    if (!window.confirm(`Revert "${quiz.title}" to draft? It will be removed from public student discovery.`)) return
    setActionLoading(true)
    facultyApi.unpublishQuiz(quiz._id)
      .then(res => {
        setActionMessage(res.message || 'Quiz reverted to draft.')
        loadData()
      })
      .catch(err => {
        setActionError(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  const handleArchive = (quiz) => {
    if (!window.confirm(`Archive "${quiz.title}"? Existing student historical records will be preserved.`)) return
    setActionLoading(true)
    facultyApi.archiveQuiz(quiz._id)
      .then(res => {
        setActionMessage(res.message || 'Quiz archived.')
        loadData()
      })
      .catch(err => {
        setActionError(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  const handleDelete = (quiz) => {
    if (!window.confirm(`Permanently delete "${quiz.title}"? Note: If student attempts exist, it will be safely archived to protect student transcripts.`)) return
    setActionLoading(true)
    facultyApi.deleteQuiz(quiz._id)
      .then(res => {
        setActionMessage(res.message || 'Quiz deleted successfully.')
        loadData()
      })
      .catch(err => {
        setActionError(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  const handleDuplicate = (quiz) => {
    setActionLoading(true)
    facultyApi.duplicateQuiz(quiz._id)
      .then(res => {
        setActionMessage(res.message || 'Quiz duplicated as draft!')
        loadData()
      })
      .catch(err => {
        setActionError(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  const handleRestore = (quiz) => {
    setActionLoading(true)
    facultyApi.restoreQuiz(quiz._id)
      .then(res => {
        setActionMessage(res.message || 'Quiz restored to draft!')
        loadData()
      })
      .catch(err => {
        setActionError(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── HEADER BANNER ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
            Faculty Educational Quizzes
          </h2>
          <p style={{ color: '#8C7B6D', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Author, organize, and publish curriculum quizzes with verified educator attribution.
          </p>
        </div>
        <Link
          to="/faculty/quizzes/new"
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            padding: '10px 22px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: '0.86rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
          }}
        >
          <PlusCircle size={16} /> Create New Quiz
        </Link>
      </div>

      {actionMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.88rem' }}>
          ✓ {actionMessage}
        </div>
      )}

      {actionError && (
        <div style={{ background: '#FCEFEB', border: '1px solid #F5C6CB', color: '#721C24', padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.88rem' }}>
          ⚠️ {actionError}
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #ECE4D8',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#F8F4EE', padding: 4, borderRadius: 10 }}>
          {[
            { id: 'all', label: 'All Quizzes' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
            { id: 'archived', label: 'Archived' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              style={{
                border: 'none',
                background: selectedStatus === tab.id ? '#FFFFFF' : 'transparent',
                color: selectedStatus === tab.id ? '#2563EB' : '#5C4D40',
                padding: '6px 14px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: selectedStatus === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={15} style={{ position: 'absolute', left: 12, color: '#8C7B6D' }} />
            <input
              type="text"
              placeholder="Search by title, topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '8px 12px 8px 34px',
                borderRadius: 999,
                border: '1px solid #ECE4D8',
                background: '#F8F4EE',
                fontSize: '0.84rem',
                outline: 'none',
                width: 240
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#231C16',
              color: '#FFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* ── QUIZ LIST ── */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#8C7B6D' }}>
          <GraduationCap size={32} style={{ animation: 'bounce 1s infinite', color: '#2563EB', marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>Loading quizzes...</div>
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #ECE4D8',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#8C7B6D'
        }}>
          <BookOpenCheck size={40} style={{ color: '#C8BCB0', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#231C16', margin: '0 0 8px 0' }}>
            No quizzes found
          </h3>
          <p style={{ fontSize: '0.86rem', maxWidth: 420, margin: '0 auto 20px' }}>
            {selectedStatus !== 'all'
              ? `No quizzes currently match the status "${selectedStatus}".`
              : 'You haven\'t authored any quizzes yet. Create your first educational assessment to publish for students.'}
          </p>
          <Link
            to="/faculty/quizzes/new"
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <PlusCircle size={15} /> Create Quiz
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {quizzes.map(q => {
            const isPub = q.status === 'published'
            const isArch = q.status === 'archived'
            return (
              <div key={q._id} style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #ECE4D8',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                boxShadow: '0 4px 16px rgba(35,28,22,0.02)'
              }}>
                <div style={{ flex: '1 1 340px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: isPub ? '#ECFDF5' : (isArch ? '#F3F4F6' : '#FEF9E7'),
                      color: isPub ? '#065F46' : (isArch ? '#4B5563' : '#92400E'),
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {q.status}
                    </span>
                    {q.isVerifiedFaculty && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: '#EEF4FD',
                        color: '#1D4ED8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        🎓 Verified Faculty
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: '#8C7B6D' }}>
                      v{q.version || 1}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', margin: '0 0 6px 0' }}>
                    {q.title}
                  </h3>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: '#5C4D40' }}>
                    <span><strong>Subject:</strong> {q.category}</span>
                    <span><strong>Topic:</strong> {q.topic}</span>
                    <span><strong>Difficulty:</strong> {q.difficulty}</span>
                    <span><strong>Questions:</strong> {q.questionsCount}</span>
                    <span><strong>Duration:</strong> {q.durationMinutes}m</span>
                    <span><strong>Passing:</strong> {q.passingScore}%</span>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#231C16' }}>
                      {q.attemptsCount || 0}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#8C7B6D', fontWeight: 600 }}>Attempts</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: q.avgScore >= 60 ? '#10B981' : '#F59E0B' }}>
                      {q.avgScore || 0}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#8C7B6D', fontWeight: 600 }}>Avg Score</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link
                    to={`/faculty/quizzes/${q._id}/edit`}
                    style={{
                      background: '#F8F4EE',
                      color: '#231C16',
                      border: '1px solid #ECE4D8',
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </Link>

                  <Link
                    to={`/faculty/quizzes/${q._id}/preview`}
                    style={{
                      background: '#F8F4EE',
                      color: '#231C16',
                      border: '1px solid #ECE4D8',
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Eye size={13} /> Preview
                  </Link>

                  <Link
                    to={`/faculty/quizzes/${q._id}/analytics`}
                    style={{
                      background: '#F8F4EE',
                      color: '#231C16',
                      border: '1px solid #ECE4D8',
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <BarChart2 size={13} /> Results
                  </Link>

                  {!isPub ? (
                    <button
                      onClick={() => handlePublishClick(q)}
                      style={{
                        background: '#10B981',
                        color: '#FFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(q)}
                      style={{
                        background: '#FEF9E7',
                        color: '#92400E',
                        border: '1px solid #F4DF94',
                        padding: '8px 14px',
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Unpublish
                    </button>
                  )}

                  {isArch && (
                    <button
                      onClick={() => handleRestore(q)}
                      style={{
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        padding: '8px 14px',
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Restore to Draft"
                    >
                      <RotateCcw size={13} /> Restore
                    </button>
                  )}

                  {!isArch && (
                    <button
                      onClick={() => handleArchive(q)}
                      style={{
                        background: 'transparent',
                        color: '#8C7B6D',
                        border: 'none',
                        padding: 6,
                        cursor: 'pointer'
                      }}
                      title="Archive Quiz"
                    >
                      <Archive size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDuplicate(q)}
                    style={{
                      background: 'transparent',
                      color: '#8C7B6D',
                      border: 'none',
                      padding: 6,
                      cursor: 'pointer'
                    }}
                    title="Duplicate Quiz"
                  >
                    <Copy size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(q)}
                    style={{
                      background: 'transparent',
                      color: '#EF4444',
                      border: 'none',
                      padding: 6,
                      cursor: 'pointer'
                    }}
                    title="Delete Quiz"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── UNVERIFIED FACULTY PUBLISH WARNING MODAL ── */}
      {unverifiedModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 500,
            width: '100%',
            padding: 32,
            border: '1px solid #ECE4D8',
            boxShadow: '0 20px 48px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#FDF6EC',
              color: '#D96B43',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <ShieldAlert size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#231C16', margin: '0 0 10px 0' }}>
              Faculty Verification Required
            </h3>

            <p style={{ color: '#5C4D40', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              To protect academic integrity and student quality on REXION Career Hub, <strong>only verified faculty and college professors can publish quizzes</strong>.
            </p>

            <div style={{
              background: '#F8F4EE',
              borderRadius: 12,
              padding: 14,
              fontSize: '0.84rem',
              color: '#5C4D40',
              marginBottom: 24,
              border: '1px solid #ECE4D8'
            }}>
              <div style={{ fontWeight: 700, color: '#231C16', marginBottom: 4 }}>
                Selected Quiz: {selectedQuizForPublish?.title}
              </div>
              Your quiz draft is safely saved and ready. Complete your institutional verification request now to unlock publication.
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUnverifiedModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #ECE4D8',
                  padding: '9px 18px',
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  color: '#5C4D40'
                }}
              >
                Keep as Draft
              </button>
              <button
                onClick={() => {
                  setUnverifiedModalOpen(false)
                  navigate('/faculty/verification')
                }}
                style={{
                  background: '#2563EB',
                  border: 'none',
                  color: '#FFF',
                  padding: '9px 22px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Go to Verification <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyQuizzesPage
