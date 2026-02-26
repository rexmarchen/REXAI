import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ParticleEarth from '../../components/common/ParticleEarth'
import WorkspaceSection from '../Workspace'
import { useRexcode } from '../../hooks/useRexcode'
import styles from './Home.module.css'

const BOLD_MARKDOWN_REGEX = /(\*\*[^*]+\*\*)/g

const renderInlineAnswer = (text, keyPrefix) => {
  return String(text)
    .split(BOLD_MARKDOWN_REGEX)
    .map((segment, index) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        const content = segment.slice(2, -2).trim()
        if (!content) {
          return null
        }

        return <strong key={`${keyPrefix}-strong-${index}`}>{content}</strong>
      }

      return (
        <React.Fragment key={`${keyPrefix}-text-${index}`}>
          {segment}
        </React.Fragment>
      )
    })
}

const renderAnswerBlocks = (answer) => {
  const blocks = String(answer || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const isList = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line))

    if (isList) {
      return (
        <ul key={`answer-list-${blockIndex}`} className={styles.answerList}>
          {lines.map((line, itemIndex) => (
            <li key={`answer-list-item-${blockIndex}-${itemIndex}`}>
              {renderInlineAnswer(line.replace(/^[-*]\s+/, ''), `list-${blockIndex}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      )
    }

    return (
      <p key={`answer-para-${blockIndex}`} className={styles.answerParagraph}>
        {renderInlineAnswer(lines.join(' '), `para-${blockIndex}`)}
      </p>
    )
  })
}

const Home = () => {
  const [prompt, setPrompt] = useState('')
  const [rexcodeResult, setRexcodeResult] = useState(null)

  const {
    generate,
    loading: rexcodeLoading,
    error: rexcodeError
  } = useRexcode()

  const handleAsk = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    const result = await generate(trimmed, { mode: 'answer' })
    if (result) setRexcodeResult(result)
  }
  const generatedCode =
    rexcodeResult?.code ||
    rexcodeResult?.result?.code ||
    ''
  const generatedAnswer =
    rexcodeResult?.answer ||
    rexcodeResult?.result?.answer ||
    ''
  const generatedUrl =
    rexcodeResult?.siteUrl ||
    rexcodeResult?.result?.siteUrl ||
    ''
  const generatedUrlLabel = generatedUrl.startsWith('data:text/html')
    ? 'Open generated site preview'
    : generatedUrl

  return (
    <>
      <ParticleEarth />
      <div className="grid-bg"></div>
      <div className="corner corner-tl"></div>
      <div className="corner corner-tr"></div>
      <div className="corner corner-bl"></div>
      <div className="corner corner-br"></div>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>NEXT GENERATION ARTIFICIAL INTELLIGENCE</div>
        <h1 className={styles.heroTitle}>REXION</h1>
        <p className={styles.heroSub}>INTELLIGENCE BEYOND IMAGINATION</p>

        <div className={styles.authActions}>
          <Link to="/login" className={styles.loginCta}>Login</Link>
          <Link to="/register" className={styles.registerCta}>Register</Link>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchBar}
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAsk()
              }}
              placeholder="Ask REXION anything..."
            />
            <span className={styles.searchIcon}>Q</span>
          </div>
          <button
            className={styles.searchBtn}
            onClick={handleAsk}
            disabled={rexcodeLoading}
          >
            {rexcodeLoading ? 'ASKING...' : 'ASK'}
          </button>
          <div className={styles.robotWrap}>
            <div className={styles.robotOrb}></div>
            <div className={styles.robotLabel}>AI CORE</div>
          </div>
        </div>

        {rexcodeError && <p className={styles.errorText}>{rexcodeError}</p>}

        <div className={styles.aiOutputSection}>
          <div className={`${styles.resultCard} ${generatedAnswer ? styles.answerCard : ''}`}>
            <h3>AI Output</h3>
            {generatedAnswer && (
              <div className={styles.answerBubble}>
                {renderAnswerBlocks(generatedAnswer)}
              </div>
            )}
            {!generatedAnswer && generatedUrl && (
              <p>
                Site URL:{' '}
                <a href={generatedUrl} target="_blank" rel="noreferrer">
                  {generatedUrlLabel}
                </a>
              </p>
            )}
            {!generatedAnswer && generatedCode && (
              <pre className={styles.codeBlock}>{generatedCode}</pre>
            )}
            {!generatedAnswer && !generatedCode && !generatedUrl && (
              <p>Ask something and your AI output will appear here.</p>
            )}
          </div>
        </div>

        <div className={styles.quickLinks}>
          <Link to="/resume-predictor">Open Resume Predictor Page</Link>
          <a href="#workspace">Open Workspace</a>
        </div>
      </section>

      <section id="workspace" className={styles.workspaceSection}>
        <WorkspaceSection />
      </section>
    </>
  )
}

export default Home
