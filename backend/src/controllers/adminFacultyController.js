import FacultyProfile from '../models/FacultyProfile.js'
import FacultyVerificationLog from '../models/FacultyVerificationLog.js'
import { Quiz } from '../models/Quiz.js'
import User from '../models/User.js'
import cacheManager from '../utils/cacheManager.js'

export const getFacultyList = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 30 } = req.query
    const filter = {}

    if (status && status !== 'all') {
      filter.status = status
    }
    if (search && search.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { contactEmail: { $regex: search.trim(), $options: 'i' } },
        { institutionName: { $regex: search.trim(), $options: 'i' } },
        { department: { $regex: search.trim(), $options: 'i' } }
      ]
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit)
    const [total, facultyMembers] = await Promise.all([
      FacultyProfile.countDocuments(filter),
      FacultyProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email role facultyStatus createdAt')
        .populate('reviewedBy', 'name email')
        .lean()
    ])

    return res.json({
      success: true,
      facultyMembers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        limit: Number(limit)
      }
    })
  } catch (error) {
    return next(error)
  }
}

export const getFacultyDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const profile = await FacultyProfile.findById(id)
      .populate('userId', 'name email role facultyStatus createdAt')
      .populate('reviewedBy', 'name email')
      .lean()

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' })
    }

    const [logs, quizzesCount] = await Promise.all([
      FacultyVerificationLog.find({ facultyProfileId: id })
        .sort({ createdAt: -1 })
        .populate('performedBy', 'name email')
        .lean(),
      Quiz.countDocuments({ author: profile.userId })
    ])

    return res.json({
      success: true,
      profile,
      verificationHistory: logs,
      quizzesCount
    })
  } catch (error) {
    return next(error)
  }
}

export const updateFacultyStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, reason = '', notes = '' } = req.body

    const validStatuses = ['unverified', 'pending', 'verified', 'rejected', 'suspended']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid faculty verification status.' })
    }

    const profile = await FacultyProfile.findById(id)
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' })
    }

    const previousStatus = profile.status
    profile.status = status
    profile.reviewedBy = req.user._id
    profile.verificationReviewedAt = new Date()

    let auditAction = 'submitted'

    if (status === 'verified') {
      auditAction = 'approved'
      profile.rejectionReason = ''
      profile.suspensionReason = ''
      // Upgrade user's facultyStatus and role
      await User.findByIdAndUpdate(profile.userId, {
        role: 'faculty',
        facultyStatus: 'verified'
      })
      // Upgrade any published quizzes by this faculty
      await Quiz.updateMany(
        { author: profile.userId },
        { isVerifiedFaculty: true, authorRole: 'faculty', institutionName: profile.institutionName }
      )
    } else if (status === 'rejected') {
      auditAction = 'rejected'
      profile.rejectionReason = reason || 'Verification documents or institutional credentials could not be validated.'
      await User.findByIdAndUpdate(profile.userId, {
        facultyStatus: 'rejected'
      })
    } else if (status === 'suspended') {
      auditAction = 'suspended'
      profile.suspensionReason = reason || 'Faculty privileges suspended by administrator.'
      await User.findByIdAndUpdate(profile.userId, {
        facultyStatus: 'suspended'
      })
      // Strip verified flag from quizzes
      await Quiz.updateMany(
        { author: profile.userId },
        { isVerifiedFaculty: false }
      )
    } else if (status === 'unverified') {
      auditAction = 'reinstated'
      await User.findByIdAndUpdate(profile.userId, {
        facultyStatus: 'unverified'
      })
    }

    profile.calculateCompletion()
    await profile.save()
    cacheManager.invalidateTag('quizzes')

    // Record audit log
    await FacultyVerificationLog.create({
      facultyProfileId: profile._id,
      userId: profile.userId,
      action: auditAction,
      previousStatus,
      newStatus: status,
      performedBy: req.user._id,
      performerEmail: req.user.email,
      reason: reason || notes,
      metadata: { adminName: req.user.name }
    })

    return res.json({
      success: true,
      message: `Faculty verification status successfully updated to "${status}".`,
      profile
    })
  } catch (error) {
    return next(error)
  }
}
