import React, { useRef, useState } from 'react'
import styles from './UploadForm.module.css'

const UploadForm = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onUpload(file)
  }

  const handleClick = () => {
    inputRef.current.click()
  }

  return (
    <div
      className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleChange}
        className={styles.fileInput}
      />
      <div className={styles.icon}>📄</div>
      <div className={styles.title}>Upload your resume</div>
      <div className={styles.hint}>Drag & drop or click to browse</div>
    </div>
  )
}

export default UploadForm