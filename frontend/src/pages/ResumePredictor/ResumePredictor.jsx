import React, { useEffect, useMemo, useRef, useState } from 'react'
import JobMatchingEngine from '../../components/resume/JobMatchingEngine'
import { matchResumesWithJob, uploadResumesToAts } from '../../services/atsApi'
import { predictResumePipeline } from '../../services/resumeApi'
import { predictCareerPath } from '../../services/mlServiceApi'
import styles from './ResumePredictor.module.css'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx']

const STEPS = [
  { id: 1, label: 'Upload Resume' },
  { id: 2, label: 'Prediction Results' },
  { id: 3, label: 'Job Matching' }
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function sanitizeList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

function truncateText(value, maxLength = 220) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength).trim()}...`
}

function sanitizeJobs(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((job, index) => ({
      id: String(job?.id || job?.apply_link || `${index}`),
      title: String(job?.title || 'Untitled role').trim(),
      company: String(job?.company || 'Unknown company').trim(),
      location: String(job?.location || 'Location not specified').trim(),
      description: truncateText(job?.description || '', 240),
      apply_link: String(job?.apply_link || '').trim(),
      posted_date: String(job?.posted_date || '').trim(),
      is_remote: Boolean(job?.is_remote),
      employment_type: String(job?.employment_type || '').trim()
    }))
    .filter((job) => job.title)
}

function normalizePrediction(data) {
  if (!data || typeof data !== 'object') {
    return null
  }

  // Handle ML Service response format (career_path, confidence, ats_score, jobs)
  if (data.career_path) {
    const rawConfidence = Number(data.confidence)
    const confidence =
      Number.isFinite(rawConfidence) && rawConfidence > 1
        ? clamp(rawConfidence / 100, 0, 1)
        : clamp(rawConfidence || 0, 0, 1)
    const experienceYears = Number(data.required_experience || 0)

    return {
      name: 'Resume Candidate',
      skills: sanitizeList(data.extracted_skills || data.required_skills || []),
      education: String(data.required_education || '').trim(),
      certifications: sanitizeList(data.certifications || []),
      projects: sanitizeList(data.projects || []),
      experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0,
      predicted_role: String(data.career_path || '').trim(),
      confidence,
      ats_score: Number(data.ats_score || 0),
      predicted_category: String(data.predicted_category || '').trim(),
      job_description_used: String(data.job_description_used || '').trim(),
      missing_skills: sanitizeList(data.missing_skills || []),
      jobs: sanitizeJobs(data.jobs)
    }
  }

  // Handle legacy backend response format
  const rawConfidence = Number(data.confidence)
  const confidence =
    Number.isFinite(rawConfidence) && rawConfidence > 1
      ? clamp(rawConfidence / 100, 0, 1)
      : clamp(rawConfidence || 0, 0, 1)

  const experienceYears = Number(data.experience_years)

  return {
    name: String(data.name || '').trim(),
    skills: sanitizeList(data.skills),
    education: String(data.education || '').trim(),
    certifications: sanitizeList(data.certifications),
    projects: sanitizeList(data.projects),
    experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0,
    predicted_role: String(data.predicted_role || '').trim(),
    confidence,
    ats_score: Number(data.ats_score || 0),
    predicted_category: String(data.predicted_category || '').trim(),
    job_description_used: String(data.job_description_used || '').trim(),
    missing_skills: sanitizeList(data.missing_skills),
    jobs: sanitizeJobs(data.jobs)
  }
}

function formatBytes(size) {
  const numericSize = Number(size)
  if (!Number.isFinite(numericSize) || numericSize < 0) {
    return '0 B'
  }

  if (numericSize < 1024) {
    return `${numericSize} B`
  }

  const kb = numericSize / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function buildAutoJobDescription(prediction, skills) {
  const role = String(prediction?.predicted_role || '').trim() || 'Software Engineer'
  const years = Number(prediction?.experience_years || 0)
  const normalizedSkills = sanitizeList(skills).slice(0, 12)
  const skillsText = normalizedSkills.length
    ? normalizedSkills.join(', ')
    : 'software development, problem solving, API development'

  return [
    `Hiring for ${role}.`,
    `Required skills: ${skillsText}.`,
    years > 0 ? `Preferred experience: around ${years} years.` : 'Experience: 0-5 years.',
    'Must be able to build production-ready solutions and collaborate with cross-functional teams.'
  ].join(' ')
}

const ResumePredictor = ({ embedded = false }) => {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [editedSkills, setEditedSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [showMatching, setShowMatching] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [analysisStarted, setAnalysisStarted] = useState(false)
  const [jobDescriptionInput, setJobDescriptionInput] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(true)
  const [atsJobDescription, setAtsJobDescription] = useState('')
  const [atsExtraFiles, setAtsExtraFiles] = useState([])
  const [atsLoading, setAtsLoading] = useState(false)
  const [atsError, setAtsError] = useState('')
  const [atsResults, setAtsResults] = useState([])

  useEffect(() => {
    if (!prediction) {
      setEditedSkills([])
      return
    }

    setEditedSkills(sanitizeList(prediction.skills))
  }, [prediction])

  useEffect(() => {
    if (showMatching) {
      setStep(3)
      return
    }

    if (loading || prediction || (analysisStarted && error)) {
      setStep(2)
      return
    }

    setStep(1)
  }, [analysisStarted, loading, prediction, showMatching, error])

  const resumeForMatching = useMemo(() => {
    if (!prediction) {
      return null
    }

    return {
      name: prediction.name || 'Candidate',
      skills: editedSkills,
      education: prediction.education,
      certifications: prediction.certifications,
      projects: prediction.projects,
      experience_years: prediction.experience_years,
      role_target: prediction.predicted_role || 'Software Engineer'
    }
  }, [editedSkills, prediction])

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return 'Please choose a resume file.'
    }

    const lowerName = selectedFile.name.toLowerCase()
    const validExtension = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
    if (!validExtension) {
      return 'Only PDF, DOC, and DOCX files are supported.'
    }

    if (selectedFile.size > MAX_FILE_BYTES) {
      return 'File too large. Maximum supported size is 10MB.'
    }

    return ''
  }

  const onFileSelected = (selectedFile) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setFile(null)
      setAnalysisStarted(false)
      return
    }

    setError('')
    setAnalysisStarted(false)
    setFile(selectedFile)
  }

  const handleAnalyze = async () => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setAnalysisStarted(false)
      return
    }

    setAnalysisStarted(true)
    setError('')
    setLoading(true)
    setShowMatching(false)

    try {
      let response
      const predictionOptions = {
        jobDescription: jobDescriptionInput.trim(),
        location: jobLocation.trim(),
        remote: remoteOnly
      }

      // Try ML service first
      try {
        response = await predictCareerPath(file, predictionOptions)
        console.log('ML Service response:', response)
      } catch (mlError) {
        console.log('ML Service failed, trying backend...', mlError.message)
        // Fall back to backend
        response = await predictResumePipeline(file)
      }

      const normalized = normalizePrediction(response)

      if (!normalized) {
        throw new Error('Prediction API returned an invalid response.')
      }

      setPrediction(normalized)
      setLastResult(normalized)
      setAtsError('')
      setAtsResults([])
      setAtsExtraFiles([])
      if (!atsJobDescription && normalized.job_description_used) {
        setAtsJobDescription(normalized.job_description_used)
      }
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        requestError.message ||
        'Unable to analyze this resume right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const removeSkill = (skillToRemove) => {
    setEditedSkills((current) => current.filter((skill) => skill !== skillToRemove))
  }

  const addSkill = () => {
    const value = newSkill.trim()
    if (!value) {
      return
    }

    setEditedSkills((current) => {
      const alreadyPresent = current.some((item) => item.toLowerCase() === value.toLowerCase())
      if (alreadyPresent) {
        return current
      }
      return [...current, value]
    })
    setNewSkill('')
  }

  const handleReupload = () => {
    setFile(null)
    setPrediction(null)
    setShowMatching(false)
    setEditedSkills([])
    setNewSkill('')
    setError('')
    setAnalysisStarted(false)
    setJobDescriptionInput('')
    setJobLocation('')
    setRemoteOnly(true)
    setAtsJobDescription('')
    setAtsExtraFiles([])
    setAtsLoading(false)
    setAtsError('')
    setAtsResults([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const useLastResult = () => {
    if (!lastResult) {
      return
    }

    setPrediction(lastResult)
    setError('')
    setShowMatching(false)
    setAnalysisStarted(true)
  }

  const handleRunAtsMatch = async () => {
    const manualJd = atsJobDescription.trim()
    const jd = manualJd || buildAutoJobDescription(prediction, editedSkills)

    if (!file && atsExtraFiles.length === 0) {
      setAtsError('Upload at least one resume file before running ATS match.')
      return
    }

    const candidateFiles = [file, ...atsExtraFiles].filter(Boolean)
    const uniqueByNameSize = new Map()
    for (const candidate of candidateFiles) {
      const key = `${candidate.name}-${candidate.size}`
      if (!uniqueByNameSize.has(key)) {
        uniqueByNameSize.set(key, candidate)
      }
    }
    const uniqueFiles = Array.from(uniqueByNameSize.values())

    setAtsLoading(true)
    setAtsError('')
    try {
      const uploadPayload = await uploadResumesToAts(uniqueFiles)
      const resumeIds =
        uploadPayload?.resumes?.map((item) => item.resume_id).filter(Boolean) || []

      if (resumeIds.length === 0) {
        throw new Error('ATS upload succeeded but no resume IDs were returned.')
      }

      const matchPayload = await matchResumesWithJob({
        jobDescription: jd,
        resumeIds
      })

      const results = Array.isArray(matchPayload?.results) ? matchPayload.results : []
      setAtsResults(results)
      if (results.length === 0) {
        setAtsError('No ATS results returned for the uploaded resumes.')
      }
    } catch (atsRequestError) {
      const message =
        atsRequestError?.response?.data?.detail ||
        atsRequestError?.response?.data?.message ||
        atsRequestError.message ||
        'ATS engine request failed.'
      setAtsError(message)
    } finally {
      setAtsLoading(false)
    }
  }

  return (
    <div className={`${styles.container} ${embedded ? styles.embedded : ''}`}>
      <div className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>RESUME TO JOB PIPELINE</p>
          <h1 className={styles.title}>Analyze Resume and Find Matching Jobs</h1>
          <p className={styles.subtitle}>
            Upload your resume, review extracted profile data, then jump straight into role-based
            job opportunities.
          </p>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={handleReupload}>
              Re-upload
            </button>
            {lastResult && !prediction && (
              <button type="button" className={styles.secondaryButton} onClick={useLastResult}>
                Restore Last Result
              </button>
            )}
          </div>
        </header>

        <div className={styles.stepper}>
          {STEPS.map((item) => {
            const isComplete = step > item.id
            const isCurrent = step === item.id

            return (
              <div key={item.id} className={styles.stepItem}>
                <div
                  className={`${styles.stepIndex} ${isComplete ? styles.complete : ''} ${
                    isCurrent ? styles.current : ''
                  }`}
                >
                  {item.id}
                </div>
                <span className={styles.stepLabel}>{item.label}</span>
              </div>
            )
          })}
        </div>

        <section className={`${styles.panel} ${styles.fadeSlide}`}>
          <h2 className={styles.panelTitle}>Step 1 - Upload Resume</h2>

          <div
            className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
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
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              onFileSelected(event.dataTransfer.files?.[0])
            }}
          >
            <input
              ref={inputRef}
              id="resume-input"
              type="file"
              accept=".pdf,.doc,.docx"
              className={styles.fileInput}
              onChange={(event) => onFileSelected(event.target.files?.[0])}
            />
            <p className={styles.dropTitle}>Drag and drop your PDF or DOCX here</p>
            <p className={styles.dropHint}>or click below to browse files</p>
            <label htmlFor="resume-input" className={styles.primaryButton}>
              Choose Resume
            </label>
            {file && (
              <p className={styles.fileInfo}>
                {file.name} ({formatBytes(file.size)})
              </p>
            )}
          </div>

          <div className={styles.queryGrid}>
            <textarea
              value={jobDescriptionInput}
              onChange={(event) => setJobDescriptionInput(event.target.value)}
              placeholder="Optional: paste a target job description for ATS score. If empty, auto JD is used."
              className={styles.jobTextarea}
            />
            <div className={styles.skillInputRow}>
              <input
                value={jobLocation}
                onChange={(event) => setJobLocation(event.target.value)}
                placeholder="Optional job location (e.g. San Francisco, CA)"
                className={styles.textInput}
              />
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(event) => setRemoteOnly(event.target.checked)}
                  className={styles.checkboxInput}
                />
                Remote-first jobs
              </label>
            </div>
          </div>

          <button
            type="button"
            className={styles.analyzeButton}
            onClick={handleAnalyze}
            disabled={loading || !file}
          >
            {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
          </button>

          {error && !analysisStarted && <p className={styles.error}>{error}</p>}
        </section>

        {(loading || prediction || (analysisStarted && error)) && (
          <section className={`${styles.panel} ${styles.fadeSlide}`}>
            <h2 className={styles.panelTitle}>Step 2 - Prediction Results</h2>

            {loading && (
              <div className={styles.loadingState}>
                <span className={styles.spinner} />
                <p>Running AI extraction and prediction...</p>
              </div>
            )}

            {!loading && error && <p className={styles.error}>{error}</p>}

            {!loading && prediction && (
              <>
                <div className={styles.resultGrid}>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Name</p>
                    <p className={styles.resultValue}>{prediction.name || 'Not detected'}</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Education</p>
                    <p className={styles.resultValue}>{prediction.education || 'Not detected'}</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Experience</p>
                    <p className={styles.resultValue}>{prediction.experience_years} years</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Predicted Role</p>
                    <p className={styles.resultValue}>{prediction.predicted_role || 'Not detected'}</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>ATS Score</p>
                    <p className={styles.resultValue}>{Math.round(prediction.ats_score || 0)}%</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>ATS Category</p>
                    <p className={styles.resultValue}>{prediction.predicted_category || 'Not detected'}</p>
                  </div>
                </div>

                <div className={styles.confidenceWrap}>
                  <div className={styles.confidenceHeader}>
                    <span>Prediction Confidence</span>
                    <strong>{Math.round(prediction.confidence * 100)}%</strong>
                  </div>
                  <div className={styles.confidenceTrack}>
                    <div
                      className={styles.confidenceFill}
                      style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                    />
                  </div>
                </div>

                <div className={styles.skillsSection}>
                  <p className={styles.resultLabel}>Skills (editable)</p>
                  <div className={styles.chipList}>
                    {editedSkills.length === 0 && <span className={styles.emptyText}>No skills found yet.</span>}
                    {editedSkills.map((skill) => (
                      <span key={skill} className={styles.skillChip}>
                        {skill}
                        <button
                          type="button"
                          className={styles.removeChip}
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className={styles.skillInputRow}>
                    <input
                      value={newSkill}
                      onChange={(event) => setNewSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addSkill()
                        }
                      }}
                      placeholder="Add a skill"
                      className={styles.textInput}
                    />
                    <button type="button" className={styles.secondaryButton} onClick={addSkill}>
                      Add Skill
                    </button>
                  </div>
                </div>

                <div className={styles.listGrid}>
                  <div className={styles.listCard}>
                    <p className={styles.resultLabel}>Certifications</p>
                    {prediction.certifications.length === 0 ? (
                      <p className={styles.emptyText}>No certifications detected.</p>
                    ) : (
                      <ul className={styles.list}>
                        {prediction.certifications.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.listCard}>
                    <p className={styles.resultLabel}>Projects</p>
                    {prediction.projects.length === 0 ? (
                      <p className={styles.emptyText}>No projects detected.</p>
                    ) : (
                      <ul className={styles.list}>
                        {prediction.projects.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={styles.atsSection}>
                  <p className={styles.resultLabel}>ATS Match (Python Model)</p>
                  {prediction.job_description_used && (
                    <p className={styles.jobMeta}>
                      Active JD: {truncateText(prediction.job_description_used, 180)}
                    </p>
                  )}
                  <p className={styles.emptyText}>
                    Job description is optional. ATS will auto-generate it from resume role and skills.
                  </p>
                  {prediction.missing_skills?.length > 0 && (
                    <div className={styles.atsSkillWrap}>
                      <p className={styles.resultLabel}>Missing Skills vs Current JD</p>
                      <div className={styles.chipList}>
                        {prediction.missing_skills.map((skill) => (
                          <span key={`predict-missing-${skill}`} className={styles.missingSkillChip}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <textarea
                    value={atsJobDescription}
                    onChange={(event) => setAtsJobDescription(event.target.value)}
                    placeholder="Optional: paste your own job description. Leave empty for auto mode."
                    className={styles.jobTextarea}
                  />
                  <div className={styles.atsActions}>
                    <label htmlFor="ats-files" className={styles.secondaryButton}>
                      Add More Resumes
                    </label>
                    <input
                      id="ats-files"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      className={styles.fileInput}
                      onChange={(event) => setAtsExtraFiles(Array.from(event.target.files || []))}
                    />
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleRunAtsMatch}
                      disabled={atsLoading}
                    >
                      {atsLoading ? 'Running ATS...' : 'Run ATS Match'}
                    </button>
                  </div>
                  {atsExtraFiles.length > 0 && (
                    <p className={styles.fileInfo}>
                      {atsExtraFiles.length} extra resume(s) selected for ranking.
                    </p>
                  )}
                  {atsError && <p className={styles.error}>{atsError}</p>}

                  {atsResults.length > 0 && (
                    <div className={styles.atsResultList}>
                      {atsResults.map((result) => (
                        <article key={result.resume_id} className={styles.atsResultCard}>
                          <div className={styles.atsTopRow}>
                            <strong>{result.filename}</strong>
                            <span className={styles.atsRank}>Rank #{result.rank}</span>
                          </div>
                          <p className={styles.atsMeta}>
                            ATS Score: {result.ats_score}% | Category: {result.predicted_category}
                          </p>
                          <div className={styles.atsSkillWrap}>
                            <p className={styles.resultLabel}>Extracted Skills</p>
                            <div className={styles.chipList}>
                              {result.extracted_skills?.map((skill) => (
                                <span key={`${result.resume_id}-${skill}`} className={styles.skillChip}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={styles.atsSkillWrap}>
                            <p className={styles.resultLabel}>Missing Skills</p>
                            <div className={styles.chipList}>
                              {result.missing_skills?.length ? (
                                result.missing_skills.map((skill) => (
                                  <span key={`${result.resume_id}-miss-${skill}`} className={styles.missingSkillChip}>
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className={styles.emptyText}>No critical missing skills detected.</span>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.jobsSection}>
                  <p className={styles.resultLabel}>Live Job Vacancies (JSearch)</p>
                  {prediction.jobs?.length > 0 ? (
                    <div className={styles.jobsGrid}>
                      {prediction.jobs.map((job) => (
                        <article key={job.id} className={styles.jobCard}>
                          <div className={styles.jobHeader}>
                            <h3 className={styles.jobTitle}>{job.title}</h3>
                            {job.is_remote && <span className={styles.atsRank}>Remote</span>}
                          </div>
                          <p className={styles.jobCompany}>{job.company}</p>
                          <p className={styles.jobMeta}>
                            {job.location}
                            {job.employment_type ? ` | ${job.employment_type}` : ''}
                          </p>
                          {job.description && <p className={styles.jobDescription}>{job.description}</p>}
                          <div className={styles.jobActions}>
                            {job.apply_link ? (
                              <a
                                href={job.apply_link}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.jobApplyButton}
                              >
                                Apply
                              </a>
                            ) : (
                              <span className={styles.emptyText}>Apply link unavailable.</span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>
                      No vacancies returned for this query. Try changing location or disabling remote-only.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className={styles.matchingButton}
                  onClick={() => setShowMatching(true)}
                >
                  Find Matching Jobs -&gt;
                </button>
              </>
            )}
          </section>
        )}

        {showMatching && resumeForMatching && (
          <section className={`${styles.panel} ${styles.fadeSlide}`}>
            <h2 className={styles.panelTitle}>Step 3 - Job Matching Engine</h2>
            <JobMatchingEngine resume={resumeForMatching} />
          </section>
        )}
      </div>
    </div>
  )
}

export default ResumePredictor
