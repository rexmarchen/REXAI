import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  PlusCircle,
  HelpCircle,
  BookOpenCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  GraduationCap
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

const CATEGORIES = [
  'Development',
  'AI / ML',
  'Data Science',
  'DSA',
  'Database',
  'Cloud & DevOps',
  'Cybersecurity',
  'Software Architecture',
  'Mathematics & Logic',
  'Computer Systems'
]

const FacultyQuizCreatePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    category: 'Development',
    topic: '',
    difficulty: 'Medium',
    targetAudience: 'All Undergraduate Students',
    durationMinutes: 15,
    passingScore: 60,
    randomizeQuestions: false,
    randomizeOptions: false,
    negativeMarking: false,
    showExplanations: true,
    availabilityStart: '',
    availabilityEnd: '',
    maxAttempts: 0
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Quiz title is required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        instructions: form.instructions.trim(),
        topic: form.topic.trim() || form.title.trim(),
        durationMinutes: Number(form.durationMinutes) || 15,
        passingScore: Number(form.passingScore) || 60,
        maxAttempts: Number(form.maxAttempts) || 0,
        availabilityStart: form.availabilityStart ? new Date(form.availabilityStart).toISOString() : undefined,
        availabilityEnd: form.availabilityEnd ? new Date(form.availabilityEnd).toISOString() : undefined
      }

      const res = await facultyApi.createQuiz(payload)
      if (res?.quiz?._id) {
        navigate(`/faculty/quizzes/${res.quiz._id}/edit`)
      } else {
        navigate('/faculty/quizzes')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create quiz.')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── BREADCRUMB / BACK ── */}
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
      </div>

      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#231C16', margin: '0 0 6px 0' }}>
          Create New Educational Quiz
        </h2>
        <p style={{ color: '#8C7B6D', fontSize: '0.88rem', margin: 0 }}>
          Configure assessment metadata and student instructions. You can author and import questions in the next step.
        </p>
      </div>

      {error && (
        <div style={{ background: '#FCEFEB', border: '1px solid #F5C6CB', color: '#721C24', padding: '14px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.88rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #ECE4D8',
        padding: 32,
        boxShadow: '0 4px 20px rgba(35,28,22,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>
        {/* Section 1: Core Details */}
        <div style={{ borderBottom: '1px solid #ECE4D8', paddingBottom: 24 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', marginBottom: 16 }}>
            1. Basic Information
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Quiz Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Data Structures Midterm Review: Trees & Graphs"
                value={form.title}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Subject / Category *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #ECE4D8',
                    background: '#F8F4EE',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Specific Topic *
                </label>
                <input
                  type="text"
                  name="topic"
                  placeholder="e.g. Binary Search Trees & AVL"
                  value={form.topic}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #ECE4D8',
                    background: '#F8F4EE',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #ECE4D8',
                    background: '#F8F4EE',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Beginner">Beginner (Foundational)</option>
                  <option value="Intermediate">Intermediate (Core Curriculum)</option>
                  <option value="Advanced">Advanced (Honors / Competitive)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                  Target Audience / Course Level
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  placeholder="e.g. 2nd Year Computer Science / CS201"
                  value={form.targetAudience}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #ECE4D8',
                    background: '#F8F4EE',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Description & Course Objectives
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief summary of the quiz learning objectives and concepts evaluated..."
                value={form.description}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Student Instructions / Examination Guidelines
              </label>
              <textarea
                name="instructions"
                rows={2}
                placeholder="e.g. Calculators allowed. No external browser tabs. Complete all questions within the allotted duration."
                value={form.instructions}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Timing, Scoring & Controls */}
        <div style={{ borderBottom: '1px solid #ECE4D8', paddingBottom: 24 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', marginBottom: 16 }}>
            2. Timing & Assessment Parameters
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Duration (Minutes)
              </label>
              <input
                type="number"
                name="durationMinutes"
                min="1"
                max="180"
                value={form.durationMinutes}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Passing Score (%)
              </label>
              <input
                type="number"
                name="passingScore"
                min="0"
                max="100"
                value={form.passingScore}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Attempt Limit (0 = Unlimited)
              </label>
              <input
                type="number"
                name="maxAttempts"
                min="0"
                max="10"
                value={form.maxAttempts}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Availability window */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Availability Start (Optional)
              </label>
              <input
                type="datetime-local"
                name="availabilityStart"
                value={form.availabilityStart}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Availability End / Deadline (Optional)
              </label>
              <input
                type="datetime-local"
                name="availabilityEnd"
                value={form.availabilityEnd}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #ECE4D8',
                  background: '#F8F4EE',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Assessment Integrity Options */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', marginBottom: 14 }}>
            3. Examination Integrity & Options
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#F8F4EE', padding: '10px 14px', borderRadius: 10 }}>
              <input
                type="checkbox"
                name="randomizeQuestions"
                checked={form.randomizeQuestions}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#231C16' }}>
                Randomize Question Order
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#F8F4EE', padding: '10px 14px', borderRadius: 10 }}>
              <input
                type="checkbox"
                name="randomizeOptions"
                checked={form.randomizeOptions}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#231C16' }}>
                Randomize Option Choices
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#F8F4EE', padding: '10px 14px', borderRadius: 10 }}>
              <input
                type="checkbox"
                name="negativeMarking"
                checked={form.negativeMarking}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#231C16' }}>
                Enable Negative Marking
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#F8F4EE', padding: '10px 14px', borderRadius: 10 }}>
              <input
                type="checkbox"
                name="showExplanations"
                checked={form.showExplanations}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#231C16' }}>
                Release Explanations After Submission
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
          <button
            type="button"
            onClick={() => navigate('/faculty/quizzes')}
            style={{
              background: 'transparent',
              border: '1px solid #ECE4D8',
              padding: '10px 22px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: '0.86rem',
              color: '#5C4D40',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#2563EB',
              border: 'none',
              color: '#FFF',
              padding: '10px 26px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Draft...' : 'Save Draft & Author Questions →'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FacultyQuizCreatePage
