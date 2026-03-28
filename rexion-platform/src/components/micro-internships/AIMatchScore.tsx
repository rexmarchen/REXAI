import styles from '@/styles/micro.module.css'

export function AIMatchScore({ score, explanation }: { score: number; explanation?: string }) {
  return (
    <div className={styles.inlineMeta}>
      <span className={styles.matchScore}>{score}% match</span>
      {explanation ? <span className={styles.muted}>{explanation}</span> : null}
    </div>
  )
}
