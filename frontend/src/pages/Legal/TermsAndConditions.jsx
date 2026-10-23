import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, ShieldCheck, Cpu, DollarSign, Scale } from 'lucide-react'
import styles from './LegalPage.module.css'

export default function TermsAndConditions() {
  return (
    <div className={styles.container}>
      <div className={styles.glowBackground} />
      <div className={styles.inner}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to REXION AI
        </Link>

        <header className={styles.header}>
          <span className={styles.badge}>User Agreement</span>
          <h1 className={styles.title}>Terms of Service</h1>
          <div className={styles.meta}>
            <span>Effective Date: October 1, 2026</span>
            <span>•</span>
            <span>Version: 2.0</span>
          </div>
        </header>

        <div className={styles.contentWrapper}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileText className={styles.sectionIcon} size={22} />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, registering for, or using REXION AI services, website, or developer platforms, you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these terms, you may not access or use our services.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <CheckCircle className={styles.sectionIcon} size={22} />
              2. User Accounts & Responsibilities
            </h2>
            <p>
              To access certain features (such as Resume Analyzer, Mock Interviews, and Code Arena), you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete profile and credentials.</li>
              <li>Maintain the confidentiality of your authentication tokens and password.</li>
              <li>Promptly notify REXION AI of any unauthorized access or breach of security.</li>
              <li>Assume full responsibility for all activities that occur under your credentials.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Cpu className={styles.sectionIcon} size={22} />
              3. Acceptable Use of AI & Code Execution Sandboxes
            </h2>
            <p>
              REXION AI provides AI-assisted interview training and sandboxed programming environments. You expressly agree not to:
            </p>
            <ul>
              <li>Execute malicious payloads, fork bombs, denial-of-service scripts, or probe internal network infrastructure.</li>
              <li>Reverse engineer, scrape at scale, or bypass automated rate limits imposed on our AI APIs.</li>
              <li>Upload plagiarized resumes or submit fraudulent credentials to recruitment partners.</li>
              <li>Use the platform to distribute unsolicited spam, promotional outreach, or deceptive materials.</li>
            </ul>
            <div className={styles.highlightBox}>
              <strong>Enforcement:</strong> Any account detected violating acceptable use policies or attempting infrastructure abuse will be subject to immediate termination without refund.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <DollarSign className={styles.sectionIcon} size={22} />
              4. Subscription & Billing (RexPro)
            </h2>
            <p>
              Certain premium capabilities, such as unlimited AI interview simulations and verified recruiter spotlights, are offered under paid subscriptions (RexPro).
            </p>
            <ul>
              <li><strong>Billing:</strong> Fees are charged on a monthly or annual billing cycle based on the plan selected at checkout.</li>
              <li><strong>Cancellations:</strong> You may cancel your subscription at any time via your Account Dashboard. Access remains active until the end of the paid billing period.</li>
              <li><strong>Refunds:</strong> We offer a 14-day satisfaction refund guarantee for initial purchases upon written request.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <ShieldCheck className={styles.sectionIcon} size={22} />
              5. Intellectual Property
            </h2>
            <p>
              The REXION AI platform, including its software, UI components, branding, logos, and custom learning algorithms, is the exclusive property of REXION AI and its licensors.
            </p>
            <p>
              You retain full ownership of all original code submissions, personal resumes, and portfolio assets you upload to the platform.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <AlertTriangle className={styles.sectionIcon} size={22} />
              6. Disclaimer & Limitation of Liability
            </h2>
            <p>
              REXION AI is provided on an "as is" and "as available" basis. While our AI recommendation systems are designed to maximize career success, we make no guarantee of specific job placements or interview outcomes.
            </p>
            <p>
              To the maximum extent permitted by applicable law, REXION AI shall not be liable for any indirect, incidental, or consequential damages resulting from platform usage.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Scale className={styles.sectionIcon} size={22} />
              7. Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the applicable legal jurisdiction, without giving effect to conflict of law provisions.
            </p>
            <div className={styles.contactBox}>
              <p style={{ margin: 0 }}><strong>Legal Inquiries:</strong> legal@rexion.ai</p>
              <p style={{ margin: '6px 0 0' }}><strong>Postal:</strong> REXION AI Inc., Legal Counsel, Global Operations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
