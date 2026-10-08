import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileDown,
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  LayoutTemplate,
  Maximize2,
  Menu,
  Moon,
  Plus,
  Printer,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Sun,
  Target,
  Terminal,
  Trash2,
  UploadCloud,
  Wand2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import properCuteCat from '../../assets/proper_cute_cat_perfect.png'
import styles from './ResumeBuilder.module.css'
import ResumeForm from './ResumeForm'
import ResumePreview from './ResumePreview'
import TemplateSelector from './TemplateSelector'
import useResumeStore, { selectActiveResume, selectResumeVersions } from '../../store/resumeStore'
import {
  PREVIEW_MODES,
  RESUME_SECTION_LIBRARY,
  TEMPLATE_OPTIONS,
  getTemplateConfig,
  formatRelativeTime,
  exportAtsPlainText,
  estimatePageFit,
} from '../../utils/resumeBuilder'
import { analyzeResumeATS, optimizeResumeForJobDescription } from '../../utils/resumeAI'

const WORKSPACE_TABS = [
  { id: 'editor', label: 'Editor', icon: FileText },
  { id: 'templates', label: 'Design (48)', icon: LayoutTemplate },
  { id: 'ats', label: 'ATS Lab', icon: Sparkles },
  { id: 'matcher', label: 'Job Matcher', icon: Target },
  { id: 'ordering', label: 'Sections', icon: ArrowDownUp },
]

const CURATED_ACCENTS = [
  { name: 'Terracotta', color: '#E97852' },
  { name: 'Slate Dark', color: '#1E293B' },
  { name: 'Navy Blue', color: '#1E3A8A' },
  { name: 'Emerald', color: '#047857' },
  { name: 'Plum', color: '#6B21A8' },
  { name: 'Crimson', color: '#991B1B' },
  { name: 'Teal', color: '#0F766E' },
  { name: 'Charcoal', color: '#334155' },
]

const CURATED_FONTS = [
  { name: 'Inter (Clean Sans)', value: 'Inter, sans-serif' },
  { name: 'Roboto (Modern)', value: 'Roboto, sans-serif' },
  { name: 'Outfit (Geometric)', value: 'Outfit, sans-serif' },
  { name: 'Playfair (Executive)', value: 'Playfair Display, Georgia, serif' },
  { name: 'Merriweather (Serif)', value: 'Merriweather, serif' },
  { name: 'JetBrains (Monospace)', value: 'JetBrains Mono, monospace' },
  { name: 'Plus Jakarta (Fintech)', value: 'Plus Jakarta Sans, sans-serif' },
]

