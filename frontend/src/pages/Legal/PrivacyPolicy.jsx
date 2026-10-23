import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Database, Cookie, Bell, Mail } from 'lucide-react'
import styles from './LegalPage.module.css'

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <div className={styles.glowBackground} />
      <div className={styles.inner}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to REXION AI
        </Link>

        <header className={styles.header}>
          <span className={styles.badge}>Trust & Transparency</span>
          <h1 className={styles.title}>Privacy Policy</h1>
          <div className={styles.meta}>
            <span>Effective Date: October 1, 2026</span>
            <span>•</span>
            <span>Version: 2.1 (GDPR & CCPA Compliant)</span>
          </div>
        </header>

        <div className={styles.contentWrapper}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Shield className={styles.sectionIcon} size={22} />
              1. Overview & Commitment
            </h2>
            <p>
              At REXION AI ("we", "our", or "us"), we prioritize the privacy and security of candidates, recruiters, and learners utilizing our AI-powered career operating system.
            </p>
            <p>
              This Privacy Policy details how we collect, store, process, and safeguard your personal information when you interact with our web applications, APIs, interview simulators, and resume analytics surfaces.
            </p>
            <div className={styles.highlightBox}>
              <strong>Key Pledge:</strong> We never sell your personal data or your resume records to third-party data brokers. Your profile data and uploaded resumes are solely used to empower your personalized career growth and match you with verified opportunities.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Database className={styles.sectionIcon} size={22} />
              2. Information We Collect
            </h2>
            <p>We collect information in the following categories:</p>
            <ul>
              <li><strong>Account Credentials:</strong> Full name, verified email address, hashed passwords, and account role (candidate or recruiter).</li>
              <li><strong>Professional Profiles & Resumes:</strong> Uploaded CVs/resumes (PDF/DOCX), extracted skill sets, work histories, educational background, GitHub/LinkedIn links.</li>
              <li><strong>Assessment & Learning Data:</strong> Quiz performance, code challenge submissions, mock interview metrics, and skill graph progression.</li>
              <li><strong>Technical & Usage Telemetry:</strong> Anonymized browser type, device details, IP address for security rate-limiting, and session logs.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Eye className={styles.sectionIcon} size={22} />
              3. How We Use Your Data
            </h2>
            <p>Your data is processed strictly for legitimate operational purposes:</p>
            <ul>
              <li>Powering AI resume scoring, ATS optimization recommendations, and career pathway insights.</li>
              <li>Connecting you with curated internship opportunities and recruiters with your explicit consent.</li>
              <li>Executing sandboxed code execution challenges in Rexcode and Code Arena.</li>
              <li>Detecting fraudulent activity, credential stuffing, and maintaining platform security.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Lock className={styles.sectionIcon} size={22} />
              4. Data Protection & Security
            </h2>
            <p>
              We implement enterprise-grade security protocols, including AES-256 encryption at rest and TLS 1.3 encryption in transit for all network traffic.
            </p>
            <p>
              Access to databases and compute environments is restricted through role-based access controls (RBAC) and audited regularly.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Cookie className={styles.sectionIcon} size={22} />
              5. Cookies & Local Storage
            </h2>
            <p>
              We use essential cookies and browser local storage strictly to keep you authenticated and store your UI preferences (such as dark mode and cookie banner consent). You can manage or clear cookie preferences via your browser or our cookie consent manager at any time.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Bell className={styles.sectionIcon} size={22} />
              6. Your Privacy Rights (GDPR & CCPA)
            </h2>
            <p>Depending on your jurisdiction, you have the right to:</p>
            <ul>
              <li><strong>Access & Portability:</strong> Request an export of all personal data held about you in machine-readable format.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete profile details directly via your Settings.</li>
              <li><strong>Erasure ("Right to Be Forgotten"):</strong> Request immediate and permanent deletion of your account and resume data.</li>
              <li><strong>Withdraw Consent:</strong> Opt out of automated resume matchmaking notifications at any time.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Mail className={styles.sectionIcon} size={22} />
              7. Contact Our Data Protection Officer
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to our privacy team:
            </p>
            <div className={styles.contactBox}>
              <p style={{ margin: 0 }}><strong>Email:</strong> privacy@rexion.ai</p>
              <p style={{ margin: '6px 0 0' }}><strong>Postal:</strong> REXION AI Inc., Legal & Privacy Compliance, Global Headquarters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
