import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownUp,
  Copy,
  Download,
  FileText,
  LayoutTemplate,
  Menu,
  Moon,
  Plus,
  Printer,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import styles from './ResumeBuilder.module.css'
import ResumeForm from './ResumeForm'
import ResumePreview from './ResumePreview'
import TemplateSelector from './TemplateSelector'
import useResumeStore, { selectActiveResume, selectResumeVersions } from '../../store/resumeStore'
import {
  PREVIEW_MODES,
  RESUME_SECTION_LIBRARY,
  formatRelativeTime,
} from '../../utils/resumeBuilder'
import { analyzeResumeATS, optimizeResumeForJobDescription } from '../../utils/resumeAI'

const DRAWER_VIEWS = [
  {
    id: 'versions',
    label: 'Studio',
    title: 'Resume Studio',
    description: 'Rename the active resume, switch saved versions, and manage version history.',
    icon: FileText,
  },
  {
    id: 'templates',
    label: 'Templates',
    title: 'Template Direction',
    description: 'Switch the visual language of the resume without losing any content.',
    icon: LayoutTemplate,
  },
  {
    id: 'ordering',
    label: 'Section Order',
    title: 'Narrative Order',
    description: 'Rearrange the final reading flow of the resume and exported PDF.',
    icon: ArrowDownUp,
  },
  {
    id: 'optimization',
    label: 'ATS Lab',
    title: 'ATS Optimization',
    description: 'Paste a job description, inspect keyword fit, and apply AI-powered updates.',
    icon: Sparkles,
  },
]

