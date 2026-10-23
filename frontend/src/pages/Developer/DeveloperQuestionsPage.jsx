import React, { useState, useEffect } from 'react'
import {
  Search, Filter, BookOpen, Code2, Plus, Copy,
  CheckCircle2, AlertTriangle, RefreshCw, Check
} from 'lucide-react'
import developerApi from '../../services/developerApi'
import styles from './DeveloperQuestionsPage.module.css'

export default function DeveloperQuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [type, setType] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await developerApi.getQuestionsBank({
        search,
        category: category || undefined,
        difficulty: difficulty || undefined,
        type: type || undefined
      })
      if (res.success) {
        setQuestions(res.questions || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [category, difficulty, type])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadQuestions()
  }

  const handleCopyText = (q) => {
    const text = `Q: ${q.question}\nOptions: ${(q.options || []).join(', ')}\nAnswer: ${q.type === 'multiple_select' ? (q.correctIndices || []).join(', ') : q.type === 'short_answer' ? q.correctAnswer : q.options?.[q.correctIndex]}`
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(q._id || q.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Global Question Bank</h1>
          <p className={styles.subtitle}>
            Explore and reuse your technical questions across quizzes and assessments.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search questions by text, code, or topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </form>

        <div className={styles.selectGroup}>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className={styles.select}
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className={styles.select}
          >
            <option value="">All Types</option>
            <option value="single_choice">Single-Choice MCQ</option>
            <option value="multiple_select">Multi-Select</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
            <option value="code_snippet">Code-based</option>
          </select>
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className={styles.loadingWrapper}>
          <RefreshCw size={24} className={styles.spin} />
          <p>Querying question bank...</p>
        </div>
      ) : error ? (
        <div className={styles.errorWrapper}>
          <AlertTriangle size={24} color="#DC2626" />
          <p>{error}</p>
          <button onClick={loadQuestions} className={styles.retryBtn}>Retry</button>
        </div>
      ) : questions.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <BookOpen size={48} color="#D5C8B8" />
          <h3>No Questions Found</h3>
          <p>
            {search || difficulty || type
              ? 'Try clearing filters or broadening search parameters.'
              : 'Questions added to your quizzes will automatically be indexed here.'}
          </p>
        </div>
      ) : (
        <div className={styles.questionsList}>
          {questions.map((q, idx) => {
            const qId = q._id || q.id || idx
            const isCopied = copiedId === qId
            return (
              <div key={qId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.pillRow}>
                    <span className={styles.typePill}>{(q.type || 'single_choice').replace('_', ' ')}</span>
                    <span className={styles.diffPill}>{q.difficulty || 'Intermediate'}</span>
                    <span className={styles.marksPill}>+{q.marks || 1} pt</span>
                    {q.topic && <span className={styles.topicPill}>{q.topic}</span>}
                    {q.quizTitle && (
                      <span className={styles.quizRefPill}>Used in: {q.quizTitle}</span>
                    )}
                  </div>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopyText(q)}
                    title="Copy question content"
                  >
                    {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className={styles.qText}>{q.question}</div>

                {q.code && (
                  <pre className={styles.codeBlock}><code>{q.code}</code></pre>
                )}

                {Array.isArray(q.options) && q.options.length > 0 && (
                  <div className={styles.optionsGrid}>
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.type === 'multiple_select'
                        ? Array.isArray(q.correctIndices) && q.correctIndices.includes(oIdx)
                        : q.correctIndex === oIdx
                      return (
                        <div
                          key={oIdx}
                          className={`${styles.optionChip} ${isCorrect ? styles.correctChip : ''}`}
                        >
                          <span className={styles.letter}>{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                          {isCorrect && <Check size={13} className={styles.correctIcon} />}
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className={styles.shortAnswerReveal}>
                    Expected answer: <strong>"{q.correctAnswer}"</strong>
                  </div>
                )}

                {q.explanation && (
                  <div className={styles.explanationBox}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
