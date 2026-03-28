import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buildLoginPath } from '../../utils/authSession'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem'
        }}
      >
        Validating your session...
      </div>
    )
  }

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={buildLoginPath(nextPath)} replace />
  }

  return children
}

export default ProtectedRoute
