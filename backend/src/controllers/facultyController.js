import mongoose from 'mongoose'
import FacultyProfile from '../models/FacultyProfile.js'
import FacultyQuestion from '../models/FacultyQuestion.js'
import FacultyVerificationLog from '../models/FacultyVerificationLog.js'
import { Quiz, QuizAttempt, QuizVersion } from '../models/Quiz.js'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import cacheManager from '../utils/cacheManager.js'

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateUniqueSlug(baseText, excludeQuizId = null) {
  let base = slugify(baseText) || 'academic-quiz'
  let candidate = base
  let counter = 1

  while (true) {
    const query = { slug: candidate }
    if (excludeQuizId) {
      query._id = { $ne: excludeQuizId }
    }
    const exists = await Quiz.findOne(query).lean()
    if (!exists) return candidate
    candidate = `${base}-${counter}`
    counter++
  }
}

/**
 * Validates a single question payload for quiz authoring
 */
export function validateFacultyQuestion(q, index = 0) {
  const errors = []
  const prefix = `Question #${index + 1}`

  if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
    errors.push(`${prefix}: Question statement is required.`)
  }

  const type = q.type || 'multiple_choice'
  const validTypes = ['multiple_choice', 'true_false', 'multiple_select', 'short_answer', 'code']
  if (!validTypes.includes(type)) {
    errors.push(`${prefix}: Invalid question type "${type}".`)
  }

  if (type === 'multiple_choice') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`${prefix}: Multiple-choice questions must have at least 2 options.`)
    } else {
      const hasEmpty = q.options.some(opt => typeof opt !== 'string' || !opt.trim())
      if (hasEmpty) errors.push(`${prefix}: All options must have text.`)
      const idx = Number(q.correctIndex)
      if (isNaN(idx) || idx < 0 || idx >= q.options.length) {
        errors.push(`${prefix}: Please select a valid correct answer option.`)
      }
    }
  } else if (type === 'true_false') {
    const idx = Number(q.correctIndex)
    if (idx !== 0 && idx !== 1) {
      errors.push(`${prefix}: True/False question must have a valid answer (True or False).`)
    }
  } else if (type === 'multiple_select') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`${prefix}: Multi-select question must have at least 2 options.`)
    } else {
      const indices = Array.isArray(q.correctIndices) ? q.correctIndices : []
      if (indices.length === 0) {
        errors.push(`${prefix}: Multi-select question must have at least 1 correct option.`)
      } else {
        const outOfBounds = indices.some(i => i < 0 || i >= q.options.length)
        if (outOfBounds) errors.push(`${prefix}: Selected correct option index is out of bounds.`)
      }
    }
  } else if (type === 'short_answer') {
    if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) {
      errors.push(`${prefix}: Short-answer question must provide the correct answer string.`)
    }
  }

  if (q.marks !== undefined && (isNaN(Number(q.marks)) || Number(q.marks) < 0)) {
    errors.push(`${prefix}: Marks must be a non-negative number.`)
  }

  if (q.negativeMarks !== undefined && (isNaN(Number(q.negativeMarks)) || Number(q.negativeMarks) < 0)) {
    errors.push(`${prefix}: Negative marks must be a non-negative number.`)
  }

  return errors
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FACULTY PROFILE & VERIFICATION SUBMISSION
// ─────────────────────────────────────────────────────────────────────────────

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id
    let profile = await FacultyProfile.findOne({ userId })

    if (!profile) {
      const initialStatus = (req.user.facultyStatus && req.user.facultyStatus !== 'none') 
        ? req.user.facultyStatus 
        : 'unverified'

      profile = await FacultyProfile.create({
        userId,
        fullName: req.user.name || 'Educator',
        professionalTitle: 'Prof.',
        contactEmail: req.user.email,
        institutionName: req.user.role === 'admin' ? 'REXION Administration' : '',
        department: '',
        status: initialStatus
      })
    }

    profile.calculateCompletion()
    await profile.save()

    const recentLogs = await FacultyVerificationLog.find({ facultyProfileId: profile._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    return res.json({
      success: true,
      userRole: req.user.role,
      status: profile.status,
      isVerified: profile.status === 'verified',
      profileCompletion: profile.profileCompletion,
      profile,
      verificationHistory: recentLogs
    })
  } catch (error) {
    return next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id
    let profile = await FacultyProfile.findOne({ userId })

    if (!profile) {
      profile = new FacultyProfile({ userId, contactEmail: req.user.email })
    }

    const {
      fullName,
      avatarUrl,
      professionalTitle,
      designation,
      bio,
      contactEmail,
      phone,
      institutionName,
      institutionType,
      department,
      city,
      state,
      country,
      website,
      employeeId,
      employmentType,
      qualifications,
      teachingSubjects,
      yearsOfExperience,
      coursesTaught,
      certifications,
      researchInterests,
      achievements
    } = req.body

    if (fullName && fullName.trim()) profile.fullName = fullName.trim()
    if (avatarUrl !== undefined) profile.avatarUrl = String(avatarUrl).trim()
    if (professionalTitle) profile.professionalTitle = professionalTitle
    if (designation) profile.designation = designation
    if (bio !== undefined) profile.bio = String(bio).trim()
    if (contactEmail && contactEmail.trim()) profile.contactEmail = contactEmail.trim().toLowerCase()
    if (phone !== undefined) profile.phone = String(phone).trim()
    if (institutionName && institutionName.trim()) profile.institutionName = institutionName.trim()
    if (institutionType) profile.institutionType = institutionType
    if (department && department.trim()) profile.department = department.trim()
    if (city !== undefined) profile.city = String(city).trim()
    if (state !== undefined) profile.state = String(state).trim()
    if (country !== undefined) profile.country = String(country).trim()
    if (website !== undefined) profile.website = String(website).trim()
    if (employeeId !== undefined) profile.employeeId = String(employeeId).trim()
    if (employmentType) profile.employmentType = employmentType

    if (Array.isArray(qualifications)) {
      profile.qualifications = qualifications.filter(q => q && q.degree && q.institution).map(q => ({
        degree: String(q.degree).trim(),
        specialization: String(q.specialization || '').trim(),
        institution: String(q.institution).trim(),
        graduationYear: q.graduationYear ? Number(q.graduationYear) : undefined
      }))
    }

    if (Array.isArray(teachingSubjects)) {
      profile.teachingSubjects = teachingSubjects.map(s => String(s).trim()).filter(Boolean)
    }

    if (yearsOfExperience !== undefined) {
      profile.yearsOfExperience = Math.max(0, Number(yearsOfExperience) || 0)
    }

    if (Array.isArray(coursesTaught)) {
      profile.coursesTaught = coursesTaught.map(s => String(s).trim()).filter(Boolean)
    }
    if (Array.isArray(certifications)) {
      profile.certifications = certifications.map(s => String(s).trim()).filter(Boolean)
    }
    if (Array.isArray(researchInterests)) {
      profile.researchInterests = researchInterests.map(s => String(s).trim()).filter(Boolean)
    }
    if (Array.isArray(achievements)) {
      profile.achievements = achievements.map(s => String(s).trim()).filter(Boolean)
    }

    profile.calculateCompletion()
    await profile.save()

    // Sync full name to user account if changed
    if (profile.fullName) {
      await User.findByIdAndUpdate(userId, { name: profile.fullName })
    }

    return res.json({
      success: true,
      message: 'Faculty profile updated successfully.',
      profileCompletion: profile.profileCompletion,
      profile
    })
  } catch (error) {
    return next(error)
  }
}

