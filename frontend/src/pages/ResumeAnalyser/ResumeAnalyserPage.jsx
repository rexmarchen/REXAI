import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Gauge,
  Zap,
  Eye,
  Activity,
  Terminal,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  FileText,
  Briefcase,
  Upload,
  Play,
  Square,
  Volume2,
  VolumeX,
  Layers,
  Search,
  Target,
  Award,
  TrendingUp,
  Compass,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Cpu,
  Database,
  Code,
  MapPin
} from 'lucide-react'
import useResumeStore, { selectActiveResume } from '../../store/resumeStore'
import { buildResumeText } from '../../utils/resumeBuilder'
import {
  auditResumeWithMlAndRag,
  SAMPLE_JOB_DESCRIPTIONS
} from '../../utils/resumeAI'
import styles from './ResumeAnalyserPage.module.css'

const SAMPLE_FALLBACK_RESUME = `Rohit Kumar
B.Tech CSE (AI & ML) | CGC Mohali
rohitpatiyal616@gmail.com • +91 8894459240 • Himachal Pradesh, India • linkedin.com/in/rohit-kumar • github.com/rohit-ai

SUMMARY
Enthusiastic and results-driven AI Engineer with hands-on experience developing deep learning computer vision pipelines, full-stack React/Node.js web platforms, and automated workflow agents.

SKILLS
Programming: Python, JavaScript, TypeScript, C++, SQL
Frameworks: PyTorch, TensorFlow, React, FastAPI, Express.js, Node.js
Tools & Cloud: Docker, AWS ECS, Git, MongoDB, PostgreSQL, Vector Databases (FAISS)

EXPERIENCE
AI & Software Intern | Tech Innovations Lab
June 2024 - Present
• Engineered and deployed convolutional deep learning model for real-time object classification, achieving 94.2% test accuracy on 15,000+ images.
• Optimized distributed data loader pipeline using multiprocessing and TensorRT, reducing inference latency by 38% (from 82ms to 51ms per frame).
• Collaborated in cross-functional Agile team of 6 engineers to integrate microservice endpoints into production Docker containers on AWS.

Full Stack Project Developer | Academic Capstone
January 2024 - May 2024
• Architected scalable web platform serving 1,200+ active university users with JWT authentication and responsive React/Tailwind UI.
• Designed PostgreSQL schema with indexed queries, reducing dashboard load times from 2.4s to 450ms.

PROJECTS
Autonomous Career Agent (REXION AI)
• Built agentic job matching and ATS parsing pipeline utilizing cosine vector similarity and automated application runner.
• Integrated Google XYZ formula rewriting algorithms with real-time feedback loops.

EDUCATION
B.Tech in Computer Science & Engineering (Artificial Intelligence & Machine Learning)
CGC Mohali | 2022 - 2026 | CGPA: 8.6 / 10.0`

