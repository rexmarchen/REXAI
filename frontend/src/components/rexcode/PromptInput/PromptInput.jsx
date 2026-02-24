import React, { useState } from 'react'
import styles from './PromptInput.module.css'

const PromptInput = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (prompt.trim()) onGenerate(prompt)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <textarea
        className={styles.textarea}
        placeholder="Describe the website you want... (e.g., 'A modern landing page for a tech startup')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button type="submit" className={styles.button}>Generate</button>
    </form>
  )
}

export default PromptInput