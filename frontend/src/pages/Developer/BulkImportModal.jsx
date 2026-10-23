import React, { useState } from 'react'
import {
  X, UploadCloud, FileText, CheckCircle2, AlertTriangle,
  Download, ArrowRight, RefreshCw
} from 'lucide-react'
import styles from './BulkImportModal.module.css'

const SAMPLE_JSON = [
  {
    "type": "single_choice",
    "question": "Which of the following is true regarding JavaScript closures?",
    "options": [
      "They only have access to global variables",
      "They retain access to variables in their lexical scope even after the outer function has returned",
      "They cause memory leaks in every modern browser",
      "They can only be created using arrow function syntax"
    ],
    "correctIndex": 1,
    "difficulty": "Intermediate",
    "topic": "JavaScript Scope",
    "marks": 1,
    "negativeMarks": 0,
    "explanation": "A closure is the combination of a function bundled together with references to its surrounding lexical state."
  },
  {
    "type": "multiple_select",
    "question": "Which of the following are valid JavaScript primitive types?",
    "options": [
      "string",
      "number",
      "boolean",
      "Array"
    ],
    "correctIndices": [0, 1, 2],
    "difficulty": "Beginner",
    "topic": "JavaScript Types",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "Array is an Object in JavaScript, not a primitive."
  },
  {
    "type": "true_false",
    "question": "HTTP/2 uses multiplexing over a single TCP connection.",
    "options": ["True", "False"],
    "correctIndex": 0,
    "difficulty": "Intermediate",
    "topic": "Networking",
    "marks": 1,
    "explanation": "HTTP/2 introduces binary framing and multiplexing over a single connection."
  }
]

const SAMPLE_CSV = `type,question,options,correctIndex,difficulty,marks,explanation
single_choice,"What does NaN === NaN evaluate to in JS?","true;false;undefined;null",1,Beginner,1,"NaN is the only value in JavaScript that is not equal to itself."
true_false,"Node.js runs on a multi-threaded event loop by default.","True;False",1,Intermediate,1,"Node.js uses a single-threaded event loop backed by libuv thread pool."
short_answer,"What keyword defines an immutable variable in modern JS?","",const,Beginner,1,"const prevents re-assignment of the variable identifier."`

