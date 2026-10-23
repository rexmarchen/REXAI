import React, { useState, useEffect } from 'react'
import {
  X, Plus, Trash2, Code2, AlertTriangle, CheckCircle2,
  HelpCircle, Sparkles, BookOpen
} from 'lucide-react'
import styles from './QuestionBuilderModal.module.css'

const QUESTION_TYPES = [
  { id: 'single_choice', label: 'Single-Choice MCQ', desc: 'Candidates select 1 correct option' },
  { id: 'multiple_select', label: 'Multi-Select', desc: 'Candidates select all that apply' },
  { id: 'true_false', label: 'True / False', desc: 'Binary true or false evaluation' },
  { id: 'short_answer', label: 'Short Answer', desc: 'Case-insensitive exact/keyword string match' },
  { id: 'code_snippet', label: 'Code Execution / Bug', desc: 'Code snippet with single-choice output prediction' }
]

export default function QuestionBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialQuestion = null,
  isEditing = false,
  saving = false
}) {
  const [type, setType] = useState('single_choice')
  const [questionText, setQuestionText] = useState('')
  const [code, setCode] = useState('')
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [correctIndices, setCorrectIndices] = useState([0])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [topic, setTopic] = useState('')
  const [marks, setMarks] = useState(1)
  const [negativeMarks, setNegativeMarks] = useState(0)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (initialQuestion) {
      setType(initialQuestion.type || 'single_choice')
      setQuestionText(initialQuestion.question || '')
      setCode(initialQuestion.code || '')
      setShowCodeEditor(!!initialQuestion.code)
      if (initialQuestion.type === 'true_false') {
        setOptions(['True', 'False'])
      } else if (Array.isArray(initialQuestion.options) && initialQuestion.options.length > 0) {
        setOptions([...initialQuestion.options])
      } else {
        setOptions(['', '', '', ''])
      }
      setCorrectIndex(typeof initialQuestion.correctIndex === 'number' ? initialQuestion.correctIndex : 0)
      setCorrectIndices(Array.isArray(initialQuestion.correctIndices) && initialQuestion.correctIndices.length > 0
        ? [...initialQuestion.correctIndices]
        : [typeof initialQuestion.correctIndex === 'number' ? initialQuestion.correctIndex : 0]
      )
      setCorrectAnswer(initialQuestion.correctAnswer || '')
      setExplanation(initialQuestion.explanation || '')
      setDifficulty(initialQuestion.difficulty || 'Intermediate')
      setTopic(initialQuestion.topic || '')
      setMarks(typeof initialQuestion.marks === 'number' ? initialQuestion.marks : 1)
      setNegativeMarks(typeof initialQuestion.negativeMarks === 'number' ? initialQuestion.negativeMarks : 0)
    } else {
      // Default new state
      setType('single_choice')
      setQuestionText('')
      setCode('')
      setShowCodeEditor(false)
      setOptions(['', '', '', ''])
      setCorrectIndex(0)
      setCorrectIndices([0])
      setCorrectAnswer('')
      setExplanation('')
      setDifficulty('Intermediate')
      setTopic('')
      setMarks(1)
      setNegativeMarks(0)
    }
    setValidationError('')
  }, [initialQuestion, isOpen])

  // Adjust options when type changes
  const handleTypeChange = (newType) => {
    setType(newType)
    if (newType === 'true_false') {
      setOptions(['True', 'False'])
      setCorrectIndex(0)
    } else if (newType === 'code_snippet') {
      setShowCodeEditor(true)
    } else if (options.length < 2) {
      setOptions(['', '', '', ''])
    }
  }

  // Option text change
  const handleOptionChange = (idx, value) => {
    const updated = [...options]
    updated[idx] = value
    setOptions(updated)
  }

  // Add option
  const handleAddOption = () => {
    if (options.length >= 8) return
    setOptions(prev => [...prev, ''])
  }

  // Remove option
  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return
    const updated = options.filter((_, i) => i !== idx)
    setOptions(updated)
    // Adjust single correctIndex
    if (correctIndex === idx) {
      setCorrectIndex(0)
    } else if (correctIndex > idx) {
      setCorrectIndex(correctIndex - 1)
    }
    // Adjust multiple correctIndices
    setCorrectIndices(prev =>
      prev
        .filter(i => i !== idx)
        .map(i => (i > idx ? i - 1 : i))
    )
  }

  // Toggle multi-select index
  const toggleMultiSelectIndex = (idx) => {
    if (correctIndices.includes(idx)) {
      if (correctIndices.length === 1) return // Keep at least one
      setCorrectIndices(correctIndices.filter(i => i !== idx))
    } else {
      setCorrectIndices([...correctIndices, idx])
    }
  }

  const handleValidateAndSave = () => {
    setValidationError('')

    if (!questionText.trim()) {
      setValidationError('Question text is required.')
      return
    }

    if (type === 'single_choice' || type === 'code_snippet') {
      if (options.length < 2) {
        setValidationError('At least 2 options are required for multiple-choice questions.')
        return
      }
      for (let i = 0; i < options.length; i++) {
        if (!options[i].trim()) {
          setValidationError(`Option ${String.fromCharCode(65 + i)} cannot be blank.`)
          return
        }
      }
      if (correctIndex < 0 || correctIndex >= options.length) {
        setValidationError('Please select a valid correct answer option.')
        return
      }
    } else if (type === 'multiple_select') {
      if (options.length < 2) {
        setValidationError('At least 2 options are required.')
        return
      }
      for (let i = 0; i < options.length; i++) {
        if (!options[i].trim()) {
          setValidationError(`Option ${String.fromCharCode(65 + i)} cannot be blank.`)
          return
        }
      }
      if (!correctIndices || correctIndices.length === 0) {
        setValidationError('Please mark at least one option as correct.')
        return
      }
    } else if (type === 'true_false') {
      if (correctIndex !== 0 && correctIndex !== 1) {
        setValidationError('Please select True or False.')
        return
      }
    } else if (type === 'short_answer') {
      if (!correctAnswer.trim()) {
        setValidationError('Please provide the expected correct answer keyword or phrase.')
        return
      }
    }

    if (marks < 0.5) {
      setValidationError('Marks must be at least 0.5 points.')
      return
    }

    const payload = {
      type,
      question: questionText.trim(),
      code: showCodeEditor && code.trim() ? code.trim() : undefined,
      difficulty,
      topic: topic.trim() || undefined,
      marks: Number(marks) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      explanation: explanation.trim() || undefined
    }

    if (type === 'single_choice' || type === 'code_snippet') {
      payload.options = options.map(o => o.trim())
      payload.correctIndex = Number(correctIndex)
    } else if (type === 'multiple_select') {
      payload.options = options.map(o => o.trim())
      payload.correctIndices = correctIndices.sort((a, b) => a - b)
    } else if (type === 'true_false') {
      payload.options = ['True', 'False']
      payload.correctIndex = Number(correctIndex)
    } else if (type === 'short_answer') {
      payload.options = []
      payload.correctAnswer = correctAnswer.trim()
    }

    onSave(payload)
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <span className={styles.typeBadge}>
              {QUESTION_TYPES.find(t => t.id === type)?.label}
            </span>
            <h2>{isEditing ? 'Edit Question' : 'Add New Question'}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {validationError && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        <div className={styles.body}>
          {/* Question Type Selection */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Question Type</label>
            <div className={styles.typeGrid}>
              {QUESTION_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.typeCard} ${type === t.id ? styles.typeCardActive : ''}`}
                  onClick={() => handleTypeChange(t.id)}
                >
                  <span className={styles.typeName}>{t.label}</span>
                  <span className={styles.typeDesc}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div className={styles.section}>
            <div className={styles.labelRow}>
              <label className={styles.sectionLabel}>Question Text *</label>
              <button
                type="button"
                className={styles.toggleCodeBtn}
                onClick={() => setShowCodeEditor(!showCodeEditor)}
              >
                <Code2 size={14} />
                {showCodeEditor ? 'Remove Code Block' : '+ Add Code Snippet'}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. What will be the console output of the following async function when invoked?"
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              className={styles.textarea}
              required
            />
          </div>

          {/* Code Snippet Editor */}
          {showCodeEditor && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Code Snippet</label>
              <textarea
                rows={5}
                placeholder="const wait = ms => new Promise(res => setTimeout(res, ms));&#10;wait(100).then(() => console.log('Done'));"
                value={code}
                onChange={e => setCode(e.target.value)}
                className={styles.codeTextarea}
                spellCheck={false}
              />
            </div>
          )}

          {/* Options / Answer Input depending on type */}
          {(type === 'single_choice' || type === 'code_snippet') && (
            <div className={styles.section}>
              <div className={styles.labelRow}>
                <label className={styles.sectionLabel}>Answer Options (Select the 1 correct answer)</label>
                {options.length < 8 && (
                  <button type="button" className={styles.addOptionBtn} onClick={handleAddOption}>
                    <Plus size={13} /> Add Option
                  </button>
                )}
              </div>
              <div className={styles.optionsList}>
                {options.map((opt, idx) => (
                  <div key={idx} className={styles.optionRow}>
                    <input
                      type="radio"
                      name="correct_choice"
                      checked={correctIndex === idx}
                      onChange={() => setCorrectIndex(idx)}
                      className={styles.radioInput}
                      title="Mark as correct answer"
                    />
                    <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      className={`${styles.optionInput} ${correctIndex === idx ? styles.optionInputCorrect : ''}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className={styles.removeOptionBtn}
                        title="Delete option"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'multiple_select' && (
            <div className={styles.section}>
              <div className={styles.labelRow}>
                <label className={styles.sectionLabel}>Options (Check ALL correct answers)</label>
                {options.length < 8 && (
                  <button type="button" className={styles.addOptionBtn} onClick={handleAddOption}>
                    <Plus size={13} /> Add Option
                  </button>
                )}
              </div>
              <div className={styles.optionsList}>
                {options.map((opt, idx) => {
                  const isChecked = correctIndices.includes(idx)
                  return (
                    <div key={idx} className={styles.optionRow}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMultiSelectIndex(idx)}
                        className={styles.checkboxInput}
                        title="Mark as correct answer"
                      />
                      <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                        value={opt}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        className={`${styles.optionInput} ${isChecked ? styles.optionInputCorrect : ''}`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className={styles.removeOptionBtn}
                          title="Delete option"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {type === 'true_false' && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Correct Answer</label>
              <div className={styles.tfRow}>
                <button
                  type="button"
                  className={`${styles.tfBtn} ${correctIndex === 0 ? styles.tfBtnActive : ''}`}
                  onClick={() => setCorrectIndex(0)}
                >
                  ✓ TRUE
                </button>
                <button
                  type="button"
                  className={`${styles.tfBtn} ${correctIndex === 1 ? styles.tfBtnActive : ''}`}
                  onClick={() => setCorrectIndex(1)}
                >
                  ✗ FALSE
                </button>
              </div>
            </div>
          )}

          {type === 'short_answer' && (
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Expected Correct Answer *</label>
              <input
                type="text"
                placeholder="e.g. O(log n) or undefined or Promise"
                value={correctAnswer}
                onChange={e => setCorrectAnswer(e.target.value)}
                className={styles.input}
              />
              <span className={styles.hint}>
                Student answers will be evaluated case-insensitively and trimmed of whitespace.
              </span>
            </div>
          )}

          {/* Explanation */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Explanation / Solution Notes</label>
            <textarea
              rows={2}
              placeholder="Explain why this answer is correct and what principle applies (revealed during post-quiz review)..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {/* Metadata Row: Difficulty, Marks, Negative Marks, Topic */}
          <div className={styles.metaGrid}>
            <div className={styles.field}>
              <label>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Topic / Sub-skill</label>
              <input
                type="text"
                placeholder="e.g. Closures, Event Loop"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Marks (+)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={marks}
                onChange={e => setMarks(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Negative Marks (-)</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={negativeMarks}
                onChange={e => setNegativeMarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleValidateAndSave}
            disabled={saving}
          >
            {saving ? 'Saving Question...' : isEditing ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  )
}