const ResumeBuilder = () => {
  const previewSheetRef = useRef(null)
  const jsonInputRef = useRef(null)
  const exportDropdownRef = useRef(null)

  // Navigation & view states
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('editor')
  const [viewLayout, setViewLayout] = useState('split') // 'split' | 'editor' | 'preview'
  const [zoom, setZoom] = useState(0.85)
  const [showPageGuide, setShowPageGuide] = useState(true)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  // ATS lab & optimization states
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [labTab, setLabTab] = useState('telemetry')
  const [statusMessage, setStatusMessage] = useState('All changes auto-saved locally in real time.')

  const activeResume = useResumeStore(selectActiveResume)
  const resumeVersions = useResumeStore(selectResumeVersions)
  const deferredAnalysisKey = useDeferredValue(
    JSON.stringify({
      resumeId: activeResume?.id,
      formData: activeResume?.formData,
      jobDescription: activeResume?.jobDescription,
    })
  )

  const setActiveResume = useResumeStore((state) => state.setActiveResume)
  const renameActiveResume = useResumeStore((state) => state.renameActiveResume)
  const createResumeVersion = useResumeStore((state) => state.createResumeVersion)
  const duplicateActiveResume = useResumeStore((state) => state.duplicateActiveResume)
  const deleteActiveResume = useResumeStore((state) => state.deleteActiveResume)
  const importResumeVersion = useResumeStore((state) => state.importResumeVersion)
  const setTemplate = useResumeStore((state) => state.setTemplate)
  const setCustomAccent = useResumeStore((state) => state.setCustomAccent)
  const setCustomFont = useResumeStore((state) => state.setCustomFont)
  const setPreviewMode = useResumeStore((state) => state.setPreviewMode)
  const setJobDescription = useResumeStore((state) => state.setJobDescription)
  const setAtsReport = useResumeStore((state) => state.setAtsReport)
  const replaceFormData = useResumeStore((state) => state.replaceFormData)
  const moveSection = useResumeStore((state) => state.moveSection)
  const addSkill = useResumeStore((state) => state.addSkill)

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportMenuOpen(false)
      }
    }
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExportMenuOpen])

  // Continuous background ATS analysis
  useEffect(() => {
    if (!activeResume) return

    const analysisPayload = JSON.parse(deferredAnalysisKey)
    let isCancelled = false
    const controller = new AbortController()

    const timer = window.setTimeout(async () => {
      setIsAnalyzing(true)
      try {
        const report = await analyzeResumeATS({
          resumeData: analysisPayload.formData,
          jobDescription: analysisPayload.jobDescription,
          signal: controller.signal,
        })
        if (!isCancelled) {
          setAtsReport(report)
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('ATS analysis failed:', error)
        }
      } finally {
        if (!isCancelled) {
          setIsAnalyzing(false)
        }
      }
    }, 220)

    return () => {
      isCancelled = true
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [activeResume, deferredAnalysisKey, setAtsReport])

  if (!activeResume) return null

  const isDarkMode = activeResume.previewMode === 'dark'
  const distinctTemplates = TEMPLATE_OPTIONS.filter((t) => !t.isLegacy)
  const currentTemplateConfig = getTemplateConfig(activeResume?.template)
  const currentTemplateIndex = Math.max(
    0,
    distinctTemplates.findIndex((t) => t.id === currentTemplateConfig.id)
  )

  const handlePrevTemplate = () => {
    const nextIdx = currentTemplateIndex <= 0 ? distinctTemplates.length - 1 : currentTemplateIndex - 1
    setTemplate(distinctTemplates[nextIdx].id)
    setStatusMessage(`Switched template to ${distinctTemplates[nextIdx].name}.`)
  }

  const handleNextTemplate = () => {
    const nextIdx = currentTemplateIndex >= distinctTemplates.length - 1 ? 0 : currentTemplateIndex + 1
    setTemplate(distinctTemplates[nextIdx].id)
    setStatusMessage(`Switched template to ${distinctTemplates[nextIdx].name}.`)
  }

  const handleResumeSwitch = (resumeId) => {
    setActiveResume(resumeId)
    const targetResume = resumeVersions.find((r) => r.id === resumeId)
    setStatusMessage(`Switched to "${targetResume?.name || 'the selected resume'}".`)
  }

  const handleCreateVersion = () => {
    createResumeVersion(`Resume ${resumeVersions.length + 1}`)
    setStatusMessage('New resume version ready for editing.')
  }

  const handleDuplicateResume = () => {
    duplicateActiveResume()
    setStatusMessage('Duplicated active resume as a new version.')
  }

  const handleDeleteResume = () => {
    if (window.confirm(`Delete "${activeResume.name}"? Other saved versions will remain intact.`)) {
      deleteActiveResume()
      setStatusMessage('Resume version removed.')
    }
  }

  // Google XYZ Quantified Rewrite Handler
  const handleApplyRewrite = (originalText, rewrittenText) => {
    if (!activeResume?.formData || !originalText || !rewrittenText) return
    const nextExperience = (activeResume.formData.experience || []).map((exp) => ({
      ...exp,
      bullets: (exp.bullets || []).map((b) => (b === originalText ? rewrittenText : b)),
    }))
    const nextProjects = (activeResume.formData.projects || []).map((proj) => ({
      ...proj,
      bullets: (proj.bullets || []).map((b) => (b === originalText ? rewrittenText : b)),
    }))
    replaceFormData({
      ...activeResume.formData,
      experience: nextExperience,
      projects: nextProjects,
    })
    setStatusMessage('Applied Google XYZ quantified rewrite to resume.')
  }

  // 1-Click AI Optimization
  const handleOptimizeResume = async () => {
    if (!activeResume.jobDescription.trim()) {
      setStatusMessage('Paste a job description first in Job Matcher to optimize.')
      setActiveWorkspaceTab('matcher')
      return
    }

    setIsOptimizing(true)
    setStatusMessage('AI is tailoring your resume for the target job description...')

    try {
      const result = await optimizeResumeForJobDescription({
        resumeData: activeResume.formData,
        jobDescription: activeResume.jobDescription,
      })
      replaceFormData(result.optimizedData)
      setAtsReport(result.atsReport)
      setStatusMessage('Tailoring complete! Summary, skills, and bullets have been optimized.')
    } catch (error) {
      console.error('Resume optimization failed:', error)
      setStatusMessage('Unable to optimize resume right now. Please try again.')
    } finally {
      setIsOptimizing(false)
    }
  }

  // High-Res PDF Export
  const handleExportPdf = async () => {
    const previewSheet = previewSheetRef.current
    if (!previewSheet) {
      setStatusMessage('Resume preview sheet is loading...')
      return
    }

    setIsExporting(true)
    setStatusMessage('Rendering high-resolution A4 PDF...')
    setIsExportMenuOpen(false)

    // Store original parent transform so zoom scale doesn't distort html2canvas
    const transformParent = previewSheet.parentElement
    const originalTransform = transformParent ? transformParent.style.transform : ''

    try {
      if (transformParent) {
        transformParent.style.transform = 'none'
      }

      // Small tick to ensure browser reflows to unscaled 794px width
      await new Promise((r) => setTimeout(r, 60))

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(previewSheet, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: activeResume.previewMode === 'dark' ? '#111821' : '#ffffff',
        width: 794,
        windowWidth: 1200,
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = 210
      const pdfHeight = 297
      const contentWidth = pdfWidth
      const contentHeight = pdfHeight
      const imageHeight = (canvas.height * contentWidth) / canvas.width
      let remainingHeight = imageHeight

      pdf.addImage(imageData, 'PNG', 0, 0, contentWidth, imageHeight)
      remainingHeight -= contentHeight

      let pageIndex = 1
      while (remainingHeight > 5) {
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', 0, -(pageIndex * contentHeight), contentWidth, imageHeight)
        remainingHeight -= contentHeight
        pageIndex += 1
      }

      const fileName =
        (activeResume.formData?.personal?.name || activeResume.name || 'rexion-resume')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'rexion-resume'

      pdf.save(`${fileName}.pdf`)
      setStatusMessage('High-res PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF export failed:', error)
      setStatusMessage('PDF export failed. Please try again.')
    } finally {
      if (transformParent) {
        transformParent.style.transform = originalTransform
      }
      setIsExporting(false)
    }
  }

  // ATS Plain Text Copy
  const handleCopyAtsText = () => {
    const plainText = exportAtsPlainText(activeResume)
    navigator.clipboard.writeText(plainText)
    setStatusMessage('Copied ATS-clean plain text for job applications!')
    setIsExportMenuOpen(false)
  }

  // ATS Plain Text .txt Download
  const handleDownloadTxt = () => {
    const plainText = exportAtsPlainText(activeResume)
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const fileName =
      (activeResume.formData.personal.name || activeResume.name || 'resume')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') + '-ats.txt'
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    setStatusMessage('Downloaded ATS plain text (.txt) file.')
    setIsExportMenuOpen(false)
  }

  // JSON Backup Export
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(activeResume, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const fileName =
      (activeResume.formData.personal.name || activeResume.name || 'resume')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') + '-backup.json'
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    setStatusMessage('Exported resume JSON backup file.')
    setIsExportMenuOpen(false)
  }

  // JSON Backup Import
  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (importResumeVersion) {
          importResumeVersion(parsed)
          setStatusMessage('Imported resume backup successfully!')
        }
      } catch (err) {
        setStatusMessage('Error reading JSON resume file.')
      }
    }
    reader.readAsText(file)
    setIsExportMenuOpen(false)
  }

  const handlePrint = () => {
    window.print()
    setStatusMessage('Print dialog opened.')
    setIsExportMenuOpen(false)
  }

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(1.3, Number((prev + 0.1).toFixed(2))))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.75, Number((prev - 0.1).toFixed(2))))
  const handleZoomReset = () => setZoom(0.85)

  // Estimated page fit & telemetry
  const pageFit = estimatePageFit(activeResume)
  const atsScore = Math.round(activeResume.atsReport?.score || 0)
  const keywordMatch = Math.round(activeResume.atsReport?.keywordMatch || 0)

  // Rex mascot dynamic tip
  const getRexTip = () => {
    if (!pageFit.isOnePage) {
      return "Rex: 'Your resume runs onto Page 2! Trim 1-2 bullets to hit a sleek 1-page fit! 🐾'"
    }
    if (activeResume.formData.skills.length < 5) {
      return "Rex: 'Open Job Matcher to add missing keywords and boost your ATS rating! 🐾'"
    }
    if (atsScore >= 85) {
      return "Rex: 'Paws-itively brilliant! 85%+ score puts you in top candidate percentiles! ♡'"
    }
    if (activeResume.formData.experience.length === 0) {
      return "Rex: 'Add your past work or internships so recruiters can see your journey! 🐾'"
    }
    return "Rex: 'Try Google XYZ rewrites in ATS Lab for quantified measurable impact! ♡'"
  }

  // Report fields
  const report = activeResume.atsReport || {}
  const subScores = report.subScores || {}
  const glance = report.recruiter6SecGlance
  const quantifyList = report.googleXyzQuantify || []
  const interviewList = report.predictiveInterviewQuestions || []
  const rawStream = report.rawAtsStream || ''
  const grade = atsScore >= 85 ? 'A' : atsScore >= 70 ? 'B' : atsScore >= 55 ? 'C' : 'D'

  return (
    <div
      className={`${styles.builderShell} ${
        isDarkMode ? styles.workspaceThemeDark : styles.workspaceThemeLight
      }`}
    >
      {/* HIDDEN FILE INPUT FOR IMPORT */}
      <input
        type="file"
        ref={jsonInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleImportJsonFile}
      />

      {/* =========================================================================
          TIER 1: ATELIER COMMAND BAR (NAVBAR)
          ========================================================================= */}
      <header className={styles.atelierNavbar}>
        {/* LEFT: BRAND & RESUME SELECTOR */}
        <div className={styles.atelierNavLeft}>
          <div
            className={styles.atelierBrandPill}
            onClick={() => setActiveWorkspaceTab('templates')}
            title="REXION Resume Atelier"
          >
            <img src={properCuteCat} alt="Rex Mascot" className={styles.atelierCatIcon} />
            <span className={styles.atelierBrandText}>Rex Atelier ♡</span>
          </div>

          <div className={styles.atelierDocMeta}>
            <select
              id="resume-version-select"
              className={styles.atelierVersionSelect}
              value={activeResume.id}
              onChange={(e) => handleResumeSwitch(e.target.value)}
              title="Switch saved resume version"
            >
              {resumeVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            <input
              id="resume-name-input"
              className={styles.atelierDocInput}
              value={activeResume.name}
              onChange={(e) => renameActiveResume(e.target.value)}
              placeholder="Resume Name"
              title="Click to rename active version"
            />
          </div>
        </div>

        {/* CENTER: 5 MAIN WORKSPACE TABS */}
        <div className={styles.atelierNavCenter}>
          <div className={styles.atelierTabGroup}>
            {WORKSPACE_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeWorkspaceTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`workspace-tab-${tab.id}`}
                  type="button"
                  className={`${styles.atelierTabBtn} ${isActive ? styles.atelierTabBtnActive : ''}`}
                  onClick={() => {
                    setActiveWorkspaceTab(tab.id)
                    setIsExportMenuOpen(false)
                    if (viewLayout === 'preview') setViewLayout('split')
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT: VIEW MODES, ZOOM, THEME, EXPORT HUB */}
        <div className={styles.atelierNavRight}>
          {/* View Modes Toggle */}
          <div className={styles.layoutToggleGroup} title="Switch workspace layout">
            <button
              id="layout-toggle-split"
              type="button"
              className={`${styles.layoutToggleBtn} ${
                viewLayout === 'split' ? styles.layoutToggleBtnActive : ''
              }`}
              onClick={() => {
                setViewLayout('split')
                setIsExportMenuOpen(false)
              }}
              title="Split View (Forms + Live Sheet)"
            >
              <Layers size={13} />
            </button>
            <button
              id="layout-toggle-editor"
              type="button"
              className={`${styles.layoutToggleBtn} ${
                viewLayout === 'editor' ? styles.layoutToggleBtnActive : ''
              }`}
              onClick={() => {
                setViewLayout('editor')
                setIsExportMenuOpen(false)
              }}
              title="Editor Only (Focus on Writing)"
            >
              <FileText size={13} />
            </button>
            <button
              id="layout-toggle-preview"
              type="button"
              className={`${styles.layoutToggleBtn} ${
                viewLayout === 'preview' ? styles.layoutToggleBtnActive : ''
              }`}
              onClick={() => {
                setViewLayout('preview')
                setIsExportMenuOpen(false)
              }}
              title="Zen Preview (Centered Full Sheet)"
            >
              <Eye size={13} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className={styles.zoomPillGroup} title="Adjust sheet zoom">
            <button
              id="btn-zoom-out"
              type="button"
              className={styles.zoomBtn}
              onClick={handleZoomOut}
              disabled={zoom <= 0.75}
            >
              <ZoomOut size={12} />
            </button>
            <span
              id="btn-zoom-reset"
              className={styles.zoomLabel}
              onClick={handleZoomReset}
              title="Click to reset to 100%"
              style={{ cursor: 'pointer' }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              id="btn-zoom-in"
              type="button"
              className={styles.zoomBtn}
              onClick={handleZoomIn}
              disabled={zoom >= 1.3}
            >
              <ZoomIn size={12} />
            </button>
          </div>

          {/* A4 Page Cut Guide Toggle */}
          <button
            id="btn-toggle-a4-guide"
            type="button"
            className={`${styles.compactBtn} ${showPageGuide ? styles.compactBtnActive : ''}`}
            onClick={() => setShowPageGuide(!showPageGuide)}
            title="Toggle A4 Page 1 Boundary Guide Line"
          >
            <Scissors size={12} />
            <span>A4 Cut</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-toggle-theme"
            type="button"
            className={styles.compactBtn}
            onClick={() => setPreviewMode(isDarkMode ? 'light' : 'dark')}
            title="Toggle Light / Dark Preview"
          >
            {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {/* Production Export Hub: 1-Click Download PDF Split Button */}
          <div className={styles.exportHubContainer} ref={exportDropdownRef} style={{ display: 'inline-flex', alignItems: 'stretch' }}>
            <button
              id="btn-download-pdf-primary"
              type="button"
              className={styles.exportMainBtn}
              onClick={handleExportPdf}
              disabled={isExporting}
              title="Download High-Resolution A4 PDF"
            >
              <Download size={13} />
              <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              id="btn-export-hub-toggle"
              type="button"
              className={styles.exportDropdownTriggerBtn}
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              title="More export formats (Print / Save as PDF, ATS Text, JSON)"
              aria-label="More export options"
            >
              <ChevronDown size={13} />
            </button>

            {isExportMenuOpen && (
              <div className={styles.exportMenuDropdown}>
                <button
                  id="btn-export-pdf"
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={handleExportPdf}
                  disabled={isExporting}
                >
                  <FileDown size={14} color="#E97852" />
                  <span>{isExporting ? 'Generating PDF...' : 'Download PDF (A4)'}</span>
                </button>

                <button
                  id="btn-copy-ats-text"
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={handleCopyAtsText}
                >
                  <Copy size={14} color="#059669" />
                  <span>Copy ATS Plain Text</span>
                </button>

                <button
                  id="btn-download-ats-txt"
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={handleDownloadTxt}
                >
                  <FileText size={14} color="#2563EB" />
                  <span>Download .txt (ATS Safe)</span>
                </button>

                <div className={styles.exportMenuDivider} />

                <button
                  id="btn-export-json"
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={handleExportJson}
                >
                  <Download size={14} color="#7C3AED" />
                  <span>Export JSON Backup</span>
                </button>

                <button
                  id="btn-import-json"
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => jsonInputRef.current?.click()}
                >
                  <UploadCloud size={14} color="#D97706" />
                  <span>Import JSON Backup</span>
                </button>

                <div className={styles.exportMenuDivider} />

                <button
                  id="btn-print-sheet"
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={handlePrint}
                >
                  <Printer size={14} color="#475569" />
                  <span>Print Sheet (Ctrl+P)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          TIER 2: TELEMETRY & CAT MASCOT BAR
          ========================================================================= */}
      <div className={styles.atelierTelemetryBar}>
        {/* LEFT: Current Template & Quick Color Swatches */}
        <div className={styles.telemetryLeft}>
          <div className={styles.activeTemplateChip}>
            <button
              type="button"
              className={styles.btnCycleTemplate}
              onClick={handlePrevTemplate}
              title="Previous template"
              style={{ border: 'none', background: 'transparent', padding: '1px 3px' }}
            >
              <ChevronLeft size={13} />
            </button>
            <span>
              {currentTemplateConfig.num ? `${currentTemplateConfig.num}. ` : ''}
              {currentTemplateConfig.name}
            </span>
            <button
              type="button"
              className={styles.btnCycleTemplate}
              onClick={handleNextTemplate}
              title="Next template"
              style={{ border: 'none', background: 'transparent', padding: '1px 3px' }}
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Quick Color Swatches */}
          <div className={styles.colorSwatchesGroup} title="Quick Accent Recolor">
            {CURATED_ACCENTS.map((item) => {
              const isSelected = (activeResume.customAccent || currentTemplateConfig.accent) === item.color
              return (
                <button
                  key={item.color}
                  type="button"
                  className={`${styles.swatchBtn} ${isSelected ? styles.swatchBtnActive : ''}`}
                  style={{ background: item.color }}
                  onClick={() => {
                    setCustomAccent(item.color)
                    setStatusMessage(`Applied ${item.name} accent palette.`)
                  }}
                  title={item.name}
                />
              )
            })}
          </div>
        </div>

        {/* CENTER: Live Telemetry & Page Fit */}
        <div className={styles.telemetryCenter}>
          <span
            className={`${styles.telemetryBadge} ${
              atsScore >= 75 ? styles.telemetryBadgeScore : styles.telemetryBadgeAmber
            }`}
          >
            ✦ ATS {atsScore}% (Grade {grade})
          </span>

          <span className={styles.telemetryBadge}>
            🎯 JD Match {keywordMatch}%
          </span>

          <span
            className={`${styles.telemetryBadge} ${
              pageFit.isOnePage ? styles.telemetryBadgeScore : styles.telemetryBadgeAmber
            }`}
          >
            {pageFit.isOnePage ? '📄 1 Page Fit' : '⚠️ 2 Pages'}
          </span>
        </div>

        {/* RIGHT: Dynamic Rex Mascot Advice Speech Bubble */}
        <div className={styles.telemetryRight}>
          <div className={styles.rexSpeechPill} title={statusMessage}>
            <img src={properCuteCat} alt="Rex Mascot" className={styles.rexSpeechCat} />
            <span>{getRexTip()}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE (SPLIT / FULL SHELL)
          ========================================================================= */}
      <div
        className={`${styles.splitShell} ${
          viewLayout === 'editor'
            ? styles.splitShellFullEditor
            : viewLayout === 'preview'
              ? styles.splitShellFullPreview
              : ''
        }`}
      >
        {/* LEFT COLUMN: ACTIVE WORKSPACE TAB VIEW */}
        {viewLayout !== 'preview' && (
          <section className={styles.editorPane}>
            {/* TAB 1: FORM EDITOR */}
            {activeWorkspaceTab === 'editor' && (
              <ResumeForm
                resume={activeResume}
                onDownloadPdf={handleExportPdf}
                isExporting={isExporting}
              />
            )}

            {/* TAB 2: DESIGN & 48 TEMPLATES STUDIO */}
            {activeWorkspaceTab === 'templates' && (
              <div className={styles.designStudioPanel}>
                <div className={styles.designToolbarCard}>
                  <div className={styles.designSectionHeader}>
                    <h3 className={styles.designSectionTitle}>
                      <Sliders size={16} color="#E97852" />
                      <span>Typography & Font Family</span>
                    </h3>
                  </div>

                  <div className={styles.fontSelectGrid}>
                    {CURATED_FONTS.map((f) => {
                      const isSelected = activeResume.customFont === f.value
                      return (
                        <button
                          key={f.name}
                          type="button"
                          className={`${styles.fontOptionBtn} ${
                            isSelected ? styles.fontOptionBtnActive : ''
                          }`}
                          onClick={() => {
                            setCustomFont(f.value)
                            setStatusMessage(`Font changed to ${f.name}.`)
                          }}
                        >
                          {f.name}
                        </button>
                      )
                    })}
                  </div>

                  <div className={styles.designSectionHeader} style={{ marginTop: '0.5rem' }}>
                    <h3 className={styles.designSectionTitle}>
                      <Sparkles size={16} color="#E97852" />
                      <span>Custom Color Palettes</span>
                    </h3>
                  </div>

                  <div className={styles.accentPaletteGrid}>
                    {CURATED_ACCENTS.map((item) => {
                      const isSelected =
                        (activeResume.customAccent || currentTemplateConfig.accent) === item.color
                      return (
                        <div
                          key={item.color}
                          className={`${styles.accentSwatchBox} ${
                            isSelected ? styles.accentSwatchBoxActive : ''
                          }`}
                          onClick={() => {
                            setCustomAccent(item.color)
                            setStatusMessage(`Applied ${item.name} palette.`)
                          }}
                        >
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: item.color,
                            }}
                          />
                          <span>{item.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 48 Templates Gallery */}
                <TemplateSelector
                  activeTemplate={activeResume.template}
                  onSelectTemplate={(tid) => {
                    setTemplate(tid)
                    setStatusMessage('Template applied.')
                  }}
                  showHeader={true}
                />
              </div>
            )}

            {/* TAB 3: ATS LAB */}
            {activeWorkspaceTab === 'ats' && (
              <section className={styles.formPanel}>
                <div className={styles.formPanelHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={20} color="#E97852" />
                    <div>
                      <h2 className={styles.formPanelTitle}>ATS Intelligence Lab</h2>
                      <p className={styles.helperText}>
                        9-dimensional automated audit, Google XYZ quantified bullet rewrites, and 6s recruiter glance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.labNav}>
                  <button
                    type="button"
                    className={`${styles.labTabBtn} ${
                      labTab === 'telemetry' ? styles.labTabBtnActive : ''
                    }`}
                    onClick={() => setLabTab('telemetry')}
                  >
                    <Gauge size={14} /> 9D Scoring
                  </button>
                  <button
                    type="button"
                    className={`${styles.labTabBtn} ${
                      labTab === 'quantify' ? styles.labTabBtnActive : ''
                    }`}
                    onClick={() => setLabTab('quantify')}
                  >
                    <Zap size={14} /> Google XYZ Rewrites
                  </button>
                  <button
                    type="button"
                    className={`${styles.labTabBtn} ${
                      labTab === 'recruiter' ? styles.labTabBtnActive : ''
                    }`}
                    onClick={() => setLabTab('recruiter')}
                  >
                    <Eye size={14} /> 6s Recruiter Glance
                  </button>
                  <button
                    type="button"
                    className={`${styles.labTabBtn} ${
                      labTab === 'interview' ? styles.labTabBtnActive : ''
                    }`}
                    onClick={() => setLabTab('interview')}
                  >
                    <HelpCircle size={14} /> Interview Prep
                  </button>
                  <button
                    type="button"
                    className={`${styles.labTabBtn} ${
                      labTab === 'rawAts' ? styles.labTabBtnActive : ''
                    }`}
                    onClick={() => setLabTab('rawAts')}
                  >
                    <Terminal size={14} /> Raw ATS Stream
                  </button>
                </div>

                <div className={styles.atsLayout}>
                  {/* ATS SUB-TAB 1: 9D TELEMETRY */}
                  {labTab === 'telemetry' && (
                    <>
                      <div className={styles.atsTopline}>
                        <div
                          className={styles.scoreDial}
                          style={{
                            '--score-progress': atsScore,
                            '--score-accent':
                              atsScore >= 80 ? '#7cf9c4' : atsScore >= 60 ? '#00e5ff' : '#ffc857',
                          }}
                        >
                          <div className={styles.scoreRing} />
                          <div className={styles.scoreValue}>{atsScore}</div>
                        </div>

                        <div className={styles.scoreMeta}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className={styles.scoreTitle}>ATS Readiness</div>
                            <span
                              className={`${styles.gradeBadge} ${
                                grade === 'A'
                                  ? styles.gradeA
                                  : grade === 'B'
                                    ? styles.gradeB
                                    : grade === 'C'
                                      ? styles.gradeC
                                      : styles.gradeD
                              }`}
                            >
                              Grade {grade}
                            </span>
                          </div>
                          <div className={styles.scoreSummary}>
                            9-dimensional weighted audit evaluates formatting hygiene, keyword density, and bullet impact.
                          </div>
                        </div>
                      </div>

                      {/* 9-Dimensional Breakdown */}
                      {Object.keys(subScores).length > 0 && (
                        <div>
                          <div className={styles.helperText} style={{ marginBottom: '0.4rem' }}>
                            9-Dimension Mathematical Breakdown
                          </div>
                          <div className={styles.dimensionGrid}>
                            {Object.entries(subScores).map(([key, dim]) => {
                              const dimScore = dim.score || 0
                              const barColor =
                                dimScore >= 80 ? '#7cf9c4' : dimScore >= 60 ? '#00e5ff' : '#ffc857'
                              return (
                                <div key={key} className={styles.dimensionItem}>
                                  <div className={styles.dimensionItemHeader}>
                                    <span className={styles.dimensionItemTitle}>
                                      {dim.label || key}
                                      <span className={styles.dimensionItemWeight}>
                                        ({dim.weight || 0}%)
                                      </span>
                                    </span>
                                    <span className={styles.dimensionItemScore} style={{ color: barColor }}>
                                      {dimScore}/100
                                    </span>
                                  </div>
                                  <div className={styles.dimensionTrack}>
                                    <div
                                      className={styles.dimensionBarFill}
                                      style={{ width: `${dimScore}%`, backgroundColor: barColor }}
                                    />
                                  </div>
                                  {dim.tips && <div className={styles.dimensionTip}>{dim.tips}</div>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Suggestions list */}
                      <div>
                        <div className={styles.helperText}>Key suggestions</div>
                        <ul className={styles.list}>
                          {(report.suggestions || []).map((suggestion) => (
                            <li key={suggestion}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* ATS SUB-TAB 2: GOOGLE XYZ REWRITES */}
                  {labTab === 'quantify' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        The <strong>Google XYZ formula</strong> (<em>Accomplished [X] as measured by [Y], by doing [Z]</em>) dramatically increases interview callback rates by attaching measurable ROI to each bullet point.
                      </div>

                      {quantifyList.length === 0 ? (
                        <div className={styles.chipMuted} style={{ padding: '1rem', textAlign: 'center' }}>
                          No weak bullets detected. Ensure your experience and project sections have bullets added to unlock XYZ rewrites!
                        </div>
                      ) : (
                        quantifyList.map((item, idx) => (
                          <div key={item.id || idx} className={styles.quantifyCard}>
                            <div className={styles.quantifyHeader}>
                              <span className={styles.quantifyBadge}>
                                <Zap size={12} /> {item.type === 'project' ? 'Project' : 'Experience'} Bullet
                              </span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {item.metricsAdded}
                              </span>
                            </div>

                            <div className={styles.quantifyOriginal}>
                              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#ff6b6b', fontWeight: 700, marginBottom: '0.2rem' }}>
                                Before (Weak / Unquantified)
                              </div>
                              {item.original}
                            </div>

                            <div className={styles.quantifyRewrite}>
                              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#7cf9c4', fontWeight: 700, marginBottom: '0.2rem' }}>
                                After (Google XYZ Quantified)
                              </div>
                              {item.rewritten}
                            </div>

                            <button
                              type="button"
                              className={styles.quantifyActionBtn}
                              onClick={() => handleApplyRewrite(item.original, item.rewritten)}
                            >
                              <Check size={14} /> Apply XYZ Rewrite to Resume
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ATS SUB-TAB 3: RECRUITER 6-SECOND GLANCE */}
                  {labTab === 'recruiter' && (
                    <div className={styles.glanceContainer}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Recruiters spend an average of <strong>6 seconds</strong> reviewing a resume before making an initial shortlist decision.
                      </div>

                      {glance ? (
                        <div className={styles.glanceCard}>
                          <div
                            className={`${styles.glanceVerdictBox} ${
                              glance.recruiterVerdict?.status === 'LIKELY_SHORTLIST'
                                ? styles.glanceVerdictPass
                                : glance.recruiterVerdict?.status === 'BORDERLINE'
                                  ? styles.glanceVerdictBorderline
                                  : styles.glanceVerdictReject
                            }`}
                          >
                            <span>Verdict: {glance.recruiterVerdict?.badge || 'Review'}</span>
                            <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>Glance: ~6s</span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                            {glance.recruiterVerdict?.reason}
                          </div>

                          <div className={styles.glanceRow}>
                            <span className={styles.glanceLabel}>Target / Perceived Role</span>
                            <span className={styles.glanceVal}>{glance.currentOrTargetRole || 'Not specified'}</span>
                          </div>

                          <div className={styles.glanceRow}>
                            <span className={styles.glanceLabel}>Top Perceived Skills (6-Sec Window)</span>
                            <div className={styles.chipGroup} style={{ marginTop: '0.2rem' }}>
                              {(glance.topPerceivedSkills || []).map((skill) => (
                                <span key={skill} className={styles.chip}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.chipMuted} style={{ padding: '1rem', textAlign: 'center' }}>
                          Glance simulation is calculating...
                        </div>
                      )}
                    </div>
                  )}

                  {/* ATS SUB-TAB 4: INTERVIEW PREP */}
                  {labTab === 'interview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Questions generated by analyzing technical stack and claims listed on your resume.
                      </div>

                      {interviewList.length === 0 ? (
                        <div className={styles.chipMuted} style={{ padding: '1rem', textAlign: 'center' }}>
                          Add projects or skills to generate role-specific technical interview questions.
                        </div>
                      ) : (
                        interviewList.map((item, idx) => (
                          <div key={idx} className={styles.interviewCard}>
                            <div className={styles.interviewCategory}>{item.category || 'Technical Deep Dive'}</div>
                            <div className={styles.interviewPrompt}>{item.question}</div>
                            {item.targetProjectOrSkill && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                Target: <strong style={{ color: 'var(--accent)' }}>{item.targetProjectOrSkill}</strong>
                              </div>
                            )}
                            {item.interviewerLookFor && (
                              <div className={styles.interviewGuidance}>
                                <strong>What interviewers look for:</strong> {item.interviewerLookFor}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ATS SUB-TAB 5: RAW ATS STREAM */}
                  {labTab === 'rawAts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        This is how Enterprise ATS parsers (Workday, Taleo, Greenhouse, iCIMS) parse your resume into plaintext.
                      </div>

                      <div className={styles.buttonRow}>
                        <button
                          type="button"
                          className={`${styles.secondaryButton} ${styles.buttonCompact}`}
                          onClick={() => {
                            navigator.clipboard.writeText(rawStream || '')
                            setStatusMessage('Copied raw ATS text stream to clipboard.')
                          }}
                        >
                          <Copy size={14} /> Copy Raw ATS Text
                        </button>
                      </div>

                      <pre className={styles.rawTerminal}>
                        {rawStream || 'Raw ATS stream generating...'}
                      </pre>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* TAB 4: TARGET JOB MATCHER */}
            {activeWorkspaceTab === 'matcher' && (
              <div className={styles.jobMatcherPane}>
                <div className={styles.matcherCard}>
                  <div className={styles.matcherHeader}>
                    <div>
                      <h3 className={styles.designSectionTitle}>
                        <Target size={16} color="#E97852" />
                        <span>Target Job Matcher & Keyword Gap Analysis</span>
                      </h3>
                      <p className={styles.helperText} style={{ margin: '0.25rem 0 0' }}>
                        Paste any job post to detect matching keywords and missing skills. Click any missing skill to add it directly to your resume!
                      </p>
                    </div>

                    <button
                      type="button"
                      className={styles.exportMainBtn}
                      onClick={handleOptimizeResume}
                      disabled={isOptimizing}
                    >
                      <Sparkles size={14} />
                      <span>{isOptimizing ? 'Tailoring...' : 'Auto-Tailor Resume with AI'}</span>
                    </button>
                  </div>

                  {/* Hero Match Score Dial */}
                  <div className={styles.matcherScoreHero}>
                    <div
                      className={styles.matcherScoreDial}
                      style={{ '--match-score': keywordMatch }}
                    >
                      <div className={styles.matcherScoreDialInner}>{keywordMatch}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {keywordMatch >= 75
                          ? 'High Candidate Alignment'
                          : keywordMatch >= 50
                            ? 'Moderate Alignment'
                            : 'Significant Keyword Gaps'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {keywordMatch >= 75
                          ? 'Your resume contains most high-frequency keywords the ATS bot will screen for.'
                          : 'Adding 2-3 missing skills below will boost your visibility in automated ATS filters.'}
                      </div>
                    </div>
                  </div>

                  {/* Job Description Textarea */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Job Description (Paste from LinkedIn / Indeed)</label>
                    <textarea
                      className={`${styles.control} ${styles.textarea}`}
                      rows={6}
                      value={activeResume.jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description here..."
                    />
                  </div>

                  {/* Missing Keywords (Click to add) */}
                  <div>
                    <div className={styles.fieldLabel} style={{ marginBottom: '0.45rem' }}>
                      Missing Keywords from Job Post (Click to Add to Skills):
                    </div>
                    <div className={styles.matcherKeywordsGrid}>
                      {(report.missingKeywords || []).length > 0 ? (
                        report.missingKeywords.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            className={styles.missingKeywordChip}
                            onClick={() => {
                              addSkill(kw)
                              setStatusMessage(`Added "${kw}" to your skills!`)
                            }}
                            title={`Click to add "${kw}" to resume skills`}
                          >
                            <Plus size={12} />
                            <span>{kw}</span>
                          </button>
                        ))
                      ) : (
                        <span className={styles.chipMuted}>
                          {activeResume.jobDescription
                            ? 'Great job! No major missing keywords detected.'
                            : 'Paste a job description above to see missing skills.'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matched Keywords */}
                  <div>
                    <div className={styles.fieldLabel} style={{ marginBottom: '0.45rem' }}>
                      Keywords Already Matched in Resume:
                    </div>
                    <div className={styles.matcherKeywordsGrid}>
                      {(report.matchedKeywords || []).length > 0 ? (
                        report.matchedKeywords.map((kw) => (
                          <span key={kw} className={styles.matchedKeywordChip}>
                            <Check size={12} />
                            <span>{kw}</span>
                          </span>
                        ))
                      ) : (
                        <span className={styles.chipMuted}>No keyword matches yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SECTION ORGANIZER */}
            {activeWorkspaceTab === 'ordering' && (
              <div className={styles.sectionOrganizerPane}>
                <div className={styles.matcherCard}>
                  <div className={styles.matcherHeader}>
                    <div>
                      <h3 className={styles.designSectionTitle}>
                        <ArrowDownUp size={16} color="#E97852" />
                        <span>Resume Narrative Section Order</span>
                      </h3>
                      <p className={styles.helperText} style={{ margin: '0.25rem 0 0' }}>
                        Rearrange how sections flow on your live sheet and exported PDF.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {activeResume.sectionOrder.map((sectionId, idx) => {
                      const sectionDef =
                        RESUME_SECTION_LIBRARY.find((s) => s.id === sectionId) || {
                          label: sectionId,
                          description: '',
                        }
                      return (
                        <div key={sectionId} className={styles.sectionOrderCard}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {idx + 1}. {sectionDef.label}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              {sectionDef.description}
                            </div>
                          </div>

                          <div className={styles.sectionOrderActions}>
                            <button
                              type="button"
                              className={styles.btnOrderArrow}
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, idx - 1)}
                              title="Move section up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className={styles.btnOrderArrow}
                              disabled={idx === activeResume.sectionOrder.length - 1}
                              onClick={() => moveSection(idx, idx + 1)}
                              title="Move section down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* RIGHT COLUMN: LIVE RESUME PREVIEW SHEET */}
        {viewLayout !== 'editor' && (
          <aside className={styles.previewPane}>
            <div className={styles.previewPaneHeaderBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  A4 Page Preview
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  (794 × 1123 px standard)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  id="preview-quick-download-pdf"
                  type="button"
                  className={styles.previewQuickDownloadBtn}
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  title="Download High-Resolution A4 PDF"
                >
                  <Download size={12} />
                  <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
                </button>
                <button
                  id="preview-quick-print"
                  type="button"
                  className={styles.previewQuickPrintBtn}
                  onClick={handlePrint}
                  title="Print / Save as PDF (Vector ATS)"
                >
                  <Printer size={12} />
                  <span>Print</span>
                </button>
              </div>
            </div>
            <section className={styles.previewFrame}>
              <div className={styles.previewStage}>
                <ResumePreview
                  resume={activeResume}
                  sheetRef={previewSheetRef}
                  zoom={zoom}
                  customAccent={activeResume.customAccent}
                  customFont={activeResume.customFont}
                  showPageGuide={showPageGuide}
                />
              </div>
            </section>
          </aside>
        )}
      </div>

      {/* 48 TEMPLATES GALLERY MODAL (IF TRIGGERED) */}
      {isTemplateModalOpen && (
        <div
          className={styles.templateModalBackdrop}
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div
            className={styles.templateModalWindow}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.templateModalHeader}>
              <div className={styles.templateModalHeaderLeft}>
                <img
                  src={properCuteCat}
                  alt="Cat Mascot"
                  className={styles.templateModalCatIcon}
                />
                <div className={styles.templateModalTitleGroup}>
                  <h3 className={styles.templateModalTitle}>
                    <span>Resume Template Atelier</span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#B45309',
                        background: '#FEF3C7',
                        border: '1px solid #FDE68A',
                        padding: '1px 8px',
                        borderRadius: '999px',
                        fontWeight: 800,
                      }}
                    >
                      ⭐ 24 Top Recommended + 24 Atelier ♡
                    </span>
                  </h3>
                  <p className={styles.templateModalSub}>
                    Choose between our top recommended professional formats or atelier classics. Every template renders your live data instantly!
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.templateModalCloseBtn}
                onClick={() => setIsTemplateModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.templateModalBody}>
              <TemplateSelector
                activeTemplate={activeResume.template}
                onSelectTemplate={(templateId) => {
                  setTemplate(templateId)
                  setIsTemplateModalOpen(false)
                  setStatusMessage('Template applied.')
                }}
                showHeader={false}
              />
            </div>

            <div className={styles.templateModalFooter}>
              <span style={{ fontSize: '12px', color: '#756E66', fontWeight: 600 }}>
                Active: <strong style={{ color: '#E97852' }}>{currentTemplateConfig.name}</strong>
              </span>
              <button
                type="button"
                className={styles.templateModalDoneBtn}
                onClick={() => setIsTemplateModalOpen(false)}
              >
                Continue Editing &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeBuilder
