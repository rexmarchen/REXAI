import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ParticleEarth from '../../components/common/ParticleEarth'
import WorkspaceSection from '../Workspace'
import { useResumeUpload } from '../../hooks/useResumeUpload'
import { useRexcode } from '../../hooks/useRexcode'
import styles from './Home.module.css'

const Home = () => {
  const [prompt, setPrompt] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [resumeResult, setResumeResult] = useState(null)
  const [rexcodeResult, setRexcodeResult] = useState(null)

  const {
    upload,
    loading: resumeLoading,
    error: resumeError
  } = useResumeUpload()

  const {
    generate,
    loading: rexcodeLoading,
    error: rexcodeError
  } = useRexcode()

  const handleAsk = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    const result = await generate(trimmed)
    if (result) setRexcodeResult(result)
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setSelectedFileName(file.name)
    const result = await upload(file)
    if (result) setResumeResult(result)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    handleFileUpload(event.dataTransfer.files?.[0])
  }

  const predictionText =
    resumeResult?.prediction ||
    resumeResult?.result?.prediction ||
    ''
  const confidence =
    resumeResult?.confidence ??
    resumeResult?.result?.confidence
  const generatedCode =
    rexcodeResult?.code ||
    rexcodeResult?.result?.code ||
    ''
  const generatedUrl =
    rexcodeResult?.siteUrl ||
    rexcodeResult?.result?.siteUrl ||
    ''

  return (
    <>
      <ParticleEarth />
      <div className="grid-bg"></div>
      <div className="corner corner-tl"></div>
      <div className="corner corner-tr"></div>
      <div className="corner corner-bl"></div>
      <div className="corner corner-br"></div>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>NEXT GENERATION ARTIFICIAL INTELLIGENCE</div>
        <h1 className={styles.heroTitle}>REXION</h1>
        <p className={styles.heroSub}>INTELLIGENCE BEYOND IMAGINATION</p>

        <div className={styles.authActions}>
          <Link to="/login" className={styles.loginCta}>Login</Link>
          <Link to="/register" className={styles.registerCta}>Register</Link>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchBar}
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAsk()
              }}
              placeholder="Ask REXION anything..."
            />
            <span className={styles.searchIcon}>Q</span>
          </div>
          <button
            className={styles.searchBtn}
            onClick={handleAsk}
            disabled={rexcodeLoading}
          >
            {rexcodeLoading ? 'ASKING...' : 'ASK'}
          </button>
          <div className={styles.robotWrap}>
            <div className={styles.robotOrb}></div>
            <div className={styles.robotLabel}>AI CORE</div>
          </div>
        </div>

        {rexcodeError && <p className={styles.errorText}>{rexcodeError}</p>}

        <div className={styles.uploadSection}>
          <label className={styles.uploadLabel}>RESUME PREDICTOR</label>
          <div
            className={`${styles.uploadDropzone} ${dragActive ? styles.dragOver : ''}`}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setDragActive(false)
            }}
            onDrop={handleDrop}
          >
            <span className={styles.uploadIcon}>UPLOAD</span>
            <div className={styles.uploadTitle}>Drop your resume for AI analysis</div>
            <div className={styles.uploadHint}>PDF, DOC, DOCX</div>
            <label htmlFor="resume-file" className={styles.uploadBtn}>
              {resumeLoading ? 'ANALYZING...' : 'SELECT FILE'}
            </label>
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) => handleFileUpload(event.target.files?.[0])}
              className={styles.fileInput}
            />
            {selectedFileName && (
              <div className={styles.fileInfo}>
                {selectedFileName} ready for REXION analysis
              </div>
            )}
          </div>
          {resumeError && <p className={styles.errorText}>{resumeError}</p>}
        </div>

        {(resumeResult || rexcodeResult) && (
          <div className={styles.resultsGrid}>
            <div className={styles.resultCard}>
              <h3>Resume Result</h3>
              {!resumeResult && <p>No resume analyzed yet.</p>}
              {resumeResult && (
                <>
                  {predictionText && <p>{predictionText}</p>}
                  {confidence !== undefined && confidence !== null && (
                    <p>Confidence: {confidence}%</p>
                  )}
                </>
              )}
            </div>
            <div className={styles.resultCard}>
              <h3>AI Output</h3>
              {!rexcodeResult && <p>No prompt generated yet.</p>}
              {generatedUrl && (
                <p>
                  Site URL:{' '}
                  <a href={generatedUrl} target="_blank" rel="noreferrer">
                    {generatedUrl}
                  </a>
                </p>
              )}
              {generatedCode && (
                <pre className={styles.codeBlock}>{generatedCode}</pre>
              )}
            </div>
          </div>
        )}

        <div className={styles.quickLinks}>
          <Link to="/resume-predictor">Open Resume Predictor Page</Link>
          <a href="#workspace">Open Workspace</a>
        </div>
      </section>

      <section id="workspace" className={styles.workspaceSection}>
        <WorkspaceSection />
      </section>
    </>
  )
}

export default Home
