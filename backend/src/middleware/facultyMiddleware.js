import FacultyProfile from '../models/FacultyProfile.js'
import AppError from '../utils/AppError.js'

export const requireFaculty = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in. Please log in to access the Faculty Portal.', 401))
    }

    // Admins always have access to educator and faculty tools
    if (req.user.role === 'admin') {
      let profile = await FacultyProfile.findOne({ userId: req.user._id })
      if (!profile) {
        profile = await FacultyProfile.create({
          userId: req.user._id,
          fullName: req.user.name || 'System Administrator',
          contactEmail: req.user.email,
          professionalTitle: 'Professor',
          designation: 'Dean / Department Head',
          institutionName: 'REXION Academic Operations',
          department: 'Academic Oversight',
          status: 'verified'
        })
      }
      req.facultyProfile = profile
      return next()
    }

    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        code: 'NOT_FACULTY',
        message: 'Access restricted to authorized faculty and educators. Please register or apply for faculty access.'
      })
    }

    let profile = await FacultyProfile.findOne({ userId: req.user._id })
    if (!profile) {
      profile = await FacultyProfile.create({
        userId: req.user._id,
        fullName: req.user.name || 'Educator',
        contactEmail: req.user.email,
        institutionName: 'College / University',
        department: 'General Academics',
        status: req.user.facultyStatus || 'unverified'
      })
    }

    if (profile.status === 'suspended') {
      return res.status(403).json({
        success: false,
        code: 'FACULTY_SUSPENDED',
        status: 'suspended',
        message: 'Your faculty account is temporarily suspended. Please contact REXION academic support.'
      })
    }

    req.facultyProfile = profile
    return next()
  } catch (error) {
    return next(error)
  }
}

/**
 * Enforces that faculty member must be fully verified before publishing quizzes
 */
export const requireVerifiedFaculty = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in. Please log in to proceed.', 401))
    }

    if (req.user.role === 'admin') {
      return next()
    }

    const profile = req.facultyProfile || await FacultyProfile.findOne({ userId: req.user._id })
    if (!profile) {
      return res.status(403).json({
        success: false,
        code: 'NO_FACULTY_PROFILE',
        message: 'Faculty profile not found. Please complete your academic profile.'
      })
    }

    if (profile.status !== 'verified') {
      return res.status(403).json({
        success: false,
        code: 'UNVERIFIED_FACULTY',
        status: profile.status,
        message: `Only verified faculty members may publish educational quizzes. Current verification status: ${profile.status}. Please complete verification review.`
      })
    }

    req.facultyProfile = profile
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
