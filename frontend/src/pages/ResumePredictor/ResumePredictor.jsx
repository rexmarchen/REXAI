import React, { useState } from 'react'
import UploadForm from '../../components/resume/UploadForm'
import PredictionResult from '../../components/resume/PredictionResult'
import LoadingIndicator from '../../components/resume/LoadingIndicator'
import { useResumeUpload } from '../../hooks/useResumeUpload'
import styles from './ResumePredictor.module.css'

const ResumePredictor = () => {
  const { upload, loading, error } = useResumeUpload()
  const [result, setResult] = useState(null)

  const handleUpload = async (file) => {
    const data = await upload(file)
    setResult(data)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Future Resume Predictor</h1>
      <UploadForm onUpload={handleUpload} />
      {loading && <LoadingIndicator />}
      {error && <div className={styles.error}>{error}</div>}
      {result && <PredictionResult result={result} />}
    </div>
  )
}

export default ResumePredictor