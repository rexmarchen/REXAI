import React, { useState } from 'react'
import styles from '../../WorkspaceSection.module.css'

const MODELS = [
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    type: 'claude-opus-4',
    description: 'Best for complex reasoning, architecture and long context tasks.',
    badge: 'Active'
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    type: 'claude-sonnet-4',
    description: 'Balanced for daily coding, rapid iterations and reliable speed.',
    badge: 'Fast'
  },
  {
    id: 'claude-haiku-4',
    name: 'Claude Haiku 4',
    type: 'claude-haiku-4',
    description: 'Optimized for low-latency completions and real-time interactions.'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    type: 'gpt-4o',
    description: 'Multimodal model for code, reasoning, and image-aware workflows.'
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    type: 'gemini-2.0-flash',
    description: 'High throughput model with deep search and long context support.',
    badge: 'New'
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    type: 'meta-llama-3.3-70b',
    description: 'Strong open-source option for privacy-first self-hosted environments.'
  }
]

const ModelsSection = () => {
  const [selectedModel, setSelectedModel] = useState('claude-opus-4')

  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Models</h2>
      <p className={styles.pageSubtitle}>
        Pick the model that best matches your workload and quality requirements.
      </p>

      <div className={styles.modelGrid}>
        {MODELS.map((model) => (
          <article
            key={model.id}
            className={`${styles.modelCard} ${selectedModel === model.id ? styles.modelCardActive : ''}`}
            onClick={() => setSelectedModel(model.id)}
          >
            <h3 className={styles.modelName}>{model.name}</h3>
            <p className={styles.modelType}>{model.type}</p>
            <p className={styles.modelDesc}>{model.description}</p>
            {model.badge && <span className={styles.modelBadge}>{model.badge}</span>}
          </article>
        ))}
      </div>
    </section>
  )
}

export default ModelsSection
