import DeveloperProfile from '../models/DeveloperProfile.js'
import User from '../models/User.js'

export const getDevelopersList = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 30 } = req.query
    const filter = {}

    if (status && status !== 'all') {
      filter.status = status
    }
    if (search && search.trim()) {
      filter.$or = [
        { displayName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { title: { $regex: search.trim(), $options: 'i' } }
      ]
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit)
    const [total, developers] = await Promise.all([
      DeveloperProfile.countDocuments(filter),
      DeveloperProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email role createdAt')
        .populate('approvedBy', 'name email')
        .lean()
    ])

    return res.json({
      success: true,
      developers,
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

export const updateDeveloperStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, revokedReason = '', notes = '' } = req.body

    const validStatuses = ['pending', 'active', 'suspended', 'revoked']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid developer status.' })
    }

    const profile = await DeveloperProfile.findById(id)
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Developer profile not found.' })
    }

    profile.status = status
    if (notes) profile.notes = notes

    if (status === 'active') {
      profile.approvedBy = req.user._id
      profile.approvedAt = new Date()
      profile.revokedReason = ''
      // Upgrade user role if regular user
      await User.findByIdAndUpdate(profile.userId, {
        role: 'developer',
        developerStatus: 'active'
      })
    } else if (status === 'revoked' || status === 'suspended') {
      profile.revokedReason = revokedReason
      // Downgrade user role to regular user
      await User.findByIdAndUpdate(profile.userId, {
        role: 'user',
        developerStatus: status
      })
    } else if (status === 'pending') {
      await User.findByIdAndUpdate(profile.userId, {
        developerStatus: 'pending'
      })
    }

    await profile.save()

    return res.json({
      success: true,
      message: `Developer status successfully updated to "${status}".`,
      profile
    })
  } catch (error) {
    return next(error)
  }
}

export const inviteOrGrantDeveloper = async (req, res, next) => {
  try {
    const { email, title = 'Developer', technicalExpertise = [] } = req.body

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'User email is required.' })
    }

    const targetUser = await User.findOne({ email: email.trim().toLowerCase() })
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: `No user found with email "${email}". The user must register first.`
      })
    }

    let profile = await DeveloperProfile.findOne({ userId: targetUser._id })
    if (!profile) {
      profile = new DeveloperProfile({
        userId: targetUser._id,
        displayName: targetUser.name || 'Developer',
        email: targetUser.email,
        title,
        technicalExpertise: Array.isArray(technicalExpertise) ? technicalExpertise : [],
        status: 'active',
        approvedBy: req.user._id,
        approvedAt: new Date()
      })
    } else {
      profile.status = 'active'
      profile.approvedBy = req.user._id
      profile.approvedAt = new Date()
      profile.revokedReason = ''
    }

    await profile.save()

    // Promote User
    if (targetUser.role !== 'admin') {
      targetUser.role = 'developer'
    }
    targetUser.developerStatus = 'active'
    await targetUser.save()

    return res.status(200).json({
      success: true,
      message: `Developer privileges granted to ${targetUser.email}.`,
      profile
    })
  } catch (error) {
    return next(error)
  }
}
