import React, { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buildLoginPath } from '../../utils/authSession'
import developerApi from '../../services/developerApi'
import { ShieldAlert, Clock, AlertTriangle, ArrowRight, Sparkles, Terminal } from 'lucide-react'

const DeveloperRoute = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isReady } = useAuth()
  const [checkingDev, setCheckingDev] = useState(true)
  const [devStatus, setDevStatus] = useState(null)
  const [devProfile, setDevProfile] = useState(null)

  useEffect(() => {
    let isMounted = true
    if (!isAuthenticated) {
      setCheckingDev(false)
      return
    }

    developerApi.getProfile()
      .then(res => {
        if (!isMounted) return
        setDevStatus(res.developerStatus || (res.profile ? res.profile.status : 'none'))
        setDevProfile(res.profile || null)
      })
      .catch(() => {
        if (!isMounted) return
        // Fallback to user role if API fails
        if (user?.role === 'admin' || user?.role === 'developer') {
          setDevStatus('active')
        } else {
          setDevStatus('none')
        }
      })
      .finally(() => {
        if (isMounted) setCheckingDev(false)
      })

    return () => { isMounted = false }
  }, [isAuthenticated, user?.role])

  if (!isReady || checkingDev) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F4EE',
        color: '#231C16',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        gap: 16
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: '#FEF3EB',
          color: '#D96B43',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 1.5s infinite'
        }}>
          <Terminal size={24} />
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#5C4D40' }}>
          Verifying Developer Authorization...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={buildLoginPath(nextPath)} replace />
  }

  // Admins always have access
  if (user?.role === 'admin') {
    return children
  }

  // Pending Developer state
  if (devStatus === 'pending') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F4EE',
        padding: 24,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        <div style={{
          maxWidth: 520,
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #ECE4D8',
          boxShadow: '0 12px 32px rgba(35,28,22,0.06)',
          padding: 36,
          textAlign: 'center'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#FEF9E7',
            color: '#B48805',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20
          }}>
            <Clock size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#231C16', marginBottom: 10 }}>
            Developer Application Under Review
          </h2>
          <p style={{ color: '#5C4D40', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 24 }}>
            Thank you for applying to the REXION Developer Program, <strong>{user?.name || 'Developer'}</strong>! Your account application is currently pending admin moderation.
          </p>
          <div style={{
            background: '#F8F4EE',
            borderRadius: 12,
            padding: '14px 18px',
            textAlign: 'left',
            marginBottom: 24,
            fontSize: '0.85rem',
            color: '#5C4D40',
            border: '1px solid #ECE4D8'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Application Status:</span>
              <span style={{ fontWeight: 700, color: '#B48805', background: '#FEF9E7', padding: '2px 8px', borderRadius: 999 }}>
                Pending Review ⏳
              </span>
            </div>
            {devProfile?.title && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Applied Role:</span>
                <span style={{ fontWeight: 600 }}>{devProfile.title}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/career')}
              style={{
                background: '#D96B43',
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
              Return to Career Hub <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Suspended or revoked
  if (devStatus === 'suspended' || devStatus === 'revoked') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F4EE',
        padding: 24,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #ECE4D8',
          padding: 36,
          textAlign: 'center'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#FCEFEB',
            color: '#E05A47',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20
          }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#231C16', marginBottom: 10 }}>
            Developer Access {devStatus === 'suspended' ? 'Suspended' : 'Revoked'}
          </h2>
          <p style={{ color: '#5C4D40', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
            Your developer privileges have been {devStatus}. If you believe this is in error, please contact the REXION administrative team.
          </p>
          <button
            onClick={() => navigate('/career')}
            style={{
              background: '#231C16',
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

  // Non-developer user redirect to application
  if (user?.role !== 'developer' || devStatus !== 'active') {
    return <Navigate to="/developer/apply" replace />
  }

  return children
}

export default DeveloperRoute