export const submitVerificationRequest = async (req, res, next) => {
  try {
    const userId = req.user._id
    let profile = await FacultyProfile.findOne({ userId })

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found. Please complete profile first.' })
    }

    if (profile.status === 'verified') {
      return res.json({
        success: true,
        message: 'Your faculty account is already verified.',
        status: 'verified',
        profile
      })
    }

    const {
      institutionalEmail,
      employeeId,
      department,
      institutionName,
      idDocumentUrl = '',
      idDocumentName = '',
      notes = ''
    } = req.body

    if (!institutionalEmail || !institutionalEmail.trim()) {
      return res.status(400).json({ success: false, message: 'Institutional email address is required for faculty verification.' })
    }

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({ success: false, message: 'Faculty ID or employee ID is required.' })
    }

    const prevStatus = profile.status

    profile.contactEmail = institutionalEmail.trim().toLowerCase()
    profile.employeeId = employeeId.trim()
    if (department && department.trim()) profile.department = department.trim()
    if (institutionName && institutionName.trim()) profile.institutionName = institutionName.trim()

    profile.verificationEvidence = {
      idDocumentUrl: String(idDocumentUrl).trim(),
      idDocumentName: String(idDocumentName).trim(),
      institutionalEmail: institutionalEmail.trim().toLowerCase(),
      notes: String(notes).trim()
    }

    profile.status = 'pending'
    profile.verificationRequestedAt = new Date()
    profile.rejectionReason = ''
    profile.calculateCompletion()
    await profile.save()

    // Update user record
    await User.findByIdAndUpdate(userId, { facultyStatus: 'pending' })

    // Audit log
    await FacultyVerificationLog.create({
      facultyProfileId: profile._id,
      userId,
      action: 'submitted',
      previousStatus: prevStatus,
      newStatus: 'pending',
      performedBy: userId,
      performerEmail: req.user.email,
      reason: notes || 'Verification request submitted by faculty member.'
    })

    return res.status(200).json({
      success: true,
      message: 'Faculty verification request submitted successfully and is pending administrator review.',
      status: 'pending',
      profile
    })
  } catch (error) {
    return next(error)
  }
}

