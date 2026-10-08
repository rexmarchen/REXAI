'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import type { SessionUser } from '@/types'
import type {
  CareerProfileShape,
  ProfileCompletionResult,
  ProfileExperience,
  ProfileEducation,
  ProfileProject,
  ProfileCertification,
  ProfileAchievement,
} from '@/types/profile'
import { ProfileHeader } from './ProfileHeader'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { ProfileAboutSection, ProfileCareerDirection } from './ProfileAboutAndDirection'
import { ProfileSkillsSection } from './ProfileSkillsSection'
import { ProfileExperienceSection } from './ProfileExperienceSection'
import { ProfileProjectsSection } from './ProfileProjectsSection'
import {
  ProfileEducationSection,
  ProfileCertificationsSection,
  ProfileAchievementsSection,
} from './ProfileEducationAndCredentials'
import {
  ProfileSocialLinksSection,
  ProfileJobPreferencesSection,
  ProfileWorkAuthSection,
  ProfileApplicationProfileSection,
  ProfilePrivacySection,
} from './ProfilePreferencesAndSettings'
import {
  EditBasicInfoModal,
  EditAboutModal,
  EditCareerDirectionModal,
  EditSkillsModal,
  ExperienceModal,
  ProjectModal,
  EducationModal,
  CertificationModal,
  AchievementModal,
  SocialLinksModal,
  EditJobPreferencesModal,
  EditWorkAuthModal,
  EditApplicationProfileModal,
  EditPrivacyModal,
  ResumeUploadModal,
  ProfilePreviewModal,
} from './ProfileModals'

interface ProfilePageClientProps {
  initialUser: SessionUser
}

