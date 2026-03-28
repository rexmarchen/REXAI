import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import authApi from '../services/authApi'
import {
  AUTH_CHANGE_EVENT,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
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
  const [user, setUser] = useState(() => getStoredUser())
  const [isReady, setIsReady] = useState(false)

  const syncFromStorage = () => {
    setUser(getStoredUser())
  }

  const applyAuthResponse = (response, remember = true) => {
    persistAuthSession(response, remember)
    setUser(response.user || null)
  }

  const logout = () => {
    clearStoredAuth()
    setUser(null)
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
      persistStoredUser(response.user)
      setUser(response.user || null)
      return response.user || null
    } catch {
      clearStoredAuth()
      setUser(null)
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