export const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params
    let profile = null

    if (mongoose.Types.ObjectId.isValid(id)) {
      profile = await FacultyProfile.findById(id) || await FacultyProfile.findOne({ userId: id })
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' })
    }

    return res.json({
      success: true,
      profile: profile.toPublicProfile()
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FACULTY DASHBOARD OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user._id
    const profile = req.facultyProfile || await FacultyProfile.findOne({ userId })

    // Aggregate real quiz counts owned by this faculty
    const [totalQuizzes, publishedQuizzes, draftQuizzes, archivedQuizzes] = await Promise.all([
      Quiz.countDocuments({ author: userId }),
      Quiz.countDocuments({ author: userId, status: 'published' }),
      Quiz.countDocuments({ author: userId, status: { $in: ['draft', 'in_review'] } }),
      Quiz.countDocuments({ author: userId, status: 'archived' })
    ])

    // Find all slugs for real student attempt metrics
    const facultyQuizzes = await Quiz.find({ author: userId }).select('slug title category difficulty status').lean()
    const quizSlugs = facultyQuizzes.map(q => q.slug)

    let totalAttempts = 0
    let avgScore = 0
    let passCount = 0
    let recentAttempts = []

    if (quizSlugs.length > 0) {
      const [agg, recent] = await Promise.all([
        QuizAttempt.aggregate([
          { $match: { quizSlug: { $in: quizSlugs }, isRealAttempt: true } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              avgScore: { $avg: '$scorePercentage' },
              passed: { $sum: { $cond: ['$passed', 1, 0] } }
            }
          }
        ]),
        QuizAttempt.find({ quizSlug: { $in: quizSlugs }, isRealAttempt: true })
          .sort({ completedAt: -1 })
          .limit(8)
          .lean()
      ])

      if (agg.length > 0) {
        totalAttempts = agg[0].total || 0
        avgScore = Math.round(agg[0].avgScore || 0)
        passCount = agg[0].passed || 0
      }

      recentAttempts = recent.map(a => ({
        id: a._id,
        quizSlug: a.quizSlug,
        scorePercentage: a.scorePercentage,
        passed: a.passed,
        timeTaken: a.timeTaken,
        completedAt: a.completedAt
      }))
    }

    const questionBankCount = await FacultyQuestion.countDocuments({ author: userId })

    return res.json({
      success: true,
      faculty: {
        id: profile?._id,
        name: profile?.fullName || req.user.name,
        title: profile?.professionalTitle,
        designation: profile?.designation,
        institution: profile?.institutionName,
        status: profile?.status || 'unverified',
        isVerified: profile?.status === 'verified',
        profileCompletion: profile?.profileCompletion || 0
      },
      stats: {
        totalQuizzes,
        publishedQuizzes,
        draftQuizzes,
        archivedQuizzes,
        totalAttempts,
        averageScore: avgScore,
        passRate: totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0,
        questionBankCount
      },
      recentActivity: recentAttempts,
      recentQuizzes: facultyQuizzes.slice(0, 5)
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FACULTY QUIZ MANAGEMENT (CRUD + PUBLISH GATE)
// ─────────────────────────────────────────────────────────────────────────────

export const getQuizzes = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { status, search, page = 1, limit = 20 } = req.query

    const filter = { author: userId }
    if (status && status !== 'all') {
      filter.status = status
    }
    if (search && search.trim()) {
      const s = search.trim()
      filter.$or = [
        { title: { $regex: s, $options: 'i' } },
        { topic: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } }
      ]
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit)
    const [total, quizzes] = await Promise.all([
      Quiz.countDocuments(filter),
      Quiz.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()
    ])

    const slugs = quizzes.map(q => q.slug)
    const attemptCounts = await QuizAttempt.aggregate([
      { $match: { quizSlug: { $in: slugs }, isRealAttempt: true } },
      { $group: { _id: '$quizSlug', count: { $sum: 1 }, avgScore: { $avg: '$scorePercentage' } } }
    ])

    const countMap = {}
    attemptCounts.forEach(item => {
      countMap[item._id] = {
        attempts: item.count,
        avgScore: Math.round(item.avgScore || 0)
      }
    })

    const items = quizzes.map(q => ({
      _id: q._id,
      slug: q.slug,
      title: q.title,
      description: q.description,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      targetAudience: q.targetAudience || 'All Students',
      status: q.status || 'draft',
      durationMinutes: q.durationMinutes,
      questionsCount: (q.questionPool && q.questionPool.length) || 0,
      passingScore: q.passingScore || 60,
      version: q.version || 1,
      isVerifiedFaculty: Boolean(q.isVerifiedFaculty),
      attemptsCount: countMap[q.slug]?.attempts || 0,
      avgScore: countMap[q.slug]?.avgScore || 0,
      publishedAt: q.publishedAt,
      updatedAt: q.updatedAt
    }))

    return res.json({
      success: true,
      quizzes: items,
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

export const createQuiz = async (req, res, next) => {
  try {
    const userId = req.user._id
    const profile = req.facultyProfile || await FacultyProfile.findOne({ userId })

    const {
      title,
      slug,
      description = '',
      instructions = '',
      topic,
      category = 'Development',
      difficulty = 'Medium',
      targetAudience = 'All Students',
      durationMinutes = 15,
      passingScore = 60,
      randomizeQuestions = false,
      randomizeOptions = false,
      negativeMarking = false,
      showExplanations = true,
      availabilityStart,
      availabilityEnd,
      maxAttempts = 0,
      initialQuestions = []
    } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Quiz title is required.' })
    }

    const cleanTopic = topic && topic.trim() ? topic.trim() : title.trim()
    const finalSlug = await generateUniqueSlug(slug || title)

    const validatedQuestions = []
    if (Array.isArray(initialQuestions) && initialQuestions.length > 0) {
      for (let i = 0; i < initialQuestions.length; i++) {
        const q = initialQuestions[i]
        const errs = validateFacultyQuestion(q, i)
        if (errs.length > 0) {
          return res.status(400).json({ success: false, message: errs.join(' ') })
        }
        validatedQuestions.push({
          id: q.id || `q_${Date.now()}_${i}`,
          question: q.question.trim(),
          type: q.type || 'multiple_choice',
          code: q.code || '',
          language: q.language || '',
          options: Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [],
          correctIndex: q.correctIndex !== undefined ? Number(q.correctIndex) : 0,
          correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices.map(Number) : [],
          correctAnswer: q.correctAnswer ? String(q.correctAnswer).trim() : '',
          explanation: q.explanation || '',
          tags: Array.isArray(q.tags) ? q.tags : [],
          difficulty: q.difficulty || difficulty,
          marks: q.marks !== undefined ? Number(q.marks) : 1,
          negativeMarks: q.negativeMarks !== undefined ? Number(q.negativeMarks) : 0,
          order: i
        })
      }
    }

    const authorDisplayName = profile
      ? `${profile.professionalTitle || 'Prof.'} ${profile.fullName || req.user.name}`
      : req.user.name

    const quiz = await Quiz.create({
      slug: finalSlug,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      topic: cleanTopic,
      category: category.trim(),
      difficulty,
      targetAudience: targetAudience.trim(),
      durationMinutes: Math.max(1, Number(durationMinutes) || 15),
      questionsCount: validatedQuestions.length,
      passingScore: Math.min(100, Math.max(0, Number(passingScore) || 60)),
      randomizeQuestions: Boolean(randomizeQuestions),
      randomizeOptions: Boolean(randomizeOptions),
      negativeMarking: Boolean(negativeMarking),
      showExplanations: Boolean(showExplanations),
      availabilityStart: availabilityStart ? new Date(availabilityStart) : undefined,
      availabilityEnd: availabilityEnd ? new Date(availabilityEnd) : undefined,
      maxAttempts: Number(maxAttempts) || 0,
      author: userId,
      authorName: authorDisplayName,
      authorRole: 'faculty',
      facultyProfile: profile?._id,
      institutionName: profile?.institutionName || '',
      isVerifiedFaculty: profile?.status === 'verified',
      status: 'draft',
      visibility: 'public',
      version: 1,
      questionPool: validatedQuestions
    })

    cacheManager.invalidateTag('quizzes')

    return res.status(201).json({
      success: true,
      message: 'Draft educational quiz created successfully.',
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id).lean()

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to this faculty quiz.' })
    }

    return res.json({
      success: true,
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this quiz.' })
    }

    const {
      title,
      slug,
      description,
      instructions,
      topic,
      category,
      difficulty,
      targetAudience,
      durationMinutes,
      passingScore,
      randomizeQuestions,
      randomizeOptions,
      negativeMarking,
      showExplanations,
      availabilityStart,
      availabilityEnd,
      maxAttempts
    } = req.body

    if (title && title.trim()) quiz.title = title.trim()
    if (description !== undefined) quiz.description = String(description).trim()
    if (instructions !== undefined) quiz.instructions = String(instructions).trim()
    if (topic && topic.trim()) quiz.topic = topic.trim()
    if (category && category.trim()) quiz.category = category.trim()
    if (difficulty) quiz.difficulty = difficulty
    if (targetAudience !== undefined) quiz.targetAudience = String(targetAudience).trim()
    if (durationMinutes !== undefined) quiz.durationMinutes = Math.max(1, Number(durationMinutes))
    if (passingScore !== undefined) quiz.passingScore = Math.min(100, Math.max(0, Number(passingScore)))
    if (randomizeQuestions !== undefined) quiz.randomizeQuestions = Boolean(randomizeQuestions)
    if (randomizeOptions !== undefined) quiz.randomizeOptions = Boolean(randomizeOptions)
    if (negativeMarking !== undefined) quiz.negativeMarking = Boolean(negativeMarking)
    if (showExplanations !== undefined) quiz.showExplanations = Boolean(showExplanations)
    if (availabilityStart !== undefined) quiz.availabilityStart = availabilityStart ? new Date(availabilityStart) : undefined
    if (availabilityEnd !== undefined) quiz.availabilityEnd = availabilityEnd ? new Date(availabilityEnd) : undefined
    if (maxAttempts !== undefined) quiz.maxAttempts = Math.max(0, Number(maxAttempts) || 0)

    if (slug && slug.trim() && slug.trim() !== quiz.slug) {
      quiz.slug = await generateUniqueSlug(slug, quiz._id)
    }

    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: 'Quiz settings updated successfully.',
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this quiz.' })
    }

    // Preserve historical attempts integrity: check if real attempts exist
    const attemptsCount = await QuizAttempt.countDocuments({ quizSlug: quiz.slug, isRealAttempt: true })
    if (attemptsCount > 0) {
      // Archive rather than permanently purge to prevent corrupting student transcripts
      quiz.status = 'archived'
      quiz.archivedAt = new Date()
      await quiz.save()
      cacheManager.invalidateTag('quizzes')
      return res.json({
        success: true,
        message: 'Quiz has existing student attempts and was safely archived rather than deleted to protect student records.',
        archived: true
      })
    }

    await Quiz.findByIdAndDelete(id)
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: 'Quiz deleted successfully.'
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * PUBLISH QUIZ:
 * Non-negotiable security rule: Unverified faculty must NOT be able to publish quizzes.
 * Handled here via both middleware and explicit backend check.
 */
export const publishQuiz = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You do not have permission to publish this quiz.' })
    }

    // Explicit Verification Security Check:
    const profile = req.facultyProfile || await FacultyProfile.findOne({ userId: req.user._id })
    if (!isAdmin && (!profile || profile.status !== 'verified')) {
      return res.status(403).json({
        success: false,
        code: 'UNVERIFIED_FACULTY',
        message: `Only verified faculty members may publish educational quizzes. Current status: "${profile ? profile.status : 'unverified'}". Please submit verification to publish quizzes to Career Hub.`
      })
    }

    // Validation checks before publishing
    if (!quiz.title || !quiz.title.trim()) {
      return res.status(400).json({ success: false, message: 'Quiz must have a title before publishing.' })
    }
    if (!quiz.category || !quiz.category.trim()) {
      return res.status(400).json({ success: false, message: 'Quiz must have a category before publishing.' })
    }

    const questions = quiz.questionPool || []
    if (questions.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quiz must have at least 1 valid question before publication.'
      })
    }

    // Validate every question
    for (let i = 0; i < questions.length; i++) {
      const errs = validateFacultyQuestion(questions[i], i)
      if (errs.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Validation failed on ${errs.join(' ')}`
        })
      }
    }

    const currentVersion = quiz.version || 1

    // Save immutable snapshot in QuizVersion
    await QuizVersion.findOneAndUpdate(
      { quizId: quiz._id, version: currentVersion },
      {
        quizId: quiz._id,
        quizSlug: quiz.slug,
        version: currentVersion,
        title: quiz.title,
        description: quiz.description,
        instructions: quiz.instructions,
        category: quiz.category,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        passingScore: quiz.passingScore,
        questionPool: quiz.questionPool,
        publishedBy: req.user._id,
        publishedAt: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    )

    quiz.status = 'published'
    quiz.publishedAt = new Date()
    quiz.authorRole = 'faculty'
    quiz.isVerifiedFaculty = true
    if (profile?.institutionName) {
      quiz.institutionName = profile.institutionName
    }
    quiz.questionsCount = Math.min(questions.length, quiz.questionsCount || questions.length)
    await quiz.save()

    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: `Quiz "${quiz.title}" has been successfully published to Career Hub with Verified Faculty badge!`,
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const unpublishQuiz = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    quiz.status = 'draft'
    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: `Quiz "${quiz.title}" has been reverted to draft.`,
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const archiveQuiz = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    quiz.status = 'archived'
    quiz.archivedAt = new Date()
    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: `Quiz "${quiz.title}" is now archived.`,
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const restoreQuiz = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    if (quiz.status !== 'archived') {
      return res.status(400).json({ success: false, message: `Only archived quizzes can be restored. Current status is "${quiz.status}".` })
    }

    quiz.status = 'draft'
    quiz.archivedAt = undefined
    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: `Quiz "${quiz.title}" has been restored to draft.`,
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const duplicateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params
    const sourceQuiz = await Quiz.findById(id).lean()

    if (!sourceQuiz) {
      return res.status(404).json({ success: false, message: 'Source quiz not found.' })
    }

    const isOwner = Boolean(sourceQuiz.author && sourceQuiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    const profile = req.facultyProfile || await FacultyProfile.findOne({ userId: req.user._id }).lean()
    const authorDisplayName = profile
      ? `${profile.professionalTitle || 'Prof.'} ${profile.fullName || req.user.name}`
      : req.user.name

    const baseTitle = `${sourceQuiz.title || 'Educational Quiz'} (Copy)`
    const newSlug = await generateUniqueSlug(baseTitle)

    const clonedQuestions = (sourceQuiz.questionPool || []).map((q, idx) => ({
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${idx}`,
      question: q.question,
      type: q.type || 'multiple_choice',
      code: q.code || '',
      language: q.language || '',
      options: Array.isArray(q.options) ? [...q.options] : [],
      correctIndex: q.correctIndex,
      correctIndices: Array.isArray(q.correctIndices) ? [...q.correctIndices] : [],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      tags: Array.isArray(q.tags) ? [...q.tags] : [],
      difficulty: q.difficulty || sourceQuiz.difficulty || 'Medium',
      marks: q.marks !== undefined ? q.marks : 1,
      negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0,
      order: idx
    }))

    const newQuiz = await Quiz.create({
      slug: newSlug,
      title: baseTitle,
      description: sourceQuiz.description || '',
      instructions: sourceQuiz.instructions || '',
      topic: sourceQuiz.topic,
      category: sourceQuiz.category || 'Development',
      difficulty: sourceQuiz.difficulty || 'Medium',
      targetAudience: sourceQuiz.targetAudience || 'All Students',
      durationMinutes: sourceQuiz.durationMinutes || 15,
      questionsCount: clonedQuestions.length,
      passingScore: sourceQuiz.passingScore || 60,
      randomizeQuestions: Boolean(sourceQuiz.randomizeQuestions),
      randomizeOptions: Boolean(sourceQuiz.randomizeOptions),
      negativeMarking: Boolean(sourceQuiz.negativeMarking),
      showExplanations: Boolean(sourceQuiz.showExplanations),
      questionPool: clonedQuestions,
      status: 'draft',
      version: 1,
      author: req.user._id,
      authorName: authorDisplayName
    })

    cacheManager.invalidateTag('quizzes')

    return res.status(201).json({
      success: true,
      message: `Quiz duplicated successfully as "${newQuiz.title}".`,
      quiz: newQuiz
    })
  } catch (error) {
    return next(error)
  }
}

export const getQuizAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id).lean()

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied to quiz analytics.' })
    }

    const attempts = await QuizAttempt.find({ quizSlug: quiz.slug, isRealAttempt: true })
      .sort({ completedAt: -1 })
      .limit(100)
      .lean()

    const totalAttempts = attempts.length
    const passedAttempts = attempts.filter(a => a.passed).length
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.scorePercentage || 0), 0) / totalAttempts)
      : 0
    const avgTimeSecs = totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.timeTaken || 0), 0) / totalAttempts)
      : 0

    // Score distribution buckets
    const scoreBuckets = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    attempts.forEach(a => {
      const s = a.scorePercentage || 0
      if (s <= 40) scoreBuckets['0-40']++
      else if (s <= 60) scoreBuckets['41-60']++
      else if (s <= 80) scoreBuckets['61-80']++
      else scoreBuckets['81-100']++
    })

    return res.json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        slug: quiz.slug,
        status: quiz.status,
        version: quiz.version || 1,
        passingScore: quiz.passingScore || 60
      },
      stats: {
        totalAttempts,
        passedAttempts,
        passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
        averageScore: avgScore,
        averageTimeMinutes: Math.round(avgTimeSecs / 60 * 10) / 10,
        scoreBuckets
      },
      recentAttempts: attempts.slice(0, 20).map(a => ({
        id: a._id,
        scorePercentage: a.scorePercentage,
        passed: a.passed,
        timeTaken: a.timeTaken,
        completedAt: a.completedAt
      }))
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. QUESTIONS MANAGEMENT WITHIN A QUIZ
// ─────────────────────────────────────────────────────────────────────────────

export const addQuestion = async (req, res, next) => {
  try {
    const { id } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    const questionData = req.body
    const errs = validateFacultyQuestion(questionData, quiz.questionPool.length)
    if (errs.length > 0) {
      return res.status(400).json({ success: false, message: errs.join(' ') })
    }

    const newQuestion = {
      id: questionData.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      question: questionData.question.trim(),
      type: questionData.type || 'multiple_choice',
      code: questionData.code || '',
      language: questionData.language || '',
      options: Array.isArray(questionData.options) ? questionData.options.map(o => String(o).trim()) : [],
      correctIndex: questionData.correctIndex !== undefined ? Number(questionData.correctIndex) : 0,
      correctIndices: Array.isArray(questionData.correctIndices) ? questionData.correctIndices.map(Number) : [],
      correctAnswer: questionData.correctAnswer ? String(questionData.correctAnswer).trim() : '',
      explanation: questionData.explanation || '',
      tags: Array.isArray(questionData.tags) ? questionData.tags : [],
      difficulty: questionData.difficulty || quiz.difficulty || 'Medium',
      marks: questionData.marks !== undefined ? Number(questionData.marks) : 1,
      negativeMarks: questionData.negativeMarks !== undefined ? Number(questionData.negativeMarks) : 0,
      order: quiz.questionPool.length
    }

    quiz.questionPool.push(newQuestion)
    quiz.questionsCount = quiz.questionPool.length

    // If quiz was published, bump version for attempt immutability
    if (quiz.status === 'published') {
      quiz.version = (quiz.version || 1) + 1
    }

    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.status(201).json({
      success: true,
      message: 'Question added successfully.',
      question: newQuestion,
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const updateQuestion = async (req, res, next) => {
  try {
    const { id, questionId } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    const qIndex = quiz.questionPool.findIndex(q => q.id === questionId)
    if (qIndex === -1) {
      return res.status(404).json({ success: false, message: 'Question not found in this quiz.' })
    }

    const patch = req.body
    const merged = { ...quiz.questionPool[qIndex].toObject(), ...patch }
    const errs = validateFacultyQuestion(merged, qIndex)
    if (errs.length > 0) {
      return res.status(400).json({ success: false, message: errs.join(' ') })
    }

    if (patch.question !== undefined) quiz.questionPool[qIndex].question = patch.question.trim()
    if (patch.type !== undefined) quiz.questionPool[qIndex].type = patch.type
    if (patch.code !== undefined) quiz.questionPool[qIndex].code = patch.code
    if (patch.language !== undefined) quiz.questionPool[qIndex].language = patch.language
    if (Array.isArray(patch.options)) quiz.questionPool[qIndex].options = patch.options.map(o => String(o).trim())
    if (patch.correctIndex !== undefined) quiz.questionPool[qIndex].correctIndex = Number(patch.correctIndex)
    if (Array.isArray(patch.correctIndices)) quiz.questionPool[qIndex].correctIndices = patch.correctIndices.map(Number)
    if (patch.correctAnswer !== undefined) quiz.questionPool[qIndex].correctAnswer = String(patch.correctAnswer).trim()
    if (patch.explanation !== undefined) quiz.questionPool[qIndex].explanation = String(patch.explanation).trim()
    if (Array.isArray(patch.tags)) quiz.questionPool[qIndex].tags = patch.tags
    if (patch.difficulty !== undefined) quiz.questionPool[qIndex].difficulty = patch.difficulty
    if (patch.marks !== undefined) quiz.questionPool[qIndex].marks = Number(patch.marks)
    if (patch.negativeMarks !== undefined) quiz.questionPool[qIndex].negativeMarks = Number(patch.negativeMarks)

    if (quiz.status === 'published') {
      quiz.version = (quiz.version || 1) + 1
    }

    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: 'Question updated successfully.',
      question: quiz.questionPool[qIndex],
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const deleteQuestion = async (req, res, next) => {
  try {
    const { id, questionId } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    const initialLen = quiz.questionPool.length
    quiz.questionPool = quiz.questionPool.filter(q => q.id !== questionId)

    if (quiz.questionPool.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Question not found.' })
    }

    quiz.questionPool.forEach((q, idx) => { q.order = idx })
    quiz.questionsCount = quiz.questionPool.length

    if (quiz.status === 'published') {
      quiz.version = (quiz.version || 1) + 1
    }

    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: 'Question removed from quiz.',
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const reorderQuestions = async (req, res, next) => {
  try {
    const { id } = req.params
    const { orderedIds } = req.body

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array required.' })
    }

    const quiz = await Quiz.findById(id)
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    const idMap = new Map()
    quiz.questionPool.forEach(q => idMap.set(q.id, q))

    const reordered = []
    orderedIds.forEach((qId, idx) => {
      const q = idMap.get(qId)
      if (q) {
        q.order = idx
        reordered.push(q)
        idMap.delete(qId)
      }
    })

    // Append any questions not listed in orderedIds
    idMap.forEach(q => {
      q.order = reordered.length
      reordered.push(q)
    })

    quiz.questionPool = reordered
    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: 'Questions reordered successfully.',
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. REUSABLE QUESTION BANK MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const getQuestionBank = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { subject, topic, difficulty, search, page = 1, limit = 30 } = req.query

    const filter = { author: userId }
    if (subject && subject !== 'all') {
      filter.subject = subject
    }
    if (topic && topic !== 'all') {
      filter.topic = topic
    }
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty
    }
    if (search && search.trim()) {
      filter.$or = [
        { question: { $regex: search.trim(), $options: 'i' } },
        { topic: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } }
      ]
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit)
    const [total, questions] = await Promise.all([
      FacultyQuestion.countDocuments(filter),
      FacultyQuestion.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()
    ])

    return res.json({
      success: true,
      questions,
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

export const createQuestionBankItem = async (req, res, next) => {
  try {
    const userId = req.user._id
    const q = req.body

    const errs = validateFacultyQuestion(q, 0)
    if (errs.length > 0) {
      return res.status(400).json({ success: false, message: errs.join(' ') })
    }

    if (!q.subject || !q.subject.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required for Question Bank items.' })
    }
    if (!q.topic || !q.topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic is required for Question Bank items.' })
    }

    const question = await FacultyQuestion.create({
      author: userId,
      question: q.question.trim(),
      type: q.type || 'multiple_choice',
      code: q.code || '',
      language: q.language || '',
      options: Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [],
      correctIndex: q.correctIndex !== undefined ? Number(q.correctIndex) : 0,
      correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices.map(Number) : [],
      correctAnswer: q.correctAnswer ? String(q.correctAnswer).trim() : '',
      explanation: q.explanation ? String(q.explanation).trim() : '',
      subject: q.subject.trim(),
      topic: q.topic.trim(),
      difficulty: q.difficulty || 'Medium',
      tags: Array.isArray(q.tags) ? q.tags.map(t => String(t).trim()) : [],
      marks: q.marks !== undefined ? Number(q.marks) : 1,
      negativeMarks: q.negativeMarks !== undefined ? Number(q.negativeMarks) : 0
    })

    return res.status(201).json({
      success: true,
      message: 'Question added to Question Bank.',
      question
    })
  } catch (error) {
    return next(error)
  }
}

export const updateQuestionBankItem = async (req, res, next) => {
  try {
    const { id } = req.params
    const question = await FacultyQuestion.findById(id)

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found in Question Bank.' })
    }

    const isOwner = question.author.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    const patch = req.body
    const merged = { ...question.toObject(), ...patch }
    const errs = validateFacultyQuestion(merged, 0)
    if (errs.length > 0) {
      return res.status(400).json({ success: false, message: errs.join(' ') })
    }

    if (patch.question !== undefined) question.question = patch.question.trim()
    if (patch.type !== undefined) question.type = patch.type
    if (patch.code !== undefined) question.code = patch.code
    if (patch.language !== undefined) question.language = patch.language
    if (Array.isArray(patch.options)) question.options = patch.options.map(o => String(o).trim())
    if (patch.correctIndex !== undefined) question.correctIndex = Number(patch.correctIndex)
    if (Array.isArray(patch.correctIndices)) question.correctIndices = patch.correctIndices.map(Number)
    if (patch.correctAnswer !== undefined) question.correctAnswer = String(patch.correctAnswer).trim()
    if (patch.explanation !== undefined) question.explanation = String(patch.explanation).trim()
    if (patch.subject !== undefined) question.subject = patch.subject.trim()
    if (patch.topic !== undefined) question.topic = patch.topic.trim()
    if (patch.difficulty !== undefined) question.difficulty = patch.difficulty
    if (Array.isArray(patch.tags)) question.tags = patch.tags
    if (patch.marks !== undefined) question.marks = Number(patch.marks)
    if (patch.negativeMarks !== undefined) question.negativeMarks = Number(patch.negativeMarks)

    await question.save()

    return res.json({
      success: true,
      message: 'Question Bank item updated.',
      question
    })
  } catch (error) {
    return next(error)
  }
}

export const deleteQuestionBankItem = async (req, res, next) => {
  try {
    const { id } = req.params
    const question = await FacultyQuestion.findById(id)

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' })
    }

    const isOwner = question.author.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    await FacultyQuestion.findByIdAndDelete(id)

    return res.json({
      success: true,
      message: 'Question removed from Question Bank.'
    })
  } catch (error) {
    return next(error)
  }
}

export const importQuestionsFromBank = async (req, res, next) => {
  try {
    const { id } = req.params
    const { questionBankIds } = req.body

    if (!Array.isArray(questionBankIds) || questionBankIds.length === 0) {
      return res.status(400).json({ success: false, message: 'questionBankIds array required.' })
    }

    const quiz = await Quiz.findById(id)
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied.' })
    }

    const bankQuestions = await FacultyQuestion.find({
      _id: { $in: questionBankIds },
      author: req.user._id
    }).lean()

    // Deduplication check: check existing statements
    const existingStatements = new Set(quiz.questionPool.map(q => q.question.trim().toLowerCase()))
    let addedCount = 0

    for (const bq of bankQuestions) {
      if (!existingStatements.has(bq.question.trim().toLowerCase())) {
        quiz.questionPool.push({
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          question: bq.question,
          type: bq.type,
          code: bq.code || '',
          language: bq.language || '',
          options: bq.options || [],
          correctIndex: bq.correctIndex,
          correctIndices: bq.correctIndices,
          correctAnswer: bq.correctAnswer,
          explanation: bq.explanation,
          tags: bq.tags,
          difficulty: bq.difficulty,
          marks: bq.marks,
          negativeMarks: bq.negativeMarks,
          order: quiz.questionPool.length
        })
        existingStatements.add(bq.question.trim().toLowerCase())
        addedCount++
      }
    }

    quiz.questionsCount = quiz.questionPool.length
    if (quiz.status === 'published') {
      quiz.version = (quiz.version || 1) + 1
    }

    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    // Increment usageCount in question bank
    await FacultyQuestion.updateMany(
      { _id: { $in: questionBankIds } },
      { $inc: { usageCount: 1 } }
    )

    return res.json({
      success: true,
      message: `Successfully imported ${addedCount} questions without duplication.`,
      addedCount,
      quiz
    })
  } catch (error) {
    return next(error)
  }
}
