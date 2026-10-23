import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Archive,
  Users,
  Award,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Edit3,
  BarChart2,
  GraduationCap
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

const StatCard = ({ title, value, subtext, icon: Icon, color, bg }) => (
  <div style={{
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #ECE4D8',
    padding: '20px 22px',
    boxShadow: '0 4px 16px rgba(35,28,22,0.03)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </span>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: bg,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={19} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#231C16', lineHeight: 1 }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '0.78rem', color: '#8C7B6D', marginTop: 6, fontWeight: 500 }}>
          {subtext}
        </div>
      )}
    </div>
  </div>
)

const FacultyDashboardPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    facultyApi.getDashboard()
      .then(res => {
        setData(res)
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Failed to load faculty dashboard.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#8C7B6D' }}>
        <GraduationCap size={32} style={{ animation: 'bounce 1s infinite', color: '#2563EB', marginBottom: 12 }} />
        <div style={{ fontWeight: 600 }}>Loading Faculty Dashboard metrics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: '#FCEFEB', border: '1px solid #F5C6CB', borderRadius: 12, padding: 20, color: '#721C24' }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  const { stats, faculty, recentQuizzes = [], recentActivity = [] } = data || {}
  const isVerified = faculty?.isVerified
  const completion = faculty?.profileCompletion || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── VERIFICATION & ONBOARDING CALLOUT ── */}
      {!isVerified && (
        <div style={{
          background: faculty?.status === 'pending' ? '#FEF9E7' : '#FDF6EC',
          border: `1px solid ${faculty?.status === 'pending' ? '#F4DF94' : '#F3D4BA'}`,
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: faculty?.status === 'pending' ? '#FFFBEB' : '#FEF3EB',
              color: faculty?.status === 'pending' ? '#B48805' : '#D96B43',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {faculty?.status === 'pending' ? <Clock size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#231C16', fontSize: '0.98rem' }}>
                {faculty?.status === 'pending'
                  ? 'Verification Application Under Administrative Review'
                  : 'Institutional Verification Required to Publish Quizzes'}
              </div>
              <div style={{ color: '#5C4D40', fontSize: '0.84rem', marginTop: 4 }}>
                {faculty?.status === 'pending'
                  ? 'Your institutional credentials and academic appointment are being validated by REXION moderators.'
                  : 'You can draft quizzes and build question banks, but quizzes can only be published to students once your faculty profile is verified.'}
              </div>
            </div>
          </div>
          <Link
            to="/faculty/verification"
            style={{
              background: '#231C16',
              color: '#FFF',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {faculty?.status === 'pending' ? 'View Status' : 'Submit Verification'} <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── PROFILE COMPLETION BAR ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #ECE4D8',
        borderRadius: 16,
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#231C16' }}>
              Academic Profile Completion
            </span>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#2563EB' }}>
              {completion}%
            </span>
          </div>
          <div style={{ background: '#ECE4D8', height: 8, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${completion}%`,
              height: '100%',
              background: completion >= 80 ? '#10B981' : (completion >= 50 ? '#2563EB' : '#F59E0B'),
              borderRadius: 999,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
        <Link
          to="/faculty/profile"
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#2563EB',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {completion < 100 ? 'Complete Profile Information' : 'Edit Profile'} <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── 6 SUMMARY STATS CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16
      }}>
        <StatCard
          title="Total Quizzes"
          value={stats?.totalQuizzes || 0}
          subtext="Created across all subjects"
          icon={BookOpenCheck}
          color="#2563EB"
          bg="#EEF4FD"
        />
        <StatCard
          title="Published Quizzes"
          value={stats?.publishedQuizzes || 0}
          subtext="Live in Career Hub"
          icon={CheckCircle2}
          color="#10B981"
          bg="#ECFDF5"
        />
        <StatCard
          title="Draft Quizzes"
          value={stats?.draftQuizzes || 0}
          subtext="Under authoring"
          icon={Clock}
          color="#F59E0B"
          bg="#FEF9E7"
        />
        <StatCard
          title="Total Attempts"
          value={stats?.totalAttempts || 0}
          subtext="Student evaluations taken"
          icon={Users}
          color="#7C3AED"
          bg="#F5F3FF"
        />
        <StatCard
          title="Average Score"
          value={`${stats?.averageScore || 0}%`}
          subtext={`Pass rate: ${stats?.passRate || 0}%`}
          icon={Award}
          color="#059669"
          bg="#ECFDF5"
        />
        <StatCard
          title="Question Bank"
          value={stats?.questionBankCount || 0}
          subtext="Reusable questions saved"
          icon={HelpCircle}
          color="#D96B43"
          bg="#FEF3EB"
        />
      </div>

      {/* ── RECENT QUIZZES & RECENT STUDENT ATTEMPTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Recent Quizzes Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #ECE4D8',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
              Recent Quizzes
            </h2>
            <Link to="/faculty/quizzes" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
              View All ({stats?.totalQuizzes || 0})
            </Link>
          </div>

          {recentQuizzes.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: '#8C7B6D' }}>
              <BookOpenCheck size={32} style={{ color: '#C8BCB0', marginBottom: 10 }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No quizzes created yet</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Start by creating your first educational quiz.</div>
              <Link
                to="/faculty/quizzes/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#2563EB',
                  color: '#FFF',
                  padding: '8px 18px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  marginTop: 14
                }}
              >
                <PlusCircle size={14} /> Create First Quiz
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentQuizzes.map(q => {
                const isPub = q.status === 'published'
                const isArch = q.status === 'archived'
                return (
                  <div key={q._id || q.slug} style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #ECE4D8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#231C16' }}>{q.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#8C7B6D', marginTop: 2 }}>
                        {q.category} • {q.difficulty}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: isPub ? '#ECFDF5' : (isArch ? '#F3F4F6' : '#FEF9E7'),
                        color: isPub ? '#065F46' : (isArch ? '#4B5563' : '#92400E')
                      }}>
                        {q.status}
                      </span>
                      <Link to={`/faculty/quizzes/${q._id}/edit`} style={{ color: '#5C4D40', padding: 4 }} title="Edit">
                        <Edit3 size={15} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Student Attempts Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #ECE4D8',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
              Recent Student Activity
            </h2>
            <Link to="/faculty/analytics" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
              Full Analytics
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: '#8C7B6D' }}>
              <BarChart2 size={32} style={{ color: '#C8BCB0', marginBottom: 10 }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No student attempts recorded yet</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Attempts will appear here once published quizzes are taken.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentActivity.map(a => (
                <div key={a.id} style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #ECE4D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#231C16' }}>{a.quizSlug}</div>
                    <div style={{ fontSize: '0.74rem', color: '#8C7B6D', marginTop: 2 }}>
                      {new Date(a.completedAt).toLocaleString()} • {Math.round(a.timeTaken)}s
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: a.passed ? '#ECFDF5' : '#FCEFEB',
                    color: a.passed ? '#065F46' : '#991B1B'
                  }}>
                    {a.scorePercentage}% {a.passed ? '✓' : '✗'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FacultyDashboardPage
