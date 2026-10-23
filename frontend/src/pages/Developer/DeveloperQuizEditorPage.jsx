import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Eye, CheckCircle2, AlertTriangle,
  Plus, UploadCloud, ChevronUp, ChevronDown, Copy,
  Trash2, Edit3, Clock, Award, ShieldAlert, BookOpen,
  Code2, Check, RefreshCw, Sparkles, Tag, Archive
} from 'lucide-react'
import developerApi from '../../services/developerApi'
import QuestionBuilderModal from './QuestionBuilderModal'
import BulkImportModal from './BulkImportModal'
import styles from './DeveloperQuizEditorPage.module.css'

const CATEGORIES = [
  { id: 'dsa', name: 'Data Structures & Algorithms' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'react', name: 'React' },
  { id: 'nodejs', name: 'Node.js' },
  { id: 'express', name: 'Express.js' },
  { id: 'mongodb', name: 'MongoDB' },
  { id: 'mern', name: 'MERN Stack' },
  { id: 'python', name: 'Python' },
  { id: 'ai_ml', name: 'AI & Machine Learning' },
  { id: 'sql', name: 'SQL & Databases' },
  { id: 'system_design', name: 'System Design' },
  { id: 'oop', name: 'Object-Oriented Programming' },
  { id: 'networks', name: 'Computer Networks' },
  { id: 'os', name: 'Operating Systems' },
  { id: 'aptitude', name: 'Aptitude & Reasoning' },
  { id: 'interview_prep', name: 'Interview Preparation' }
]