const ResumeBuilder = () => {
  const previewSheetRef = useRef(null)
  const [draggedSectionId, setDraggedSectionId] = useState(null)
  const [activeDrawerView, setActiveDrawerView] = useState('versions')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Auto-save is active for this resume version.')

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
  const setTemplate = useResumeStore((state) => state.setTemplate)
  const setPreviewMode = useResumeStore((state) => state.setPreviewMode)
  const setJobDescription = useResumeStore((state) => state.setJobDescription)
  const setAtsReport = useResumeStore((state) => state.setAtsReport)
  const replaceFormData = useResumeStore((state) => state.replaceFormData)
  const moveSection = useResumeStore((state) => state.moveSection)

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  useEffect(() => {
    if (!activeResume) {
      return undefined
    }

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

  if (!activeResume) {
    return null
  }

  const currentDrawerView =
    DRAWER_VIEWS.find((view) => view.id === activeDrawerView) || DRAWER_VIEWS[0]
  const isDarkMode = activeResume.previewMode === 'dark'

  const openDrawer = (viewId) => {
    setActiveDrawerView(viewId)
    setIsSidebarOpen(true)
  }

  const handleResumeSwitch = (resumeId) => {
    setActiveResume(resumeId)
    const targetResume = resumeVersions.find((resume) => resume.id === resumeId)
    setStatusMessage(`Switched to ${targetResume?.name || 'the selected resume'}.`)
  }

  const handleCreateVersion = () => {
    createResumeVersion(`Resume ${resumeVersions.length + 1}`)
    setStatusMessage('A new resume version is ready for editing.')
  }

  const handleDuplicateResume = () => {
    duplicateActiveResume()
    setStatusMessage('The active resume was duplicated as a new saved version.')
  }

  const handleTemplateSelect = (templateId) => {
    setTemplate(templateId)
    setStatusMessage('Template applied to the live preview.')
  }

  const handlePreviewModeChange = (modeId) => {
    setPreviewMode(modeId)
    setStatusMessage(`${modeId === 'dark' ? 'Dark' : 'Light'} workspace activated.`)
  }

  const handleOptimizeResume = async () => {
    if (!activeResume.jobDescription.trim()) {
      setStatusMessage('Paste a job description first to run resume optimization.')
      openDrawer('optimization')
      return
    }

    setIsOptimizing(true)
    setStatusMessage('Optimizing the active resume for the pasted job description...')

    try {
      const result = await optimizeResumeForJobDescription({
        resumeData: activeResume.formData,
        jobDescription: activeResume.jobDescription,
      })

      replaceFormData(result.optimizedData)
      setAtsReport(result.atsReport)
      setStatusMessage('Optimization applied. Summary, skills, and bullets were refreshed.')
    } catch (error) {
      console.error('Resume optimization failed:', error)
      setStatusMessage('Unable to optimize the resume right now. Please try again.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleExportPdf = async () => {
    const previewSheet = previewSheetRef.current

    if (!previewSheet) {
      setStatusMessage('Resume preview is still loading.')
      return
    }

    setIsExporting(true)
    setStatusMessage('Exporting PDF...')

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const captureViewportWidth = Math.max(
        Math.round(window.visualViewport?.width || window.innerWidth || 0),
        1200
      )
      const captureViewportHeight = Math.max(
        Math.round(window.visualViewport?.height || window.innerHeight || 0),
        previewSheet.clientHeight
      )

      const canvas = await html2canvas(previewSheet, {
        scale: Math.max(window.devicePixelRatio || 1, 2),
        useCORS: true,
        backgroundColor: activeResume.previewMode === 'dark' ? '#111821' : '#ffffff',
        windowWidth: captureViewportWidth,
        windowHeight: captureViewportHeight,
        width: previewSheet.scrollWidth,
        height: previewSheet.scrollHeight,
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = 210
      const pdfHeight = 297
      const margin = 8
      const contentWidth = pdfWidth - margin * 2
      const contentHeight = pdfHeight - margin * 2
      const imageHeight = (canvas.height * contentWidth) / canvas.width
      let remainingHeight = imageHeight
      let currentY = margin

      pdf.addImage(imageData, 'PNG', margin, currentY, contentWidth, imageHeight)
      remainingHeight -= contentHeight

      while (remainingHeight > 0) {
        currentY = margin - (imageHeight - remainingHeight)
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', margin, currentY, contentWidth, imageHeight)
        remainingHeight -= contentHeight
      }

      const fileName =
        (activeResume.formData.personal.name || activeResume.name || 'rexion-resume')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'rexion-resume'

      pdf.save(`${fileName}.pdf`)
      setStatusMessage('PDF exported successfully.')
    } catch (error) {
      console.error('PDF export failed:', error)
      setStatusMessage('PDF export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
    setStatusMessage('Print dialog opened for the active resume preview.')
  }

  const handleDeleteActiveResume = () => {
    const shouldDelete = window.confirm(
      `Delete "${activeResume.name}"? Your other saved versions will remain intact.`
    )

    if (!shouldDelete) {
      return
    }

    deleteActiveResume()
    setStatusMessage('Resume version removed. Your remaining versions are still saved locally.')
  }

  const handleSectionDrop = (targetSectionId) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      return
    }

    const sourceIndex = activeResume.sectionOrder.findIndex((sectionId) => sectionId === draggedSectionId)
    const targetIndex = activeResume.sectionOrder.findIndex((sectionId) => sectionId === targetSectionId)

    moveSection(sourceIndex, targetIndex)
    setDraggedSectionId(null)
    setStatusMessage('Section order updated in the live preview.')
  }

  const renderDrawerContent = () => {
    if (currentDrawerView.id === 'versions') {
      return (
        <div className={styles.drawerStack}>
          <section className={styles.drawerSection}>
            <div className={styles.drawerSectionHeader}>
              <h3 className={styles.drawerSectionTitle}>Resume versions</h3>
              <p className={styles.helperText}>
                Everything here is saved locally, so you can keep multiple tailored resumes ready.
              </p>
            </div>

            <div className={styles.drawerSectionBody}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Active version</label>
                <select
                  className={`${styles.control} ${styles.versionSelect}`}
                  value={activeResume.id}
                  onChange={(event) => handleResumeSwitch(event.target.value)}
                >
                  {resumeVersions.map((resumeVersion) => (
                    <option key={resumeVersion.id} value={resumeVersion.id}>
                      {resumeVersion.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Version name</label>
                <input
                  className={`${styles.control} ${styles.resumeNameInput}`}
                  value={activeResume.name}
                  onChange={(event) => renameActiveResume(event.target.value)}
                  placeholder="Resume version name"
                />
              </div>

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={`${styles.secondaryButton} ${styles.buttonCompact}`}
                  onClick={handleCreateVersion}
                >
                  <Plus size={16} />
                  New Version
                </button>
                <button
                  type="button"
                  className={`${styles.ghostButton} ${styles.buttonCompact}`}
                  onClick={handleDuplicateResume}
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <button
                  type="button"
                  className={`${styles.dangerButton} ${styles.buttonCompact}`}
                  onClick={handleDeleteActiveResume}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </section>
        </div>
      )
    }

    if (currentDrawerView.id === 'templates') {
      return (
        <TemplateSelector
          activeTemplate={activeResume.template}
          onSelectTemplate={handleTemplateSelect}
          showHeader={false}
        />
      )
    }

    if (currentDrawerView.id === 'ordering') {
      return (
        <section className={styles.drawerSection}>
          <div className={styles.drawerSectionHeader}>
            <h3 className={styles.drawerSectionTitle}>Section order</h3>
            <p className={styles.helperText}>
              Drag items to control the reading flow of the preview and exported resume.
            </p>
          </div>

          <div className={styles.sectionOrderList}>
            {activeResume.sectionOrder
              .map((sectionId) =>
                RESUME_SECTION_LIBRARY.find((section) => section.id === sectionId)
              )
              .filter(Boolean)
              .map((section, index) => {
                const isDragged = draggedSectionId === section.id

                return (
                  <motion.div
                    key={section.id}
                    layout
                    draggable
                    className={`${styles.sectionOrderItem} ${
                      isDragged ? styles.sectionOrderItemActive : ''
                    }`}
                    onDragStart={() => setDraggedSectionId(section.id)}
                    onDragEnd={() => setDraggedSectionId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleSectionDrop(section.id)}
                  >
                    <span className={styles.orderIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderTitle}>{section.label}</span>
                      <span className={styles.orderDescription}>{section.description}</span>
                    </div>
                    <span className={styles.dragHandle}>:::</span>
                  </motion.div>
                )
              })}
          </div>
        </section>
      )
    }

    return (
      <section className={styles.drawerSection}>
        <div className={styles.drawerSectionHeader}>
          <div>
            <h3 className={styles.drawerSectionTitle}>ATS optimization</h3>
            <p className={styles.helperText}>
              Paste a job description to score alignment, surface gaps, and refresh resume language.
            </p>
          </div>
          <span className={styles.statusInline}>{isAnalyzing ? 'Analyzing...' : 'Live analysis'}</span>
        </div>

        <div className={styles.atsLayout}>
          <div className={styles.atsTopline}>
            <div
              className={styles.scoreDial}
              style={{
                '--score-progress': Math.round(activeResume.atsReport.score || 0),
                '--score-accent':
                  (activeResume.atsReport.score || 0) >= 80
                    ? '#7cf9c4'
                    : (activeResume.atsReport.score || 0) >= 60
                      ? '#00e5ff'
                      : '#ffc857',
              }}
            >
              <div className={styles.scoreRing} />
              <div className={styles.scoreValue}>{Math.round(activeResume.atsReport.score || 0)}</div>
            </div>

            <div className={styles.scoreMeta}>
              <div className={styles.scoreTitle}>ATS readiness</div>
              <div className={styles.scoreSummary}>
                Keywords, formatting hygiene, and section completeness are all factored into this
                score.
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Job description</label>
            <textarea
              className={`${styles.control} ${styles.textarea}`}
              value={activeResume.jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description here to analyze role keywords, missing terms, and optimization opportunities."
            />
          </div>

          <div className={styles.metricInline}>
            <div className={styles.metricInlineItem}>
              <span className={styles.metricInlineValue}>
                {Math.round(activeResume.atsReport.keywordMatch || 0)}%
              </span>
              <span className={styles.metricInlineLabel}>Keyword match</span>
            </div>
            <div className={styles.metricInlineItem}>
              <span className={styles.metricInlineValue}>
                {Math.round(activeResume.atsReport.completeness || 0)}%
              </span>
              <span className={styles.metricInlineLabel}>Completeness</span>
            </div>
            <div className={styles.metricInlineItem}>
              <span className={styles.metricInlineValue}>
                {activeResume.atsReport.formattingIssues.length}
              </span>
              <span className={styles.metricInlineLabel}>Formatting issues</span>
            </div>
          </div>

          <div>
            <div className={styles.helperText}>Matched keywords</div>
            <div className={styles.chipGroup}>
              {activeResume.atsReport.matchedKeywords.length > 0 ? (
                activeResume.atsReport.matchedKeywords.map((keyword) => (
                  <span key={keyword} className={styles.chip}>
                    {keyword}
                  </span>
                ))
              ) : (
                <span className={styles.chipMuted}>Paste a job description to unlock keyword analysis.</span>
              )}
            </div>
          </div>

          <div>
            <div className={styles.helperText}>Missing keywords</div>
            <div className={styles.chipGroup}>
              {activeResume.atsReport.missingKeywords.length > 0 ? (
                activeResume.atsReport.missingKeywords.map((keyword) => (
                  <span key={keyword} className={styles.chipWarning}>
                    {keyword}
                  </span>
                ))
              ) : (
                <span className={styles.chipMuted}>No critical gaps detected yet.</span>
              )}
            </div>
          </div>

          <div>
            <div className={styles.helperText}>Suggested improvements</div>
            <ul className={styles.list}>
              {activeResume.atsReport.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>

          {activeResume.atsReport.formattingIssues.length > 0 ? (
            <div>
              <div className={styles.helperText}>Formatting issues</div>
              <ul className={styles.list}>
                {activeResume.atsReport.formattingIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.primaryButton} ${styles.buttonCompact}`}
              onClick={handleOptimizeResume}
              disabled={isOptimizing}
            >
              <Sparkles size={16} />
              {isOptimizing ? 'Optimizing...' : 'Optimize Resume'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div
      className={`${styles.builderShell} ${
        isDarkMode ? styles.workspaceThemeDark : styles.workspaceThemeLight
      }`}
    >
      <AnimatePresence initial={false}>
        {isSidebarOpen ? (
          <>
            <motion.button
              type="button"
              className={styles.drawerBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close studio drawer"
            />

            <motion.aside
              className={styles.drawer}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              <div className={styles.drawerHeader}>
                <div>
                  <span className={styles.drawerEyebrow}>Studio controls</span>
                  <h2 className={styles.drawerTitle}>{currentDrawerView.title}</h2>
                  <p className={styles.drawerDescription}>{currentDrawerView.description}</p>
                </div>

                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.buttonCompact}`}
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>

              <div className={styles.drawerNav}>
                {DRAWER_VIEWS.map((view) => {
                  const Icon = view.icon
                  const isActive = view.id === currentDrawerView.id

                  return (
                    <button
                      key={view.id}
                      type="button"
                      className={`${styles.drawerNavItem} ${
                        isActive ? styles.drawerNavItemActive : ''
                      }`}
                      onClick={() => setActiveDrawerView(view.id)}
                    >
                      <Icon size={16} />
                      <span className={styles.drawerNavText}>{view.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className={styles.drawerBody}>{renderDrawerContent()}</div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open studio drawer"
          >
            <Menu size={18} />
          </button>

          <div className={styles.brandBlock}>
            <span className={styles.brandEyebrow}>REXION Resume Atelier</span>
            <div className={styles.brandTitle}>Draft on the left. Review the final sheet on the right.</div>
          </div>
        </div>

        <div className={styles.topBarCenter}>
          <div className={styles.fieldInline}>
            <label className={styles.fieldInlineLabel}>Version</label>
            <select
              className={`${styles.control} ${styles.versionSelect}`}
              value={activeResume.id}
              onChange={(event) => handleResumeSwitch(event.target.value)}
            >
              {resumeVersions.map((resumeVersion) => (
                <option key={resumeVersion.id} value={resumeVersion.id}>
                  {resumeVersion.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldInlineWide}>
            <label className={styles.fieldInlineLabel}>Resume name</label>
            <input
              className={`${styles.control} ${styles.resumeNameInput}`}
              value={activeResume.name}
              onChange={(event) => renameActiveResume(event.target.value)}
              placeholder="Resume version name"
            />
          </div>
        </div>

        <div className={styles.topBarRight}>
          <div className={styles.previewToggleGroup}>
            {PREVIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`${styles.previewToggle} ${
                  activeResume.previewMode === mode.id ? styles.previewToggleActive : ''
                }`}
                onClick={() => handlePreviewModeChange(mode.id)}
              >
                {mode.id === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                {mode.id === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.buttonCompact}`}
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print
          </button>

          <button
            type="button"
            className={`${styles.primaryButton} ${styles.buttonCompact}`}
            onClick={handleExportPdf}
            disabled={isExporting}
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div className={styles.statusStrip}>
        <div className={styles.workspaceLinks}>
          <button type="button" className={styles.workspaceLink} onClick={() => openDrawer('templates')}>
            <LayoutTemplate size={15} />
            Templates
          </button>
          <button type="button" className={styles.workspaceLink} onClick={() => openDrawer('ordering')}>
            <ArrowDownUp size={15} />
            Section Order
          </button>
          <button
            type="button"
            className={styles.workspaceLink}
            onClick={() => openDrawer('optimization')}
          >
            <Sparkles size={15} />
            ATS Lab
          </button>
        </div>

        <div className={styles.studioStats}>
          <div className={styles.studioStat}>
            <span className={styles.studioStatValue}>{Math.round(activeResume.atsReport.score || 0)}%</span>
            <span className={styles.studioStatLabel}>ATS score</span>
          </div>
          <div className={styles.studioStat}>
            <span className={styles.studioStatValue}>
              {Math.round(activeResume.atsReport.keywordMatch || 0)}%
            </span>
            <span className={styles.studioStatLabel}>Keyword match</span>
          </div>
          <div className={styles.studioStat}>
            <span className={styles.studioStatValue}>{formatRelativeTime(activeResume.updatedAt)}</span>
            <span className={styles.studioStatLabel}>Last saved</span>
          </div>
        </div>

        <div className={styles.inlineStatus}>{statusMessage}</div>
      </div>

      <div className={styles.splitShell}>
        <section className={styles.editorPane}>
          <div className={styles.editorIntro}>
            <span className={styles.leadKicker}>Editor workspace</span>
            <h2 className={styles.leadTitle}>
              Personal info, summary, skills, and experience all update live while you type.
            </h2>
            <p className={styles.leadText}>
              Use the studio drawer for template changes, section order, and ATS optimization without
              leaving the editor.
            </p>
          </div>

          <ResumeForm resume={activeResume} />
        </section>

        <aside className={styles.previewPane}>
          <section className={styles.previewFrame}>
            <div className={styles.previewHeader}>
              <div className={styles.previewInfo}>
                <span className={styles.previewLabel}>Live preview</span>
                <h2 className={styles.previewTitle}>
                  {activeResume.formData.personal.name || activeResume.name}
                </h2>
                <div className={styles.previewMeta}>
                  <span className={styles.previewMetaStrong}>{activeResume.template}</span>
                  <span>{activeResume.previewMode} mode</span>
                  <span>{activeResume.sectionOrder.length} sections</span>
                </div>
              </div>

              <div className={styles.previewHeaderStats}>
                <span className={styles.previewBadge}>
                  ATS {Math.round(activeResume.atsReport.score || 0)}
                </span>
                <span className={styles.previewBadge}>
                  {resumeVersions.length} version{resumeVersions.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className={styles.previewStage}>
              <ResumePreview resume={activeResume} sheetRef={previewSheetRef} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default ResumeBuilder
