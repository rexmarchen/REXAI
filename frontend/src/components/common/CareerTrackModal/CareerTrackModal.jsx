import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  X, Check, Cpu, Zap, Layers, Code2, BarChart2, Cloud, Sparkles, RefreshCw, ArrowRight, Compass
} from 'lucide-react'
import skillGraphApi from '../../../services/skillGraphApi'
import profileApi from '../../../services/profileApi'
import styles from './CareerTrackModal.module.css'

export const STANDARD_TRACKS = [
  {
    id: 'ai-engineer',
    title: 'AI Engineer',
    category: 'Artificial Intelligence',
    desc: 'LLMs, Machine Learning, Python, RAG architectures, and model inference.',
    icon: Cpu,
    color: '#10B981',
    bg: '#ECFDF5'
  },
  {
    id: 'agentic-ai',
    title: 'Agentic AI Engineer',
    category: 'Autonomous Systems',
    desc: 'Autonomous agent loops, LangGraph, tool-calling, MCP protocols, and multi-agent teams.',
    icon: Zap,
    color: '#D96B43',
    bg: '#FDF3EE'
  },
  {
    id: 'fullstack-developer',
    title: 'Full Stack Engineer',
    category: 'Software Engineering',
    desc: 'React, Node.js, PostgreSQL/MongoDB, REST APIs, and production deployment.',
    icon: Layers,
    color: '#0284C7',
    bg: '#F0F9FF'
  },
  {
    id: 'frontend-developer',
    title: 'Frontend Web Engineer',
    category: 'Frontend & UI',
    desc: 'React, Next.js App Router, TypeScript, Tailwind, CSS animations, and Web Vitals.',
    icon: Code2,
    color: '#8B5CF6',
    bg: '#F5F3FF'
  },
  {
    id: 'data-analyst',
    title: 'Data Scientist & Analyst',
    category: 'Data & Analytics',
    desc: 'Statistics & probability, Pandas, SQL, Scikit-Learn modeling, and Power BI reporting.',
    icon: BarChart2,
    color: '#F59E0B',
    bg: '#FFFBEB'
  },
  {
    id: 'cloud-devops',
    title: 'Cloud & DevOps Engineer',
    category: 'Infrastructure & SRE',
    desc: 'Docker containers, Kubernetes, AWS VPC, GitHub Actions CI/CD, and Terraform IaC.',
    icon: Cloud,
    color: '#64748B',
    bg: '#F8FAFC'
  }
]

