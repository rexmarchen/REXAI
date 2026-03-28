import styles from '@/styles/landing.module.css'

const messages = [
  'Arjun got 3 interviews in 2 days using Outreach Automation',
  'Sneha earned ₹18,000 on a micro-gig that became a PPO',
  'Rohan landed a ₹12 LPA offer after a resume analyzer rewrite',
  'Priya sent 40 cold emails in 10 minutes with 1-Click Outreach',
]

export function FeatureTicker() {
  return (
    <div className={styles.socialBand}>
      <div className={styles.tickerTrack}>
        {[...messages, ...messages].map((message, index) => (
          <span key={`${message}-${index}`} className={styles.tickerItem}>
            {message}
            <span className={styles.tickerMark}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