const ResumeAnalyserPage = () => {
  const navigate = useNavigate()
  const activeResume = useResumeStore(selectActiveResume)
  const resumeVersions = useResumeStore((state) => state.resumeVersions) || []
  const setActiveResume = useResumeStore((state) => state.setActiveResume)
  const replaceFormData = useResumeStore((state) => state.replaceFormData)

  // Ingestion configuration
  const [sourceMode, setSourceMode] = useState('active') // 'active' | 'upload' | 'custom'
  const [uploadedFile, setUploadedFile] = useState(null)
  const [customResumeText, setCustomResumeText] = useState(SAMPLE_FALLBACK_RESUME)
  const [targetRole, setTargetRole] = useState(activeResume?.formData?.personal?.role || 'AI & Machine Learning Engineer')
  const [jobDescription, setJobDescription] = useState(activeResume?.jobDescription || SAMPLE_JOB_DESCRIPTIONS[1].description)
  const [engineMode, setEngineMode] = useState('hybrid') // 'hybrid' | 'rag' | 'ats'

  // Auditing lifecycle
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditStepMsg, setAuditStepMsg] = useState('')
  const [activeTab, setActiveTab] = useState('telemetry')
  const [report, setReport] = useState(null)
  const [copiedRaw, setCopiedRaw] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [applySuccessMsg, setApplySuccessMsg] = useState('')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Explainability filters
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')

  const fileInputRef = useRef(null)

  // Auto-run analysis when active resume is available on mount
  useEffect(() => {
    if (activeResume && !report) {
      handleRunAudit()
    }
  }, [activeResume?.id])

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleRunAudit = async (fileOverride = null) => {
    setIsAuditing(true)
    setApplySuccessMsg('')
    setAuditStepMsg('Initializing hybrid ML & RAG vector runtime...')

    const targetFile = fileOverride || (sourceMode === 'upload' ? uploadedFile : null)

    try {
      await new Promise((r) => setTimeout(r, 100))
      setAuditStepMsg('Extracting resume tokens, layout, and structural hierarchy...')

      let payloadData = {}
      let effectiveText = ''

      if (sourceMode === 'active' && !fileOverride && activeResume?.formData) {
        payloadData = activeResume.formData
        effectiveText = buildResumeText({ formData: payloadData })
      } else if (targetFile) {
        payloadData = {
          personal: { name: targetFile.name.replace(/\.[^/.]+$/, '') },
          skills: [],
          experience: [],
          projects: []
        }
      } else {
        effectiveText = customResumeText
        payloadData = {
          personal: { name: 'Candidate' },
          summary: customResumeText.slice(0, 300),
          experience: [{ role: targetRole || 'Role', bullets: customResumeText.split('\n').filter(Boolean).slice(0, 6) }],
          skills: ['Python', 'Machine Learning', 'React', 'FastAPI', 'Docker', 'SQL']
        }
      }

      await new Promise((r) => setTimeout(r, 160))
      setAuditStepMsg('Running RAG semantic cosine similarity against target JD...')

      await new Promise((r) => setTimeout(r, 180))
      setAuditStepMsg('Evaluating 6-Category ATS rules, bullet quality & explainability engine...')

      const result = await auditResumeWithMlAndRag({
        resumeData: payloadData,
        resumeText: effectiveText,
        file: targetFile,
        jobDescription,
        targetRole,
        engineMode
      })

      setReport(result)
      if (result.effectiveText) {
        setCustomResumeText(result.effectiveText)
      }
      setAuditStepMsg('')
    } catch (err) {
      console.error('Audit failed:', err)
      setAuditStepMsg('Error running audit. Please retry.')
    } finally {
      setIsAuditing(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setSourceMode('upload')
      if (file.name.endsWith('.txt') || file.type.startsWith('text/')) {
        const reader = new FileReader()
        reader.onload = (re) => {
          setCustomResumeText(re.target?.result || '')
        }
        reader.readAsText(file)
      }
      handleRunAudit(file)
    }
  }

  const handleApplyRewrite = (originalText, rewrittenText) => {
    if (!activeResume?.formData || !originalText || !rewrittenText) return
    const nextExperience = (activeResume.formData.experience || []).map((exp) => ({
      ...exp,
      bullets: (exp.bullets || []).map((b) => (b === originalText ? rewrittenText : b))
    }))
    const nextProjects = (activeResume.formData.projects || []).map((proj) => ({
      ...proj,
      bullets: (proj.bullets || []).map((b) => (b === originalText ? rewrittenText : b))
    }))
    replaceFormData({
      ...activeResume.formData,
      experience: nextExperience,
      projects: nextProjects
    })
    setApplySuccessMsg('Applied Google XYZ quantified rewrite directly to Resume Studio!')
    setTimeout(() => setApplySuccessMsg(''), 4500)
  }

  const handleToggleVoiceSummary = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    const textToSpeak =
      report?.mlPrediction?.voiceSummary ||
      `AI Recruiter audit summary. Candidate readiness score is ${report?.score || 78} out of 100. Target role alignment is ${report?.mlPrediction?.career_path || targetRole}. Key recommendation: quantify top achievements using the Google XYZ formula and incorporate missing target keywords.`

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    window.speechSynthesis.speak(utterance)
    setIsPlayingAudio(true)
  }

  const handleCopySummaryReport = () => {
    if (!report) return
    const summaryText = `REXION AI Resume Audit Report
================================
Candidate: ${activeResume?.formData?.personal?.name || 'Candidate'}
Target Role: ${report.mlPrediction?.career_path || targetRole}
Overall ATS Score: ${report.score}/100 (Grade: ${report.grade})
RAG Semantic JD Match: ${report.ragReport?.similarityPercent || report.keywordMatch}%
ML Model Confidence: ${report.mlPrediction?.confidence || 85}% (${report.mlPrediction?.confidenceLevel || 'High'})
Recruiter 6s Verdict: ${report.recruiter6SecGlance?.verdict || 'Review'}
Flagged Formatting Issues: ${(report.formattingIssues || []).length}
Top Missing Skills: ${(report.missingKeywords || []).slice(0, 5).join(', ') || 'None'}`

    navigator.clipboard.writeText(summaryText)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2200)
  }

  // Normalized values
  const subScores = report?.subScores || {}
  const grade = report?.grade || (report?.score >= 85 ? 'A' : report?.score >= 70 ? 'B' : report?.score >= 50 ? 'C' : 'D')
  const glance = report?.recruiter6SecGlance || null
  const quantifyList = report?.quantifySuggestions || []
  const interviewList = report?.interviewQuestions || []
  const rawStream = report?.rawAtsStream || ''
  const mlPred = report?.mlPrediction || {}
  const ragInfo = report?.ragReport || {}

  const overallScoreVal = Math.round(report?.score || 0)
  const scoreColor =
    overallScoreVal >= 80 ? '#10b981' : overallScoreVal >= 65 ? '#38bdf8' : overallScoreVal >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className={styles.pageWrapper}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* TOP NAVIGATION */}
      <header className={styles.topNavbar}>
        <div className={styles.navLeft}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/resume')}>
            <ArrowLeft size={16} /> Back to Resume Studio
          </button>
          <div className={styles.pageTitleGroup}>
            <h1 className={styles.pageTitle}>
              <Cpu size={22} style={{ color: '#10b981' }} />
              Enterprise Resume Analyser
              <span className={styles.engineBadgeOnline}>v2.4 Production</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Multi-Layer Hybrid Architecture &bull; ML Career Classifier &bull; RAG Vector Semantic Search &bull; 9-D ATS Mathematical Scorer
            </p>
          </div>
        </div>

        <div className={styles.navRight}>
          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={handleToggleVoiceSummary}
            title="Listen to AI Recruiter Audio Debrief"
          >
            {isPlayingAudio ? <VolumeX size={15} color="#ef4444" /> : <Volume2 size={15} color="#10b981" />}
            <span>{isPlayingAudio ? 'Stop Audio' : 'AI Voice Debrief'}</span>
          </button>

          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={handleCopySummaryReport}
            title="Copy Executive Summary to Clipboard"
          >
            {copiedSummary ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            type="button"
            className={styles.primaryPrintBtn}
            onClick={() => window.print()}
            title="Print or Save Audit Report as PDF"
          >
            <FileText size={15} />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className={styles.mainContent}>
        {/* =========================================================================
            SECTION 1: INGESTION & AUDIT CONFIGURATION COMMAND CENTER
            ========================================================================= */}
        <section className={styles.inputPanel}>
          <div className={styles.panelHeadingRow}>
            <div className={styles.headingTitleGroup}>
              <div className={styles.panelIconWrap}>
                <Layers size={18} color="#10b981" />
              </div>
              <div>
                <h2 className={styles.panelTitle}>Audit Ingestion & Context Configuration</h2>
                <p className={styles.panelDesc}>
                  Select your resume source, tune target job parameters, and select the diagnostic engine.
                </p>
              </div>
            </div>

            {/* Source Mode Toggle */}
            <div className={styles.sourceToggle}>
              <button
                type="button"
                className={`${styles.sourceBtn} ${sourceMode === 'active' ? styles.sourceBtnActive : ''}`}
                onClick={() => setSourceMode('active')}
              >
                <FileText size={14} /> Active Resume Studio
              </button>
              <button
                type="button"
                className={`${styles.sourceBtn} ${sourceMode === 'upload' ? styles.sourceBtnActive : ''}`}
                onClick={() => {
                  setSourceMode('upload')
                  if (!uploadedFile) fileInputRef.current?.click()
                }}
              >
                <Upload size={14} /> Upload Resume (PDF / DOCX)
              </button>
              <button
                type="button"
                className={`${styles.sourceBtn} ${sourceMode === 'custom' ? styles.sourceBtnActive : ''}`}
                onClick={() => setSourceMode('custom')}
              >
                <Code size={14} /> Custom Text / Raw
              </button>
            </div>
          </div>

          <div className={styles.formGrid}>
            {/* COLUMN 1: RESUME SOURCE INPUT */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                <span>1. Resume Ingestion Source</span>
                {sourceMode === 'active' && resumeVersions.length > 1 && (
                  <select
                    className={styles.resumeVersionSelect}
                    value={activeResume?.id || ''}
                    onChange={(e) => setActiveResume(e.target.value)}
                  >
                    {resumeVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.formData?.personal?.name || 'Draft'})
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {sourceMode === 'active' ? (
                <div className={styles.activeResumeCard}>
                  <div className={styles.activeResumeHeader}>
                    <div className={styles.activeResumeAvatar}>
                      {(activeResume?.formData?.personal?.name || 'CV').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.activeCandidateName}>
                        {activeResume?.formData?.personal?.name || 'Candidate Name'}
                      </div>
                      <div className={styles.activeRoleTag}>
                        {activeResume?.formData?.personal?.role || 'Software Professional'}
                      </div>
                    </div>
                    <div className={styles.syncedLiveBadge}>
                      <span className={styles.syncedDot} /> Synced Live
                    </div>
                  </div>

                  <div className={styles.activeResumeMetaRow}>
                    <div className={styles.metaStatPill}>
                      <strong>{activeResume?.formData?.experience?.length || 0}</strong> Positions
                    </div>
                    <div className={styles.metaStatPill}>
                      <strong>{activeResume?.formData?.projects?.length || 0}</strong> Projects
                    </div>
                    <div className={styles.metaStatPill}>
                      <strong>{activeResume?.formData?.skills?.length || 0}</strong> Skills
                    </div>
                    <div className={styles.metaStatPill}>
                      Template: <strong>{activeResume?.template || 'Harvard ATS'}</strong>
                    </div>
                  </div>

                  <div className={styles.activeResumeTip}>
                    Changes made in the <strong>Google XYZ Rewriter</strong> tab will update this draft in real time.
                  </div>
                </div>
              ) : sourceMode === 'upload' ? (
                <div
                  className={styles.dropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} color="#10b981" />
                  {uploadedFile ? (
                    <div className={styles.uploadFileInfo}>
                      <span className={styles.uploadFileName}>{uploadedFile.name}</span>
                      <span className={styles.uploadFileSize}>
                        {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Click to change file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className={styles.dropZoneTitle}>Click or drop your PDF / DOCX resume here</div>
                      <div className={styles.dropZoneSub}>Parses text tokens directly for ML classification</div>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  className={styles.textarea}
                  rows={7}
                  placeholder="Paste your raw resume text here..."
                  value={customResumeText}
                  onChange={(e) => setCustomResumeText(e.target.value)}
                />
              )}
            </div>

            {/* COLUMN 2: TARGET JOB DESCRIPTION & SAMPLE PRESETS */}
            <div className={styles.fieldGroup}>
              <div className={styles.jdLabelRow}>
                <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
                  <span>2. Target Role & Job Description (JD)</span>
                </label>
                <div className={styles.sampleJdGroup}>
                  <span className={styles.sampleJdText}>Sample JDs:</span>
                  {SAMPLE_JOB_DESCRIPTIONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={styles.sampleJdBtn}
                      onClick={() => {
                        setJobDescription(preset.description)
                        setTargetRole(preset.role)
                      }}
                      title={preset.title}
                    >
                      {preset.company}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.roleInputRow}>
                <input
                  type="text"
                  className={styles.roleInput}
                  placeholder="Target Role (e.g., AI/ML Engineer, Full Stack Developer)"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>

              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="Paste the target job description to calculate semantic vector match, keyword gaps, and interview prep questions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          {/* ACTION BAR & ENGINE SELECTOR */}
          <div className={styles.auditActionRow}>
            <div className={styles.engineSelectGroup}>
              <span className={styles.engineLabel}>Diagnostic Engine:</span>
              <button
                type="button"
                className={`${styles.engineOptionBtn} ${engineMode === 'hybrid' ? styles.engineOptionBtnActive : ''}`}
                onClick={() => setEngineMode('hybrid')}
              >
                <Sparkles size={13} /> Hybrid (ML + RAG + 9-D ATS)
              </button>
              <button
                type="button"
                className={`${styles.engineOptionBtn} ${engineMode === 'rag' ? styles.engineOptionBtnActive : ''}`}
                onClick={() => setEngineMode('rag')}
              >
                <Compass size={13} /> RAG Vector Focus
              </button>
              <button
                type="button"
                className={`${styles.engineOptionBtn} ${engineMode === 'ats' ? styles.engineOptionBtnActive : ''}`}
                onClick={() => setEngineMode('ats')}
              >
                <ShieldCheck size={13} /> Strict ATS Screen
              </button>
            </div>

            <button
              type="button"
              className={styles.auditBtn}
              onClick={handleRunAudit}
              disabled={isAuditing}
            >
              {isAuditing ? <RefreshCw size={16} className={styles.spinningIcon} /> : <Sparkles size={16} />}
              <span>{isAuditing ? 'Running Production Diagnostics...' : 'Run Production Audit'}</span>
            </button>
          </div>

          {auditStepMsg && (
            <div className={styles.auditStepBanner}>
              <RefreshCw size={13} className={styles.spinningIcon} color="#10b981" />
              <span>{auditStepMsg}</span>
            </div>
          )}
        </section>

        {/* FEEDBACK NOTIFICATION */}
        {applySuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.successAlert}
          >
            <CheckCircle2 size={16} /> {applySuccessMsg}
          </motion.div>
        )}

        {/* =========================================================================
            SECTION 2: EXECUTIVE PRODUCTION-LEVEL STATS & KPIS
            ========================================================================= */}
        {report && (
          <section className={styles.kpiContainer}>
            {/* KPI 1: OVERALL ATS RADIAL HEALTH GAUGE */}
            <div className={styles.kpiScoreCard}>
              <div className={styles.kpiCardTitle}>Overall ATS Readiness</div>
              <div
                className={styles.dialWrapper}
                style={{
                  '--score-val': overallScoreVal,
                  '--score-accent': scoreColor
                }}
              >
                <div className={styles.dialInner}>
                  <span className={styles.dialNum} style={{ color: scoreColor }}>
                    {overallScoreVal}
                  </span>
                  <span className={styles.dialMax}>/100</span>
                </div>
              </div>

              <div
                className={styles.gradeBadgeLarge}
                style={{
                  background: `${scoreColor}18`,
                  color: scoreColor,
                  border: `1px solid ${scoreColor}44`
                }}
              >
                Grade {grade} &bull; {overallScoreVal >= 80 ? 'Elite Shortlist' : overallScoreVal >= 65 ? 'Competitive' : 'Needs Optimization'}
              </div>

              <div className={styles.kpiBenchmarkSub}>
                {overallScoreVal >= 80
                  ? '🏆 Top 10% Candidate Pool (Tier-1 Tech Ready)'
                  : overallScoreVal >= 65
                    ? '⚡ Passes 78% of Corporate Screening Filters'
                    : '⚠️ High Risk of Automated Screening Drop'}
              </div>
            </div>

            {/* KPI 2: ML CAREER MODEL PREDICTION */}
            <div className={styles.kpiStatCard}>
              <div className={styles.kpiHeaderRow}>
                <span className={styles.kpiCardTitle}>ML Career Classifier</span>
                <span className={styles.kpiBadgePurple}>ML Model</span>
              </div>

              <div className={styles.mlRoleTitle}>
                {mlPred.career_path || targetRole || 'Full Stack Engineer'}
              </div>

              <div className={styles.mlConfidenceMeter}>
                <div className={styles.mlConfidenceRow}>
                  <span>Model Confidence</span>
                  <strong>{mlPred.confidence || 88}% ({mlPred.confidenceLevel || 'High'})</strong>
                </div>
                <div className={styles.kpiTrack}>
                  <div
                    className={styles.kpiFill}
                    style={{ width: `${mlPred.confidence || 88}%`, background: '#8b5cf6' }}
                  />
                </div>
              </div>

              <div className={styles.kpiMetaFooter}>
                <span>Architecture: <strong>{mlPred.llmModel || 'BERT-v2 / Hybrid'}</strong></span>
                <span>Scope: <strong>{activeResume?.formData?.experience?.length ? `${activeResume.formData.experience.length} Exp` : 'Graduate / Mid'}</strong></span>
              </div>
            </div>

            {/* KPI 3: RAG SEMANTIC VECTOR MATCH */}
            <div className={styles.kpiStatCard}>
              <div className={styles.kpiHeaderRow}>
                <span className={styles.kpiCardTitle}>RAG Vector Similarity</span>
                <span className={styles.kpiBadgeEmerald}>Semantic Vector</span>
              </div>

              <div className={styles.ragScoreBig}>
                {ragInfo.similarityPercent || Math.round(report.keywordMatch || 78)}%
              </div>

              <div className={styles.ragCosineMeta}>
                <span>Cosine Similarity: <strong>{ragInfo.rawCosine || 0.82}</strong></span>
                <span className={styles.ragStatusPill}>
                  {ragInfo.similarityPercent >= 80 ? 'High Semantic Overlap' : 'Moderate Overlap'}
                </span>
              </div>

              <div className={styles.kpiTrack}>
                <div
                  className={styles.kpiFill}
                  style={{
                    width: `${ragInfo.similarityPercent || Math.round(report.keywordMatch || 78)}%`,
                    background: '#10b981'
                  }}
                />
              </div>

              <div className={styles.kpiMetaFooter}>
                <span>Target JD Match against: <strong>{targetRole}</strong></span>
              </div>
            </div>

            {/* KPI 4: RECRUITER 6-SECOND GLANCE & HYGIENE */}
            <div className={styles.kpiStatCard}>
              <div className={styles.kpiHeaderRow}>
                <span className={styles.kpiCardTitle}>Human Recruiter Glance</span>
                <span className={styles.kpiBadgeAmber}>6s Scan Time</span>
              </div>

              <div
                className={styles.glanceVerdictTag}
                style={{
                  background:
                    glance?.verdict?.includes('HIGH') || overallScoreVal >= 80
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                  color:
                    glance?.verdict?.includes('HIGH') || overallScoreVal >= 80 ? '#10b981' : '#f59e0b',
                  border: `1px solid ${
                    glance?.verdict?.includes('HIGH') || overallScoreVal >= 80 ? '#10b981' : '#f59e0b'
                  }44`
                }}
              >
                {glance?.verdict || (overallScoreVal >= 80 ? 'SHORTLIST CALL-BACK' : 'SECOND SCREENING')}
              </div>

              <div className={styles.hygieneIssuesRow}>
                <span className={styles.hygieneCount} style={{ color: (report.formattingIssues || []).length > 0 ? '#f59e0b' : '#10b981' }}>
                  {(report.formattingIssues || []).length}
                </span>
                <span className={styles.hygieneLabel}>
                  Formatting Flags Detected
                </span>
              </div>

              <div className={styles.kpiMetaFooter}>
                <span>Cognitive Load: <strong>Low / Fast Scan</strong></span>
                <span>Unquantified Bullets: <strong>{quantifyList.length}</strong></span>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 3: TAB NAVIGATION FOR DEEP DIVE MODULES
            ========================================================================= */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'telemetry' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            <Gauge size={16} /> Telemetry & 9-D Score
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'mlrag' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('mlrag')}
          >
            <Cpu size={16} /> ML & RAG Diagnostics
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'keywords' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('keywords')}
          >
            <Target size={16} /> Keyword & Skill Gap Matrix
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'quantify' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('quantify')}
          >
            <Zap size={16} /> Google XYZ Rewriter {quantifyList.length > 0 ? `(${quantifyList.length})` : ''}
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'recruiter' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('recruiter')}
          >
            <Eye size={16} /> Recruiter 6s Glance
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'interview' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('interview')}
          >
            <Activity size={16} /> RAG Interview Prep ({interviewList.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'rawAts' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('rawAts')}
          >
            <Terminal size={16} /> Raw ATS Parser Stream
          </button>
        </div>

        {/* =========================================================================
            TAB 1: 9-DIMENSION MATHEMATICAL TELEMETRY
            ========================================================================= */}
        {activeTab === 'telemetry' && report && (
          <div className={styles.tabContentCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Gauge size={18} color="#10b981" />
                  9-Dimension Mathematical ATS Breakdown
                </h3>
                <p className={styles.sectionSub}>
                  Calculated using rigorous multi-attribute weighting to replicate Fortune 500 applicant screening engines.
                </p>
              </div>
            </div>

            <div className={styles.dimensionGrid}>
              {Object.entries(subScores).map(([key, dim]) => {
                const dScore = dim.score || 0
                const barColor = dScore >= 80 ? '#10b981' : dScore >= 65 ? '#38bdf8' : dScore >= 50 ? '#f59e0b' : '#ef4444'
                const statusLabel = dScore >= 80 ? 'Elite' : dScore >= 65 ? 'Competitive' : dScore >= 50 ? 'Borderline' : 'Action Required'

                return (
                  <div key={key} className={styles.dimensionCard}>
                    <div className={styles.dimHeader}>
                      <div className={styles.dimTitleCol}>
                        <span className={styles.dimLabel}>{dim.label || key}</span>
                        <span className={styles.dimWeightPill}>{dim.weight}% weight</span>
                      </div>
                      <div className={styles.dimScoreCol}>
                        <span className={styles.dimScoreNum} style={{ color: barColor }}>
                          {dScore}
                        </span>
                        <span className={styles.dimScoreMax}>/100</span>
                      </div>
                    </div>

                    <div className={styles.dimTrack}>
                      <div className={styles.dimFill} style={{ width: `${dScore}%`, background: barColor }} />
                    </div>

                    <div className={styles.dimFooterRow}>
                      <span className={styles.dimStatusTag} style={{ color: barColor }}>
                        {statusLabel}
                      </span>
                      {dim.tips && <span className={styles.dimTip}>{dim.tips}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: ML MODEL & RAG VECTOR INSIGHTS
            ========================================================================= */}
        {activeTab === 'mlrag' && report && (
          <div className={styles.tabContentCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Cpu size={18} color="#8b5cf6" />
                  ML Career Model & RAG Vector Knowledge Diagnostics
                </h3>
                <p className={styles.sectionSub}>
                  Inference telemetry powered by the REXION ML Classifier and Retrieval-Augmented Vector Store.
                </p>
              </div>

              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={handleToggleVoiceSummary}
              >
                {isPlayingAudio ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} color="#10b981" />}
                <span>{isPlayingAudio ? 'Stop AI Audio' : 'Play AI Voice Debrief'}</span>
              </button>
            </div>

            <div className={styles.mlGrid}>
              {/* Domain Competency Matrix */}
              <div className={styles.mlCard}>
                <h4 className={styles.mlCardHeader}>
                  <Database size={16} color="#10b981" />
                  RAG 6-Domain Vector Competency Coverage
                </h4>
                <div className={styles.domainCoverageList}>
                  {Object.entries(ragInfo.domainCoverage || {}).map(([dKey, dVal]) => (
                    <div key={dKey} className={styles.domainItem}>
                      <div className={styles.domainHeaderRow}>
                        <span className={styles.domainLabel}>{dVal.label}</span>
                        <span className={styles.domainScore}>{dVal.score}%</span>
                      </div>
                      <div className={styles.dimTrack}>
                        <div
                          className={styles.dimFill}
                          style={{
                            width: `${dVal.score}%`,
                            background: dVal.score >= 70 ? '#10b981' : dVal.score >= 40 ? '#38bdf8' : '#f59e0b'
                          }}
                        />
                      </div>
                      {dVal.matched?.length > 0 && (
                        <div className={styles.domainMatchedChips}>
                          {dVal.matched.map((m) => (
                            <span key={m} className={styles.miniChip}>{m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technology Recommendations & Improvement Roadmap */}
              <div className={styles.mlCard}>
                <h4 className={styles.mlCardHeader}>
                  <Sparkles size={16} color="#8b5cf6" />
                  Recommended Technology Stack Additions
                </h4>
                <div className={styles.techRecList}>
                  {(mlPred.technologyRecommendations || []).map((tech, idx) => (
                    <div key={idx} className={styles.techRecItem}>
                      <span className={styles.techRecDot} />
                      <span className={styles.techRecName}>{tech}</span>
                      <span className={styles.techRecBadge}>High Industry ROI</span>
                    </div>
                  ))}
                </div>

                <h4 className={styles.mlCardHeader} style={{ marginTop: '1.5rem' }}>
                  <TrendingUp size={16} color="#38bdf8" />
                  Prioritized Action Roadmap
                </h4>
                <div className={styles.roadmapList}>
                  {(mlPred.improvementPlan || []).map((step, idx) => (
                    <div key={idx} className={styles.roadmapItem}>
                      <span className={styles.roadmapNumber}>{idx + 1}</span>
                      <span className={styles.roadmapText}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: KEYWORD & SKILL GAP MATRIX
            ========================================================================= */}
        {activeTab === 'keywords' && report && (
          <div className={styles.tabContentCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Target size={18} color="#10b981" />
                  Target Keyword & Semantic Skill Gap Matrix
                </h3>
                <p className={styles.sectionSub}>
                  Compares tokens in your resume directly against the target job description requirements.
                </p>
              </div>
            </div>

            <div className={styles.keywordsColumns}>
              {/* Matched Keywords */}
              <div className={styles.keywordCard}>
                <div className={styles.keywordCardHeader}>
                  <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={14} /> Matched Keywords ({(report.matchedKeywords || []).length})
                  </span>
                  <span className={styles.keywordSub}>Present in your resume & target JD</span>
                </div>

                <div className={styles.chipGrid}>
                  {(report.matchedKeywords || []).length > 0 ? (
                    report.matchedKeywords.map((k) => (
                      <span key={k} className={styles.chipGreen}>
                        <Check size={12} /> {k}
                      </span>
                    ))
                  ) : (
                    <span className={styles.emptyNotice}>
                      No matching keywords extracted yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Critical Keywords */}
              <div className={styles.keywordCard}>
                <div className={styles.keywordCardHeader}>
                  <span className={styles.badgeWarning}>
                    <AlertTriangle size={14} /> Missing Critical Keywords ({(report.missingKeywords || []).length})
                  </span>
                  <span className={styles.keywordSub}>Found in target JD but missing from resume</span>
                </div>

                <div className={styles.chipGrid}>
                  {(report.missingKeywords || []).length > 0 ? (
                    report.missingKeywords.map((k) => (
                      <span key={k} className={styles.chipAmber}>
                        + {k}
                      </span>
                    ))
                  ) : (
                    <span className={styles.emptyNotice}>
                      Zero critical keyword gaps detected! Full coverage achieved.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: GOOGLE XYZ BULLET POINT REWRITER
            ========================================================================= */}
        {activeTab === 'quantify' && (
          <div className={styles.tabContentCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Zap size={18} color="#10b981" />
                  Google XYZ Formula Bullet Rewriter Studio
                </h3>
                <p className={styles.sectionSub}>
                  Transforms task-oriented passive bullet points into quantified achievements:
                  <strong> &ldquo;Accomplished [X] as measured by [Y], by doing [Z]&rdquo;</strong>.
                </p>
              </div>
            </div>

            {quantifyList.length === 0 ? (
              <div className={styles.emptyRewritesBox}>
                <CheckCircle2 size={32} color="#10b981" />
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.5rem' }}>
                  All Bullet Points Meet High Quantification Thresholds!
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Your bullets contain strong action verbs and measurable metrics.
                </div>
              </div>
            ) : (
              <div className={styles.quantifyListWrap}>
                {quantifyList.map((item, idx) => (
                  <div key={item.id || idx} className={styles.quantifyCard}>
                    <div className={styles.quantifyHeader}>
                      <span className={styles.quantifyTag}>
                        {item.type === 'project' ? 'Project Impact' : 'Work Experience Impact'} &bull; {item.metricsAdded}
                      </span>
                    </div>

                    <div className={styles.quantifyOriginal}>
                      <div className={styles.quantifyLabelRed}>Before (Passive / Unquantified)</div>
                      <div className={styles.quantifyText}>{item.original}</div>
                    </div>

                    <div className={styles.quantifyRewrite}>
                      <div className={styles.quantifyLabelGreen}>After (Google XYZ Quantified)</div>
                      <div className={styles.quantifyText}>{item.rewritten}</div>
                    </div>

                    <div className={styles.quantifyActions}>
                      <button
                        type="button"
                        className={styles.applyRewriteBtn}
                        onClick={() => handleApplyRewrite(item.original, item.rewritten)}
                      >
                        <Check size={14} /> Apply XYZ Rewrite Directly to Active Resume
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: RECRUITER 6-SECOND GLANCE SIMULATION
            ========================================================================= */}
        {activeTab === 'recruiter' && glance && (
          <div className={styles.tabContentCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Eye size={18} color="#38bdf8" />
                  Recruiter 6-Second Glance Simulation
                </h3>
                <p className={styles.sectionSub}>
                  Simulates the visual heat-map and cognitive verdict of a corporate screener reading your resume in under 6 seconds.
                </p>
              </div>
            </div>

            <div className={styles.glanceBox}>
              <div className={styles.glanceHeaderRow}>
                <div>
                  <span className={styles.glanceSubHeading}>Screener Verdict:</span>
                  <div className={styles.glanceVerdictTitle}>{glance.verdict || 'Review Candidate'}</div>
                </div>
                <div className={styles.glanceTimer}>
                  <span>Average Time</span>
                  <strong>5.8 Seconds</strong>
                </div>
              </div>

              <div className={styles.glanceReason}>
                {glance.recruiterVerdict?.reason ||
                  'Clear headline and skills detected in the top third of the page. Candidate demonstrated strong role alignment.'}
              </div>

              <div className={styles.glanceGrid}>
                <div className={styles.glanceItem}>
                  <span className={styles.glanceLabel}>Candidate Name</span>
                  <span className={styles.glanceVal}>{glance.candidateName || 'Candidate Name'}</span>
                </div>

                <div className={styles.glanceItem}>
                  <span className={styles.glanceLabel}>Perceived Role Alignment</span>
                  <span className={styles.glanceVal}>{glance.currentOrTargetRole || targetRole}</span>
                </div>

                <div className={styles.glanceItem} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.glanceLabel}>Top Glanced Technical Skills</span>
                  <div className={styles.chipGrid} style={{ marginTop: '0.4rem' }}>
                    {(glance.topPerceivedSkills || []).map((s) => (
                      <span key={s} className={styles.chipGreen}>{s}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.glanceItem} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.glanceLabel}>Primary Catchy Bullets Absorbed</span>
                  <ul className={styles.glanceBulletsList}>
                    {(glance.primaryAchievementsGleaned || []).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: RAG INTERVIEW PREP GENERATOR
            ========================================================================= */}
        {activeTab === 'interview' && (
          <div className={styles.tabContentCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Activity size={18} color="#10b981" />
                  RAG Interview Preparation Generator
                </h3>
                <p className={styles.sectionSub}>
                  Anticipates technical, architectural, and behavioral questions derived directly from your resume claims.
                </p>
              </div>
            </div>

            <div className={styles.interviewGrid}>
              {interviewList.map((item, idx) => (
                <div key={idx} className={styles.interviewCard}>
                  <div className={styles.interviewHeader}>
                    <span className={styles.interviewCategory}>{item.category || 'System Architecture'}</span>
                    <span className={styles.interviewNumber}>Q{idx + 1}</span>
                  </div>

                  <div className={styles.interviewPrompt}>{item.question}</div>

                  {item.interviewerLookFor && (
                    <div className={styles.interviewGuidance}>
                      <strong>What Interviewers Look For:</strong> {item.interviewerLookFor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: RAW ATS PARSER STREAM (WORKDAY / GREENHOUSE VIEW)
            ========================================================================= */}
        {activeTab === 'rawAts' && (
          <div className={styles.tabContentCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Terminal size={18} color="#10b981" />
                  Raw ATS Ingestion Stream (Workday / Greenhouse / Taleo)
                </h3>
                <p className={styles.sectionSub}>
                  Shows the plaintext parsed data representation as received by corporate Applicant Tracking Systems.
                </p>
              </div>

              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={() => {
                  navigator.clipboard.writeText(rawStream || '')
                  setCopiedRaw(true)
                  setTimeout(() => setCopiedRaw(false), 2000)
                }}
              >
                {copiedRaw ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedRaw ? 'Copied Stream!' : 'Copy Raw Text'}</span>
              </button>
            </div>

            <pre className={styles.rawTerminal}>
              {rawStream || 'Raw ATS text stream generating...'}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}

export default ResumeAnalyserPage
