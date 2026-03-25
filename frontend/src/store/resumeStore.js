import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  arrayMove,
  DEFAULT_RESUME_SEED_ID,
  createEmptyCertification,
  createDefaultSeedResume,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyProject,
  createInitialAtsReport,
  createResumeVersion as createResumeSnapshot,
  normalizeFormData,
  normalizeResumeVersion,
} from '../utils/resumeBuilder'

const createDefaultResumeState = () => {
  const initialResume = createDefaultSeedResume()

  return {
    resumes: [initialResume],
    activeResumeId: initialResume.id,
  }
}

const getActiveResumeIndex = (resumes, activeResumeId) => {
  const index = resumes.findIndex((resume) => resume.id === activeResumeId)
  return index >= 0 ? index : 0
}

const isBlankStarterResume = (resume) => {
  const formData = normalizeFormData(resume?.formData)
  const personal = formData.personal || {}

  return (
    !String(personal.name || '').trim() &&
    !String(personal.email || '').trim() &&
    !String(personal.phone || '').trim() &&
    !String(personal.role || '').trim() &&
    !String(formData.summary || '').trim() &&
    formData.skills.length === 0 &&
    formData.experience.length === 0 &&
    formData.education.length === 0 &&
    formData.projects.length === 0 &&
    formData.certifications.length === 0
  )
}

const ensureResumes = (resumes) =>
  Array.isArray(resumes) && resumes.length > 0
    ? resumes.map((resume) => normalizeResumeVersion(resume))
    : [createDefaultSeedResume()]

const injectSeededDefaultResume = (resumes, activeResumeId) => {
  if (resumes.some((resume) => resume.seedId === DEFAULT_RESUME_SEED_ID)) {
    return {
      resumes,
      activeResumeId: resumes.find((resume) => resume.id === activeResumeId)?.id || resumes[0].id,
    }
  }

  if (resumes.length === 1 && isBlankStarterResume(resumes[0])) {
    const starter = resumes[0]
    const seededResume = createDefaultSeedResume({
      id: starter.id,
      createdAt: starter.createdAt,
      updatedAt: starter.updatedAt,
    })

    return {
      resumes: [seededResume],
      activeResumeId: seededResume.id,
    }
  }

  const seededResume = createDefaultSeedResume()
  return {
    resumes: [seededResume, ...resumes],
    activeResumeId: resumes.find((resume) => resume.id === activeResumeId)?.id || seededResume.id,
  }
}

const buildLegacyResume = (legacyState = {}) =>
  normalizeResumeVersion(
    createResumeSnapshot({
      name: legacyState.resumeName || 'Imported Resume',
      template: legacyState.template || 'modern',
      formData: normalizeFormData(legacyState.formData),
      atsReport: {
        ...createInitialAtsReport(),
        score: Math.round(Number(legacyState.atsScore) || 0),
        keywordMatch: Math.round(Number(legacyState.keywordMatch) || 0),
      },
    })
  )

const updateActiveResume = (state, updater) => {
  const resumes = ensureResumes(state.resumes)
  const index = getActiveResumeIndex(resumes, state.activeResumeId)
  const currentResume = normalizeResumeVersion(resumes[index])
  const updatedResume = normalizeResumeVersion(updater(currentResume))

  updatedResume.updatedAt = new Date().toISOString()

  const nextResumes = [...resumes]
  nextResumes[index] = updatedResume

  return {
    resumes: nextResumes,
    activeResumeId: updatedResume.id,
  }
}

export const selectActiveResume = (state) => {
  const resumes = Array.isArray(state.resumes) && state.resumes.length > 0 ? state.resumes : null

  if (!resumes) {
    return null
  }

  return resumes[getActiveResumeIndex(resumes, state.activeResumeId)] || resumes[0]
}

export const selectResumeVersions = (state) =>
  Array.isArray(state.resumes) && state.resumes.length > 0 ? state.resumes : []

