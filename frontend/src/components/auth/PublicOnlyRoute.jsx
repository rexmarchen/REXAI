import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { resolveAuthRedirectPath } from '../../utils/authSession'

const PublicOnlyRoute = ({ children }) => {
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
        Loading authentication...
      </div>
    )
  }

  if (isAuthenticated) {
    const nextPath = new URLSearchParams(location.search).get('next')
    return <Navigate to={resolveAuthRedirectPath(nextPath)} replace />
  }

  return children
}

export default PublicOnlyRoute
