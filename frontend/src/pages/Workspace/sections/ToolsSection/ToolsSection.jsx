import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const TOOLS = [
  {
    id: 'test-generator',
    title: 'Test Generator',
    meta: 'Quality',
    description: 'Auto-generate unit and integration tests from existing logic.'
  },
  {
    id: 'api-validator',
    title: 'API Validator',
    meta: 'Reliability',
    description: 'Run schema checks, payload validation and response conformity.'
  },
  {
    id: 'security-scanner',
    title: 'Security Scanner',
    meta: 'Security',
    description: 'Detect unsafe patterns, secrets, and auth vulnerabilities.'
  },
  {
    id: 'prompt-optimizer',
    title: 'Prompt Optimizer',
    meta: 'AI Ops',
    description: 'Tune prompts for consistency, latency and lower token cost.'
  },
  {
    id: 'migration-builder',
    title: 'Migration Builder',
    meta: 'Database',
    description: 'Generate safe SQL migrations with rollback scripts.'
  },
  {
    id: 'bundle-profiler',
    title: 'Bundle Profiler',
    meta: 'Performance',
    description: 'Analyze JS bundles and suggest strategic splitting.'
  }
]

const ToolsSection = () => {
  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Tools</h2>
      <p className={styles.pageSubtitle}>
        Production tooling for code quality, performance and security.
      </p>

      <div className={styles.toolGrid}>
        {TOOLS.map((tool) => (
          <article key={tool.id} className={styles.toolCard}>
            <h3 className={styles.toolTitle}>{tool.title}</h3>
            <p className={styles.toolMeta}>{tool.meta}</p>
            <p className={styles.toolDesc}>{tool.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ToolsSection
