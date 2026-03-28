import styles from '@/styles/landing.module.css'
import { FeatureTicker } from '@/components/landing/FeatureTicker'
import { TestimonialCards } from '@/components/landing/TestimonialCards'
import { AnimatedCounter } from '@/components/landing/AnimatedCounter'

export function SocialProof() {
  return (
    <section id="social-proof">
      <FeatureTicker />
      <div className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionKicker}>Proof over promise</span>
            <h2 className={styles.sectionTitle}>The search gets tighter when the signal gets real.</h2>
            <p className={styles.sectionDescription}>
              More replies, better gigs, faster interview loops, and a cleaner path from work shipped to offers earned.
            </p>
          </div>

          <TestimonialCards />

          <div className={styles.statsStrip}>
            <article className={styles.statsStripCard}>
              <div className={styles.counterValue}>
                <AnimatedCounter value={10000} suffix="+" />
              </div>
              <div>Users</div>
            </article>
            <article className={styles.statsStripCard}>
              <div className={styles.counterValue}>₹<AnimatedCounter value={50} suffix="L+" /></div>
              <div>Earned on Micro-Gigs</div>
            </article>
            <article className={styles.statsStripCard}>
              <div className={styles.counterValue}>
                <AnimatedCounter value={87} suffix="%" />
              </div>
              <div>Interview Rate</div>
            </article>
            <article className={styles.statsStripCard}>
              <div className={styles.counterValue}>
                <AnimatedCounter value={49} suffix="★" />
              </div>
              <div>Rating</div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