export function ProfilePageClient({ initialUser }: ProfilePageClientProps) {
  const [user, setUser] = useState<SessionUser>(initialUser)
  const [profile, setProfile] = useState<CareerProfileShape | null>(null)
  const [completion, setCompletion] = useState<ProfileCompletionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modal visibility states
  const [modalOpen, setModalOpen] = useState<{
    basicInfo?: boolean
    about?: boolean
    direction?: boolean
    skills?: boolean
    experience?: { isOpen: boolean; data?: ProfileExperience | null; index?: number | null }
    project?: { isOpen: boolean; data?: ProfileProject | null; index?: number | null }
    education?: { isOpen: boolean; data?: ProfileEducation | null; index?: number | null }
    certification?: { isOpen: boolean; data?: ProfileCertification | null; index?: number | null }
    achievement?: { isOpen: boolean; data?: ProfileAchievement | null; index?: number | null }
    socialLinks?: boolean
    jobPreferences?: boolean
    workAuth?: boolean
    applicationProfile?: boolean
    privacy?: boolean
    resumeUpload?: boolean
    preview?: boolean
  }>({})

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Load profile data from API
  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/profile')
      if (!res.ok) {
        throw new Error('Failed to load profile data.')
      }
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
      }
      if (data.user) {
        setUser((prev: SessionUser) => ({ ...prev, ...data.user }))
      }
      if (data.completion) {
        setCompletion(data.completion)
      }
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err?.message || 'Failed to load profile.')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Save profile updates to backend
  const updateProfileData = async (payload: Partial<CareerProfileShape> & { name?: string }) => {
    try {
      // Optimistic update
      if (profile) {
        setProfile((prev: CareerProfileShape | null) => (prev ? { ...prev, ...payload } : null))
      }
      if (payload.name) {
        setUser((prev: SessionUser) => ({ ...prev, name: payload.name }))
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save changes.')
      }

      if (result.profile) {
        setProfile(result.profile)
      }
      if (result.completion) {
        setCompletion(result.completion)
      }

      showToast('Profile updated successfully.')
    } catch (err: any) {
      console.error('Update error:', err)
      showToast(err?.message || 'Failed to save changes.')
      // Re-fetch to ensure sync
      fetchProfile()
    }
  }

  // Handle section jumping from completion card
  const handleCompleteStep = (key: string) => {
    switch (key) {
      case 'basic':
        setModalOpen((prev) => ({ ...prev, basicInfo: true }))
        break
      case 'summary':
        setModalOpen((prev) => ({ ...prev, about: true }))
        break
      case 'direction':
        setModalOpen((prev) => ({ ...prev, direction: true }))
        break
      case 'skills':
        setModalOpen((prev) => ({ ...prev, skills: true }))
        break
      case 'experience':
        setModalOpen((prev) => ({ ...prev, experience: { isOpen: true, data: null, index: null } }))
        break
      case 'education':
        setModalOpen((prev) => ({ ...prev, education: { isOpen: true, data: null, index: null } }))
        break
      case 'projects':
        setModalOpen((prev) => ({ ...prev, project: { isOpen: true, data: null, index: null } }))
        break
      case 'resume':
        setModalOpen((prev) => ({ ...prev, resumeUpload: true }))
        break
      case 'social':
        setModalOpen((prev) => ({ ...prev, socialLinks: true }))
        break
      default:
        break
    }
  }

  // Sub-resource handlers (Experience, Projects, Education, etc.)
  const handleSaveExperience = async (item: ProfileExperience, index?: number | null) => {
    const list = [...(profile?.experience || [])]
    if (typeof index === 'number' && index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    await updateProfileData({ experience: list })
  }

  const handleDeleteExperience = async (index: number) => {
    const list = (profile?.experience || []).filter((_, i) => i !== index)
    await updateProfileData({ experience: list })
  }

  const handleSaveProject = async (item: ProfileProject, index?: number | null) => {
    const list = [...(profile?.projects || [])]
    if (typeof index === 'number' && index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    await updateProfileData({ projects: list })
  }

  const handleDeleteProject = async (index: number) => {
    const list = (profile?.projects || []).filter((_, i) => i !== index)
    await updateProfileData({ projects: list })
  }

  const handleSaveEducation = async (item: ProfileEducation, index?: number | null) => {
    const list = [...(profile?.education || [])]
    if (typeof index === 'number' && index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    await updateProfileData({ education: list })
  }

  const handleDeleteEducation = async (index: number) => {
    const list = (profile?.education || []).filter((_, i) => i !== index)
    await updateProfileData({ education: list })
  }

  const handleSaveCertification = async (item: ProfileCertification, index?: number | null) => {
    const list = [...(profile?.certifications || [])]
    if (typeof index === 'number' && index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    await updateProfileData({ certifications: list })
  }

  const handleDeleteCertification = async (index: number) => {
    const list = (profile?.certifications || []).filter((_, i) => i !== index)
    await updateProfileData({ certifications: list })
  }

  const handleSaveAchievement = async (item: ProfileAchievement, index?: number | null) => {
    const list = [...(profile?.achievements || [])]
    if (typeof index === 'number' && index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    await updateProfileData({ achievements: list })
  }

  const handleDeleteAchievement = async (index: number) => {
    const list = (profile?.achievements || []).filter((_, i) => i !== index)
    await updateProfileData({ achievements: list })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 size={36} className="animate-spin text-emerald-400" />
        <p className="text-sm font-semibold tracking-wide text-white">
          Loading your REXION Career OS profile...
        </p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <AlertCircle size={32} className="text-rose-400" />
        <h3 className="text-lg font-bold text-white">Unable to load profile</h3>
        <p className="text-xs text-[var(--text-secondary)]">{error || 'An unexpected error occurred.'}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="rounded-full bg-emerald-400/10 border border-emerald-400/30 px-5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-400/30 bg-[#0c1a14] px-4 py-3 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Profile Header */}
      <ProfileHeader
        user={user}
        profile={profile}
        completionScore={completion?.percentage || profile.profileCompletion || 0}
        onEditBasicInfo={() => setModalOpen((prev) => ({ ...prev, basicInfo: true }))}
        onOpenResumeModal={() => setModalOpen((prev) => ({ ...prev, resumeUpload: true }))}
        onPreviewProfile={() => setModalOpen((prev) => ({ ...prev, preview: true }))}
      />

      {/* 2. Completion Card */}
      {completion && (
        <ProfileCompletionCard
          completion={completion}
          onCompleteStep={handleCompleteStep}
        />
      )}

      {/* 3. Main Grid: About & Career Direction */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileAboutSection
          profile={profile}
          onEdit={() => setModalOpen((prev) => ({ ...prev, about: true }))}
        />
        <ProfileCareerDirection
          profile={profile}
          onEdit={() => setModalOpen((prev) => ({ ...prev, direction: true }))}
        />
      </div>

      {/* 4. Skills Section */}
      <ProfileSkillsSection
        profile={profile}
        onEdit={() => setModalOpen((prev) => ({ ...prev, skills: true }))}
      />

      {/* 5. Experience Section */}
      <ProfileExperienceSection
        experience={profile.experience || []}
        onAddExperience={() =>
          setModalOpen((prev) => ({ ...prev, experience: { isOpen: true, data: null, index: null } }))
        }
        onEditExperience={(item, index) =>
          setModalOpen((prev) => ({ ...prev, experience: { isOpen: true, data: item, index } }))
        }
        onDeleteExperience={handleDeleteExperience}
      />

      {/* 6. Projects Section */}
      <ProfileProjectsSection
        projects={profile.projects || []}
        onAddProject={() =>
          setModalOpen((prev) => ({ ...prev, project: { isOpen: true, data: null, index: null } }))
        }
        onEditProject={(item, index) =>
          setModalOpen((prev) => ({ ...prev, project: { isOpen: true, data: item, index } }))
        }
        onDeleteProject={handleDeleteProject}
      />

      {/* 7. Education Section */}
      <ProfileEducationSection
        education={profile.education || []}
        onAddEducation={() =>
          setModalOpen((prev) => ({ ...prev, education: { isOpen: true, data: null, index: null } }))
        }
        onEditEducation={(item, index) =>
          setModalOpen((prev) => ({ ...prev, education: { isOpen: true, data: item, index } }))
        }
        onDeleteEducation={handleDeleteEducation}
      />

      {/* 8. Certifications & Achievements Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCertificationsSection
          certifications={profile.certifications || []}
          onAddCertification={() =>
            setModalOpen((prev) => ({ ...prev, certification: { isOpen: true, data: null, index: null } }))
          }
          onEditCertification={(item, index) =>
            setModalOpen((prev) => ({ ...prev, certification: { isOpen: true, data: item, index } }))
          }
          onDeleteCertification={handleDeleteCertification}
        />
        <ProfileAchievementsSection
          achievements={profile.achievements || []}
          onAddAchievement={() =>
            setModalOpen((prev) => ({ ...prev, achievement: { isOpen: true, data: null, index: null } }))
          }
          onEditAchievement={(item, index) =>
            setModalOpen((prev) => ({ ...prev, achievement: { isOpen: true, data: item, index } }))
          }
          onDeleteAchievement={handleDeleteAchievement}
        />
      </div>

      {/* 9. Social Links Section */}
      <ProfileSocialLinksSection
        socialLinks={profile.socialLinks || {}}
        onEdit={() => setModalOpen((prev) => ({ ...prev, socialLinks: true }))}
      />

      {/* 10. Preferences & Work Authorization Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileJobPreferencesSection
          preferences={profile.jobPreferences}
          onEdit={() => setModalOpen((prev) => ({ ...prev, jobPreferences: true }))}
        />
        <ProfileWorkAuthSection
          auth={profile.workAuthorization}
          onEdit={() => setModalOpen((prev) => ({ ...prev, workAuth: true }))}
        />
      </div>

      {/* 11. Application Profile & Privacy Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileApplicationProfileSection
          appPrefs={profile.applicationPreferences}
          onEdit={() => setModalOpen((prev) => ({ ...prev, applicationProfile: true }))}
        />
        <ProfilePrivacySection
          privacy={profile.privacySettings}
          onEdit={() => setModalOpen((prev) => ({ ...prev, privacy: true }))}
        />
      </div>

      {/* MODALS */}
      {modalOpen.basicInfo && (
        <EditBasicInfoModal
          profile={profile}
          userName={user.name || ''}
          onClose={() => setModalOpen((prev) => ({ ...prev, basicInfo: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.about && (
        <EditAboutModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, about: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.direction && (
        <EditCareerDirectionModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, direction: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.skills && (
        <EditSkillsModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, skills: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.experience?.isOpen && (
        <ExperienceModal
          initialData={modalOpen.experience.data}
          index={modalOpen.experience.index}
          onClose={() => setModalOpen((prev) => ({ ...prev, experience: undefined }))}
          onSave={handleSaveExperience}
        />
      )}

      {modalOpen.project?.isOpen && (
        <ProjectModal
          initialData={modalOpen.project.data}
          index={modalOpen.project.index}
          onClose={() => setModalOpen((prev) => ({ ...prev, project: undefined }))}
          onSave={handleSaveProject}
        />
      )}

      {modalOpen.education?.isOpen && (
        <EducationModal
          initialData={modalOpen.education.data}
          index={modalOpen.education.index}
          onClose={() => setModalOpen((prev) => ({ ...prev, education: undefined }))}
          onSave={handleSaveEducation}
        />
      )}

      {modalOpen.certification?.isOpen && (
        <CertificationModal
          initialData={modalOpen.certification.data}
          index={modalOpen.certification.index}
          onClose={() => setModalOpen((prev) => ({ ...prev, certification: undefined }))}
          onSave={handleSaveCertification}
        />
      )}

      {modalOpen.achievement?.isOpen && (
        <AchievementModal
          initialData={modalOpen.achievement.data}
          index={modalOpen.achievement.index}
          onClose={() => setModalOpen((prev) => ({ ...prev, achievement: undefined }))}
          onSave={handleSaveAchievement}
        />
      )}

      {modalOpen.socialLinks && (
        <SocialLinksModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, socialLinks: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.jobPreferences && (
        <EditJobPreferencesModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, jobPreferences: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.workAuth && (
        <EditWorkAuthModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, workAuth: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.applicationProfile && (
        <EditApplicationProfileModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, applicationProfile: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.privacy && (
        <EditPrivacyModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, privacy: false }))}
          onSave={updateProfileData}
        />
      )}

      {modalOpen.resumeUpload && (
        <ResumeUploadModal
          profile={profile}
          onClose={() => setModalOpen((prev) => ({ ...prev, resumeUpload: false }))}
          onSuccess={(data) => {
            if (data.profile) setProfile(data.profile)
            if (data.completion) setCompletion(data.completion)
            showToast('Resume uploaded and parsed successfully!')
          }}
        />
      )}

      {modalOpen.preview && (
        <ProfilePreviewModal
          profile={profile}
          userName={user.name || ''}
          userEmail={user.email}
          onClose={() => setModalOpen((prev) => ({ ...prev, preview: false }))}
        />
      )}
    </div>
  )
}