export default function BulkImportModal({
  isOpen,
  onClose,
  onImport,
  importing = false
}) {
  const [mode, setMode] = useState('json') // 'json' or 'csv'
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState([])
  const [previewCount, setPreviewCount] = useState(null)

  if (!isOpen) return null

  const handleDownloadSample = () => {
    const isJson = mode === 'json'
    const blob = new Blob(
      [isJson ? JSON.stringify(SAMPLE_JSON, null, 2) : SAMPLE_CSV],
      { type: isJson ? 'application/json' : 'text/csv' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isJson ? 'rexion_quiz_template.json' : 'rexion_quiz_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setContent(text)
        if (file.name.endsWith('.csv')) {
          setMode('csv')
        } else if (file.name.endsWith('.json')) {
          setMode('json')
        }
      }
    }
    reader.readAsText(file)
  }

  const parseAndValidate = () => {
    const rowErrors = []
    let parsedQuestions = []

    if (!content.trim()) {
      setErrors(['Please paste or upload question data.'])
      return null
    }

    if (mode === 'json') {
      try {
        const data = JSON.parse(content)
        if (!Array.isArray(data)) {
          setErrors(['JSON input must be an array of question objects [...]'])
          return null
        }

        data.forEach((item, idx) => {
          const rowNum = idx + 1
          if (!item.question || typeof item.question !== 'string' || !item.question.trim()) {
            rowErrors.push(`Item #${rowNum}: Missing or empty 'question' text.`)
          }
          const itemType = item.type || 'single_choice'
          if (itemType === 'single_choice' || itemType === 'code_snippet') {
            if (!Array.isArray(item.options) || item.options.length < 2) {
              rowErrors.push(`Item #${rowNum}: Must have an 'options' array with at least 2 choices.`)
            }
            if (typeof item.correctIndex !== 'number' || item.correctIndex < 0 || (item.options && item.correctIndex >= item.options.length)) {
              rowErrors.push(`Item #${rowNum}: 'correctIndex' must be a valid option index.`)
            }
          } else if (itemType === 'multiple_select') {
            if (!Array.isArray(item.options) || item.options.length < 2) {
              rowErrors.push(`Item #${rowNum}: Must have an 'options' array with at least 2 choices.`)
            }
            if (!Array.isArray(item.correctIndices) || item.correctIndices.length === 0) {
              rowErrors.push(`Item #${rowNum}: 'correctIndices' must be a non-empty array of valid indices.`)
            }
          } else if (itemType === 'short_answer') {
            if (!item.correctAnswer || typeof item.correctAnswer !== 'string' || !item.correctAnswer.trim()) {
              rowErrors.push(`Item #${rowNum}: Short answer must include 'correctAnswer' string.`)
            }
          }
        })
        parsedQuestions = data
      } catch (err) {
        setErrors([`JSON Syntax Error: ${err.message}`])
        return null
      }
    } else {
      // Basic CSV parsing
      try {
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 2) {
          setErrors(['CSV must contain a header row and at least one question row.'])
          return null
        }

        // Parse CSV lines respecting quotes
        const parseCsvLine = (line) => {
          const result = []
          let cur = ''
          let inQuotes = false
          for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) {
              inQuotes = !inQuotes
            } else if (ch === ',' && !inQuotes) {
              result.push(cur.trim())
              cur = ''
            } else {
              cur += ch
            }
          }
          result.push(cur.trim())
          return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'))
        }

        const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
        const typeIdx = headers.indexOf('type')
        const qIdx = headers.indexOf('question')
        const optIdx = headers.indexOf('options')
        const corrIdx = headers.indexOf('correctindex')
        const diffIdx = headers.indexOf('difficulty')
        const marksIdx = headers.indexOf('marks')
        const explIdx = headers.indexOf('explanation')

        if (qIdx === -1) {
          setErrors(["CSV header must contain a 'question' column."])
          return null
        }

        for (let i = 1; i < lines.length; i++) {
          const row = parseCsvLine(lines[i])
          const rowNum = i
          const qText = row[qIdx]
          if (!qText) {
            rowErrors.push(`Row #${rowNum}: Missing question text.`)
            continue
          }

          const qType = typeIdx !== -1 && row[typeIdx] ? row[typeIdx] : 'single_choice'
          const rawOpts = optIdx !== -1 && row[optIdx] ? row[optIdx].split(';').map(s => s.trim()) : []
          const rawCorr = corrIdx !== -1 ? row[corrIdx] : '0'

          const questionObj = {
            type: qType,
            question: qText,
            difficulty: diffIdx !== -1 && row[diffIdx] ? row[diffIdx] : 'Intermediate',
            marks: marksIdx !== -1 && !isNaN(Number(row[marksIdx])) ? Number(row[marksIdx]) : 1,
            explanation: explIdx !== -1 && row[explIdx] ? row[explIdx] : undefined
          }

          if (qType === 'short_answer') {
            questionObj.correctAnswer = rawCorr
            questionObj.options = []
          } else if (qType === 'true_false') {
            questionObj.options = ['True', 'False']
            questionObj.correctIndex = rawCorr === '1' || rawCorr.toLowerCase() === 'false' ? 1 : 0
          } else {
            questionObj.options = rawOpts.length >= 2 ? rawOpts : ['Option A', 'Option B']
            questionObj.correctIndex = !isNaN(Number(rawCorr)) ? Number(rawCorr) : 0
          }

          parsedQuestions.push(questionObj)
        }
      } catch (err) {
        setErrors([`CSV Parsing Error: ${err.message}`])
        return null
      }
    }

    if (rowErrors.length > 0) {
      setErrors(rowErrors)
      return null
    }

    setErrors([])
    return parsedQuestions
  }

  const handleSubmit = () => {
    const validQuestions = parseAndValidate()
    if (!validQuestions || validQuestions.length === 0) return
    onImport(validQuestions)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <UploadCloud size={22} color="#D96B43" />
            <h2>Bulk Import Questions</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.topActions}>
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeTab} ${mode === 'json' ? styles.activeTab : ''}`}
                onClick={() => setMode('json')}
              >
                JSON Array
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${mode === 'csv' ? styles.activeTab : ''}`}
                onClick={() => setMode('csv')}
              >
                CSV Table
              </button>
            </div>

            <button
              type="button"
              className={styles.downloadSampleBtn}
              onClick={handleDownloadSample}
            >
              <Download size={14} />
              Download Sample {mode.toUpperCase()} Template
            </button>
          </div>

          <div className={styles.uploadArea}>
            <input
              type="file"
              id="bulk-file-upload"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
            <label htmlFor="bulk-file-upload" className={styles.uploadLabel}>
              <UploadCloud size={24} color="#8E7E70" />
              <span>Choose a .json or .csv file or paste content below</span>
            </label>
          </div>

          <textarea
            rows={10}
            placeholder={
              mode === 'json'
                ? '[\n  {\n    "type": "single_choice",\n    "question": "What is ...",\n    "options": ["A", "B", "C", "D"],\n    "correctIndex": 0\n  }\n]'
                : 'type,question,options,correctIndex,difficulty,marks,explanation\nsingle_choice,"What is ...","A;B;C;D",0,Intermediate,1,"Because ..."'
            }
            value={content}
            onChange={e => setContent(e.target.value)}
            className={styles.textarea}
            spellCheck={false}
          />

          {errors.length > 0 && (
            <div className={styles.errorBox}>
              <div className={styles.errorHeader}>
                <AlertTriangle size={16} />
                <span>Validation errors detected ({errors.length}):</span>
              </div>
              <ul className={styles.errorList}>
                {errors.slice(0, 8).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 8 && (
                  <li>...and {errors.length - 8} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={importing}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.importBtn}
            onClick={handleSubmit}
            disabled={importing || !content.trim()}
          >
            {importing ? (
              <>
                <RefreshCw size={14} className={styles.spin} /> Importing Questions...
              </>
            ) : (
              'Validate & Import Questions →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
