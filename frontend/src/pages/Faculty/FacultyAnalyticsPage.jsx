import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart2,
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  FileText
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

export default function FacultyAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuizId = searchParams.get('quizId') || ''

  const [quizzes, setQuizzes] = useState([])
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId)
  const [analytics, setAnalytics] = useState(null)
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuizzes()
  }, [])

  useEffect(() => {
    if (selectedQuizId) {
      fetchAnalytics(selectedQuizId)
    } else {
      setAnalytics(null)
    }
  }, [selectedQuizId])

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true)
      const res = await facultyApi.getQuizzes({ limit: 100 })
      const data = res?.data || res
      if (data?.success) {
        const list = data.quizzes || []
        setQuizzes(list)
        if (!selectedQuizId && list.length > 0) {
          // Default to the first quiz with attempts, or the first quiz
          const withAttempts = list.find(q => q.attemptsCount > 0)
          const target = withAttempts || list[0]
          setSelectedQuizId(target._id)
          setSearchParams({ quizId: target._id })
        }
      }
    } catch (err) {
      setError('Failed to load quizzes for analytics.')
    } finally {
      setLoadingQuizzes(false)
    }
  }

  const fetchAnalytics = async (quizId) => {
    try {
      setLoadingAnalytics(true)
      setError('')
      const res = await facultyApi.getQuizAnalytics(quizId)
      const data = res?.data || res
      if (data?.success) {
        setAnalytics(data)
      } else {
        setError(data?.message || 'Could not load quiz analytics.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleSelectQuiz = (e) => {
    const id = e.target.value
    setSelectedQuizId(id)
    setSearchParams(id ? { quizId: id } : {})
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Quiz Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
            Quiz Results & Analytics
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#8C7B6D', marginTop: 4, margin: 0 }}>
            Inspect student attempt cohorts, pass rates, score distributions, and time spent on your quizzes.
          </p>
        </div>

        {/* Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#231C16' }}>
            Select Quiz:
          </label>
          <select
            value={selectedQuizId}
            onChange={handleSelectQuiz}
            disabled={loadingQuizzes || quizzes.length === 0}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #D5C7B7',
              fontSize: '0.88rem',
              color: '#231C16',
              background: '#FFFFFF',
              fontWeight: 600,
              minWidth: 260,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {quizzes.length === 0 && <option value="">No quizzes found</option>}
            {quizzes.map((q) => (
              <option key={q._id} value={q._id}>
                {q.title} ({q.attemptsCount || 0} attempts)
              </option>
            ))}
          </select>
        </div>
      </div>

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

      {loadingQuizzes || loadingAnalytics ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <div style={{ color: '#8C7B6D', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshCw size={20} className="spin" /> Calculating student cohort statistics...
          </div>
        </div>
      ) : !analytics ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #ECE4D8',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <BarChart2 size={42} color="#D5C7B7" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#231C16' }}>No Quiz Selected</h2>
          <p style={{ fontSize: '0.88rem', color: '#8C7B6D', maxWidth: 420, margin: '6px auto 18px' }}>
            Select an educational quiz from your catalog above to review detailed analytics, or create a new quiz.
          </p>
          <Link
            to="/faculty/quizzes/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: '#D97706',
              color: '#FFFFFF',
              borderRadius: 10,
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Create Educational Quiz
          </Link>
        </div>
      ) : (
        <>
          {/* Quiz Metadata Bar */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '16px 22px',
            border: '1px solid #ECE4D8',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: analytics.quiz?.status === 'published' ? '#DCFCE7' : '#FEF3C7',
                  color: analytics.quiz?.status === 'published' ? '#15803D' : '#B45309'
                }}>
                  {analytics.quiz?.status}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#8C7B6D', fontWeight: 600 }}>
                  Snapshot Version {analytics.quiz?.version || 1}
                </span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#231C16', margin: '4px 0 0' }}>
                {analytics.quiz?.title}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                to={`/faculty/quizzes/${selectedQuizId}/edit`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #D5C7B7',
                  background: '#FFFFFF',
                  color: '#231C16',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Edit Quiz
              </Link>
              <Link
                to={`/faculty/quizzes/${selectedQuizId}/preview`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #D5C7B7',
                  background: '#FFFFFF',
                  color: '#231C16',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Candidate Preview
              </Link>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '18px 20px',
              border: '1px solid #ECE4D8',
              boxShadow: '0 2px 10px rgba(35,28,22,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>
                  Total Attempts
                </span>
                <Users size={18} color="#D97706" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#231C16', marginTop: 10 }}>
                {analytics.stats?.totalAttempts || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8C7B6D', marginTop: 4 }}>
                Evaluated student submissions
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '18px 20px',
              border: '1px solid #ECE4D8',
              boxShadow: '0 2px 10px rgba(35,28,22,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>
                  Pass Rate
                </span>
                <Award size={18} color="#16A34A" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#231C16', marginTop: 10 }}>
                {analytics.stats?.passRate || 0}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8C7B6D', marginTop: 4 }}>
                Passing score requirement: {analytics.quiz?.passingScore || 60}%
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '18px 20px',
              border: '1px solid #ECE4D8',
              boxShadow: '0 2px 10px rgba(35,28,22,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>
                  Average Score
                </span>
                <TrendingUp size={18} color="#2563EB" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#231C16', marginTop: 10 }}>
                {analytics.stats?.averageScore || 0}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8C7B6D', marginTop: 4 }}>
                Across all completed evaluations
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '18px 20px',
              border: '1px solid #ECE4D8',
              boxShadow: '0 2px 10px rgba(35,28,22,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>
                  Avg. Completion Time
                </span>
                <Clock size={18} color="#7C3AED" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#231C16', marginTop: 10 }}>
                {analytics.stats?.averageTimeMinutes || 0}m
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8C7B6D', marginTop: 4 }}>
                Average elapsed time per attempt
              </div>
            </div>
          </div>

          {/* Score Distribution Buckets */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #ECE4D8',
            padding: '24px 28px',
            boxShadow: '0 4px 16px rgba(35,28,22,0.02)'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#231C16', margin: '0 0 16px' }}>
              Score Cohort Distribution
            </h2>
            {analytics.stats?.totalAttempts === 0 ? (
              <div style={{ fontSize: '0.88rem', color: '#8C7B6D', fontStyle: 'italic', padding: '16px 0' }}>
                No student attempts have been submitted for this quiz yet. Publish your quiz to Career Hub to begin collecting cohort insights.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(analytics.stats?.scoreBuckets || {}).map(([range, count]) => {
                  const total = analytics.stats?.totalAttempts || 1
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={range}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                        <span>Score {range}%</span>
                        <span style={{ color: '#8C7B6D' }}>{count} students ({pct}%)</span>
                      </div>
                      <div style={{ height: 10, background: '#F0EAE1', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: range === '81-100' ? '#16A34A' : range === '61-80' ? '#2563EB' : range === '41-60' ? '#D97706' : '#DC2626',
                          borderRadius: 6,
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Student Attempts Table */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #ECE4D8',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(35,28,22,0.02)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #ECE4D8' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
                Recent Student Attempts
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#8C7B6D', margin: '4px 0 0' }}>
                Authorized record of candidates who attempted this educational assessment.
              </p>
            </div>

            {(!analytics.attempts || analytics.attempts.length === 0) ? (
              <div style={{ padding: '36px 24px', textAlign: 'center', color: '#8C7B6D', fontSize: '0.88rem' }}>
                No recent attempt records found for this quiz.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#FAF8F5', borderBottom: '1px solid #ECE4D8', color: '#8C7B6D', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 20px' }}>Student / Candidate</th>
                      <th style={{ padding: '12px 20px' }}>Score</th>
                      <th style={{ padding: '12px 20px' }}>Result</th>
                      <th style={{ padding: '12px 20px' }}>Time Taken</th>
                      <th style={{ padding: '12px 20px' }}>Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.attempts.map((attempt) => (
                      <tr key={attempt._id} style={{ borderBottom: '1px solid #F3EDE4' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#231C16' }}>
                          {attempt.userName || attempt.userEmail || 'Anonymous Candidate'}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: '#231C16' }}>
                          {attempt.scorePercentage || 0}%
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: attempt.passed ? '#DCFCE7' : '#FEE2E2',
                            color: attempt.passed ? '#15803D' : '#B91C1C'
                          }}>
                            {attempt.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#4B3F35' }}>
                          {attempt.timeTaken ? `${Math.round(attempt.timeTaken / 60 * 10) / 10} min` : 'N/A'}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#8C7B6D' }}>
                          {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
