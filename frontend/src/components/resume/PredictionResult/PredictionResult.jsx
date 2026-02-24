import React from 'react'
import styles from './PredictionResult.module.css'
import VoiceAssistant from '../VoiceAssistant'

const renderList = (title, items, emptyText) => {
  const list = Array.isArray(items) ? items.filter(Boolean) : []

  return (
    <section className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      {list.length > 0 ? (
        <ul className={styles.list}>
          {list.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{emptyText}</p>
      )}
    </section>
  )
}

const PredictionResult = ({ result }) => {
  const confidenceLevel = result.confidenceLevel || 'Unknown'
  const voiceMessage =
    result.voiceSummary ||
    `Your confidence level is ${result.confidence} percent. Main weakness is ${
      result.weaknesses?.[0] || 'not enough measurable impact in resume'
    }. Main improvement is ${
      result.improvementPlan?.[0] || 'add measurable outcomes and role-specific technologies'
    }.`

  return (
    <div className={styles.result}>
      <h3 className={styles.heading}>Your Future Prediction</h3>
      <div className={styles.content}>
        <p className={styles.prediction}>{result.prediction}</p>
        <p className={styles.confidence}>
          Confidence: {result.confidence}% ({confidenceLevel})
        </p>
        <p className={styles.model}>Analysis model: {result.llmModel || 'local-llm-v1'}</p>

        {renderList(
          'Weaknesses',
          result.weaknesses,
          'No major weakness detected. Keep improving role alignment.'
        )}
        {renderList(
          'Precautions For Future Applications',
          result.precautions,
          'No critical precautions found. Continue with targeted applications.'
        )}
        {renderList(
          'New Technologies You Should Learn',
          result.technologyRecommendations,
          'No extra technology suggestion available.'
        )}
        {renderList(
          'Improvement Plan',
          result.improvementPlan,
          'No improvement plan generated yet.'
        )}

        <VoiceAssistant message={voiceMessage} />
      </div>
    </div>
  )
}

export default PredictionResult
