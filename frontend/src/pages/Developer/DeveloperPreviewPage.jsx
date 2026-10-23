import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, Check, X, ShieldAlert, BookOpen,
  RotateCcw, Sparkles, Award, Code2, Copy, AlertTriangle,
  ChevronRight, RefreshCw
} from 'lucide-react'
import developerApi from '../../services/developerApi'
import quizApi from '../../services/quizApi'
import styles from './DeveloperPreviewPage.module.css'

export default function DeveloperPreviewPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quiz, setQuiz] = useState(null)

  // Runner state
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState({}) // { [qId]: index | indices[] | string }
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const loadQuiz = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await developerApi.getQuizById(quizId)
      if (res.success && res.quiz) {
        setQuiz(res.quiz)
      } else {
        setError('Quiz not found')
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

  const questions = quiz?.questions || quiz?.questionPool || []
  const currentQ = questions[currentIdx]

  // Answer handler
  const handleSelectSingle = (qId, optionIdx) => {
    if (submitted) return
    setUserAnswers(prev => ({ ...prev, [qId]: optionIdx }))
  }

  const handleToggleMulti = (qId, optionIdx) => {
    if (submitted) return
    const prevList = Array.isArray(userAnswers[qId]) ? userAnswers[qId] : []
    const updated = prevList.includes(optionIdx)
      ? prevList.filter(i => i !== optionIdx)
      : [...prevList, optionIdx]
    setUserAnswers(prev => ({ ...prev, [qId]: updated }))
  }

  const handleTextAnswer = (qId, text) => {
    if (submitted) return
    setUserAnswers(prev => ({ ...prev, [qId]: text }))
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Preview submission
  const handleSubmitQuiz = async () => {
    if (submitting) return
    try {
      setSubmitting(true)
      const answersPayload = questions.map(q => {
        const qId = q._id || q.id
        const userChoice = userAnswers[qId]
        if (q.type === 'multiple_select') {
          return {
            questionId: qId,
            selectedIndices: Array.isArray(userChoice) ? userChoice : []
          }
        } else if (q.type === 'short_answer') {
          return {
            questionId: qId,
            answerText: typeof userChoice === 'string' ? userChoice : ''
          }
        } else {
          return {
            questionId: qId,
            selectedIndex: typeof userChoice === 'number' ? userChoice : -1
          }
        }
      })

      // Send to quizApi.submitQuiz with preview: true
      const slug = quiz.slug || quiz._id
      const res = await quizApi.submitQuiz(slug, answersPayload, 60, undefined, true)

      if (res.result) {
        setScoreResult(res.result)
      } else {
        // Fallback local scoring if offline
        let correct = 0
        questions.forEach(q => {
          const qId = q._id || q.id
          if (userAnswers[qId] === q.correctIndex) correct++
        })
        const pct = Math.round((correct / questions.length) * 100)
        setScoreResult({
          correctCount: correct,
          totalQuestions: questions.length,
          scorePercentage: pct,
          passed: pct >= (quiz.passingScore || 70),
          feedback: pct >= (quiz.passingScore || 70) ? 'Passes standard criteria.' : 'Needs improvement.',
          answers: questions.map(q => ({
            questionId: q._id || q.id,
            isCorrect: userAnswers[q._id || q.id] === q.correctIndex,
            correctIndex: q.correctIndex,
            explanation: q.explanation
          }))
        })
      }
      setSubmitted(true)
    } catch (err) {
      alert(`Submission error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setUserAnswers({})
    setSubmitted(false)
    setScoreResult(null)
    setCurrentIdx(0)
    setShowReview(false)
  }

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <RefreshCw size={28} className={styles.spin} />
        <p>Loading candidate preview...</p>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className={styles.errorWrapper}>
        <AlertTriangle size={32} color="#DC2626" />
        <h2>Unable to load preview</h2>
        <p>{error}</p>
        <button onClick={() => navigate(`/developer/quizzes/${quizId}/edit`)} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Quiz Editor
        </button>
      </div>
    )
  }

  const answeredCount = Object.keys(userAnswers).filter(k => {
    const val = userAnswers[k]
    if (Array.isArray(val)) return val.length > 0
    if (typeof val === 'string') return val.trim().length > 0
    return val !== undefined && val !== -1
  }).length

  return (
    <div className={styles.container}>
      {/* Simulation Banner */}
      <div className={styles.previewNotice}>
        <div className={styles.noticeLeft}>
          <ShieldAlert size={18} />
          <div>
            <strong>DEVELOPER PREVIEW MODE</strong>
            <span> — Testing interactive layout & questions. Submissions will NOT create real attempts or alter student analytics.</span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/developer/quizzes/${quizId}/edit`)}
          className={styles.exitPreviewBtn}
        >
          <ArrowLeft size={14} /> Back to Editor
        </button>
      </div>

      {/* Main Runner Shell */}
      <div className={styles.runnerHeader}>
        <div>
          <span className={styles.categoryBadge}>{quiz.category}</span>
          <h1 className={styles.quizTitle}>{quiz.title}</h1>
          <p className={styles.quizSub}>
            {quiz.difficulty} • {questions.length} questions • {quiz.durationMinutes || 15} minutes • Pass mark: {quiz.passingScore || 70}%
          </p>
        </div>
        <div className={styles.timerBadge}>
          <Clock size={15} />
          <span>{quiz.durationMinutes || 15}:00 (Preview)</span>
        </div>
      </div>

      {submitted && scoreResult ? (
        /* Results View */
        <div className={styles.resultCard}>
          <div className={`${styles.resultIconCircle} ${scoreResult.passed ? styles.passedIcon : styles.failedIcon}`}>
            {scoreResult.passed ? <Check size={36} /> : <X size={36} />}
          </div>

          <h2 className={styles.resultTitle}>
            {scoreResult.passed ? 'Quiz Passed! 🎉' : 'Assessment Not Passed'}
          </h2>

          <div className={styles.resultScoreBadge}>
            {scoreResult.scorePercentage}%
          </div>

          <p className={styles.resultFeedback}>
            {scoreResult.feedback || (scoreResult.passed
              ? 'Great job! Meets passing criteria.'
              : 'Score is below the configured passing threshold.')}
          </p>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{scoreResult.correctCount}</span>
              <span className={styles.statLabel}>Correct</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{scoreResult.totalQuestions - scoreResult.correctCount}</span>
              <span className={styles.statLabel}>Incorrect</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{scoreResult.totalQuestions}</span>
              <span className={styles.statLabel}>Total Questions</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{quiz.passingScore || 70}%</span>
              <span className={styles.statLabel}>Passing Mark</span>
            </div>
          </div>

          <div className={styles.resultActions}>
            <button
              className={styles.reviewBtn}
              onClick={() => setShowReview(!showReview)}
            >
              <BookOpen size={16} />
              {showReview ? 'Hide Solutions Review' : 'Review Solutions & Explanations'}
            </button>
            <button className={styles.retryBtn} onClick={handleReset}>
              <RotateCcw size={16} />
              Reset & Retake Preview
            </button>
            <button
              className={styles.editorReturnBtn}
              onClick={() => navigate(`/developer/quizzes/${quizId}/edit`)}
            >
              Done Previewing
            </button>
          </div>

          {/* Solutions & Explanations Review */}
          {showReview && (
            <div className={styles.reviewSection}>
              <h3>Question-by-Question Review</h3>
              {questions.map((q, idx) => {
                const qId = q._id || q.id
                const answerResult = scoreResult.answers?.find(a => a.questionId === qId)
                const isCorrect = answerResult?.isCorrect
                const userChoice = userAnswers[qId]

                return (
                  <div
                    key={qId || idx}
                    className={`${styles.reviewItem} ${isCorrect ? styles.reviewCorrect : styles.reviewIncorrect}`}
                  >
                    <div className={styles.reviewHeader}>
                      <span className={styles.reviewQNum}>Q{idx + 1}.</span>
                      <span className={styles.reviewQText}>{q.question}</span>
                      <span className={`${styles.reviewStatusBadge} ${isCorrect ? styles.correctBadge : styles.incorrectBadge}`}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    {q.code && (
                      <pre className={styles.reviewCode}><code>{q.code}</code></pre>
                    )}

                    <div className={styles.reviewAnswers}>
                      {q.type === 'short_answer' ? (
                        <div>
                          <div>Candidate answer: <strong>{typeof userChoice === 'string' ? userChoice : '—'}</strong></div>
                          {!isCorrect && (
                            <div className={styles.correctReveal}>
                              Expected: <strong>"{q.correctAnswer}"</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div>
                            Candidate choice:{' '}
                            <strong>
                              {Array.isArray(userChoice)
                                ? userChoice.map(i => q.options[i]).join(', ') || 'None selected'
                                : userChoice !== undefined && q.options[userChoice]
                                ? q.options[userChoice]
                                : 'Skipped'}
                            </strong>
                          </div>
                          {!isCorrect && (
                            <div className={styles.correctReveal}>
                              Correct answer:{' '}
                              <strong>
                                {q.type === 'multiple_select'
                                  ? (q.correctIndices || []).map(i => q.options[i]).join(', ')
                                  : q.options[q.correctIndex]}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}

                      {q.explanation && (
                        <div className={styles.reviewExplanation}>
                          💡 <em>{q.explanation}</em>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Active Question Runner */
        <div className={styles.runnerGrid}>
          <div className={styles.runnerMain}>
            {currentQ ? (
              <div className={styles.card}>
                <div className={styles.qMetaBar}>
                  <span className={styles.qTypePill}>{(currentQ.type || 'single_choice').replace('_', ' ')}</span>
                  <span className={styles.qDiffPill}>{currentQ.difficulty || 'Intermediate'}</span>
                  <span className={styles.qMarksPill}>+{currentQ.marks || 1} mark{currentQ.marks === 1 ? '' : 's'}</span>
                  {currentQ.negativeMarks > 0 && (
                    <span className={styles.qNegPill}>-{currentQ.negativeMarks} penalty</span>
                  )}
                </div>

                <h2 className={styles.questionText}>{currentQ.question}</h2>

                {currentQ.code && (
                  <div className={styles.codeSnippetArea}>
                    <div className={styles.codeHeader}>
                      <span>Code Snippet</span>
                      <button
                        onClick={() => handleCopyCode(currentQ.code)}
                        className={styles.copyBtn}
                      >
                        <Copy size={13} />
                        {copiedCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className={styles.codeBody}><code>{currentQ.code}</code></pre>
                  </div>
                )}

                {/* Options list for Single Choice and Code */}
                {(currentQ.type === 'single_choice' || currentQ.type === 'code_snippet' || !currentQ.type) && (
                  <div className={styles.optionsList}>
                    {(currentQ.options || []).map((opt, oIdx) => {
                      const isSelected = userAnswers[currentQ._id || currentQ.id] === oIdx
                      return (
                        <div
                          key={oIdx}
                          className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''}`}
                          onClick={() => handleSelectSingle(currentQ._id || currentQ.id, oIdx)}
                        >
                          <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                            {isSelected && <div className={styles.radioDot} />}
                          </div>
                          <span className={styles.optionLetter}>{String.fromCharCode(65 + oIdx)}</span>
                          <span className={styles.optionText}>{opt}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Multiple Select */}
                {currentQ.type === 'multiple_select' && (
                  <div className={styles.optionsList}>
                    <div className={styles.multiHint}>Select ALL that apply:</div>
                    {(currentQ.options || []).map((opt, oIdx) => {
                      const list = Array.isArray(userAnswers[currentQ._id || currentQ.id])
                        ? userAnswers[currentQ._id || currentQ.id]
                        : []
                      const isSelected = list.includes(oIdx)
                      return (
                        <div
                          key={oIdx}
                          className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''}`}
                          onClick={() => handleToggleMulti(currentQ._id || currentQ.id, oIdx)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className={styles.checkbox}
                          />
                          <span className={styles.optionLetter}>{String.fromCharCode(65 + oIdx)}</span>
                          <span className={styles.optionText}>{opt}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* True / False */}
                {currentQ.type === 'true_false' && (
                  <div className={styles.tfGrid}>
                    <button
                      type="button"
                      className={`${styles.tfBtn} ${userAnswers[currentQ._id || currentQ.id] === 0 ? styles.tfSelected : ''}`}
                      onClick={() => handleSelectSingle(currentQ._id || currentQ.id, 0)}
                    >
                      ✓ TRUE
                    </button>
                    <button
                      type="button"
                      className={`${styles.tfBtn} ${userAnswers[currentQ._id || currentQ.id] === 1 ? styles.tfSelected : ''}`}
                      onClick={() => handleSelectSingle(currentQ._id || currentQ.id, 1)}
                    >
                      ✗ FALSE
                    </button>
                  </div>
                )}

                {/* Short Answer */}
                {currentQ.type === 'short_answer' && (
                  <div className={styles.shortAnswerBox}>
                    <label>Enter candidate answer:</label>
                    <input
                      type="text"
                      placeholder="Type answer here..."
                      value={userAnswers[currentQ._id || currentQ.id] || ''}
                      onChange={e => handleTextAnswer(currentQ._id || currentQ.id, e.target.value)}
                      className={styles.shortAnswerInput}
                    />
                  </div>
                )}

                {/* Bottom Runner Navigation */}
                <div className={styles.navRow}>
                  <button
                    className={styles.prevBtn}
                    onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
                    disabled={currentIdx === 0}
                  >
                    ← Previous
                  </button>

                  {currentIdx < questions.length - 1 ? (
                    <button
                      className={styles.nextBtn}
                      onClick={() => setCurrentIdx(p => p + 1)}
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      className={styles.submitBtn}
                      onClick={handleSubmitQuiz}
                      disabled={submitting}
                    >
                      {submitting ? 'Evaluating...' : 'Submit Assessment ✓'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.noQuestionsCard}>
                <p>No questions configured in this quiz.</p>
              </div>
            )}
          </div>

          {/* Right Navigator Sidebar */}
          <div className={styles.runnerSidebar}>
            <div className={styles.navCard}>
              <h3>Questions Navigator</h3>
              <p className={styles.progressSub}>
                {answeredCount} of {questions.length} answered
              </p>
              <div className={styles.gridNav}>
                {questions.map((_, i) => {
                  const qId = questions[i]._id || questions[i].id
                  const isAnswered = userAnswers[qId] !== undefined && userAnswers[qId] !== -1
                  const isCurrent = i === currentIdx
                  return (
                    <button
                      key={i}
                      className={`${styles.gridNavBtn} ${isCurrent ? styles.currentNavBtn : ''} ${isAnswered ? styles.answeredNavBtn : ''}`}
                      onClick={() => setCurrentIdx(i)}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>

              <div className={styles.sidebarActions}>
                <button
                  className={styles.sidebarSubmitBtn}
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                >
                  {submitting ? 'Evaluating...' : 'Submit Quiz Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