export default function CareerTrackModal({
  isOpen,
  onClose,
  currentRoleTitle = 'AI Engineer',
  onRoleSelected = null
}) {
  const navigate = useNavigate()
  const [selectedTrackId, setSelectedTrackId] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('role')
      if (urlParam) return urlParam
      const stored = window.localStorage.getItem('rexionTargetRole')
      if (stored) return stored
    }
    const norm = String(currentRoleTitle || '').toLowerCase().trim()
    if (norm.includes('agentic')) return 'agentic-ai'
    if (norm.includes('full') || norm.includes('software')) return 'fullstack-developer'
    if (norm.includes('front')) return 'frontend-developer'
    if (norm.includes('data')) return 'data-analyst'
    if (norm.includes('devops') || norm.includes('cloud')) return 'cloud-devops'
    return 'ai-engineer'
  })

  // Synchronize active selection if currentRoleTitle changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('role')
      if (urlParam) {
        setSelectedTrackId(urlParam)
        return
      }
      const stored = window.localStorage.getItem('rexionTargetRole')
      if (stored) {
        setSelectedTrackId(stored)
        return
      }
    }
    if (currentRoleTitle) {
      const norm = String(currentRoleTitle || '').toLowerCase().trim()
      if (norm.includes('agentic')) setSelectedTrackId('agentic-ai')
      else if (norm.includes('full') || norm.includes('software')) setSelectedTrackId('fullstack-developer')
      else if (norm.includes('front')) setSelectedTrackId('frontend-developer')
      else if (norm.includes('data')) setSelectedTrackId('data-analyst')
      else if (norm.includes('devops') || norm.includes('cloud')) setSelectedTrackId('cloud-devops')
      else if (norm.includes('ai')) setSelectedTrackId('ai-engineer')
    }
  }, [currentRoleTitle, isOpen])

  const [customInput, setCustomInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [customTracks, setCustomTracks] = useState([])
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const allTracks = [...STANDARD_TRACKS, ...customTracks]
  const activeTrack = allTracks.find(t => t.id === selectedTrackId) || STANDARD_TRACKS[0]

  // Broadcast and apply track change live in real-time
  const handleSelectTrackLive = (track, customData = null) => {
    if (!track) return
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('rexionTargetRole', track.id)
        window.localStorage.setItem('rexionTargetRoleTitle', track.title)
        
        try {
          const userStr = window.localStorage.getItem('rexionUser')
          if (userStr) {
            const u = JSON.parse(userStr)
            u.targetRole = track.title
            window.localStorage.setItem('rexionUser', JSON.stringify(u))
          }
        } catch (_) {}

        window.dispatchEvent(new CustomEvent('rexion-target-role-changed', {
          detail: { roleId: track.id, roleTitle: track.title, customData }
        }))
      }

      if (onRoleSelected) {
        onRoleSelected(track, customData)
      }

      profileApi.update({ targetRole: track.title }).catch(() => {})
    } catch (err) {
      console.error('Failed to apply track live:', err)
    }
  }

  const handleSelectTrack = async (track, navigateToSkillGraph = true, customData = null) => {
    setSaving(true)
    try {
      handleSelectTrackLive(track, customData)
      onClose()

      if (navigateToSkillGraph) {
        navigate(`/skill-graph?role=${track.id}`)
      }
    } catch (err) {
      console.error('Failed to select career track:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateCustom = async (e) => {
    e.preventDefault()
    const clean = customInput.trim()
    if (!clean) return

    setIsGenerating(true)
    try {
      const res = await skillGraphApi.generateCustomPath(clean)
      const roleId = res?.roleId || clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const roleTitle = res?.roleName || clean
      const newTrack = {
        id: roleId,
        title: roleTitle,
        category: 'Custom AI Track',
        desc: `AI-synthesized learning roadmap for ${clean} with custom quizzes and challenges.`,
        icon: Sparkles,
        color: '#D96B43',
        bg: '#FDF3EE'
      }

      setCustomTracks(prev => [newTrack, ...prev])
      setSelectedTrackId(newTrack.id)
      setCustomInput('')
      await handleSelectTrack(newTrack, true, res?.data)
    } catch (err) {
      console.error('Failed to generate custom path:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AnimatePresence>
      <div className={styles.modalOverlay} onClick={onClose}>
        <motion.div
          className={styles.modalBox}
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                <Compass size={20} />
              </div>
              <div>
                <h2 className={styles.modalTitle}>Choose Your Career Journey</h2>
                <p className={styles.modalSubtitle}>
                  Select your target career track to dynamically tailor your Skill Graph, quizzes, and learning roadmap.
                </p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>

          {/* Track Grid */}
          <div className={styles.tracksGrid}>
            {allTracks.map((track) => {
              const Icon = track.icon
              const isSelected = selectedTrackId === track.id
              return (
                <div
                  key={track.id}
                  className={`${styles.trackCard} ${isSelected ? styles.trackCardSelected : ''}`}
                  onClick={() => {
                    setSelectedTrackId(track.id)
                    handleSelectTrackLive(track)
                  }}
                >
                  <div className={styles.cardTop}>
                    <div
                      className={styles.trackIconWrap}
                      style={{ background: track.bg, color: track.color }}
                    >
                      <Icon size={18} />
                    </div>
                    {isSelected && (
                      <div className={styles.selectedBadge}>
                        <Check size={12} />
                        <span>Active</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.trackCategory}>{track.category}</div>
                  <h3 className={styles.trackTitle}>{track.title}</h3>
                  <p className={styles.trackDesc}>{track.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Custom Path Generator */}
          <form className={styles.customPathSection} onSubmit={handleGenerateCustom}>
            <div className={styles.customPathHeader}>
              <Sparkles size={15} color="#D96B43" />
              <span>Want a different path? Let AI build your custom roadmap</span>
            </div>
            <div className={styles.customInputRow}>
              <input
                type="text"
                className={styles.customInput}
                placeholder="e.g. Cybersecurity Specialist, Blockchain Engineer, Game Developer..."
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                disabled={isGenerating}
              />
              <button
                type="submit"
                className={styles.generateBtn}
                disabled={!customInput.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={13} className={styles.spin} />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>AI Build Path</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Actions */}
          <div className={styles.modalFooter}>
            <div className={styles.activeSelectionNotice}>
              Selected: <strong>{activeTrack.title}</strong>
            </div>
            <div className={styles.footerBtns}>
              <button className={styles.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => handleSelectTrack(activeTrack, true)}
                disabled={saving}
              >
                Update My Journey
              </button>
              <button
                className={styles.skillGraphBtn}
                onClick={() => handleSelectTrack(activeTrack, true)}
                disabled={saving}
              >
                <span>View on Skill Graph</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
