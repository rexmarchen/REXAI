import User from '../models/User.js'
import CandidateProfile from '../models/CandidateProfile.js'
import AppError from '../utils/AppError.js'

/**
 * GET /api/profile
 * Returns the authenticated user's persisted profile from MongoDB.
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id
    console.log('[PROFILE GET] User:', userId)

    const user = await User.findById(userId).select('+profile name email role plan')
    if (!user) {
      return next(new AppError('User not found.', 404))
    }

    const candidate = await CandidateProfile.findOne({
      $or: [{ userId }, { userId: String(userId) }, { email: user.email }]
    }).lean()

    const userProfile = user.profile || {}
    const candidateProfile = candidate || {}

    // Support both canonical and alias field names (github / githubUrl, linkedin / linkedinUrl, etc.)
    const github = userProfile.github || userProfile.githubUrl || candidateProfile.github || candidateProfile.githubUrl || ''
    const linkedin = userProfile.linkedin || userProfile.linkedinUrl || candidateProfile.linkedin || candidateProfile.linkedinUrl || ''
    const portfolio = userProfile.portfolio || userProfile.portfolioUrl || candidateProfile.portfolio || candidateProfile.portfolioUrl || ''
    const bio = userProfile.bio || candidateProfile.bio || ''
    const headline = userProfile.headline || candidateProfile.headline || candidateProfile.primaryDomain || ''
    const name = userProfile.name || user.name || candidateProfile.fullName || ''
    const avatarUrl = userProfile.avatarUrl || userProfile.avatar || candidateProfile.avatarUrl || candidateProfile.avatar || ''
    const bannerUrl = userProfile.bannerUrl || userProfile.coverUrl || userProfile.banner || candidateProfile.bannerUrl || candidateProfile.coverUrl || ''

    const returnedProfile = {
      ...candidateProfile,
      ...userProfile,
      name,
      fullName: name,
      email: user.email,
      headline,
      bio,
      avatar: avatarUrl,
      avatarUrl: avatarUrl,
      bannerUrl: bannerUrl,
      coverUrl: bannerUrl,
      phone: userProfile.phone || candidateProfile.phone || '',
      location: userProfile.location || candidateProfile.location || '',
      skills: Array.isArray(userProfile.skills) && userProfile.skills.length > 0
        ? userProfile.skills
        : (candidateProfile.skills || []),
      targetRole: userProfile.targetRole || candidateProfile.primaryDomain || candidateProfile.targetRole || '',
      workMode: userProfile.workMode || candidateProfile.preferredWorkMode || 'Remote / Hybrid',
      github,
      githubUrl: github,
      linkedin,
      linkedinUrl: linkedin,
      portfolio,
      portfolioUrl: portfolio,
      resumeUrl: userProfile.resumeUrl || candidateProfile.resumeFilePath || '',
      resumeFileName: userProfile.resumeFileName || candidateProfile.resumeFileId || '',
      experiences: userProfile.experiences || candidateProfile.experience || [],
      projects: userProfile.projects || [],
      education: userProfile.education || candidateProfile.education || [],
      certifications: userProfile.certifications || candidateProfile.certifications || [],
      jobPreferences: userProfile.jobPreferences || candidateProfile.jobPreferences || {},
      updatedAt: userProfile.updatedAt || user.updatedAt || new Date()
    }

    console.log('[PROFILE GET] Returned profile:', returnedProfile)

    return res.status(200).json({
      success: true,
      name: user.name,
      email: user.email,
      profile: returnedProfile
    })
  } catch (error) {
    console.error('[PROFILE GET] Error:', error)
    return next(error)
  }
}

/**
 * PUT or PATCH or POST /api/profile
 * Atomically updates and persists the authenticated user's profile in MongoDB.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id
    console.log('[PROFILE API] Authenticated user:', userId)
    console.log('[PROFILE API] Incoming data:', req.body)

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found.', 404))
    }

    const incoming = req.body || {}
    const existingProfile = user.profile || {}

    // Synchronize aliases (github / githubUrl, linkedin / linkedinUrl, etc.)
    const github = incoming.github || incoming.githubUrl || existingProfile.github || existingProfile.githubUrl || ''
    const linkedin = incoming.linkedin || incoming.linkedinUrl || existingProfile.linkedin || existingProfile.linkedinUrl || ''
    const portfolio = incoming.portfolio || incoming.portfolioUrl || existingProfile.portfolio || existingProfile.portfolioUrl || ''
    const name = incoming.name || incoming.fullName || existingProfile.name || user.name
    if (incoming.name || incoming.fullName) {
      user.name = String(incoming.name || incoming.fullName).trim()
    }

    const avatarUrl = incoming.avatarUrl !== undefined ? incoming.avatarUrl : (incoming.avatar !== undefined ? incoming.avatar : (existingProfile.avatarUrl || existingProfile.avatar || ''))
    const bannerUrl = incoming.bannerUrl !== undefined ? incoming.bannerUrl : (incoming.coverUrl !== undefined ? incoming.coverUrl : (existingProfile.bannerUrl || existingProfile.coverUrl || ''))

    const updatedProfile = {
      ...existingProfile,
      ...incoming,
      name,
      fullName: name,
      avatar: avatarUrl,
      avatarUrl: avatarUrl,
      bannerUrl: bannerUrl,
      coverUrl: bannerUrl,
      github,
      githubUrl: github,
      linkedin,
      linkedinUrl: linkedin,
      portfolio,
      portfolioUrl: portfolio,
      bio: incoming.bio !== undefined ? incoming.bio : (existingProfile.bio || ''),
      headline: incoming.headline !== undefined ? incoming.headline : (existingProfile.headline || ''),
      skills: Array.isArray(incoming.skills) ? incoming.skills : (existingProfile.skills || []),
      location: incoming.location !== undefined ? incoming.location : (existingProfile.location || ''),
      phone: incoming.phone !== undefined ? incoming.phone : (existingProfile.phone || ''),
      targetRole: incoming.targetRole !== undefined ? incoming.targetRole : (existingProfile.targetRole || ''),
      workMode: incoming.workMode !== undefined ? incoming.workMode : (existingProfile.workMode || 'Remote / Hybrid'),
      experiences: Array.isArray(incoming.experiences) ? incoming.experiences : (existingProfile.experiences || []),
      projects: Array.isArray(incoming.projects) ? incoming.projects : (existingProfile.projects || []),
      education: Array.isArray(incoming.education) ? incoming.education : (existingProfile.education || []),
      updatedAt: new Date()
    }

    // 1. Atomic update on User collection
    user.profile = updatedProfile
    user.markModified('profile')
    await user.save()

    // 2. Atomic upsert on CandidateProfile collection for full relational persistence
    await CandidateProfile.findOneAndUpdate(
      { $or: [{ userId }, { userId: String(userId) }, { email: user.email }] },
      {
        $set: {
          userId,
          email: user.email,
          fullName: user.name,
          headline: updatedProfile.headline,
          bio: updatedProfile.bio,
          phone: updatedProfile.phone,
          location: updatedProfile.location,
          avatarUrl,
          bannerUrl,
          skills: updatedProfile.skills,
          primaryDomain: updatedProfile.targetRole || updatedProfile.headline || 'Software Engineering',
          preferredWorkMode: updatedProfile.workMode,
          github,
          githubUrl: github,
          linkedin,
          linkedinUrl: linkedin,
          portfolio,
          portfolioUrl: portfolio,
          resumeFilePath: updatedProfile.resumeUrl,
          resumeFileId: updatedProfile.resumeFileName,
          experience: updatedProfile.experiences,
          isComplete: true,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, runValidators: false }
    )

    console.log('[PROFILE API] Database result:', updatedProfile)

    return res.status(200).json({
      success: true,
      message: 'Profile saved and persisted to database.',
      name: user.name,
      email: user.email,
      profile: updatedProfile
    })
  } catch (error) {
    console.error('[PROFILE API] Error saving profile:', error)
    return next(error)
  }
}

/**
 * POST /api/profile/resume
 * Handles resume upload — multer saves to disk, updates profile in MongoDB.
 */
