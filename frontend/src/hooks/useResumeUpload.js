import { useState } from 'react'
import { uploadResume } from '../services/resumeApi'
import { useApp } from '../context/AppContext'

export const useResumeUpload = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { dispatch } = useApp()

  const upload = async (file) => {
    setLoading(true)
    setError(null)
    try {
      const result = await uploadResume(file)
      dispatch({ type: 'SET_RESUME_RESULT', payload: result })
      return result
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Resume upload failed.'
      setError(message)
      dispatch({ type: 'SET_ERROR', payload: message })
    } finally {
      setLoading(false)
    }
  }

  return { upload, loading, error }
}
