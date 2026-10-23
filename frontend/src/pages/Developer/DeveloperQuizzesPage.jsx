import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, BookOpen, Clock, Award,
  CheckCircle2, AlertTriangle, Archive, Trash2, Edit3,
  Eye, BarChart3, ExternalLink, RefreshCw, Sparkles, ChevronRight,
  Copy, RotateCcw
} from 'lucide-react'
import developerApi from '../../services/developerApi'
import styles from './DeveloperQuizzesPage.module.css'

const CATEGORY_LABELS = {
  all: 'All Categories',
  dsa: 'Data Structures & Algorithms',
  javascript: 'JavaScript',
  react: 'React',
  nodejs: 'Node.js',
  express: 'Express.js',
  mongodb: 'MongoDB',
  mern: 'MERN Stack',
  python: 'Python',
  ai_ml: 'AI & Machine Learning',
  sql: 'SQL & Databases',
  system_design: 'System Design',
  oop: 'Object-Oriented Programming',
  networks: 'Computer Networks',
  os: 'Operating Systems',
  aptitude: 'Aptitude & Reasoning',
  interview_prep: 'Interview Preparation'
}

export default function DeveloperQuizzesPage() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, draft, published, archived
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Create Quiz modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newQuizTitle, setNewQuizTitle] = useState('')
  const [newQuizCategory, setNewQuizCategory] = useState('javascript')
  const [newQuizDifficulty, setNewQuizDifficulty] = useState('Intermediate')
  const [newQuizDesc, setNewQuizDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const loadQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await developerApi.getQuizzes({
        status: statusFilter,
        category: categoryFilter,
        search
      })
      if (res.success) {
        setQuizzes(res.quizzes || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuizzes()
  }, [statusFilter, categoryFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadQuizzes()
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    if (!newQuizTitle.trim()) return
    try {
      setCreating(true)
      const res = await developerApi.createQuiz({
        title: newQuizTitle.trim(),
        category: newQuizCategory,
        difficulty: newQuizDifficulty,
        description: newQuizDesc.trim() || undefined
      })
      if (res.success && res.quiz) {
        setShowCreateModal(false)
        navigate(`/developer/quizzes/${res.quiz._id}/edit`)
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create quiz' })
    } finally {
      setCreating(false)
    }
  }

  const handlePublish = async (quiz) => {
    const confirm = window.confirm(`Are you sure you want to publish "${quiz.title}"? It will become immediately discoverable in Career Hub.`)
    if (!confirm) return

    try {
      setActionLoading(quiz._id)
      const res = await developerApi.publishQuiz(quiz._id)
      if (res.success) {
        setFeedback({ type: 'success', message: `"${quiz.title}" published successfully (v${res.quiz.version})!` })
        loadQuizzes()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish quiz' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleArchive = async (quiz) => {
    const confirm = window.confirm(`Archive "${quiz.title}"? It will be hidden from new discovery in Career Hub, but historical student results will be preserved.`)
    if (!confirm) return

    try {
      setActionLoading(quiz._id)
      const res = await developerApi.archiveQuiz(quiz._id)
      if (res.success) {
        setFeedback({ type: 'success', message: `"${quiz.title}" archived.` })
        loadQuizzes()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to archive quiz' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (quiz) => {
    const confirm = window.confirm(`Delete draft quiz "${quiz.title}"? This action cannot be undone.`)
    if (!confirm) return

    try {
      setActionLoading(quiz._id)
      const res = await developerApi.deleteQuiz(quiz._id)
      if (res.success) {
        setFeedback({ type: 'success', message: `Quiz deleted.` })
        loadQuizzes()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete quiz' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (quiz) => {
    try {
      setActionLoading(quiz._id)
      const res = await developerApi.duplicateQuiz(quiz._id)
      if (res.success) {
        setFeedback({ type: 'success', message: `Quiz duplicated as "${res.quiz.title}".` })
        loadQuizzes()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to duplicate quiz' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestore = async (quiz) => {
    try {
      setActionLoading(quiz._id)
      const res = await developerApi.restoreQuiz(quiz._id)
      if (res.success) {
        setFeedback({ type: 'success', message: `Quiz restored to draft.` })
        loadQuizzes()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to restore quiz' })
    } finally {
      setActionLoading(null)
    }
  }

  const filteredQuizzes = quizzes.filter(q => {
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false
    return true
  })

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Technical Quizzes</h1>
          <p className={styles.subtitle}>
            Create, refine, preview, and publish technical assessments for the REXION Career Hub.
          </p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          Create New Quiz
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`${styles.feedbackBanner} ${styles[feedback.type]}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={styles.toolbar}>
        <div className={styles.statusTabs}>
          {['all', 'draft', 'published', 'archived'].map(status => (
            <button
              key={status}
              className={`${styles.statusTab} ${statusFilter === status ? styles.activeTab : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.filtersGroup}>
          <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, description or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </form>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.selectFilter}
          >
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className={styles.selectFilter}
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className={styles.loadingState}>
          <RefreshCw size={24} className={styles.spin} />
          <p>Loading your technical quizzes...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle size={24} color="#DC2626" />
          <p>{error}</p>
          <button onClick={loadQuizzes} className={styles.retryBtn}>Retry</button>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>No Quizzes Found</h3>
          <p>
            {statusFilter !== 'all' || categoryFilter !== 'all' || search
              ? 'Try adjusting your search criteria or filters.'
              : 'You have not created any quizzes yet. Click "Create New Quiz" to get started.'}
          </p>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
            style={{ marginTop: 16 }}
          >
            <Plus size={16} />
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div className={styles.quizGrid}>
          {filteredQuizzes.map(quiz => {
            const isActing = actionLoading === quiz._id
            const questionCount = (quiz.questions || []).length
            return (
              <div key={quiz._id} className={styles.quizCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.statusBadge} ${styles[quiz.status || 'draft']}`}>
                      {quiz.status || 'draft'}
                    </span>
                    <span className={styles.difficultyBadge}>{quiz.difficulty || 'Intermediate'}</span>
                    <span className={styles.versionBadge}>v{quiz.version || 1}</span>
                  </div>
                  <div className={styles.categoryPill}>
                    {CATEGORY_LABELS[quiz.category] || quiz.category}
                  </div>
                </div>

                <h3 className={styles.quizTitle}>{quiz.title}</h3>
                <p className={styles.quizDesc}>
                  {quiz.description || 'No description provided yet.'}
                </p>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <BookOpen size={14} />
                    <span>{questionCount} questions</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{quiz.durationMinutes || 15} min</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Award size={14} />
                    <span>Pass: {quiz.passingScore || 70}%</span>
                  </div>
                </div>

                {/* Performance telemetry */}
                <div className={styles.telemetryBar}>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Attempts</span>
                    <span className={styles.telemetryVal}>{quiz.attemptsCount || 0}</span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Avg Score</span>
                    <span className={styles.telemetryVal}>
                      {quiz.averageScore ? `${Math.round(quiz.averageScore)}%` : '—'}
                    </span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Negative Marks</span>
                    <span className={styles.telemetryVal}>{quiz.negativeMarking ? 'On' : 'Off'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className={styles.cardActions}>
                  <button
                    className={styles.secondaryAction}
                    onClick={() => navigate(`/developer/quizzes/${quiz._id}/edit`)}
                    title="Edit Quiz & Questions"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    className={styles.secondaryAction}
                    onClick={() => navigate(`/developer/quizzes/${quiz._id}/preview`)}
                    title="Student Preview Mode"
                  >
                    <Eye size={15} />
                    Preview
                  </button>

                  <button
                    className={styles.secondaryAction}
                    onClick={() => navigate(`/developer/analytics?quizId=${quiz._id}`)}
                    title="View Analytics"
                  >
                    <BarChart3 size={15} />
                  </button>

                  {quiz.status === 'draft' && (
                    <button
                      className={styles.publishBtn}
                      onClick={() => handlePublish(quiz)}
                      disabled={isActing}
                    >
                      Publish
                    </button>
                  )}

                  {quiz.status === 'published' && (
                    <button
                      className={styles.archiveBtn}
                      onClick={() => handleArchive(quiz)}
                      disabled={isActing}
                      title="Archive Quiz"
                    >
                      <Archive size={14} />
                    </button>
                  )}

                  {quiz.status === 'archived' && (
                    <button
                      onClick={() => handleRestore(quiz)}
                      disabled={isActing}
                      title="Restore to Draft"
                      style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '6px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                  )}

                  <button
                    onClick={() => handleDuplicate(quiz)}
                    disabled={isActing}
                    title="Duplicate Quiz"
                    style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer', color: '#8C7B6D' }}
                  >
                    <Copy size={14} />
                  </button>

                  {(quiz.status === 'draft' || quiz.status === 'archived') && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(quiz)}
                      disabled={isActing}
                      title="Delete Quiz"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Create Quiz Quick Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create New Technical Quiz</h2>
              <button onClick={() => setShowCreateModal(false)} className={styles.closeBtn}>×</button>
            </div>
            <form onSubmit={handleCreateQuiz}>
              <div className={styles.formGroup}>
                <label>Quiz Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Asynchronous JavaScript & Promises Deep Dive"
                  value={newQuizTitle}
                  onChange={e => setNewQuizTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    value={newQuizCategory}
                    onChange={e => setNewQuizCategory(e.target.value)}
                  >
                    {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== 'all').map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Difficulty *</label>
                  <select
                    value={newQuizDifficulty}
                    onChange={e => setNewQuizDifficulty(e.target.value)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Short Description</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core topics and expectations for candidates..."
                  value={newQuizDesc}
                  onChange={e => setNewQuizDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={creating || !newQuizTitle.trim()}
                >
                  {creating ? 'Creating...' : 'Continue to Question Builder →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
