import { useState } from 'react'
import { generateSite } from '../services/rexcodeApi'
import { useApp } from '../context/AppContext'

export const useRexcode = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { dispatch } = useApp()

  const generate = async (prompt) => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateSite(prompt)
      dispatch({ type: 'SET_REXCODE_RESULT', payload: result })
      return result
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Prompt request failed.'
      setError(message)
      dispatch({ type: 'SET_ERROR', payload: message })
    } finally {
      setLoading(false)
    }
  }

  return { generate, loading, error }
}
