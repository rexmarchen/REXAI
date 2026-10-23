import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  HelpCircle,
  GraduationCap
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

const FacultyPreviewPage = () => {
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [evalResult, setEvalResult] = useState(null)

  useEffect(() => {
    facultyApi.getQuizById(quizId)
      .then(res => {
        setQuiz(res.quiz)
      })
      .catch(err => {
        console.error('Preview load error:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [quizId])

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#8C7B6D' }}>
        <GraduationCap size={32} style={{ animation: 'bounce 1s infinite', color: '#2563EB', marginBottom: 12 }} />
        <div style={{ fontWeight: 600 }}>Loading Candidate Preview...</div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#721C24' }}>
        Quiz not found for preview.
      </div>
    )
  }

  const questions = quiz.questionPool || []
  const currentQ = questions[currentIndex]

  const handleSelectOption = (qId, optionIdx) => {
    if (submitted) return
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }))
  }

  const handleSubmitEvaluation = () => {
    let correctCount = 0
    let totalScore = 0
    let earned = 0

    const results = questions.map(q => {
      const selected = selectedAnswers[q.id]
      const isCorrect = Number(selected) === Number(q.correctIndex)
      const marks = q.marks || 1
      totalScore += marks
      if (isCorrect) {
        correctCount++
        earned += marks
      }
      return {
        id: q.id,
        isCorrect,
        selected,
        correctIndex: q.correctIndex,
        explanation: q.explanation
      }
    })

    const scorePct = Math.round((earned / Math.max(1, totalScore)) * 100)
    setEvalResult({
      scorePct,
      correctCount,
      totalCount: questions.length,
      passed: scorePct >= (quiz.passingScore || 60),
      results
    })
    setSubmitted(true)
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── PREVIEW MODE BANNER ── */}
      <div style={{
        background: '#FEF9E7',
        border: '1px solid #F4DF94',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} color="#B48805" />
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#92400E' }}>
            Candidate Preview Mode: Attempts in preview do not affect real course metrics or student transcripts.
          </span>
        </div>
        <Link
          to={`/faculty/quizzes/${quiz._id}/edit`}
          style={{
            background: '#FFFFFF',
            border: '1px solid #ECE4D8',
            color: '#231C16',
            padding: '6px 14px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: '0.78rem',
            textDecoration: 'none'
          }}
        >
          Exit Preview
        </Link>
      </div>

      {/* ── QUIZ HEADER ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1px solid #ECE4D8',
        padding: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', marginBottom: 4 }}>
              🎓 {quiz.authorName} • {quiz.institutionName || 'Verified Faculty'}
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#231C16', margin: '0 0 6px 0' }}>
              {quiz.title}
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#5C4D40', margin: 0 }}>
              {quiz.instructions || quiz.description || 'Answer all questions to complete this educational evaluation.'}
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#F8F4EE',
            padding: '8px 14px',
            borderRadius: 12,
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#5C4D40'
          }}>
            <Clock size={16} /> {quiz.durationMinutes} Minutes • Passing: {quiz.passingScore}%
          </div>
        </div>
      </div>

      {/* ── QUESTION DISPLAY OR SUBMISSION SUMMARY ── */}
      {submitted && evalResult ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #ECE4D8',
          padding: 32,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: evalResult.passed ? '#ECFDF5' : '#FCEFEB',
            color: evalResult.passed ? '#10B981' : '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={36} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
            {evalResult.passed ? 'Evaluation Passed!' : 'Evaluation Incomplete'}
          </h2>

          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: evalResult.passed ? '#10B981' : '#EF4444' }}>
            {evalResult.scorePct}%
          </div>

          <p style={{ color: '#5C4D40', fontSize: '0.9rem', maxWidth: 440, margin: 0 }}>
            You scored {evalResult.correctCount} out of {evalResult.totalCount} questions correctly.
            {evalResult.passed
              ? ' Congratulations, you passed the required threshold for this assessment!'
              : ' Passing score is ' + quiz.passingScore + '%. Review the explanations below.'}
          </p>

          <button
            onClick={() => {
              setSubmitted(false)
              setEvalResult(null)
              setSelectedAnswers({})
              setCurrentIndex(0)
            }}
            style={{
              background: '#2563EB',
              border: 'none',
              color: '#FFF',
              padding: '10px 24px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              marginTop: 10
            }}
          >
            Retake Preview
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 18, padding: 36, textAlign: 'center', color: '#8C7B6D' }}>
          This quiz has no questions yet. Return to the editor to add questions.
        </div>
      ) : (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #ECE4D8',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#8C7B6D' }}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>Marks: {currentQ?.marks || 1}</span>
          </div>

          <div style={{ background: '#ECE4D8', height: 6, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              height: '100%',
              background: '#2563EB',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Statement */}
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', lineHeight: 1.5 }}>
            {currentQ?.question}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.isArray(currentQ?.options) && currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === oIdx
              return (
                <div
                  key={oIdx}
                  onClick={() => handleSelectOption(currentQ.id, oIdx)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#ECE4D8'}`,
                    background: isSelected ? '#EEF4FD' : '#F8F4EE',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#1D4ED8' : '#231C16',
                    fontSize: '0.9rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#C8BCB0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    background: isSelected ? '#2563EB' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#8C7B6D'
                  }}>
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <span>{opt}</span>
                </div>
              )
            })}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #ECE4D8' }}>
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              style={{
                background: 'transparent',
                border: '1px solid #ECE4D8',
                padding: '8px 18px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === 0 ? 0.4 : 1
              }}
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                style={{
                  background: '#2563EB',
                  border: 'none',
                  color: '#FFF',
                  padding: '8px 22px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmitEvaluation}
                style={{
                  background: '#10B981',
                  border: 'none',
                  color: '#FFF',
                  padding: '8px 24px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Submit Assessment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyPreviewPage
