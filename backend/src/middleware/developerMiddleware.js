import DeveloperProfile from '../models/DeveloperProfile.js'
import AppError from '../utils/AppError.js'

export const requireDeveloper = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in. Please log in to access the Developer Portal.', 401))
    }

    // Admins always have access to developer tools
    if (req.user.role === 'admin') {
      let profile = await DeveloperProfile.findOne({ userId: req.user._id })
      if (!profile) {
        profile = await DeveloperProfile.create({
          userId: req.user._id,
          displayName: req.user.name || 'Admin Developer',
          email: req.user.email,
          status: 'active',
          title: 'System Administrator'
        })
      }
      req.developerProfile = profile
      return next()
    }

    if (req.user.role !== 'developer') {
      return res.status(403).json({
        success: false,
        code: 'NOT_A_DEVELOPER',
        message: 'Access restricted to authorized developers. Please apply for developer access.'
      })
    }

    // Verify developer profile status
    const profile = await DeveloperProfile.findOne({ userId: req.user._id })
    if (!profile) {
      return res.status(403).json({
        success: false,
        code: 'NO_DEVELOPER_PROFILE',
        status: 'pending',
        message: 'Developer profile not found. Please complete your developer application.'
      })
    }

    if (profile.status === 'pending') {
      return res.status(403).json({
        success: false,
        code: 'DEVELOPER_PENDING',
        status: 'pending',
        message: 'Your developer application is currently pending admin review.'
      })
    }

    if (profile.status === 'suspended') {
      return res.status(403).json({
        success: false,
        code: 'DEVELOPER_SUSPENDED',
        status: 'suspended',
        message: 'Your developer account is temporarily suspended.'
      })
    }

    if (profile.status === 'revoked') {
      return res.status(403).json({
        success: false,
        code: 'DEVELOPER_REVOKED',
        status: 'revoked',
        message: 'Your developer privileges have been revoked.'
      })
    }

    if (profile.status !== 'active') {
      return res.status(403).json({
        success: false,
        code: 'DEVELOPER_INACTIVE',
        status: profile.status,
        message: 'Developer account is inactive.'
      })
    }

    req.developerProfile = profile
    return next()
  } catch (error) {
    return next(error)
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Administrator privileges required for this action.', 403))
  }
  return next()
}
