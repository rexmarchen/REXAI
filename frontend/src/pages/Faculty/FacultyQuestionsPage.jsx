import React, { useState, useEffect } from 'react'
import {
  HelpCircle,
  PlusCircle,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  BookOpenCheck,
  CheckCircle,
  Layers,
  GraduationCap
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

const SUBJECTS = [
  'All',
  'Computer Science',
  'Software Engineering',
  'Data Structures & Algorithms',
  'Database Systems',
  'Machine Learning & AI',
  'Cybersecurity',
  'Web Development',
  'Cloud & DevOps',
  'Mathematics & Statistics'
]

const FacultyQuestionsPage = () => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [msg, setMsg] = useState(null)
  const [errMsg, setErrMsg] = useState(null)

  const [form, setForm] = useState({
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    subject: 'Computer Science',
    topic: '',
    difficulty: 'Medium',
    tags: '',
    marks: 1
  })

  const loadQuestions = () => {
    setLoading(true)
    facultyApi.getQuestionBank({
      subject: selectedSubject !== 'All' ? selectedSubject : undefined,
      difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
      search: search.trim() || undefined
    })
      .then(res => {
        setQuestions(res.questions || [])
      })
      .catch(err => {
        setErrMsg(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadQuestions()
  }, [selectedSubject, selectedDifficulty])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadQuestions()
  }

  const openAddModal = () => {
    setEditingItem(null)
    setForm({
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      subject: selectedSubject !== 'All' ? selectedSubject : 'Computer Science',
      topic: '',
      difficulty: 'Medium',
      tags: '',
      marks: 1
    })
    setModalOpen(true)
  }

  const openEditModal = (q) => {
    setEditingItem(q)
    setForm({
      question: q.question,
      type: q.type || 'multiple_choice',
      options: Array.isArray(q.options) && q.options.length ? [...q.options] : ['', ''],
      correctIndex: q.correctIndex !== undefined ? Number(q.correctIndex) : 0,
      explanation: q.explanation || '',
      subject: q.subject || 'Computer Science',
      topic: q.topic || '',
      difficulty: q.difficulty || 'Medium',
      tags: Array.isArray(q.tags) ? q.tags.join(', ') : '',
      marks: q.marks !== undefined ? Number(q.marks) : 1
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.question.trim() || !form.subject.trim() || !form.topic.trim()) {
      alert('Question statement, subject, and topic are required.')
      return
    }

    try {
      const payload = {
        ...form,
        question: form.question.trim(),
        subject: form.subject.trim(),
        topic: form.topic.trim(),
        options: form.type === 'multiple_choice' ? form.options.map(o => String(o).trim()).filter(Boolean) : ['True', 'False'],
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        marks: Number(form.marks) || 1
      }

      if (editingItem) {
        await facultyApi.updateQuestionBankItem(editingItem._id, payload)
        setMsg('Question updated in bank.')
      } else {
        await facultyApi.createQuestionBankItem(payload)
        setMsg('Reusable question added to Question Bank.')
      }

      setModalOpen(false)
      loadQuestions()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save question.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question from your Question Bank?')) return
    try {
      await facultyApi.deleteQuestionBankItem(id)
      setMsg('Question deleted from bank.')
      loadQuestions()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
            Question Bank Repository
          </h2>
          <p style={{ color: '#8C7B6D', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Central repository of reusable academic questions categorized by subject, topic, and difficulty.
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
          }}
        >
          <PlusCircle size={16} /> Add Question to Bank
        </button>
      </div>

      {msg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.86rem' }}>
          ✓ {msg}
        </div>
      )}

      {/* ── CONTROLS: SUBJECTS, DIFFICULTY & SEARCH ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #ECE4D8',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Search */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 280px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#8C7B6D' }} />
              <input
                type="text"
                placeholder="Search statements, topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: 999,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: '#231C16',
                color: '#FFF',
                border: 'none',
                padding: '9px 16px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </form>

          {/* Difficulty Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8C7B6D' }}>Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #ECE4D8',
                background: '#F8F4EE',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Subject pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {SUBJECTS.map(subj => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              style={{
                border: 'none',
                background: selectedSubject === subj ? '#2563EB' : '#F8F4EE',
                color: selectedSubject === subj ? '#FFFFFF' : '#5C4D40',
                padding: '5px 12px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* ── QUESTION LIST ── */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#8C7B6D' }}>
          <GraduationCap size={32} style={{ animation: 'bounce 1s infinite', color: '#2563EB', marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>Loading Question Bank...</div>
        </div>
      ) : questions.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #ECE4D8',
          padding: 48,
          textAlign: 'center',
          color: '#8C7B6D'
        }}>
          <HelpCircle size={40} style={{ color: '#C8BCB0', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#231C16', margin: '0 0 8px 0' }}>
            No questions found
          </h3>
          <p style={{ fontSize: '0.86rem', maxWidth: 400, margin: '0 auto 20px' }}>
            No questions match your current filters. Add reusable questions to easily import them into your exams.
          </p>
          <button
            onClick={openAddModal}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 22px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <PlusCircle size={15} /> Add First Question
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q, idx) => (
            <div key={q._id} style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #ECE4D8',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: '0 2px 10px rgba(35,28,22,0.02)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: '#EEF4FD',
                    color: '#1D4ED8',
                    textTransform: 'uppercase'
                  }}>
                    {q.subject}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#8C7B6D' }}>
                    {q.topic} • {q.difficulty} • {q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: '#F8F4EE',
                    padding: '2px 8px',
                    borderRadius: 999,
                    color: '#5C4D40'
                  }}>
                    Used in {q.usageCount || 0} quiz{q.usageCount !== 1 ? 'zes' : ''}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#231C16', lineHeight: 1.4, marginBottom: 8 }}>
                  {q.question}
                </div>

                {Array.isArray(q.options) && q.options.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, marginTop: 6 }}>
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = Number(q.correctIndex) === oIdx
                      return (
                        <div key={oIdx} style={{
                          background: isCorrect ? '#ECFDF5' : '#F8F4EE',
                          border: `1px solid ${isCorrect ? '#A7F3D0' : '#ECE4D8'}`,
                          borderRadius: 8,
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          color: isCorrect ? '#065F46' : '#5C4D40',
                          fontWeight: isCorrect ? 700 : 500
                        }}>
                          {String.fromCharCode(65 + oIdx)}. {opt} {isCorrect ? '✓' : ''}
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.explanation && (
                  <div style={{ fontSize: '0.75rem', color: '#8C7B6D', marginTop: 8, fontStyle: 'italic' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => openEditModal(q)}
                  style={{
                    background: '#F8F4EE',
                    border: '1px solid #ECE4D8',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#231C16',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(q._id)}
                  style={{
                    background: '#FCEFEB',
                    border: '1px solid #F5C6CB',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    color: '#721C24',
                    cursor: 'pointer'
                  }}
                  title="Delete Question"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {modalOpen && (
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
                {editingItem ? 'Edit Reusable Question' : 'Add Question to Bank'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8C7B6D' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 4 }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={form.subject}
                    onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 4 }}>
                    Topic *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Relational Calculus"
                    value={form.topic}
                    onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 4 }}>
                  Question Statement *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the question statement clearly..."
                  value={form.question}
                  onChange={(e) => setForm(prev => ({ ...prev, question: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Options (Radio indicates correct answer) *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="radio"
                        name="bankOptionRadio"
                        checked={Number(form.correctIndex) === oIdx}
                        onChange={() => setForm(prev => ({ ...prev, correctIndex: oIdx }))}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, width: 20 }}>
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${oIdx + 1} text`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...form.options]
                          newOpts[oIdx] = e.target.value
                          setForm(prev => ({ ...prev, options: newOpts }))
                        }}
                        style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.84rem' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 4 }}>
                  Explanation
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed rationale for the correct answer..."
                  value={form.explanation}
                  onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.84rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid #ECE4D8', padding: '8px 16px', borderRadius: 999, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', border: 'none', color: '#FFF', padding: '8px 20px', borderRadius: 999, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyQuestionsPage
