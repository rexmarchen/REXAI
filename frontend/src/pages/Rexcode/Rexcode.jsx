import React, { useState } from 'react'
import PromptInput from '../../components/rexcode/PromptInput'
import CodePreview from '../../components/rexcode/CodePreview'
import GeneratedSite from '../../components/rexcode/GeneratedSite'
import LoadingIndicator from '../../components/resume/LoadingIndicator'
import { useRexcode } from '../../hooks/useRexcode'
import styles from './Rexcode.module.css'

const Rexcode = () => {
  const { generate, loading, error } = useRexcode()
  const [result, setResult] = useState(null)

  const handleGenerate = async (prompt) => {
    const data = await generate(prompt, { mode: 'site' })
    setResult(data)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Rexcode – AI Website Builder</h1>
      <PromptInput onGenerate={handleGenerate} />
      {loading && <LoadingIndicator />}
      {error && <div className={styles.error}>{error}</div>}
      {result && (
        <>
          <CodePreview code={result.code} />
          <GeneratedSite url={result.siteUrl} />
        </>
      )}
    </div>
  )
}

export default Rexcode
