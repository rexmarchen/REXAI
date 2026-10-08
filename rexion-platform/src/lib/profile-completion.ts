import type { CareerProfileShape, ProfileCompletionResult } from '@/types/profile'

export function calculateProfileCompletion(
  profile?: Partial<CareerProfileShape> | null,
  userName?: string | null,
  userEmail?: string | null
): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: 9,
      items: [
        { key: 'basic', label: 'Basic Information', completed: false, weight: 15, href: '#basic-info' },
        { key: 'summary', label: 'About & Summary', completed: false, weight: 10, href: '#about-section' },
        { key: 'direction', label: 'Career Direction', completed: false, weight: 10, href: '#career-direction' },
        { key: 'skills', label: 'Skills & Tech Stack', completed: false, weight: 15, href: '#skills-section' },
        { key: 'experience', label: 'Work Experience', completed: false, weight: 15, href: '#experience-section' },
        { key: 'education', label: 'Education', completed: false, weight: 10, href: '#education-section' },
        { key: 'projects', label: 'Projects', completed: false, weight: 10, href: '#projects-section' },
        { key: 'resume', label: 'Resume', completed: false, weight: 10, href: '#resume-section' },
        { key: 'social', label: 'Social & Developer Links', completed: false, weight: 5, href: '#social-links' },
      ],
    }
  }

  // 1. Basic Info (Name, Headline, Location/City, Phone or Email)
  const hasName = Boolean(userName?.trim())
  const hasHeadline = Boolean(profile.headline?.trim())
  const hasLocation = Boolean(
    profile.city?.trim() ||
      profile.country?.trim() ||
      profile.location?.city?.trim() ||
      profile.location?.country?.trim()
  )
  const hasContact = Boolean(profile.phone?.trim() || userEmail?.trim())
  const isBasicComplete = (hasName || hasHeadline) && hasLocation && hasContact

  // 2. Summary
  const isSummaryComplete = Boolean(
    profile.professionalSummary && profile.professionalSummary.trim().length >= 20
  )

  // 3. Career Direction (Target Roles & Level/Status)
  const hasTargetRoles = Array.isArray(profile.targetRoles) && profile.targetRoles.length > 0
  const hasLevelOrStatus = Boolean(profile.careerLevel || profile.currentStatus)
  const isDirectionComplete = hasTargetRoles && hasLevelOrStatus

  // 4. Skills (at least 3 skills)
  const totalSkills = [
    ...(profile.skills || []),
    ...(profile.languages || []),
    ...(profile.frameworks || []),
    ...(profile.databases || []),
    ...(profile.tools || []),
    ...(profile.categorizedSkills?.languages || []),
    ...(profile.categorizedSkills?.aiMl || []),
    ...(profile.categorizedSkills?.frameworks || []),
    ...(profile.categorizedSkills?.databases || []),
    ...(profile.categorizedSkills?.tools || []),
    ...(profile.categorizedSkills?.other || []),
  ]
  const uniqueSkills = Array.from(new Set(totalSkills.filter(Boolean)))
  const isSkillsComplete = uniqueSkills.length >= 3

  // 5. Experience
  const isExperienceComplete = Array.isArray(profile.experience) && profile.experience.length > 0

  // 6. Education
  const isEducationComplete = Array.isArray(profile.education) && profile.education.length > 0

  // 7. Projects
  const isProjectsComplete = Array.isArray(profile.projects) && profile.projects.length > 0

  // 8. Resume
  const isResumeComplete = Boolean(profile.resume?.fileUrl || profile.resume?.fileName)

  // 9. Social Links
  const social = profile.socialLinks || {}
  const isSocialComplete = Boolean(
    social.github ||
      social.linkedin ||
      social.portfolio ||
      social.leetcode ||
      social.hackerrank ||
      social.kaggle ||
      social.twitter
  )

  const items = [
    { key: 'basic', label: 'Basic Information', completed: isBasicComplete, weight: 15, href: '#basic-info' },
    { key: 'summary', label: 'About & Summary', completed: isSummaryComplete, weight: 10, href: '#about-section' },
    { key: 'direction', label: 'Career Direction', completed: isDirectionComplete, weight: 10, href: '#career-direction' },
    { key: 'skills', label: 'Skills & Tech Stack', completed: isSkillsComplete, weight: 15, href: '#skills-section' },
    { key: 'experience', label: 'Work Experience', completed: isExperienceComplete, weight: 15, href: '#experience-section' },
    { key: 'education', label: 'Education', completed: isEducationComplete, weight: 10, href: '#education-section' },
    { key: 'projects', label: 'Projects', completed: isProjectsComplete, weight: 10, href: '#projects-section' },
    { key: 'resume', label: 'Resume', completed: isResumeComplete, weight: 10, href: '#resume-section' },
    { key: 'social', label: 'Social & Developer Links', completed: isSocialComplete, weight: 5, href: '#social-links' },
  ]

  const percentage = items.reduce((acc, item) => (item.completed ? acc + item.weight : acc), 0)
  const completedCount = items.filter((item) => item.completed).length

  return {
    percentage: Math.min(100, percentage),
    items,
    completedCount,
    totalCount: items.length,
  }
}
