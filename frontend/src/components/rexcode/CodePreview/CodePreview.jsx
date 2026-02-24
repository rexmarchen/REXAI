import React from 'react'
import styles from './CodePreview.module.css'

const CodePreview = ({ code }) => {
  return (
    <div className={styles.preview}>
      <h3>Generated Code</h3>
      <pre className={styles.codeBlock}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default CodePreview