export default function DeveloperQuizEditorPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Quiz form state
  const [quiz, setQuiz] = useState(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('javascript')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [domain, setDomain] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(15)
  const [passingScore, setPassingScore] = useState(70)
  const [negativeMarking, setNegativeMarking] = useState(false)
  const [randomizeQuestions, setRandomizeQuestions] = useState(false)
  const [showExplanations, setShowExplanations] = useState(true)
  const [technologies, setTechnologies] = useState([])
  const [techInput, setTechInput] = useState('')

  // Questions state
  const [questions, setQuestions] = useState([])
  const [activeTab, setActiveTab] = useState('questions') // 'questions' or 'settings'

  // Modal controls
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1)
  const [modalSaving, setModalSaving] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [bulkImporting, setBulkImporting] = useState(false)

  const loadQuiz = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await developerApi.getQuizById(quizId)
      if (res.success && res.quiz) {
        const q = res.quiz
        setQuiz(q)
        setTitle(q.title || '')
        setSlug(q.slug || '')
        setCategory(q.category || 'javascript')
        setDifficulty(q.difficulty || 'Intermediate')
        setDescription(q.description || '')
        setInstructions(q.instructions || '')
        setDomain(q.domain || '')
        setDurationMinutes(q.durationMinutes || 15)
        setPassingScore(q.passingScore || 70)
        setNegativeMarking(!!q.negativeMarking)
        setRandomizeQuestions(!!q.randomizeQuestions)
        setShowExplanations(q.showExplanations !== false)
        setTechnologies(Array.isArray(q.technologies) ? q.technologies : [])
        setQuestions(Array.isArray(q.questions) ? q.questions : (Array.isArray(q.questionPool) ? q.questionPool : []))
      }
    } catch (err) {
      setError(err.message || 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  // Tech tags handling
  const handleAddTech = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = techInput.trim().replace(/^,+|,+$/g, '')
      if (val && !technologies.includes(val)) {
        setTechnologies([...technologies, val])
      }
      setTechInput('')
    }
  }

  const handleRemoveTech = (tag) => {
    setTechnologies(technologies.filter(t => t !== tag))
  }

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault()
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Quiz title cannot be empty.' })
      return
    }

    try {
      setSavingSettings(true)
      setFeedback(null)
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        category,
        difficulty,
        description: description.trim(),
        instructions: instructions.trim(),
        domain: domain.trim(),
        durationMinutes: Number(durationMinutes) || 15,
        passingScore: Number(passingScore) || 70,
        negativeMarking,
        randomizeQuestions,
        showExplanations,
        technologies
      }
      const res = await developerApi.updateQuiz(quizId, payload)
      if (res.success) {
        setQuiz(res.quiz)
        setFeedback({ type: 'success', message: 'Quiz settings saved successfully.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings' })
    } finally {
      setSavingSettings(false)
    }
  }

  // Publish Quiz
  const handlePublishQuiz = async () => {
    if (questions.length === 0) {
      setFeedback({ type: 'error', message: 'Cannot publish a quiz with 0 questions. Add questions first.' })
      return
    }

    const confirm = window.confirm(
      quiz?.status === 'published'
        ? `Publish an updated version (v${(quiz.version || 1) + 1})? Historical student attempts will stay locked to their attempted version.`
        : `Publish "${title}" to Career Hub now? Students will be able to take it immediately.`
    )
    if (!confirm) return

    try {
      setPublishing(true)
      setFeedback(null)
      const res = await developerApi.publishQuiz(quizId)
      if (res.success) {
        setQuiz(res.quiz)
        setFeedback({
          type: 'success',
          message: `Quiz published successfully (v${res.quiz.version})! It is now live in Career Hub.`
        })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Publishing failed.' })
    } finally {
      setPublishing(false)
    }
  }

  // Archive Quiz
  const handleArchiveQuiz = async () => {
    const confirm = window.confirm(`Archive this quiz? It will be removed from new Career Hub listings.`)
    if (!confirm) return

    try {
      const res = await developerApi.archiveQuiz(quizId)
      if (res.success) {
        setQuiz(res.quiz)
        setFeedback({ type: 'success', message: 'Quiz archived.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to archive quiz' })
    }
  }

  // Question Modal Save (Add or Edit)
  const handleSaveQuestion = async (questionPayload) => {
    try {
      setModalSaving(true)
      if (editingQuestion) {
        const qId = editingQuestion._id || editingQuestion.id
        const res = await developerApi.updateQuestion(quizId, qId, questionPayload)
        if (res.success) {
          setQuiz(res.quiz)
          setQuestions(res.quiz.questions || [])
          setBuilderOpen(false)
          setEditingQuestion(null)
          setFeedback({ type: 'success', message: 'Question updated.' })
        }
      } else {
        const res = await developerApi.addQuestion(quizId, questionPayload)
        if (res.success) {
          setQuiz(res.quiz)
          setQuestions(res.quiz.questions || [])
          setBuilderOpen(false)
          setFeedback({ type: 'success', message: 'Question added to quiz.' })
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save question.' })
    } finally {
      setModalSaving(false)
    }
  }

  // Delete Question
  const handleDeleteQuestion = async (question) => {
    const confirm = window.confirm('Delete this question from the quiz?')
    if (!confirm) return

    try {
      const qId = question._id || question.id
      const res = await developerApi.deleteQuestion(quizId, qId)
      if (res.success) {
        setQuiz(res.quiz)
        setQuestions(res.quiz.questions || [])
        setFeedback({ type: 'success', message: 'Question removed.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete question.' })
    }
  }

  // Duplicate Question
  const handleDuplicateQuestion = async (question) => {
    try {
      const qId = question._id || question.id
      const res = await developerApi.duplicateQuestion(quizId, qId)
      if (res.success) {
        setQuiz(res.quiz)
        setQuestions(res.quiz.questions || [])
        setFeedback({ type: 'success', message: 'Question duplicated.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to duplicate question.' })
    }
  }

  // Reorder Questions (Move Up / Down)
  const handleMoveQuestion = async (index, direction) => {
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= questions.length) return

    const reordered = [...questions]
    const temp = reordered[index]
    reordered[index] = reordered[targetIdx]
    reordered[targetIdx] = temp

    setQuestions(reordered)

    try {
      const questionIds = reordered.map(q => q._id || q.id)
      await developerApi.reorderQuestions(quizId, questionIds)
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to persist question reordering.' })
      loadQuiz()
    }
  }

  // Bulk Import
  const handleBulkImport = async (importedList) => {
    try {
      setBulkImporting(true)
      const res = await developerApi.importQuestions(quizId, importedList)
      if (res.success) {
        setQuiz(res.quiz)
        setQuestions(res.quiz.questions || [])
        setBulkImportOpen(false)
        setFeedback({
          type: 'success',
          message: `Successfully imported ${res.importedCount || importedList.length} questions into quiz!`
        })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Bulk import failed.' })
    } finally {
      setBulkImporting(false)
    }
  }

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <RefreshCw size={28} className={styles.spin} />
        <p>Loading quiz editor...</p>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className={styles.errorWrapper}>
        <AlertTriangle size={32} color="#DC2626" />
        <h2>Unable to load quiz</h2>
        <p>{error || 'Quiz not found'}</p>
        <button onClick={() => navigate('/developer/quizzes')} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Quizzes
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Top Bar Navigation & Actions */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            onClick={() => navigate('/developer/quizzes')}
            className={styles.backLink}
          >
            <ArrowLeft size={16} />
            <span>Quizzes</span>
          </button>
          <div className={styles.divider} />
          <h1 className={styles.quizHeaderTitle}>{title || 'Untitled Quiz'}</h1>
          <span className={`${styles.statusBadge} ${styles[quiz.status || 'draft']}`}>
            {quiz.status || 'draft'}
          </span>
          <span className={styles.versionBadge}>v{quiz.version || 1}</span>
        </div>

        <div className={styles.topBarRight}>
          <button
            className={styles.previewBtn}
            onClick={() => navigate(`/developer/quizzes/${quizId}/preview`)}
            title="Open Student Preview Mode"
          >
            <Eye size={16} />
            Preview
          </button>

          {activeTab === 'settings' && (
            <button
              className={styles.saveSettingsBtn}
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              <Save size={16} />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          )}

          {quiz.status === 'published' ? (
            <div className={styles.publishedActionGroup}>
              <button
                className={styles.publishBtn}
                onClick={handlePublishQuiz}
                disabled={publishing}
              >
                <Sparkles size={15} />
                {publishing ? 'Publishing...' : 'Publish Update (v' + ((quiz.version || 1) + 1) + ')'}
              </button>
              <button
                className={styles.archiveActionBtn}
                onClick={handleArchiveQuiz}
                title="Archive Quiz"
              >
                <Archive size={16} />
              </button>
            </div>
          ) : (
            <button
              className={styles.publishBtn}
              onClick={handlePublishQuiz}
              disabled={publishing || questions.length === 0}
            >
              <CheckCircle2 size={16} />
              {publishing ? 'Publishing...' : 'Publish to Career Hub'}
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`${styles.feedbackBanner} ${styles[feedback.type]}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.editorTabs}>
        <button
          className={`${styles.editorTab} ${activeTab === 'questions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <BookOpen size={16} />
          Questions ({questions.length})
        </button>
        <button
          className={`${styles.editorTab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Tag size={16} />
          Quiz Settings & Rules
        </button>
      </div>

      {/* TAB 1: QUESTIONS MANAGEMENT */}
      {activeTab === 'questions' && (
        <div className={styles.questionsPanel}>
          {/* Summary / Action Header */}
          <div className={styles.panelHeader}>
            <div className={styles.statsSummary}>
              <div className={styles.statChip}>
                <strong>{questions.length}</strong> questions
              </div>
              <div className={styles.statChip}>
                <strong>{totalMarks}</strong> total marks
              </div>
              <div className={styles.statChip}>
                Passing score: <strong>{passingScore}%</strong>
              </div>
              {negativeMarking && (
                <div className={`${styles.statChip} ${styles.negativeChip}`}>
                  Negative marking active
                </div>
              )}
            </div>

            <div className={styles.questionActions}>
              <button
                className={styles.bulkBtn}
                onClick={() => setBulkImportOpen(true)}
              >
                <UploadCloud size={16} />
                Bulk Import (JSON / CSV)
              </button>
              <button
                className={styles.addQuestionBtn}
                onClick={() => {
                  setEditingQuestion(null)
                  setEditingQuestionIndex(-1)
                  setBuilderOpen(true)
                }}
              >
                <Plus size={16} />
                Add Question
              </button>
            </div>
          </div>

          {/* Question List */}
          {questions.length === 0 ? (
            <div className={styles.emptyQuestions}>
              <BookOpen size={44} color="#D5C8B8" />
              <h3>This quiz has no questions yet</h3>
              <p>Add questions manually using the Question Builder or import them in bulk using JSON / CSV.</p>
              <div className={styles.emptyBtns}>
                <button
                  className={styles.addQuestionBtn}
                  onClick={() => {
                    setEditingQuestion(null)
                    setEditingQuestionIndex(-1)
                    setBuilderOpen(true)
                  }}
                >
                  <Plus size={16} />
                  Add First Question
                </button>
                <button
                  className={styles.bulkBtn}
                  onClick={() => setBulkImportOpen(true)}
                >
                  <UploadCloud size={16} />
                  Bulk Import Questions
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.questionCardList}>
              {questions.map((q, idx) => {
                const qType = q.type || 'single_choice'
                const isFirst = idx === 0
                const isLast = idx === questions.length - 1

                return (
                  <div key={q._id || q.id || idx} className={styles.questionCard}>
                    {/* Reorder and numbering */}
                    <div className={styles.cardLeft}>
                      <span className={styles.questionIndex}>#{idx + 1}</span>
                      <div className={styles.reorderBtns}>
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveQuestion(idx, -1)}
                          className={styles.moveBtn}
                          title="Move Up"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveQuestion(idx, 1)}
                          className={styles.moveBtn}
                          title="Move Down"
                        >
                          <ChevronDown size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className={styles.cardCenter}>
                      <div className={styles.cardPills}>
                        <span className={styles.pillType}>{qType.replace('_', ' ')}</span>
                        <span className={styles.pillDiff}>{q.difficulty || 'Intermediate'}</span>
                        <span className={styles.pillMarks}>+{q.marks || 1} mark{q.marks === 1 ? '' : 's'}</span>
                        {q.negativeMarks > 0 && (
                          <span className={styles.pillNeg}>-{q.negativeMarks}</span>
                        )}
                        {q.topic && <span className={styles.pillTopic}>{q.topic}</span>}
                      </div>

                      <div className={styles.questionTextPreview}>
                        {q.question}
                      </div>

                      {q.code && (
                        <div className={styles.codeSnippetBox}>
                          <pre><code>{q.code}</code></pre>
                        </div>
                      )}

                      {/* Options Preview */}
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className={styles.optionsPreviewGrid}>
                          {q.options.map((opt, oIdx) => {
                            const isCorrectSingle = qType !== 'multiple_select' && q.correctIndex === oIdx
                            const isCorrectMulti = qType === 'multiple_select' && Array.isArray(q.correctIndices) && q.correctIndices.includes(oIdx)
                            const isCorrect = isCorrectSingle || isCorrectMulti
                            return (
                              <div
                                key={oIdx}
                                className={`${styles.optionPreviewItem} ${isCorrect ? styles.correctOption : ''}`}
                              >
                                <span className={styles.optLetter}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className={styles.optText}>{opt}</span>
                                {isCorrect && <Check size={14} className={styles.correctIcon} />}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Short Answer Preview */}
                      {qType === 'short_answer' && (
                        <div className={styles.shortAnswerPreview}>
                          Expected Answer: <strong>"{q.correctAnswer}"</strong>
                        </div>
                      )}

                      {q.explanation && (
                        <div className={styles.explanationPreview}>
                          💡 <em>{q.explanation}</em>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={styles.cardRight}>
                      <button
                        className={styles.actionIconBtn}
                        onClick={() => {
                          setEditingQuestion(q)
                          setEditingQuestionIndex(idx)
                          setBuilderOpen(true)
                        }}
                        title="Edit Question"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        className={styles.actionIconBtn}
                        onClick={() => handleDuplicateQuestion(q)}
                        title="Duplicate Question"
                      >
                        <Copy size={15} />
                      </button>

                      <button
                        className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                        onClick={() => handleDeleteQuestion(q)}
                        title="Delete Question"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SETTINGS & RULES */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className={styles.settingsForm}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionHeading}>Basic Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.fieldFull}>
                <label>Quiz Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Advanced TypeScript Generics & Type Gymnastics"
                  required
                />
              </div>

              <div className={styles.fieldHalf}>
                <label>URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="advanced-typescript-generics"
                />
                <span className={styles.fieldHint}>Used for direct routing in Career Hub.</span>
              </div>

              <div className={styles.fieldHalf}>
                <label>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldHalf}>
                <label>Overall Difficulty *</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className={styles.fieldHalf}>
                <label>Technical Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="Frontend Engineering, Backend Infrastructure, etc."
                />
              </div>

              <div className={styles.fieldFull}>
                <label>Short Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Summarize the learning goals, target audience, and scope of this quiz..."
                />
              </div>

              <div className={styles.fieldFull}>
                <label>Detailed Instructions & Guidelines</label>
                <textarea
                  rows={4}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Shown to students before starting the test (e.g. No calculators, scratchpad permitted)..."
                />
              </div>

              <div className={styles.fieldFull}>
                <label>Relevant Technologies (Tags)</label>
                <div className={styles.techInputWrap}>
                  <input
                    type="text"
                    value={techInput}
                    onChange={e => setTechInput(e.target.value)}
                    onKeyDown={handleAddTech}
                    placeholder="Type technology and press Enter (e.g. typescript, async-await)"
                  />
                  <div className={styles.tagsList}>
                    {technologies.map(tag => (
                      <span key={tag} className={styles.tagBadge}>
                        {tag}
                        <button type="button" onClick={() => handleRemoveTech(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionHeading}>Assessment Scoring & Behavior</h3>
            <div className={styles.formGrid}>
              <div className={styles.fieldHalf}>
                <label>Time Limit (Minutes)</label>
                <input
                  type="number"
                  min="3"
                  max="180"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value)}
                />
              </div>

              <div className={styles.fieldHalf}>
                <label>Passing Score Percentage (%)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={passingScore}
                  onChange={e => setPassingScore(e.target.value)}
                />
              </div>

              <div className={styles.fieldFull}>
                <div className={styles.toggleRow}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={negativeMarking}
                      onChange={e => setNegativeMarking(e.target.checked)}
                      className={styles.toggleCheckbox}
                    />
                    <div>
                      <span className={styles.toggleTitle}>Enable Negative Marking</span>
                      <p className={styles.toggleDesc}>
                        Deducts points for incorrect answers according to each question's configured negative mark value.
                      </p>
                    </div>
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={randomizeQuestions}
                      onChange={e => setRandomizeQuestions(e.target.checked)}
                      className={styles.toggleCheckbox}
                    />
                    <div>
                      <span className={styles.toggleTitle}>Randomize Question Order</span>
                      <p className={styles.toggleDesc}>
                        Shuffles questions differently for each student attempting the quiz.
                      </p>
                    </div>
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={showExplanations}
                      onChange={e => setShowExplanations(e.target.checked)}
                      className={styles.toggleCheckbox}
                    />
                    <div>
                      <span className={styles.toggleTitle}>Show Solution Explanations Post-Submission</span>
                      <p className={styles.toggleDesc}>
                        Allows candidates to review correct solutions and tips on their result review screen.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formFooter}>
            <button
              type="submit"
              className={styles.saveSettingsBtn}
              disabled={savingSettings}
            >
              <Save size={16} />
              {savingSettings ? 'Saving Settings...' : 'Save All Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Question Builder Modal */}
      <QuestionBuilderModal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        isEditing={!!editingQuestion}
        saving={modalSaving}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImport={handleBulkImport}
        importing={bulkImporting}
      />
    </div>
  )
}
