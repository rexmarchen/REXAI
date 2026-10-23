import React, { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buildLoginPath } from '../../utils/authSession'
import facultyApi from '../../services/facultyApi'
import { GraduationCap, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react'

const FacultyRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isReady } = useAuth()
  const [checking, setChecking] = useState(true)
  const [facultyProfile, setFacultyProfile] = useState(null)
  const [facultyStatus, setFacultyStatus] = useState(null)

  useEffect(() => {
    let isMounted = true
    if (!isAuthenticated) {
      setChecking(false)
      return
    }

    if (user?.role === 'admin') {
      setFacultyStatus('verified')
      setChecking(false)
      return
    }

    facultyApi.getProfile()
      .then(res => {
        if (!isMounted) return
        setFacultyStatus(res.status || 'unverified')
        setFacultyProfile(res.profile || null)
      })
      .catch(() => {
        if (!isMounted) return
        if (user?.role === 'faculty') {
          setFacultyStatus(user.facultyStatus || 'unverified')
        } else {
          setFacultyStatus('none')
        }
      })
      .finally(() => {
        if (isMounted) setChecking(false)
      })

    return () => { isMounted = false }
  }, [isAuthenticated, user?.role, user?.facultyStatus])

  if (!isReady || checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D1117',
        color: '#E6EDF3',
        fontFamily: "'Inter', system-ui, sans-serif",
        gap: 16
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'rgba(82, 139, 255, 0.15)',
          color: '#58A6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <GraduationCap size={26} />
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#8B949E' }}>
          Verifying Faculty Credentials...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={buildLoginPath(nextPath)} replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Admins always have access
  if (user?.role === 'admin') {
    return children
  }

  // Account suspended
  if (facultyStatus === 'suspended') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D1117',
        padding: 24,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          background: '#161B22',
          borderRadius: 20,
          border: '1px solid rgba(248, 81, 73, 0.3)',
          padding: 36,
          textAlign: 'center'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(248, 81, 73, 0.15)',
            color: '#F85149',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20
          }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F0F6FC', marginBottom: 10 }}>
            Faculty Access Suspended
          </h2>
          <p style={{ color: '#8B949E', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
            Your faculty account is currently suspended. Please contact REXION academic operations support to appeal or resolve this issue.
          </p>
          <button
            onClick={() => navigate('/quizzes')}
            style={{
              background: '#238636',
              color: '#FFF',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 999,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Back to Career Hub
          </button>
        </div>
      </div>
    )
  }

  // If a student or non-faculty account navigates to faculty portal
  if (user?.role !== 'faculty') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D1117',
        padding: 24,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{
          maxWidth: 520,
          width: '100%',
          background: '#161B22',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4)',
          padding: 36,
          textAlign: 'center'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(82, 139, 255, 0.15)',
            color: '#58A6FF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20
          }}>
            <GraduationCap size={30} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F0F6FC', marginBottom: 10 }}>
            Faculty & Educator Portal Access
          </h2>
          <p style={{ color: '#8B949E', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 24 }}>
            You are currently logged in with a Student account (<strong>{user?.email}</strong>). The Faculty Portal is designed for professors, college instructors, and verified educators to author quizzes and manage question banks.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register?type=faculty')}
              style={{
                background: '#238636',
                color: '#FFF',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              Register Faculty Account <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/quizzes')}
              style={{
                background: 'transparent',
                color: '#C9D1D9',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px 20px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Browse Quizzes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default FacultyRoute
