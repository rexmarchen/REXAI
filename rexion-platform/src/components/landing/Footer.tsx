import Link from 'next/link'
import styles from '@/styles/landing.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div>
          <div className={styles.brand}>
            <span className={styles.brandMark} />
            REXION AI
          </div>
          <p className={styles.sectionDescription}>The AI system built for India&apos;s job seekers.</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/">Product</Link>
          <a href="#pricing">Pricing</a>
          <a href="#features">Features</a>
          <Link href="/privacy">Privacy</Link>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/login">Log In</Link>
          <Link href="/signup">Start Free</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
      <div className={styles.footerBottom}>© 2025 REXION AI. Built for India&apos;s job seekers. Powered by AI.</div>
    </footer>
  )
}