export const uploadProfileResume = async (req, res, next) => {
  try {
    const userId = req.user?._id
    if (!req.file) {
      return next(new AppError('No resume file uploaded.', 400))
    }

    const resumeUrl = `/uploads/${req.file.filename}`
    const resumeFileName = req.file.originalname

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found.', 404))
    }

    const profile = user.profile || {}
    profile.resumeUrl = resumeUrl
    profile.resumeFileName = resumeFileName
    profile.updatedAt = new Date()

    user.profile = profile
    user.markModified('profile')
    await user.save()

    // Sync to CandidateProfile
    await CandidateProfile.findOneAndUpdate(
      { $or: [{ userId }, { userId: String(userId) }, { email: user.email }] },
      {
        $set: {
          resumeFilePath: resumeUrl,
          resumeFileId: resumeFileName,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully and persisted to database.',
      resumeUrl,
      resumeFileName,
      profile: user.profile
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * POST /api/profile/image
 * Uploads an image (photo, logo, or background banner) and returns its accessible URL.
 */
export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided.', 400))
    }
    const publicUrl = `/uploads/${req.file.filename}`
    console.log('[PROFILE API] Uploaded profile image:', publicUrl)
    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: req.file.filename
    })
  } catch (error) {
    return next(error)
  }
}
