import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import authApi from '../services/authApi'
import {
  AUTH_CHANGE_EVENT,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  hasStoredAuth,
  persistAuthSession,
  persistStoredUser
} from '../utils/authSession'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}

export const AuthProvider = ({ children }) => {
  // Synchronous initialization prevents flash of unauthenticated UI
  const [user, setUser] = useState(() => getStoredUser())
  const [isReady, setIsReady] = useState(() => !hasStoredAuth() || Boolean(getStoredUser()))

  const syncFromStorage = () => {
    setUser(getStoredUser())
  }

  const applyAuthResponse = (response, remember = true) => {
    persistAuthSession(response, remember)
    setUser(response.user || null)
    setIsReady(true)
  }

  const logout = () => {
    clearStoredAuth()
    setUser(null)
    setIsReady(true)
  }

  const refreshSession = async () => {
    const token = getStoredToken()

    if (!token) {
      setUser(null)
      setIsReady(true)
      return null
    }

    try {
      const response = await authApi.me()
      const fetchedUser = response?.user || response?.data || null
      if (fetchedUser) {
        persistStoredUser(fetchedUser)
        setUser(fetchedUser)
      }
      return fetchedUser
    } catch (err) {
      // Invalidate stored session only if explicitly rejected by server (401/403)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        clearStoredAuth()
        setUser(null)
      }
      return null
    } finally {
      setIsReady(true)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  useEffect(() => {
    const handleAuthChange = () => syncFromStorage()

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
    window.addEventListener('storage', handleAuthChange)

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated: Boolean(user && getStoredToken()),
      applyAuthResponse,
      logout,
      refreshSession
    }),
    [isReady, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
