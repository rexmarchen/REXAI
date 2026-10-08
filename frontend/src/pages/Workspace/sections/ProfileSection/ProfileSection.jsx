import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../../context/AuthContext'
import profileApi from '../../../../services/profileApi'
import { persistStoredUser } from '../../../../utils/authSession'
import ImageCropModal from '../../../../components/common/ImageCropModal'
import styles from './ProfileSection.module.css'

const PRESET_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Next.js', 'Python', 'TailwindCSS',
  'MongoDB', 'PostgreSQL', 'GraphQL', 'AWS', 'Docker', 'REST APIs',
  'System Design', 'Git', 'FastAPI', 'Express', 'Redis', 'CI/CD'
]

const resolveImageUrl = (url) => {
  if (!url) return ''
  const trimmed = String(url).trim()
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed
  }
  if (trimmed.startsWith('/uploads')) {
    if (typeof window !== 'undefined' && window.location.port !== '5000') {
      return `http://127.0.0.1:5000${trimmed}`
    }
    return trimmed
  }
  return trimmed
}

const ProfileSection = () => {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState({
    name: '',
    fullName: '',
    headline: '',
    bio: '',
    phone: '',
    location: '',
    college: '',
    degree: '',
    graduationYear: '',
    skills: [],
    targetRole: '',
    workMode: 'Remote / Hybrid',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    noticePeriod: 'Immediate',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    resumeFileName: '',
    avatarUrl: '/uploads/profile-avatar.jpg',
    avatar: '/uploads/profile-avatar.jpg',
    bannerUrl: '',
    coverUrl: '',
    experiences: [],
    projects: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [activeModal, setActiveModal] = useState(null)
  const [modalForm, setModalForm] = useState({})
  const [newSkillInput, setNewSkillInput] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: '',
    type: 'banner', // 'banner' or 'avatar'
    title: 'Crop & Frame Panel Cover Photo',
    aspectRatio: 3.2,
    targetWidth: 1440,
    targetHeight: 450
  })

  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const modalAvatarInputRef = useRef(null)
  const modalBannerInputRef = useRef(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      console.log('[PROFILE] Loading profile from database...')
      const res = await profileApi.get()
      console.log('[PROFILE] Loaded profile response:', res)

      if (res && res.profile) {
        const p = res.profile
        const name = res.name || p.name || p.fullName || authUser?.fullName || authUser?.name || ''
        const github = p.github || p.githubUrl || ''
        const linkedin = p.linkedin || p.linkedinUrl || ''
        const portfolio = p.portfolio || p.portfolioUrl || ''
        const avatarUrl = p.avatarUrl || p.avatar || ''
        const bannerUrl = p.bannerUrl || p.coverUrl || ''

        setProfile((prev) => ({
          ...prev,
          ...p,
          name,
          fullName: name,
          email: res.email || p.email || authUser?.email || '',
          headline: p.headline || '',
          bio: p.bio || '',
          location: p.location || '',
          phone: p.phone || '',
          targetRole: p.targetRole || '',
          workMode: p.workMode || 'Remote / Hybrid',
          noticePeriod: p.noticePeriod || 'Immediate',
          avatarUrl,
          avatar: avatarUrl,
          bannerUrl,
          coverUrl: bannerUrl,
          github,
          githubUrl: github,
          linkedin,
          linkedinUrl: linkedin,
          portfolio,
          portfolioUrl: portfolio,
          skills: Array.isArray(p.skills) ? p.skills : (prev.skills || []),
          experiences: Array.isArray(p.experiences) ? p.experiences : (Array.isArray(p.experience) ? p.experience : (prev.experiences || [])),
          projects: Array.isArray(p.projects) ? p.projects : (prev.projects || [])
        }))
      }
    } catch (err) {
      console.error('[PROFILE] Database load error:', err)
      // Only fallback to authUser if profile is completely empty
      setProfile((prev) => {
        if (prev.name || prev.headline) return prev
        const name = authUser?.fullName || authUser?.name || ''
        return {
          ...prev,
          name,
          fullName: name,
          email: authUser?.email || '',
          headline: authUser?.profile?.headline || '',
          bio: authUser?.profile?.bio || '',
          location: authUser?.profile?.location || '',
          targetRole: authUser?.targetRole || '',
          skills: authUser?.profile?.skills || []
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate completion percentage
  const calculateCompletion = () => {
    let score = 0
    if (profile.name || authUser?.name || authUser?.fullName) score += 15
    if (profile.headline) score += 15
    if (profile.bio) score += 10
    if (profile.skills && profile.skills.length > 0) score += 15
    if (profile.targetRole) score += 15
    if (profile.location) score += 10
    if (profile.resumeUrl) score += 15
    if (profile.linkedinUrl || profile.githubUrl || profile.github || profile.linkedin) score += 10
    return Math.min(100, Math.max(score, 20))
  }

  const completionScore = calculateCompletion()

  const openModal = (type) => {
    setActiveModal(type)
    setSaveStatus(null)
    setModalForm({
      ...profile,
      name: profile.name || authUser?.fullName || authUser?.name || '',
      fullName: profile.name || authUser?.fullName || authUser?.name || '',
      avatarUrl: profile.avatarUrl || profile.avatar || '',
      avatar: profile.avatarUrl || profile.avatar || '',
      bannerUrl: profile.bannerUrl || profile.coverUrl || '',
      coverUrl: profile.bannerUrl || profile.coverUrl || '',
      github: profile.github || profile.githubUrl || '',
      githubUrl: profile.github || profile.githubUrl || '',
      linkedin: profile.linkedin || profile.linkedinUrl || '',
      linkedinUrl: profile.linkedin || profile.linkedinUrl || '',
      portfolio: profile.portfolio || profile.portfolioUrl || '',
      portfolioUrl: profile.portfolio || profile.portfolioUrl || ''
    })
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalForm({})
    setSaveStatus(null)
  }

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setCropModal({
      isOpen: true,
      imageSrc: previewUrl,
      type: 'avatar',
      title: 'Crop & Center Profile Photo / Logo',
      aspectRatio: 1,
      targetWidth: 500,
      targetHeight: 500
    })
    if (e.target) e.target.value = ''
  }

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setCropModal({
      isOpen: true,
      imageSrc: previewUrl,
      type: 'banner',
      title: 'Crop & Frame Panel Cover Photo',
      aspectRatio: 3.2,
      targetWidth: 1440,
      targetHeight: 450
    })
    if (e.target) e.target.value = ''
  }

  const handleCropComplete = async (blob, croppedFile, explicitType) => {
    try {
      setUploadingImage(true)
      const targetType = explicitType || cropModal.type || (cropModal.aspectRatio <= 1.2 ? 'avatar' : 'banner')
      const isAvatar = targetType === 'avatar'
      console.log(`[PROFILE] Uploading cropped ${targetType} file:`, croppedFile.name)
      const res = await profileApi.uploadImage(croppedFile)
      console.log('[PROFILE] Cropped upload response:', res)

      const newUrl = res.url
      const timestampedUrl = `${newUrl}?t=${Date.now()}`

      if (isAvatar) {
        setProfile((prev) => ({
          ...prev,
          avatarUrl: timestampedUrl,
          avatar: newUrl
        }))
        setModalForm((prev) => ({
          ...prev,
          avatarUrl: timestampedUrl,
          avatar: newUrl
        }))
        await profileApi.save({ avatarUrl: newUrl, avatar: newUrl })
        console.log('[PROFILE] Cropped avatar persisted to database successfully.')
      } else {
        setProfile((prev) => ({
          ...prev,
          bannerUrl: timestampedUrl,
          coverUrl: newUrl
        }))
        setModalForm((prev) => ({
          ...prev,
          bannerUrl: timestampedUrl,
          coverUrl: newUrl
        }))
        await profileApi.save({ bannerUrl: newUrl, coverUrl: newUrl })
        console.log('[PROFILE] Cropped cover photo persisted to database successfully.')
      }
    } catch (err) {
      console.error('[PROFILE] Image upload error:', err)
      alert('Failed to save cropped image. Please ensure the file is valid.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleOpenAvatarStudio = () => {
    setCropModal({
      isOpen: true,
      imageSrc: profile.avatarUrl ? resolveImageUrl(profile.avatarUrl) : '',
      type: 'avatar',
      title: 'Profile Photo Studio',
      aspectRatio: 1,
      targetWidth: 500,
      targetHeight: 500
    })
  }

  const handleOpenCoverStudio = () => {
    setCropModal({
      isOpen: true,
      imageSrc: profile.bannerUrl ? resolveImageUrl(profile.bannerUrl) : '',
      type: 'banner',
      title: 'Cover Photo Studio',
      aspectRatio: 3.2,
      targetWidth: 1440,
      targetHeight: 450
    })
  }

  const handleRemoveAvatar = async () => {
    try {
      setProfile((prev) => ({ ...prev, avatarUrl: '', avatar: '' }))
      setModalForm((prev) => ({ ...prev, avatarUrl: '', avatar: '' }))
      await profileApi.save({ avatarUrl: '', avatar: '' })
    } catch (err) {
      console.error('[PROFILE] Failed to remove avatar:', err)
    }
  }

  const handleRemoveBanner = async () => {
    try {
      setProfile((prev) => ({ ...prev, bannerUrl: '', coverUrl: '' }))
      setModalForm((prev) => ({ ...prev, bannerUrl: '', coverUrl: '' }))
      await profileApi.save({ bannerUrl: '', coverUrl: '' })
    } catch (err) {
      console.error('[PROFILE] Failed to remove banner:', err)
    }
  }

  const handleSaveModal = async (e) => {
    e?.preventDefault()
    const profileData = { ...modalForm }

    // Normalize field aliases before sending
    if (profileData.github) profileData.githubUrl = profileData.github
    if (profileData.githubUrl) profileData.github = profileData.githubUrl
    if (profileData.linkedin) profileData.linkedinUrl = profileData.linkedin
    if (profileData.linkedinUrl) profileData.linkedin = profileData.linkedinUrl
    if (profileData.portfolio) profileData.portfolioUrl = profileData.portfolio
    if (profileData.portfolioUrl) profileData.portfolio = profileData.portfolioUrl
    if (profileData.name) profileData.fullName = profileData.name
    if (profileData.avatarUrl) profileData.avatar = profileData.avatarUrl
    if (profileData.avatar) profileData.avatarUrl = profileData.avatar
    if (profileData.bannerUrl) profileData.coverUrl = profileData.bannerUrl
    if (profileData.coverUrl) profileData.bannerUrl = profileData.coverUrl

    console.log('[PROFILE] Form data before save:', profileData)
    console.log('[PROFILE] Saving profile...')

    try {
      setSaving(true)
      setSaveStatus(null)

      const responseData = await profileApi.save(profileData)
      console.log('[PROFILE] Save response:', responseData)

      const savedP = responseData?.profile || profileData
      const updatedName = responseData?.name || profileData.name || profile.name

      setProfile((prev) => ({
        ...prev,
        ...savedP,
        name: updatedName,
        fullName: updatedName
      }))

      // Keep AuthContext synchronized with updated name
      if (updatedName && authUser) {
        persistStoredUser({ ...authUser, name: updatedName, fullName: updatedName })
      }

      setSaveStatus({ type: 'success', message: '✓ Profile saved and persisted to database!' })
      setTimeout(() => closeModal(), 800)
    } catch (err) {
      console.error('[PROFILE] Save error:', err)
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save profile. Please try again.'
      setSaveStatus({ type: 'error', message: `✕ ${errorMsg}` })
    } finally {
      setSaving(false)
    }
  }

  const handleAddSkill = (skillToAdd) => {
    const s = skillToAdd.trim()
    if (!s) return
    const current = modalForm.skills || profile.skills || []
    if (!current.includes(s)) {
      const updated = [...current, s]
      setModalForm({ ...modalForm, skills: updated })
      if (!activeModal) {
        setProfile((prev) => ({ ...prev, skills: updated }))
        profileApi.save({ skills: updated }).catch((e) => console.error('[PROFILE] Skill save error:', e))
      }
    }
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove) => {
    const current = modalForm.skills || profile.skills || []
    const updated = current.filter((s) => s !== skillToRemove)
    setModalForm({ ...modalForm, skills: updated })
    if (!activeModal) {
      setProfile((prev) => ({ ...prev, skills: updated }))
      profileApi.save({ skills: updated }).catch((e) => console.error('[PROFILE] Skill remove error:', e))
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadProgress(25)
      console.log('[PROFILE] Uploading resume file:', file.name)
      const res = await profileApi.uploadResume(file, (percent) => setUploadProgress(percent))
      console.log('[PROFILE] Resume upload response:', res)

      setProfile((prev) => ({
        ...prev,
        resumeUrl: res.resumeUrl || prev.resumeUrl,
        resumeFileName: res.resumeFileName || file.name
      }))
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(null), 1000)
    } catch (err) {
      console.error('[PROFILE] Resume upload error:', err)
      setUploadProgress(null)
    }
  }

  const displayName = profile.name || authUser?.fullName || authUser?.name || 'REXION Candidate'
  const displayEmail = profile.email || authUser?.email || 'user@rexion.ai'
  const planName = (authUser?.plan || 'PRO').toUpperCase()
  const githubLink = profile.github || profile.githubUrl
  const linkedinLink = profile.linkedin || profile.linkedinUrl
  const portfolioLink = profile.portfolio || profile.portfolioUrl

  return (
    <motion.div
      className={styles.profileContainer}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. Header Banner Card */}
      <section className={styles.headerCard}>
        {profile.bannerUrl && (
          <div
            className={styles.bannerCoverLayer}
            style={{ backgroundImage: `url(${resolveImageUrl(profile.bannerUrl)})` }}
          />
        )}
        <div className={styles.bannerOverlay} />

        {/* Hidden Direct File Inputs */}
        <input
          type="file"
          ref={avatarInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleAvatarFileChange}
        />
        <input
          type="file"
          ref={bannerInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleBannerFileChange}
        />

        <div className={styles.identityBlock}>
          {/* Avatar column with Cover Photo button at bottom of avatar */}
          <div className={styles.avatarCol}>
            <div
              className={styles.avatarRing}
              onClick={() => avatarInputRef.current?.click()}
              title="Click to choose a new profile photo from your device"
            >
              <div className={styles.avatarInner}>
                {profile.avatarUrl ? (
                  <img
                    src={resolveImageUrl(profile.avatarUrl)}
                    alt={displayName}
                    className={styles.avatarImg}
                    onError={(e) => {
                      console.warn('[PROFILE] Avatar failed to load:', profile.avatarUrl)
                    }}
                  />
                ) : (
                  displayName.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className={styles.avatarHoverOverlay}>
                <span>📷</span>
                <span>{uploadingImage ? 'Uploading...' : 'Change Photo'}</span>
              </div>
              <div
                className={styles.avatarBadge}
                title="Change Photo or Logo"
                onClick={(e) => {
                  e.stopPropagation()
                  avatarInputRef.current?.click()
                }}
              >
                ✎
              </div>
            </div>

            {/* Positioned directly at the bottom of the profile photo icon */}
            <div className={styles.avatarBottomControls}>
              <button
                type="button"
                className={styles.coverPhotoBottomBtn}
                onClick={() => {
                  if (profile.bannerUrl) {
                    handleOpenCoverStudio()
                  } else {
                    bannerInputRef.current?.click()
                  }
                }}
                title={profile.bannerUrl ? 'Adjust or frame cover photo' : 'Choose and upload cover photo'}
              >
                🖼️ {profile.bannerUrl ? 'Cover Photo' : '+ Cover Photo'}
              </button>
              {profile.bannerUrl && (
                <button
                  type="button"
                  className={styles.coverPhotoActionBtn}
                  onClick={() => bannerInputRef.current?.click()}
                  title="Upload a new cover photo from device"
                >
                  📁
                </button>
              )}
              {profile.bannerUrl && (
                <button
                  type="button"
                  className={styles.coverPhotoRemoveBtn}
                  onClick={handleRemoveBanner}
                  title="Remove Cover Photo"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className={styles.metaInfo}>
            <div className={styles.nameRow}>
              <h2 className={styles.userName}>{displayName}</h2>
              <span className={styles.planPill}>{planName}</span>
            </div>
            <p className={styles.userHeadline}>
              {profile.headline || 'Add a professional headline...'}
            </p>
            <div className={styles.contactChips}>
              <span className={styles.chipItem}>✉ {displayEmail}</span>
              {profile.location && <span className={styles.chipItem}>📍 {profile.location}</span>}
              {profile.phone && <span className={styles.chipItem}>📞 {profile.phone}</span>}
            </div>
            <div className={styles.socialRow}>
              {linkedinLink ? (
                <a href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`} target="_blank" rel="noreferrer" className={styles.socialLink}>
                  LinkedIn ↗
                </a>
              ) : (
                <button type="button" onClick={() => openModal('links')} className={styles.socialLink}>
                  + Add LinkedIn
                </button>
              )}
              {githubLink ? (
                <a href={githubLink.startsWith('http') ? githubLink : `https://${githubLink}`} target="_blank" rel="noreferrer" className={styles.socialLink}>
                  GitHub ↗
                </a>
              ) : (
                <button type="button" onClick={() => openModal('links')} className={styles.socialLink}>
                  + Add GitHub
                </button>
              )}
              {portfolioLink && (
                <a href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`} target="_blank" rel="noreferrer" className={styles.socialLink}>
                  Portfolio ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={() => openModal('basic')}>
            ✎ Edit Profile
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => openModal('preferences')}>
            ⚙ Preferences
          </button>
        </div>
      </section>

      {/* 2. Completion Meter */}
      <section className={styles.completionCard}>
        <div className={styles.completionHeader}>
          <span className={styles.completionTitle}>
            ⚡ Profile Strength & Readiness
          </span>
          <span className={styles.completionScore}>{completionScore}%</span>
        </div>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${completionScore}%` }} />
        </div>
        <div className={styles.checklistGrid}>
          <div className={styles.checklistItem}>
            <span className={`${styles.checkDot} ${displayName ? styles.checkDotDone : styles.checkDotPending}`}>✓</span>
            <span>Personal Bio & Info</span>
          </div>
          <div className={styles.checklistItem}>
            <span className={`${styles.checkDot} ${profile.skills?.length > 0 ? styles.checkDotDone : styles.checkDotPending}`}>✓</span>
            <span>Technical Skills</span>
          </div>
          <div className={styles.checklistItem}>
            <span className={`${styles.checkDot} ${profile.targetRole ? styles.checkDotDone : styles.checkDotPending}`}>✓</span>
            <span>Career Targets</span>
          </div>
          <div className={styles.checklistItem}>
            <span className={`${styles.checkDot} ${profile.resumeUrl ? styles.checkDotDone : styles.checkDotPending}`}>✓</span>
            <span>Resume Uploaded</span>
          </div>
        </div>
      </section>

      {/* 3. Main Two-Column Grid */}
      <div className={styles.gridTwoCol}>
        {/* Left Column: Bio & Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* About / Bio Section */}
          <section className={styles.sectionPanel}>
            <div className={styles.panelTop}>
              <span className={styles.panelHeading}>📝 About & Bio</span>
              <button type="button" className={styles.panelEditBtn} onClick={() => openModal('basic')}>
                Edit
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'rgba(233, 240, 235, 0.82)', lineHeight: 1.6, margin: 0 }}>
              {profile.bio || 'No bio added yet. Click Edit to add a personal bio and summary.'}
            </p>
          </section>

          {/* Skills Section */}
          <section className={styles.sectionPanel}>
            <div className={styles.panelTop}>
              <span className={styles.panelHeading}>🛠 Technical & Core Skills</span>
              <button type="button" className={styles.panelEditBtn} onClick={() => openModal('skills')}>
                + Manage Skills
              </button>
            </div>
            <div className={styles.skillTagsWrap}>
              {(profile.skills || []).length > 0 ? (
                profile.skills.map((skill) => (
                  <span key={skill} className={styles.skillPill}>
                    {skill}
                  </span>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  No skills added yet. Click &quot;Manage Skills&quot; to add your toolkit.
                </p>
              )}
            </div>
          </section>

          {/* Target Role & Career Objectives */}
          <section className={styles.sectionPanel}>
            <div className={styles.panelTop}>
              <span className={styles.panelHeading}>🎯 Target Career & Work Mode</span>
              <button type="button" className={styles.panelEditBtn} onClick={() => openModal('preferences')}>
                Edit
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Target Role:</span>
                <strong style={{ color: '#ffffff' }}>{profile.targetRole || 'Software Engineering / Full Stack'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Preferred Work Mode:</span>
                <strong style={{ color: '#10b981' }}>{profile.workMode || 'Remote / Hybrid'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Notice Period:</span>
                <strong style={{ color: '#ffffff' }}>{profile.noticePeriod || 'Immediate'}</strong>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Experience & Resume */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Experience Section */}
          <section className={styles.sectionPanel}>
            <div className={styles.panelTop}>
              <span className={styles.panelHeading}>💼 Experience Highlights</span>
              <button type="button" className={styles.panelEditBtn} onClick={() => openModal('experience')}>
                + Add Experience
              </button>
            </div>
            <div className={styles.timelineList}>
              {(profile.experiences || []).length > 0 ? (
                profile.experiences.map((exp, idx) => (
                  <article key={idx} className={styles.timelineCard}>
                    <div className={styles.timelineRole}>
                      <span>{exp.role || exp.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{exp.period || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`}</span>
                    </div>
                    <span className={styles.timelineMeta}>@{exp.company}</span>
                    <p className={styles.timelineDesc}>{exp.description}</p>
                  </article>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  No experience records added yet. Click &quot;Add Experience&quot; to showcase your career timeline.
                </p>
              )}
            </div>
          </section>

          {/* Resume Upload Dropzone */}
          <section className={styles.sectionPanel}>
            <div className={styles.panelTop}>
              <span className={styles.panelHeading}>📄 Resume Studio</span>
              {profile.resumeUrl && (
                <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className={styles.panelEditBtn}>
                  Preview PDF ↗
                </a>
              )}
            </div>
            <label className={styles.resumeBox}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
              <div style={{ fontSize: '1.75rem' }}>📂</div>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.9rem' }}>
                  {profile.resumeFileName || 'Click to Upload Resume (PDF / DOCX)'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {uploadProgress !== null ? `Uploading: ${uploadProgress}%` : 'Supports standard ATS formats up to 10MB'}
                </span>
              </div>
            </label>
          </section>
        </div>
      </div>

      {/* 4. Edit Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.modalHeader}>
                <h3>
                  {activeModal === 'basic' && 'Edit Personal Details'}
                  {activeModal === 'preferences' && 'Edit Career & Job Preferences'}
                  {activeModal === 'skills' && 'Manage Technical Skills'}
                  {activeModal === 'links' && 'Manage Social & Portfolio Links'}
                  {activeModal === 'experience' && 'Add Work Experience'}
                </h3>
                <button type="button" className={styles.closeBtn} onClick={closeModal}>✕</button>
              </div>

              {saveStatus && (
                <div
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background: saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                    color: saveStatus.type === 'success' ? '#34d399' : '#f87171'
                  }}
                >
                  {saveStatus.message}
                </div>
              )}

              {activeModal === 'basic' && (
                <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Profile Photo / Brand Logo */}
                  <div className={styles.imageFieldCard}>
                    <div className={styles.imageFieldHeader}>
                      <label>Profile Photo / Logo</label>
                      {modalForm.avatarUrl && (
                        <button
                          type="button"
                          className={styles.removeInlineBtn}
                          onClick={() => setModalForm((m) => ({ ...m, avatarUrl: '', avatar: '' }))}
                        >
                          ✕ Remove Photo
                        </button>
                      )}
                    </div>
                    <div className={styles.imageFieldContent}>
                      <div className={styles.avatarPreviewThumb}>
                        {modalForm.avatarUrl ? (
                          <img src={resolveImageUrl(modalForm.avatarUrl)} alt="Avatar Preview" className={styles.avatarImg} />
                        ) : (
                          (modalForm.name || displayName || 'U').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className={styles.imageFieldControls}>
                        <div className={styles.imageBtnRow}>
                          <button
                            type="button"
                            className={styles.uploadInlineBtn}
                            onClick={() => modalAvatarInputRef.current?.click()}
                          >
                            📁 Upload Photo or Logo
                          </button>
                          <input
                            type="file"
                            ref={modalAvatarInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              const previewUrl = URL.createObjectURL(f)
                              setCropModal({
                                isOpen: true,
                                imageSrc: previewUrl,
                                type: 'avatar',
                                title: 'Crop & Center Profile Photo / Logo',
                                aspectRatio: 1,
                                targetWidth: 500,
                                targetHeight: 500
                              })
                              if (e.target) e.target.value = ''
                            }}
                          />
                        </div>
                        <input
                          className={styles.formInput}
                          placeholder="Or paste photo / logo URL (https://...)"
                          value={modalForm.avatarUrl || ''}
                          onChange={(e) => setModalForm({ ...modalForm, avatarUrl: e.target.value, avatar: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Panel Background Cover Photo */}
                  <div className={styles.imageFieldCard}>
                    <div className={styles.imageFieldHeader}>
                      <label>Panel Background Cover Photo</label>
                      {modalForm.bannerUrl && (
                        <button
                          type="button"
                          className={styles.removeInlineBtn}
                          onClick={() => setModalForm((m) => ({ ...m, bannerUrl: '', coverUrl: '' }))}
                        >
                          ✕ Remove Cover
                        </button>
                      )}
                    </div>
                    <div className={styles.imageFieldContent}>
                      <div
                        className={styles.bannerPreviewThumb}
                        style={modalForm.bannerUrl ? { backgroundImage: `url(${resolveImageUrl(modalForm.bannerUrl)})` } : {}}
                      >
                        {!modalForm.bannerUrl && 'Default Banner'}
                      </div>
                      <div className={styles.imageFieldControls}>
                        <div className={styles.imageBtnRow}>
                          <button
                            type="button"
                            className={styles.uploadInlineBtn}
                            onClick={() => {
                              setCropModal({
                                isOpen: true,
                                imageSrc: modalForm.bannerUrl ? resolveImageUrl(modalForm.bannerUrl) : '',
                                type: 'banner',
                                title: 'Cover Photo Studio',
                                aspectRatio: 3.2,
                                targetWidth: 1440,
                                targetHeight: 450
                              })
                            }}
                          >
                            🖼️ Choose & Crop Cover Photo
                          </button>
                        </div>
                        <input
                          className={styles.formInput}
                          placeholder="Or paste cover photo URL (https://...)"
                          value={modalForm.bannerUrl || ''}
                          onChange={(e) => setModalForm({ ...modalForm, bannerUrl: e.target.value, coverUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.name || modalForm.fullName || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value, fullName: e.target.value })}
                      placeholder="e.g. Anshu Pal"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Professional Headline</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.headline || ''}
                      onChange={(e) => setModalForm({ ...modalForm, headline: e.target.value })}
                      placeholder="e.g. AI & Agentic AI Developer"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>About / Bio</label>
                    <textarea
                      className={styles.formTextarea}
                      rows={3}
                      value={modalForm.bio || ''}
                      onChange={(e) => setModalForm({ ...modalForm, bio: e.target.value })}
                      placeholder="Share a short bio summarizing your background and strengths..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.location || ''}
                      onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                      placeholder="e.g. San Francisco, CA / Remote"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.phone || ''}
                      onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" className={styles.secondaryBtn} onClick={closeModal} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.primaryBtn} disabled={saving}>
                      {saving ? 'Saving to Database...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'skills' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>Add Skill</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        className={styles.formInput}
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        placeholder="e.g. Docker, Next.js, Python..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSkill(newSkillInput)
                          }
                        }}
                      />
                      <button type="button" className={styles.primaryBtn} onClick={() => handleAddSkill(newSkillInput)}>
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Your Current Skills
                    </label>
                    <div className={styles.skillTagsWrap}>
                      {(modalForm.skills || profile.skills || []).map((skill) => (
                        <span key={skill} className={styles.skillPill} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(skill)}>
                          {skill} <span style={{ marginLeft: '4px', opacity: 0.6 }}>✕</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Quick Suggestions
                    </label>
                    <div className={styles.skillTagsWrap}>
                      {PRESET_SKILLS.filter((s) => !(modalForm.skills || profile.skills || []).includes(s)).slice(0, 8).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddSkill(preset)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#9ca3af',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.modalFooter}>
                    <button type="button" className={styles.primaryBtn} onClick={handleSaveModal} disabled={saving}>
                      {saving ? 'Saving...' : 'Done & Save'}
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'preferences' && (
                <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>Target Role Title</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.targetRole || ''}
                      onChange={(e) => setModalForm({ ...modalForm, targetRole: e.target.value })}
                      placeholder="e.g. AI & Agentic AI Developer"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Preferred Work Mode</label>
                    <select
                      className={styles.formSelect}
                      value={modalForm.workMode || 'Remote / Hybrid'}
                      onChange={(e) => setModalForm({ ...modalForm, workMode: e.target.value })}
                    >
                      <option value="Remote Only">Remote Only</option>
                      <option value="Remote / Hybrid">Remote / Hybrid</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Notice Period</label>
                    <select
                      className={styles.formSelect}
                      value={modalForm.noticePeriod || 'Immediate'}
                      onChange={(e) => setModalForm({ ...modalForm, noticePeriod: e.target.value })}
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="60+ Days">60+ Days</option>
                    </select>
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" className={styles.secondaryBtn} onClick={closeModal} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.primaryBtn} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'links' && (
                <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>GitHub URL / Username</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.github || modalForm.githubUrl || ''}
                      onChange={(e) => setModalForm({ ...modalForm, github: e.target.value, githubUrl: e.target.value })}
                      placeholder="https://github.com/your-username"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>LinkedIn URL</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.linkedin || modalForm.linkedinUrl || ''}
                      onChange={(e) => setModalForm({ ...modalForm, linkedin: e.target.value, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/your-username"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Portfolio / Personal Website</label>
                    <input
                      className={styles.formInput}
                      value={modalForm.portfolio || modalForm.portfolioUrl || ''}
                      onChange={(e) => setModalForm({ ...modalForm, portfolio: e.target.value, portfolioUrl: e.target.value })}
                      placeholder="https://yourportfolio.dev"
                    />
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" className={styles.secondaryBtn} onClick={closeModal} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.primaryBtn} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Links'}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'experience' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const newExp = {
                      role: modalForm._newRole || 'Software Engineer',
                      company: modalForm._newCompany || 'Tech Corp',
                      period: modalForm._newPeriod || '2023 - Present',
                      description: modalForm._newDesc || 'Engineered core features and platform workflows.'
                    }
                    const updated = [...(profile.experiences || []), newExp]
                    setModalForm({ ...modalForm, experiences: updated })
                    setProfile((prev) => ({ ...prev, experiences: updated }))
                    try {
                      await profileApi.save({ experiences: updated })
                    } catch (err) {
                      console.error('[PROFILE] Experience save error:', err)
                    }
                    closeModal()
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div className={styles.formGroup}>
                    <label>Job Title / Role</label>
                    <input
                      className={styles.formInput}
                      required
                      placeholder="e.g. Frontend Developer"
                      onChange={(e) => setModalForm({ ...modalForm, _newRole: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Company / Organization</label>
                    <input
                      className={styles.formInput}
                      required
                      placeholder="e.g. Stripe, Razorpay, Startup"
                      onChange={(e) => setModalForm({ ...modalForm, _newCompany: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Timeline / Period</label>
                    <input
                      className={styles.formInput}
                      placeholder="e.g. 2022 - 2024"
                      onChange={(e) => setModalForm({ ...modalForm, _newPeriod: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Key Responsibilities & Impact</label>
                    <textarea
                      className={styles.formTextarea}
                      rows={3}
                      placeholder="Describe what you shipped and technologies used..."
                      onChange={(e) => setModalForm({ ...modalForm, _newDesc: e.target.value })}
                    />
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" className={styles.secondaryBtn} onClick={closeModal}>Cancel</button>
                    <button type="submit" className={styles.primaryBtn}>Add Experience</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Image Crop & Framing Modal */}
      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        type={cropModal.type}
        title={cropModal.title}
        aspectRatio={cropModal.aspectRatio}
        targetWidth={cropModal.targetWidth}
        targetHeight={cropModal.targetHeight}
        onClose={() => setCropModal((prev) => ({ ...prev, isOpen: false }))}
        onCropComplete={handleCropComplete}
        onRemove={
          cropModal.type === 'banner' && profile.bannerUrl
            ? handleRemoveBanner
            : (cropModal.type === 'avatar' && profile.avatarUrl ? handleRemoveAvatar : undefined)
        }
      />
    </motion.div>
  )
}

export default ProfileSection
