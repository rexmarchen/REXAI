import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Play, CheckCircle2, XCircle, RotateCcw,
  Terminal as TerminalIcon, Sparkles, Award, AlertCircle
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getStoredUser } from "../../utils/authSession"
import { fetchChallenge, runChallengeCode, submitChallengeCode } from "../../services/challengesApi"
import styles from "./ChallengeWorkspacePage.module.css"

export default function ChallengeWorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const sessionUser = getStoredUser()

  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("python")
  const [code, setCode] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [activeCaseIdx, setActiveCaseIdx] = useState(0)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setLoading(true)
        const res = await fetchChallenge(id)
        if (isMounted && res?.challenge) {
          setChallenge(res.challenge)
          const initialLang = res.challenge.category === "javascript" || res.challenge.category === "web-dev" ? "javascript" : "python"
          setSelectedLanguage(initialLang)
          setCode(res.challenge.starterCode?.[initialLang] || "")
        }
      } catch (err) {
        showToast("Error loading challenge.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [id])

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang)
    if (challenge?.starterCode?.[lang]) {
      setCode(challenge.starterCode[lang])
    }
    setTestResults(null)
  }

  const handleResetCode = () => {
    if (challenge?.starterCode?.[selectedLanguage]) {
      setCode(challenge.starterCode[selectedLanguage])
      setTestResults(null)
      showToast("Starter code reset.")
    }
  }

  const handleRun = async () => {
    if (!code.trim()) return showToast("Please write code before running.")
    try {
      setIsRunning(true)
      const res = await runChallengeCode(id, { language: selectedLanguage, code })
      setTestResults(res)
      setActiveCaseIdx(0)
      if (res.verdict === "ACCEPTED") {
        showToast("Sample test cases passed!")
      } else {
        showToast(`Test failed: ${res.verdict}`)
      }
    } catch (err) {
      showToast("Execution error encountered.")
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) return showToast("Please write code before submitting.")
    try {
      setIsSubmitting(true)
      const userId = user?.id || sessionUser?.id || sessionUser?._id || "guest"
      const res = await submitChallengeCode(id, { language: selectedLanguage, code, userId })
      setTestResults(res)
      setActiveCaseIdx(0)
      if (res.verdict === "ACCEPTED") {
        try {
          const solved = JSON.parse(localStorage.getItem("rexionSolvedChallenges") || "[]")
          if (!solved.includes(id)) {
            solved.push(id)
            localStorage.setItem("rexionSolvedChallenges", JSON.stringify(solved))
          }
          const awardXp = res.xpAwarded || challenge?.xp || 50
          const currentXP = parseInt(localStorage.getItem("rexionCareerXP") || "4280", 10)
          localStorage.setItem("rexionCareerXP", (currentXP + awardXp).toString())
          window.dispatchEvent(new CustomEvent("rexion-quiz-completed", {
            detail: { type: "challenge", challengeId: id, xpAwarded: awardXp }
          }))
        } catch (e) {
          console.warn("Could not sync solved challenge state", e)
        }
        showToast(`🎉 Challenge Accepted! +${res.xpAwarded || challenge?.xp || 50} XP awarded!`)
      } else {
        showToast(`Submission Verdict: ${res.verdict}`)
      }
    } catch (err) {
      showToast("Submission error encountered.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.shell} style={{ display: "grid", placeItems: "center" }}>
        <div style={{ color: "#8B949E", display: "flex", alignItems: "center", gap: 8 }}>
          <span className={styles.spinner} />
          <span>Loading challenge environment...</span>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className={styles.shell} style={{ padding: 40, textAlign: "center" }}>
        <h2>Challenge Not Found</h2>
        <button className={styles.backBtn} onClick={() => navigate("/challenges")}>
          <ArrowLeft size={14} /> Back to Challenges
        </button>
      </div>
    )
  }

  const diffColor = challenge.difficulty === "Easy" ? "#3FB950" : challenge.difficulty === "Hard" ? "#F85149" : "#D29922"

  return (
    <div className={styles.shell}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: 20,
              right: 24,
              backgroundColor: "#21262D",
              color: "#F0F6FC",
              border: "1px solid #30363D",
              padding: "10px 18px",
              borderRadius: 8,
              zIndex: 100,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Navigation */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={() => navigate("/challenges")}>
            <ArrowLeft size={14} />
            <span>Challenges</span>
          </button>

          <div className={styles.challengeTitleWrap}>
            <h1 className={styles.challengeTitle}>{challenge.title}</h1>
            <span className={styles.diffBadge} style={{ color: diffColor, backgroundColor: `${diffColor}22` }}>
              {challenge.difficulty}
            </span>
            <span className={styles.xpBadge}>
              +{challenge.xp} XP
            </span>
          </div>
        </div>

        <div className={styles.topRight}>
          <select
            className={styles.langSelect}
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript / Node</option>
          </select>

          <button className={styles.backBtn} onClick={handleResetCode} title="Reset to starter code">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <button
            className={styles.runBtn}
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            title="Run against sample test cases"
          >
            {isRunning ? (
              <>
                <span className={styles.spinner} />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={13} fill="#10B981" color="#10B981" />
                <span>Run</span>
              </>
            )}
          </button>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            title="Submit solution to Judge"
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} />
                <span>Grading...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main 2-Column Split Workspace */}
      <div className={styles.workspaceBody}>
        {/* Left Pane: Question Description, Guidelines, Examples */}
        <div className={styles.leftPane}>
          <div className={styles.statementMarkdown}>
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {challenge.statement || challenge.desc}
            </div>
          </div>

          <div className={styles.tagsRow}>
            {(challenge.tags || []).map((t, idx) => (
              <span key={idx} className={styles.tagPill}>{t}</span>
            ))}
          </div>
        </div>

        {/* Right Pane: Code Editor on Top, Terminal on Bottom */}
        <div className={styles.rightPane}>
          {/* Editor */}
          <div className={styles.editorContainer}>
            <div className={styles.lineNumbers}>
              {code.split("\n").map((_, i) => (
                <div key={i} className={styles.lineNum}>{i + 1}</div>
              ))}
            </div>
            <textarea
              className={styles.codeArea}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
            />
          </div>

          {/* Terminal / Test Cases Console */}
          <div className={styles.terminalContainer}>
            <div className={styles.terminalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TerminalIcon size={14} />
                <span>Execution Terminal</span>
                {testResults && (
                  <span
                    style={{
                      marginLeft: 10,
                      color: testResults.verdict === "ACCEPTED" ? "#3FB950" : "#F85149",
                      fontWeight: 700
                    }}
                  >
                    Verdict: {testResults.verdict} ({testResults.passed}/{testResults.total} Passed)
                  </span>
                )}
              </div>

              {testResults?.tests && testResults.tests.length > 0 && (
                <div className={styles.terminalCasesNav}>
                  {testResults.tests.map((_, idx) => (
                    <button
                      key={idx}
                      className={`${styles.casePill} ${activeCaseIdx === idx ? styles.casePillActive : ""}`}
                      onClick={() => setActiveCaseIdx(idx)}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.terminalContent}>
              {!testResults ? (
                <div style={{ color: "#8B949E", padding: "16px 0" }}>
                  Click <strong>Run</strong> to test your solution with sample test cases, or <strong>Submit</strong> for final evaluation.
                </div>
              ) : (
                (() => {
                  const currentTest = testResults.tests?.[activeCaseIdx] || testResults.tests?.[0]
                  if (!currentTest) {
                    return <div>{testResults.error || "No test output available."}</div>
                  }
                  return (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        {currentTest.passed ? (
                          <span className={styles.statusPillPass}>
                            <CheckCircle2 size={13} /> Passed
                          </span>
                        ) : (
                          <span className={styles.statusPillFail}>
                            <XCircle size={13} /> Failed
                          </span>
                        )}
                        <span style={{ color: "#8B949E", fontSize: "0.75rem" }}>
                          Runtime: {testResults.runtimeMs}ms
                        </span>
                      </div>

                      <div className={styles.resultBox}>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ color: "#8B949E" }}>Input: </span>
                          <span>{JSON.stringify(currentTest.input)}</span>
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ color: "#8B949E" }}>Expected: </span>
                          <span style={{ color: "#3FB950" }}>{JSON.stringify(currentTest.expected)}</span>
                        </div>
                        <div>
                          <span style={{ color: "#8B949E" }}>Actual: </span>
                          <span style={{ color: currentTest.passed ? "#3FB950" : "#F85149" }}>
                            {JSON.stringify(currentTest.actual)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
