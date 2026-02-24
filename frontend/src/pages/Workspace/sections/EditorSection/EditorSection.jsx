import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const EditorSection = () => {
  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Editor</h2>
      <p className={styles.pageSubtitle}>
        AI-assisted editor with suggestions designed for shipping production code.
      </p>

      <div className={styles.editorLayout}>
        <article className={styles.panelCard}>
          <header className={styles.panelHeader}>
            main.py
            <span className={styles.panelHeaderMeta}>Python · UTF-8</span>
          </header>
          <div className={styles.panelBody}>
            <pre className={styles.codePane}>
              <span className={styles.codeKw}>from</span> fastapi <span className={styles.codeKw}>import</span> FastAPI{'\n'}
              <span className={styles.codeKw}>from</span> pydantic <span className={styles.codeKw}>import</span> BaseModel{'\n\n'}
              app = <span className={styles.codeFn}>FastAPI</span>(){'\n\n'}
              <span className={styles.codeKw}>class</span> <span className={styles.codeFn}>ChatRequest</span>(BaseModel):{'\n'}
              {'  '}message: str{'\n'}
              {'  '}max_tokens: int = <span className={styles.codeNum}>1024</span>{'\n\n'}
              @app.<span className={styles.codeFn}>post</span>(<span className={styles.codeStr}>"/chat"</span>){'\n'}
              <span className={styles.codeKw}>async def</span> <span className={styles.codeFn}>chat</span>(req: ChatRequest):{'\n'}
              {'  '}<span className={styles.codeKw}>return</span> {'{'}
              <span className={styles.codeStr}>"reply"</span>: <span className={styles.codeStr}>"Generated response"</span>{'}'}
            </pre>
          </div>
        </article>

        <article className={styles.panelCard}>
          <header className={styles.panelHeader}>AI Suggestions</header>
          <div className={styles.panelBody}>
            <div className={styles.suggestionsList}>
              <div className={styles.suggestionCard}>
                <p className={styles.suggestionTitle}>Add request schema validation</p>
                <pre className={styles.suggestionCode}>@validator('message'){'\n'}def not_empty(cls, v): ...</pre>
              </div>
              <div className={styles.suggestionCard}>
                <p className={styles.suggestionTitle}>Add rate limiting middleware</p>
                <pre className={styles.suggestionCode}>limiter.limit("10/minute")</pre>
              </div>
              <div className={styles.suggestionCard}>
                <p className={styles.suggestionTitle}>Add structured error logging</p>
                <pre className={styles.suggestionCode}>logger.exception("chat.error", extra={'{'} ... {'}'})</pre>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default EditorSection
