import React, { useState } from 'react'
import apiClient from '../../services/apiClient'
import styles from './LinkedInSetupModal.module.css'

export default function LinkedInSetupModal({ isOpen, onClose, onConnected, currentGithub = '' }) {
  const [activeTab, setActiveTab] = useState('cloud') // 'cloud' | 'local' | 'guide'
  const [geminiKey, setGeminiKey] = useState('')
  const [linkedinToken, setLinkedinToken] = useState('')
  const [githubUser, setGithubUser] = useState(currentGithub || '')
  const [authorName, setAuthorName] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [copiedEnv, setCopiedEnv] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)

  if (!isOpen) return null

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await apiClient.post('/linkedin-automation/test-connection', {
        geminiApiKey: geminiKey,
        linkedinAccessToken: linkedinToken
      })
      setTestResult(res)
    } catch (err) {
      setTestResult({
        gemini: { ok: false, message: err.message },
        linkedin: { ok: false, message: 'Test failed.' }
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveAndActivate = async () => {
    setSaving(true)
    try {
      await apiClient.post('/linkedin-automation/save-keys', {
        geminiApiKey: geminiKey,
        linkedinAccessToken: linkedinToken,
        githubUsername: githubUser,
        authorName
      })
      if (onConnected) onConnected()
      onClose()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not save credentials.')
    } finally {
      setSaving(false)
    }
  }

  const sampleEnvText = `# 1. Google AI Studio Key (Free): https://aistudio.google.com/
GEMINI_API_KEY=${geminiKey || 'your_gemini_api_key'}

# 2. LinkedIn Access Token with w_member_social scope
LINKEDIN_ACCESS_TOKEN=${linkedinToken || 'your_linkedin_access_token'}

# 3. Your Personal Details
AUTHOR_NAME=${authorName || 'Your Name'}
GITHUB_USERNAME=${githubUser || 'your_github_username'}`

  const copyEnv = () => {
    navigator.clipboard.writeText(sampleEnvText)
    setCopiedEnv(true)
    setTimeout(() => setCopiedEnv(false), 2000)
  }

  const copyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </div>
            <div>
              <h3>Connect LinkedIn Autonomous Agent</h3>
              <p>Configure your personal branding agent for web or self-hosted CLI</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'cloud' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('cloud')}
          >
            ⚡ 1-Click Web Connect
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'local' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('local')}
          >
            💻 Run on Local Machine (CLI)
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'guide' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            📖 How to Get Keys
          </button>
        </div>

        <div className={styles.body}>
          {activeTab === 'cloud' && (
            <>
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>1. Google Gemini API Key</label>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className={styles.helperLink}>
                    Get Free Key (AI Studio) ↗
                  </a>
                </div>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>2. LinkedIn Access Token</label>
                  <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className={styles.helperLink}>
                    Developer Portal ↗
                  </a>
                </div>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="AQV..."
                  value={linkedinToken}
                  onChange={(e) => setLinkedinToken(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>3. GitHub Username (for autonomous repo research)</label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>e.g. rexmarchen</span>
                </div>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="your-github-handle"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                />
              </div>

              {testResult && (
                <div className={styles.testStatusBox}>
                  <div className={styles.testItem}>
                    <span>Gemini AI Engine:</span>
                    {testResult.gemini?.ok ? (
                      <span className={styles.successText}>✓ {testResult.gemini.message}</span>
                    ) : (
                      <span className={styles.warnText}>✗ {testResult.gemini?.message || 'Not configured'}</span>
                    )}
                  </div>
                  <div className={styles.testItem}>
                    <span>LinkedIn Profile:</span>
                    {testResult.linkedin?.ok ? (
                      <span className={styles.successText}>✓ Connected as {testResult.linkedin.name} ({testResult.linkedin.personUrn})</span>
                    ) : (
                      <span className={styles.warnText}>✗ {testResult.linkedin?.message || 'Not connected'}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'local' && (
            <>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                You can run the RAG & autonomous research agent directly on your laptop or server with full local vector memory:
              </p>

              <div className={styles.cliCard}>
                <div className={styles.cliHeader}>
                  <span className={styles.cliTitle}>scripts/linkedin-rag-agent/.env</span>
                  <button className={styles.copyBtn} onClick={copyEnv}>
                    {copiedEnv ? 'Copied ✓' : 'Copy .env'}
                  </button>
                </div>
                <pre className={styles.codeBlock}>{sampleEnvText}</pre>
              </div>

              <div className={styles.stepList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4>Preview Autonomous Post (Dry Run)</h4>
                    <p>Scans your GitHub repos, ideates an authentic angle, and drafts post text without publishing:</p>
                    <pre className={styles.codeBlock} style={{ marginTop: '0.35rem' }}>npm run agent:linkedin:dry-run</pre>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4>Publish Live to LinkedIn</h4>
                    <p>Generates post + optional AI architecture diagram and posts to your profile:</p>
                    <pre className={styles.codeBlock} style={{ marginTop: '0.35rem' }}>npm run agent:linkedin:auto</pre>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4>Index Your Resumes & Technical Notes</h4>
                    <p>Drop any <code>.pdf</code>, <code>.md</code>, <code>.docx</code>, or <code>.txt</code> files into <code>scripts/linkedin-rag-agent/documents/</code> and run:</p>
                    <pre className={styles.codeBlock} style={{ marginTop: '0.35rem' }}>npm run agent:linkedin:ingest</pre>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'guide' && (
            <div className={styles.stepList}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>Get Free Gemini API Key</h4>
                  <p>
                    Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className={styles.helperLink}>Google AI Studio ↗</a>, click <strong>Create API key</strong>, and paste it into the <code>GEMINI_API_KEY</code> field.
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>Get LinkedIn OAuth Token</h4>
                  <p>
                    Go to the <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className={styles.helperLink}>LinkedIn Developer Portal ↗</a>, create an App, and enable <strong>Share on LinkedIn</strong> and <strong>Sign In with LinkedIn</strong> under the Products tab. Generate a user token with <code>w_member_social</code> scope.
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>Connect GitHub</h4>
                  <p>
                    Enter your public GitHub username. The agent will periodically inspect your public repositories, READMEs, and commits to craft fresh, non-repetitive developer stories.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {activeTab === 'cloud' ? (
            <>
              <button
                type="button"
                className={styles.testBtn}
                onClick={handleTestConnection}
                disabled={testing || (!geminiKey && !linkedinToken)}
              >
                {testing ? 'Testing...' : '⚡ Test Connection'}
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSaveAndActivate}
                disabled={saving || (!geminiKey && !linkedinToken && !githubUser)}
              >
                {saving ? 'Saving...' : 'Save & Activate Agent'}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button type="button" className={styles.testBtn} onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
