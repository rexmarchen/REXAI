import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Sparkles, BookOpen, AlertTriangle } from 'lucide-react'
import developerApi from '../../services/developerApi'
import styles from './DeveloperQuizzesPage.module.css'

const CATEGORY_LABELS = {
  dsa: 'Data Structures & Algorithms',
  javascript: 'JavaScript',
  react: 'React',
  nodejs: 'Node.js',
  express: 'Express.js',
  mongodb: 'MongoDB',
  mern: 'MERN Stack',
  python: 'Python',
  ai_ml: 'AI & Machine Learning',
  sql: 'SQL & Databases',
  system_design: 'System Design',
  oop: 'Object-Oriented Programming',
  networks: 'Computer Networks',
  os: 'Operating Systems',
  aptitude: 'Aptitude & Reasoning',
  interview_prep: 'Interview Preparation'
}

export default function DeveloperQuizCreatePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('javascript')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(15)
  const [passingScore, setPassingScore] = useState(70)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setCreating(true)
      setError(null)
      const res = await developerApi.createQuiz({
        title: title.trim(),
        category,
        difficulty,
        description: description.trim() || undefined,
        durationMinutes: Number(durationMinutes) || 15,
        passingScore: Number(passingScore) || 70
      })
      if (res.success && res.quiz) {
        navigate(`/developer/quizzes/${res.quiz._id}/edit`)
      }
    } catch (err) {
      setError(err.message || 'Failed to create quiz')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button
        onClick={() => navigate('/developer/quizzes')}
        className={styles.secondaryAction}
        style={{ width: 'fit-content' }}
      >
        <ArrowLeft size={16} /> Back to Quizzes
      </button>

      <div style={{ background: '#FFFFFF', border: '1px solid #EAE4DA', borderRadius: 16, padding: '28px 32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#231C16', margin: '0 0 6px 0' }}>
          Create New Technical Quiz
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#6E5E52', margin: '0 0 24px 0' }}>
          Set up the title and taxonomy for your assessment, then continue directly into the question builder.
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Quiz Title *</label>
            <input
              type="text"
              placeholder="e.g. Asynchronous JavaScript & Microtask Queue"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Difficulty Level *</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Estimated Duration (Minutes)</label>
              <input
                type="number"
                min="3"
                max="180"
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Passing Score (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={passingScore}
                onChange={e => setPassingScore(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Short Description</label>
            <textarea
              rows={3}
              placeholder="Outline what skills and concepts will be evaluated..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => navigate('/developer/quizzes')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createBtn}
              disabled={creating || !title.trim()}
            >
              {creating ? 'Creating...' : 'Continue to Question Builder →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
