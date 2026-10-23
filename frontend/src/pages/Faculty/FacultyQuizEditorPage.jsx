import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  PlusCircle,
  HelpCircle,
  BookOpenCheck,
  CheckCircle2,
  Trash2,
  Edit3,
  Eye,
  ArrowUp,
  ArrowDown,
  Layers,
  Save,
  Check,
  X,
  ShieldAlert,
  AlertTriangle,
  GraduationCap
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

const FacultyQuizEditorPage = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState(null)
  const [facultyProfile, setFacultyProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Question editing/adding state
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [bankQuestions, setBankQuestions] = useState([])
  const [selectedBankIds, setSelectedBankIds] = useState(new Set())
  const [bankLoading, setBankLoading] = useState(false)

  // Question form state
  const [qForm, setQForm] = useState({
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    difficulty: 'Medium',
    marks: 1,
    negativeMarks: 0
  })

  const loadQuiz = () => {
    setLoading(true)
    Promise.all([
      facultyApi.getQuizById(quizId),
      facultyApi.getProfile()
    ])
      .then(([qRes, pRes]) => {
        setQuiz(qRes.quiz)
        setFacultyProfile(pRes.profile)
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Failed to load quiz.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  const openAddQuestion = () => {
    setEditingQuestion(null)
    setQForm({
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      difficulty: quiz?.difficulty || 'Medium',
      marks: 1,
      negativeMarks: 0
    })
    setQuestionModalOpen(true)
  }

  const openEditQuestion = (q) => {
    setEditingQuestion(q)
    setQForm({
      question: q.question,
      type: q.type || 'multiple_choice',
      options: Array.isArray(q.options) && q.options.length ? [...q.options] : ['', ''],
      correctIndex: q.correctIndex !== undefined ? Number(q.correctIndex) : 0,
      explanation: q.explanation || '',
      difficulty: q.difficulty || quiz?.difficulty || 'Medium',
      marks: q.marks !== undefined ? Number(q.marks) : 1,
      negativeMarks: q.negativeMarks !== undefined ? Number(q.negativeMarks) : 0
    })
    setQuestionModalOpen(true)
  }

  const handleSaveQuestion = async (e) => {
    e.preventDefault()
    if (!qForm.question.trim()) {
      alert('Question text is required.')
      return
    }

    try {
      let payload = {
        ...qForm,
        question: qForm.question.trim(),
        marks: Number(qForm.marks) || 1,
        negativeMarks: Number(qForm.negativeMarks) || 0
      }

      if (qForm.type === 'multiple_choice') {
        const cleanedOpts = qForm.options.map(o => String(o).trim()).filter(Boolean)
        if (cleanedOpts.length < 2) {
          alert('Multiple choice questions require at least 2 non-empty options.')
          return
        }
        payload.options = cleanedOpts
      } else if (qForm.type === 'true_false') {
        payload.options = ['True', 'False']
      }

      if (editingQuestion) {
        await facultyApi.updateQuestion(quiz._id, editingQuestion.id, payload)
        setSuccessMsg('Question updated successfully.')
      } else {
        await facultyApi.addQuestion(quiz._id, payload)
        setSuccessMsg('Question added to quiz.')
      }

      setQuestionModalOpen(false)
      loadQuiz()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save question.')
    }
  }

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    try {
      await facultyApi.deleteQuestion(quiz._id, questionId)
      setSuccessMsg('Question removed.')
      loadQuiz()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  const handleMoveQuestion = async (index, direction) => {
    const questions = [...(quiz.questionPool || [])]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= questions.length) return

    const temp = questions[index]
    questions[index] = questions[targetIndex]
    questions[targetIndex] = temp

    const orderedIds = questions.map(q => q.id)
    try {
      await facultyApi.reorderQuestions(quiz._id, orderedIds)
      loadQuiz()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  const openBankImportModal = () => {
    setBankLoading(true)
    setSelectedBankIds(new Set())
    facultyApi.getQuestionBank()
      .then(res => {
        setBankQuestions(res.questions || [])
        setBankModalOpen(true)
      })
      .catch(err => {
        alert('Failed to load Question Bank.')
      })
      .finally(() => {
        setBankLoading(false)
      })
  }

  const toggleBankSelection = (id) => {
    setSelectedBankIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImportSelected = async () => {
    if (selectedBankIds.size === 0) return
    try {
      const res = await facultyApi.importQuestionsFromBank(quiz._id, Array.from(selectedBankIds))
      setSuccessMsg(res.message || `Imported ${res.addedCount} questions.`)
      setBankModalOpen(false)
      loadQuiz()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  const isVerified = facultyProfile?.status === 'verified'

  const handlePublish = async () => {
    if (!isVerified) {
      alert(`Publishing locked: Only verified faculty may publish quizzes. Please submit verification under "Verification Status".`)
      navigate('/faculty/verification')
      return
    }

    if (!window.confirm(`Publish "${quiz.title}" to student Career Hub?`)) return
    try {
      const res = await facultyApi.publishQuiz(quiz._id)
      setSuccessMsg(res.message)
      loadQuiz()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#8C7B6D' }}>
        <GraduationCap size={32} style={{ animation: 'bounce 1s infinite', color: '#2563EB', marginBottom: 12 }} />
        <div style={{ fontWeight: 600 }}>Loading Quiz Editor...</div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div style={{ background: '#FCEFEB', border: '1px solid #F5C6CB', color: '#721C24', padding: 20, borderRadius: 12 }}>
        {error || 'Quiz not found'}
      </div>
    )
  }

  const questions = quiz.questionPool || []
  const isPub = quiz.status === 'published'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1040, margin: '0 auto' }}>
      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/faculty/quizzes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#5C4D40',
              textDecoration: 'none',
              fontSize: '0.86rem',
              fontWeight: 700
            }}
          >
            <ArrowLeft size={16} /> Back to Quizzes
          </Link>
          <span style={{ color: '#C8BCB0' }}>/</span>
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#8C7B6D' }}>Quiz Editor</span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            to={`/faculty/quizzes/${quiz._id}/preview`}
            style={{
              background: '#FFFFFF',
              border: '1px solid #ECE4D8',
              color: '#231C16',
              padding: '8px 16px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Eye size={14} /> Candidate Preview
          </Link>

          {!isPub ? (
            <button
              onClick={handlePublish}
              style={{
                background: '#10B981',
                border: 'none',
                color: '#FFF',
                padding: '8px 20px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <CheckCircle2 size={14} /> Publish to Career Hub
            </button>
          ) : (
            <span style={{
              background: '#ECFDF5',
              color: '#065F46',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: '0.8rem',
              fontWeight: 800
            }}>
              ✓ Published (v{quiz.version || 1})
            </span>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.86rem' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* ── QUIZ HEADER SUMMARY ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1px solid #ECE4D8',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 999,
                background: isPub ? '#ECFDF5' : '#FEF9E7',
                color: isPub ? '#065F46' : '#92400E',
                textTransform: 'uppercase'
              }}>
                {quiz.status}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#8C7B6D' }}>
                Slug: <code>{quiz.slug}</code>
              </span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#231C16', margin: '4px 0 0 0' }}>
              {quiz.title}
            </h1>
            <p style={{ color: '#5C4D40', fontSize: '0.86rem', margin: '6px 0 0 0' }}>
              {quiz.description || 'No description provided.'}
            </p>
          </div>

          <div style={{
            background: '#F8F4EE',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #ECE4D8',
            fontSize: '0.82rem',
            color: '#5C4D40',
            lineHeight: 1.5
          }}>
            <div><strong>Subject:</strong> {quiz.category}</div>
            <div><strong>Topic:</strong> {quiz.topic}</div>
            <div><strong>Difficulty:</strong> {quiz.difficulty}</div>
            <div><strong>Duration:</strong> {quiz.durationMinutes} mins • Passing: {quiz.passingScore}%</div>
            <div><strong>Target:</strong> {quiz.targetAudience || 'All Students'}</div>
          </div>
        </div>
      </div>

      {/* ── QUESTION POOL SECTION ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1px solid #ECE4D8',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
              Question Pool ({questions.length})
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#8C7B6D', margin: '3px 0 0 0' }}>
              Questions evaluated for this quiz. Students will be evaluated across these items.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={openBankImportModal}
              style={{
                background: '#FEF3EB',
                border: '1px solid rgba(217, 107, 67, 0.25)',
                color: '#D96B43',
                padding: '8px 16px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Layers size={14} /> Import from Bank
            </button>
            <button
              onClick={openAddQuestion}
              style={{
                background: '#2563EB',
                border: 'none',
                color: '#FFF',
                padding: '8px 18px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <PlusCircle size={14} /> Add New Question
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div style={{
            background: '#F8F4EE',
            borderRadius: 14,
            padding: '40px 20px',
            textAlign: 'center',
            color: '#8C7B6D'
          }}>
            <HelpCircle size={36} style={{ color: '#C8BCB0', marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#231C16' }}>
              No questions in this quiz yet
            </div>
            <div style={{ fontSize: '0.82rem', marginTop: 4 }}>
              Add multiple choice or true/false questions or import them from your reusable question bank.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map((q, idx) => {
              const isFirst = idx === 0
              const isLast = idx === questions.length - 1
              return (
                <div key={q.id || idx} style={{
                  background: '#F8F4EE',
                  borderRadius: 14,
                  border: '1px solid #ECE4D8',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16
                }}>
                  {/* Left: Index & Statement */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        background: '#231C16',
                        color: '#FFF',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>
                        {q.type} • {q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#231C16', lineHeight: 1.4, marginBottom: 8 }}>
                      {q.question}
                    </div>

                    {/* Options list */}
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6 }}>
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = Number(q.correctIndex) === oIdx
                          return (
                            <div key={oIdx} style={{
                              background: isCorrect ? '#ECFDF5' : '#FFFFFF',
                              border: `1px solid ${isCorrect ? '#A7F3D0' : '#ECE4D8'}`,
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: '0.8rem',
                              color: isCorrect ? '#065F46' : '#5C4D40',
                              fontWeight: isCorrect ? 700 : 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <span>{String.fromCharCode(65 + oIdx)}.</span>
                              <span>{opt}</span>
                              {isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.explanation && (
                      <div style={{ fontSize: '0.76rem', color: '#8C7B6D', marginTop: 8, fontStyle: 'italic' }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>

                  {/* Right: Reorder & Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleMoveQuestion(idx, -1)}
                        disabled={isFirst}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #ECE4D8',
                          padding: 4,
                          borderRadius: 6,
                          cursor: isFirst ? 'not-allowed' : 'pointer',
                          opacity: isFirst ? 0.3 : 1
                        }}
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(idx, 1)}
                        disabled={isLast}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #ECE4D8',
                          padding: 4,
                          borderRadius: 6,
                          cursor: isLast ? 'not-allowed' : 'pointer',
                          opacity: isLast ? 0.3 : 1
                        }}
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        onClick={() => openEditQuestion(q)}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #ECE4D8',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#231C16'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        style={{
                          background: '#FCEFEB',
                          border: '1px solid #F5C6CB',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          color: '#721C24',
                          cursor: 'pointer'
                        }}
                        title="Delete Question"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── ADD/EDIT QUESTION MODAL ── */}
      {questionModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 620,
            width: '100%',
            padding: 30,
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #ECE4D8',
            boxShadow: '0 20px 48px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => setQuestionModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8C7B6D' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Question Type
                </label>
                <select
                  value={qForm.type}
                  onChange={(e) => {
                    const t = e.target.value
                    setQForm(prev => ({
                      ...prev,
                      type: t,
                      options: t === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
                      correctIndex: 0
                    }))
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #ECE4D8',
                    background: '#F8F4EE',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="multiple_choice">Multiple Choice (Single Answer)</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Question Statement *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the question statement clearly..."
                  value={qForm.question}
                  onChange={(e) => setQForm(prev => ({ ...prev, question: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #ECE4D8',
                    background: '#F8F4EE',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Options */}
              {qForm.type === 'multiple_choice' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 8 }}>
                    Answer Options (Select the correct option radio) *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {qForm.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={Number(qForm.correctIndex) === oIdx}
                          onChange={() => setQForm(prev => ({ ...prev, correctIndex: oIdx }))}
                          title="Mark as correct answer"
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, width: 20 }}>
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <input
                          type="text"
                          required
                          placeholder={`Option ${oIdx + 1} text`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...qForm.options]
                            newOpts[oIdx] = e.target.value
                            setQForm(prev => ({ ...prev, options: newOpts }))
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #ECE4D8',
                            background: '#F8F4EE',
                            fontSize: '0.84rem'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {qForm.type === 'true_false' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 8 }}>
                    Correct Answer *
                  </label>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tfRadio"
                        checked={Number(qForm.correctIndex) === 0}
                        onChange={() => setQForm(prev => ({ ...prev, correctIndex: 0 }))}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>True</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tfRadio"
                        checked={Number(qForm.correctIndex) === 1}
                        onChange={() => setQForm(prev => ({ ...prev, correctIndex: 1 }))}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>False</span>
                    </label>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                    Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={qForm.marks}
                    onChange={(e) => setQForm(prev => ({ ...prev, marks: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #ECE4D8',
                      background: '#F8F4EE',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                    Negative Marks (if wrong)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.25"
                    value={qForm.negativeMarks}
                    onChange={(e) => setQForm(prev => ({ ...prev, negativeMarks: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #ECE4D8',
                      background: '#F8F4EE',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Explanation (Released to students after evaluation)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this answer is correct and the pedagogical principle..."
                  value={qForm.explanation}
                  onChange={(e) => setQForm(prev => ({ ...prev, explanation: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #ECE4D8',
                    background: '#F8F4EE',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ECE4D8',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    color: '#FFF',
                    padding: '8px 20px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUESTION BANK IMPORT MODAL ── */}
      {bankModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 680,
            width: '100%',
            padding: 28,
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid #ECE4D8',
            boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
                  Import from Question Bank
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#8C7B6D', margin: '3px 0 0 0' }}>
                  Select reusable questions from your repository to include in this quiz. Duplicate questions are automatically prevented.
                </p>
              </div>
              <button
                onClick={() => setBankModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8C7B6D' }}
              >
                <X size={20} />
              </button>
            </div>

            {bankQuestions.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#8C7B6D' }}>
                <HelpCircle size={32} style={{ color: '#C8BCB0', marginBottom: 10 }} />
                <div>Your Question Bank has no items yet.</div>
                <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  Save questions in the "Question Bank" tab to reuse across multiple exams.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                {bankQuestions.map(bq => {
                  const isSelected = selectedBankIds.has(bq._id)
                  return (
                    <div
                      key={bq._id}
                      onClick={() => toggleBankSelection(bq._id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: `1px solid ${isSelected ? '#2563EB' : '#ECE4D8'}`,
                        background: isSelected ? '#EEF4FD' : '#F8F4EE',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ marginTop: 4 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8C7B6D', textTransform: 'uppercase' }}>
                          {bq.subject} • {bq.topic} • {bq.difficulty}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#231C16', marginTop: 2 }}>
                          {bq.question}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#5C4D40', marginTop: 4 }}>
                          {bq.type} • {bq.options?.length || 0} options • Used in {bq.usageCount || 0} quizzes
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #ECE4D8' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5C4D40' }}>
                {selectedBankIds.size} selected
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ECE4D8',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedBankIds.size === 0}
                  onClick={handleImportSelected}
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    color: '#FFF',
                    padding: '8px 20px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: selectedBankIds.size === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedBankIds.size === 0 ? 0.5 : 1
                  }}
                >
                  Import {selectedBankIds.size} Question{selectedBankIds.size > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyQuizEditorPage
