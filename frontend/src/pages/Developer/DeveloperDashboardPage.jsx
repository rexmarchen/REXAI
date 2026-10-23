import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DeveloperLayout from './DeveloperLayout'
import developerApi from '../../services/developerApi'
import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  HelpCircle,
  Users,
  Target,
  Percent,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react'
import styles from './DeveloperDashboardPage.module.css'

const DeveloperDashboardPage = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    developerApi.getDashboard()
      .then(res => {
        if (!isMounted) return
        setData(res)
      })
      .catch(err => {
        if (!isMounted) return
        setError(err?.response?.data?.message || err.message || 'Failed to load developer dashboard.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => { isMounted = false }
  }, [])

  if (loading) {
    return (
      <DeveloperLayout pageTitle="Developer Dashboard">
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#8E7E70' }}>
          Loading developer telemetry and metrics...
        </div>
      </DeveloperLayout>
    )
  }

  const stats = data?.stats || {
    totalQuizzes: 0,
    publishedQuizzes: 0,
    draftQuizzes: 0,
    archivedQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    avgScore: 0,
    passRate: 0
  }

  const recentQuizzes = data?.recentQuizzes || []
  const recentAttempts = data?.recentAttempts || []
  const needingAttention = data?.needingAttention || []

  return (
    <DeveloperLayout pageTitle="Developer Dashboard">
      {/* ── HERO BANNER ── */}
      <div className={styles.heroCard}>
        <div className={styles.heroContent}>
          <h1>Developer Control Center</h1>
          <p>
            Build technical quizzes, manage questions across skill domains, and monitor real-time user performance.
          </p>
        </div>
        <div className={styles.heroQuickActions}>
          <Link to="/developer/quizzes/new" className={styles.primaryBtn}>
            <PlusCircle size={16} />
            <span>Create Quiz</span>
          </Link>
          <Link to="/developer/questions" className={styles.secondaryBtn}>
            <HelpCircle size={16} />
            <span>Question Bank</span>
          </Link>
          <Link to="/developer/apply" className={styles.secondaryBtn}>
            <ExternalLink size={16} />
            <span>Developer Profile</span>
          </Link>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#FEF3EB', color: '#D96B43' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div className={styles.metricVal}>{stats.totalQuizzes}</div>
            <div className={styles.metricLbl}>Total Quizzes</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#EAF6EF', color: '#2E9362' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={styles.metricVal}>{stats.publishedQuizzes}</div>
            <div className={styles.metricLbl}>Published Live</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#FEF9E7', color: '#B48805' }}>
            <FileEdit size={20} />
          </div>
          <div>
            <div className={styles.metricVal}>{stats.draftQuizzes}</div>
            <div className={styles.metricLbl}>Drafts in Work</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#EEF4FD', color: '#2F74DE' }}>
            <HelpCircle size={20} />
          </div>
          <div>
            <div className={styles.metricVal}>{stats.totalQuestions}</div>
            <div className={styles.metricLbl}>Total Questions</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <Users size={20} />
          </div>
          <div>
            <div className={styles.metricVal}>{stats.totalAttempts}</div>
            <div className={styles.metricLbl}>Total Attempts</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#FCEFEB', color: '#E05A47' }}>
            <Percent size={20} />
          </div>
          <div>
            <div className={styles.metricVal}>{stats.avgScore}%</div>
            <div className={styles.metricLbl}>Avg Quiz Score</div>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN WORKSPACE ── */}
      <div className={styles.layoutRow}>
        {/* Left Column: Recent Quizzes */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recently Edited Quizzes</span>
            <Link to="/developer/quizzes" className={styles.viewAllLink}>
              View All Quizzes <ChevronRight size={14} />
            </Link>
          </div>

          {recentQuizzes.length > 0 ? (
            <div>
              {recentQuizzes.map(quiz => (
                <div key={quiz._id} className={styles.quizItem}>
                  <div className={styles.quizInfo}>
                    <div className={styles.quizTitleRow}>
                      <span className={styles.quizTitle}>{quiz.title}</span>
                      <span className={`${styles.badge} ${
                        quiz.status === 'published' ? styles.badgePublished :
                        quiz.status === 'draft' ? styles.badgeDraft : styles.badgeArchived
                      }`}>
                        {quiz.status}
                      </span>
                    </div>
                    <div className={styles.quizMeta}>
                      <span>{quiz.category}</span>
                      <span>•</span>
                      <span>{quiz.difficulty}</span>
                      <span>•</span>
                      <span>{quiz.questionsCount} Qs</span>
                      <span>•</span>
                      <span>{quiz.durationMinutes} min</span>
                    </div>
                  </div>

                  <div className={styles.quizActions}>
                    <Link
                      to={`/developer/quizzes/${quiz._id}/preview`}
                      className={styles.quizActionBtn}
                      title="Preview quiz player"
                    >
                      Preview
                    </Link>
                    <Link
                      to={`/developer/quizzes/${quiz._id}/edit`}
                      className={styles.quizActionBtn}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>You haven't created any technical quizzes yet.</p>
              <Link to="/developer/quizzes/new" className={styles.primaryBtn} style={{ marginTop: 12 }}>
                <PlusCircle size={15} /> Create Your First Quiz
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Attention & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Needing Attention Alert */}
          {needingAttention.length > 0 && (
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle} style={{ color: '#A66E1D', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={18} /> Quizzes Needing Attention
                </span>
              </div>
              {needingAttention.map(quiz => (
                <div key={quiz._id} className={styles.attentionCard}>
                  <div className={styles.attentionTitle}>{quiz.title}</div>
                  <p className={styles.attentionDesc}>
                    Draft quiz has only {(quiz.questionPool || []).length} questions. Add at least 3 questions to publish.
                  </p>
                  <Link
                    to={`/developer/quizzes/${quiz._id}/edit`}
                    style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D96B43', marginTop: 8, display: 'inline-block' }}
                  >
                    Open Editor & Add Questions →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Recent Attempts Activity */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Recent User Attempts</span>
            </div>

            {recentAttempts.length > 0 ? (
              <div>
                {recentAttempts.map(attempt => (
                  <div key={attempt._id} className={styles.activityItem}>
                    <div className={styles.activityDot} />
                    <div style={{ flex: 1 }}>
                      <div className={styles.activityText}>
                        Candidate attempted <strong>{attempt.quizSlug}</strong> scoring <strong>{attempt.scorePercentage}%</strong> ({attempt.correctCount}/{attempt.totalQuestions})
                      </div>
                      <div className={styles.activityTime}>
                        {new Date(attempt.completedAt).toLocaleString()} • {attempt.timeTaken}s taken
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                No student attempts recorded yet on your quizzes.
              </div>
            )}
          </div>
        </div>
      </div>
    </DeveloperLayout>
  )
}

export default DeveloperDashboardPage
