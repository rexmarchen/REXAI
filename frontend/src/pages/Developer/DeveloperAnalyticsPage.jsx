import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3, Users, Award, CheckCircle2, XCircle,
  Clock, TrendingUp, AlertTriangle, RefreshCw, BookOpen
} from 'lucide-react'
import developerApi from '../../services/developerApi'
import styles from './DeveloperAnalyticsPage.module.css'

export default function DeveloperAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuizId = searchParams.get('quizId') || ''

  const [quizzes, setQuizzes] = useState([])
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId)
  const [analytics, setAnalytics] = useState(null)
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [error, setError] = useState(null)

  // Load developer quizzes for dropdown
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoadingQuizzes(true)
        const res = await developerApi.getQuizzes()
        if (res.success && Array.isArray(res.quizzes)) {
          setQuizzes(res.quizzes)
          if (!selectedQuizId && res.quizzes.length > 0) {
            setSelectedQuizId(res.quizzes[0]._id)
          }
        }
      } catch (err) {
        setError('Failed to load quiz list.')
      } finally {
        setLoadingQuizzes(false)
      }
    }
    fetchQuizzes()
  }, [])

  // Load analytics for chosen quiz
  useEffect(() => {
    if (!selectedQuizId) return
    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true)
        setError(null)
        const res = await developerApi.getQuizAnalytics(selectedQuizId)
        if (res.success) {
          setAnalytics(res)
        }
      } catch (err) {
        setError(err.message || 'Failed to load quiz analytics')
      } finally {
        setLoadingAnalytics(false)
      }
    }
    fetchAnalytics()
  }, [selectedQuizId])

  const handleSelectQuiz = (id) => {
    setSelectedQuizId(id)
    setSearchParams(id ? { quizId: id } : {})
  }

  const selectedQuiz = quizzes.find(q => q._id === selectedQuizId)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assessment Analytics</h1>
          <p className={styles.subtitle}>
            Real student attempt metrics, score distributions, and question-level performance.
          </p>
        </div>

        {quizzes.length > 0 && (
          <div className={styles.selectorWrap}>
            <label>Select Quiz:</label>
            <select
              value={selectedQuizId}
              onChange={e => handleSelectQuiz(e.target.value)}
              className={styles.quizSelect}
            >
              {quizzes.map(q => (
                <option key={q._id} value={q._id}>
                  {q.title} ({q.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingQuizzes ? (
        <div className={styles.loadingWrapper}>
          <RefreshCw size={24} className={styles.spin} />
          <p>Loading assessment registry...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <BookOpen size={48} color="#D5C8B8" />
          <h3>No Quizzes to Analyze</h3>
          <p>Create and publish technical quizzes to track student performance metrics.</p>
        </div>
      ) : loadingAnalytics ? (
        <div className={styles.loadingWrapper}>
          <RefreshCw size={24} className={styles.spin} />
          <p>Calculating cohort telemetry & score distributions...</p>
        </div>
      ) : error ? (
        <div className={styles.errorWrapper}>
          <AlertTriangle size={24} color="#DC2626" />
          <p>{error}</p>
        </div>
      ) : analytics ? (
        <div className={styles.analyticsContent}>
          {/* Top KPI Cards */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricIconWrap} style={{ background: '#FEF3EB', color: '#D96B43' }}>
                <Users size={22} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricVal}>{analytics.metrics?.totalAttempts || 0}</span>
                <span className={styles.metricLabel}>Total Student Attempts</span>
                <span className={styles.metricSub}>{analytics.metrics?.uniqueParticipants || 0} unique candidates</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIconWrap} style={{ background: '#ECFDF5', color: '#059669' }}>
                <CheckCircle2 size={22} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricVal}>{analytics.metrics?.passRate || 0}%</span>
                <span className={styles.metricLabel}>Pass Rate</span>
                <span className={styles.metricSub}>Passing threshold: {analytics.quiz?.passingScore || 70}%</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIconWrap} style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <Award size={22} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricVal}>{analytics.metrics?.averageScore || 0}%</span>
                <span className={styles.metricLabel}>Average Score</span>
                <span className={styles.metricSub}>Across all evaluated submissions</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIconWrap} style={{ background: '#FAF5FF', color: '#7C3AED' }}>
                <Clock size={22} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricVal}>
                  {analytics.metrics?.avgTimeMinutes ? `${analytics.metrics.avgTimeMinutes}m` : '< 10m'}
                </span>
                <span className={styles.metricLabel}>Average Completion Time</span>
                <span className={styles.metricSub}>Time limit: {analytics.quiz?.durationMinutes || 15}m</span>
              </div>
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <TrendingUp size={18} color="#D96B43" />
              <h3>Score Distribution Histogram</h3>
            </div>

            <div className={styles.distributionChart}>
              {[
                { range: '0-39%', count: analytics.scoreBuckets?.low || 0, color: '#DC2626' },
                { range: '40-59%', count: analytics.scoreBuckets?.midLow || 0, color: '#F59E0B' },
                { range: '60-79%', count: analytics.scoreBuckets?.midHigh || 0, color: '#3B82F6' },
                { range: '80-100%', count: analytics.scoreBuckets?.high || 0, color: '#10B981' }
              ].map(bucket => {
                const total = analytics.metrics?.totalAttempts || 1
                const pct = Math.round((bucket.count / (total || 1)) * 100)
                return (
                  <div key={bucket.range} className={styles.barColumn}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          height: `${Math.max(8, pct)}%`,
                          background: bucket.color
                        }}
                      />
                    </div>
                    <span className={styles.barCount}>{bucket.count}</span>
                    <span className={styles.barLabel}>{bucket.range}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Question-Level Accuracy Telemetry */}
          {Array.isArray(analytics.questionPerformance) && analytics.questionPerformance.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <BarChart3 size={18} color="#D96B43" />
                <h3>Question-Level Accuracy & Hardest Topics</h3>
              </div>

              <div className={styles.questionPerfList}>
                {analytics.questionPerformance.map((item, idx) => (
                  <div key={idx} className={styles.perfItem}>
                    <div className={styles.perfItemLeft}>
                      <span className={styles.qNum}>#{idx + 1}</span>
                      <div className={styles.qDetails}>
                        <span className={styles.qText}>{item.questionText}</span>
                        <div className={styles.qSub}>
                          <span>Type: {item.type}</span>
                          <span>•</span>
                          <span>Difficulty: {item.difficulty}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.perfItemRight}>
                      <div className={styles.progressWrap}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${item.accuracyPercentage || 0}%`,
                            background: (item.accuracyPercentage || 0) >= 70 ? '#10B981' : (item.accuracyPercentage || 0) >= 40 ? '#F59E0B' : '#DC2626'
                          }}
                        />
                      </div>
                      <span className={styles.accuracyVal}>{item.accuracyPercentage || 0}% correct</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Attempts Table */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Users size={18} color="#D96B43" />
              <h3>Recent Student Submissions</h3>
            </div>

            {Array.isArray(analytics.recentAttempts) && analytics.recentAttempts.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>Time Taken</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentAttempts.map((att, i) => (
                      <tr key={att._id || i}>
                        <td>{att.candidateName || 'Anonymous Candidate'}</td>
                        <td>
                          <strong>{att.scorePercentage}%</strong> ({att.score || 0} pts)
                        </td>
                        <td>
                          <span className={`${styles.tableBadge} ${att.passed ? styles.badgePassed : styles.badgeFailed}`}>
                            {att.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td>{att.timeTakenMinutes ? `${att.timeTakenMinutes} min` : '—'}</td>
                        <td>{att.createdAt ? new Date(att.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.noSubmissions}>No candidate submissions recorded yet for this quiz.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