const useResumeStore = create(
  persist(
    (set) => ({
      ...createDefaultResumeState(),
      setActiveResume: (resumeId) =>
        set((state) => {
          const resumes = ensureResumes(state.resumes)
          const targetResume = resumes.find((resume) => resume.id === resumeId)

          return {
            resumes,
            activeResumeId: targetResume ? targetResume.id : resumes[0].id,
          }
        }),
      renameActiveResume: (name) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            name: String(name || '').trim() || 'Untitled Resume',
          }))
        ),
      createResumeVersion: (name = 'New Resume') =>
        set((state) => {
          const resumes = ensureResumes(state.resumes)
          const nextResume = createResumeSnapshot({ name })

          return {
            resumes: [nextResume, ...resumes],
            activeResumeId: nextResume.id,
          }
        }),
      duplicateActiveResume: () =>
        set((state) => {
          const resumes = ensureResumes(state.resumes)
          const activeResume = resumes[getActiveResumeIndex(resumes, state.activeResumeId)]
          const copy = createResumeSnapshot({
            ...activeResume,
            id: undefined,
            name: `${activeResume.name} Copy`,
            createdAt: undefined,
            updatedAt: undefined,
          })

          return {
            resumes: [copy, ...resumes],
            activeResumeId: copy.id,
          }
        }),
      deleteActiveResume: () =>
        set((state) => {
          const resumes = ensureResumes(state.resumes)

          if (resumes.length === 1) {
            const freshResume = createDefaultSeedResume()
            return {
              resumes: [freshResume],
              activeResumeId: freshResume.id,
            }
          }

          const index = getActiveResumeIndex(resumes, state.activeResumeId)
          const nextResumes = resumes.filter((resume) => resume.id !== resumes[index].id)
          const nextActiveIndex = Math.max(0, index - 1)

          return {
            resumes: nextResumes,
            activeResumeId: nextResumes[nextActiveIndex].id,
          }
        }),
      replaceFormData: (formData) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: normalizeFormData(formData),
          }))
        ),
      updatePersonalField: (field, value) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              personal: {
                ...resume.formData.personal,
                [field]: value,
              },
            },
          }))
        ),
      setSummary: (summary) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              summary,
            },
          }))
        ),
      setSkills: (skills) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              skills: Array.from(
                new Set(
                  (Array.isArray(skills) ? skills : [])
                    .map((item) => String(item || '').trim())
                    .filter(Boolean)
                )
              ),
            },
          }))
        ),
      addSkill: (skill) =>
        set((state) =>
          updateActiveResume(state, (resume) => {
            const normalizedSkill = String(skill || '').trim()

            if (!normalizedSkill) {
              return resume
            }

            const exists = resume.formData.skills.some(
              (item) => item.toLowerCase() === normalizedSkill.toLowerCase()
            )

            return exists
              ? resume
              : {
                  ...resume,
                  formData: {
                    ...resume.formData,
                    skills: [...resume.formData.skills, normalizedSkill],
                  },
                }
          })
        ),
      removeSkill: (skillToRemove) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              skills: resume.formData.skills.filter((skill) => skill !== skillToRemove),
            },
          }))
        ),
      reorderSkills: (fromIndex, toIndex) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              skills: arrayMove(resume.formData.skills, fromIndex, toIndex),
            },
          }))
        ),
      addExperience: () =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              experience: [...resume.formData.experience, createEmptyExperience()],
            },
          }))
        ),
      updateExperience: (experienceId, patch) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              experience: resume.formData.experience.map((entry) =>
                entry.id === experienceId ? { ...entry, ...patch } : entry
              ),
            },
          }))
        ),
      removeExperience: (experienceId) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              experience: resume.formData.experience.filter((entry) => entry.id !== experienceId),
            },
          }))
        ),
      reorderExperience: (fromIndex, toIndex) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              experience: arrayMove(resume.formData.experience, fromIndex, toIndex),
            },
          }))
        ),
      addExperienceBullet: (experienceId) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              experience: resume.formData.experience.map((entry) =>
                entry.id === experienceId
                  ? { ...entry, bullets: [...entry.bullets, ''] }
                  : entry
              ),
            },
          }))
        ),
      updateExperienceBullet: (experienceId, bulletIndex, value) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              experience: resume.formData.experience.map((entry) =>
                entry.id === experienceId
                  ? {
                      ...entry,
                      bullets: entry.bullets.map((bullet, index) =>
                        index === bulletIndex ? value : bullet
                      ),
                    }
                  : entry
              ),
            },
          }))
        ),
      removeExperienceBullet: (experienceId, bulletIndex) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              experience: resume.formData.experience.map((entry) =>
                entry.id === experienceId
                  ? {
                      ...entry,
                      bullets:
                        entry.bullets.length > 1
                          ? entry.bullets.filter((_, index) => index !== bulletIndex)
                          : [''],
                    }
                  : entry
              ),
            },
          }))
        ),
      addEducation: () =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              education: [...resume.formData.education, createEmptyEducation()],
            },
          }))
        ),
      updateEducation: (educationId, patch) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              education: resume.formData.education.map((entry) =>
                entry.id === educationId ? { ...entry, ...patch } : entry
              ),
            },
          }))
        ),
      removeEducation: (educationId) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              education: resume.formData.education.filter((entry) => entry.id !== educationId),
            },
          }))
        ),
      addProject: () =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              projects: [...resume.formData.projects, createEmptyProject()],
            },
          }))
        ),
      updateProject: (projectId, patch) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              projects: resume.formData.projects.map((entry) =>
                entry.id === projectId ? { ...entry, ...patch } : entry
              ),
            },
          }))
        ),
      removeProject: (projectId) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              projects: resume.formData.projects.filter((entry) => entry.id !== projectId),
            },
          }))
        ),
      reorderProjects: (fromIndex, toIndex) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              projects: arrayMove(resume.formData.projects, fromIndex, toIndex),
            },
          }))
        ),
      addCertification: () =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              certifications: [...resume.formData.certifications, createEmptyCertification()],
            },
          }))
        ),
      updateCertification: (certificationId, patch) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              certifications: resume.formData.certifications.map((entry) =>
                entry.id === certificationId ? { ...entry, ...patch } : entry
              ),
            },
          }))
        ),
      removeCertification: (certificationId) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            formData: {
              ...resume.formData,
              certifications: resume.formData.certifications.filter(
                (entry) => entry.id !== certificationId
              ),
            },
          }))
        ),
      setTemplate: (template) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            template,
          }))
        ),
      setPreviewMode: (previewMode) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            previewMode,
          }))
        ),
      setJobDescription: (jobDescription) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            jobDescription,
          }))
        ),
      setAtsReport: (atsReport) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            atsReport: {
              ...createInitialAtsReport(),
              ...(atsReport || {}),
            },
          }))
        ),
      setSectionOrder: (sectionOrder) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            sectionOrder,
          }))
        ),
      moveSection: (fromIndex, toIndex) =>
        set((state) =>
          updateActiveResume(state, (resume) => ({
            ...resume,
            sectionOrder: arrayMove(resume.sectionOrder, fromIndex, toIndex),
          }))
        ),
      resetActiveResume: () =>
        set((state) =>
          updateActiveResume(state, (resume) =>
            resume.seedId === DEFAULT_RESUME_SEED_ID
              ? createDefaultSeedResume({
                  id: resume.id,
                  name: resume.name,
                  createdAt: resume.createdAt,
                })
              : createResumeSnapshot({
                  ...resume,
                  id: resume.id,
                  name: resume.name,
                  createdAt: resume.createdAt,
                })
          )
        ),
    }),
    {
      name: 'rexion-resume-builder',
      version: 3,
      migrate: (persistedState, persistedVersion) => {
        const persisted =
          persistedState && typeof persistedState === 'object' ? persistedState : {}

        if (Array.isArray(persisted.resumes) && persisted.resumes.length > 0) {
          const resumes = ensureResumes(persisted.resumes)

          if ((persistedVersion || 0) < 3) {
            return injectSeededDefaultResume(resumes, persisted.activeResumeId)
          }

          const activeResumeId =
            resumes.find((resume) => resume.id === persisted.activeResumeId)?.id || resumes[0].id

          return {
            ...persisted,
            resumes,
            activeResumeId,
          }
        }

        if (persisted.formData || persisted.template) {
          const importedResume = buildLegacyResume(persisted)

          if ((persistedVersion || 0) < 3 && isBlankStarterResume(importedResume)) {
            const seededResume = createDefaultSeedResume()
            return {
              resumes: [seededResume],
              activeResumeId: seededResume.id,
            }
          }

          return {
            resumes: [importedResume],
            activeResumeId: importedResume.id,
          }
        }

        return createDefaultResumeState()
      },
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
      }),
      merge: (persistedState, currentState) => {
        const persisted =
          persistedState && typeof persistedState === 'object' ? persistedState : {}

        if (Array.isArray(persisted.resumes) && persisted.resumes.length > 0) {
          const resumes = ensureResumes(persisted.resumes)
          const activeResumeId =
            resumes.find((resume) => resume.id === persisted.activeResumeId)?.id || resumes[0].id

          return {
            ...currentState,
            resumes,
            activeResumeId,
          }
        }

        if (persisted.formData || persisted.template) {
          const importedResume = buildLegacyResume(persisted)
          return {
            ...currentState,
            resumes: [importedResume],
            activeResumeId: importedResume.id,
          }
        }

        const resumes = ensureResumes(currentState.resumes)

        return {
          ...currentState,
          resumes,
          activeResumeId: currentState.activeResumeId || resumes[0].id,
        }
      },
    }
  )
)

export default useResumeStore
