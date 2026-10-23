import mongoose from 'mongoose'
import { Quiz, QuizAttempt, QuizVersion } from '../models/Quiz.js'
import DeveloperProfile from '../models/DeveloperProfile.js'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import cacheManager from '../utils/cacheManager.js'

/**
 * Helper to slugify a string safely
 */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Helper to ensure a unique slug for a quiz
 */
async function generateUniqueSlug(baseText, excludeQuizId = null) {
  let base = slugify(baseText) || 'tech-quiz'
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
 * Validate a question payload
 */
export function validateQuestion(q, index = 0) {
  const errors = []
  const prefix = `Question #${index + 1}`

  if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
    errors.push(`${prefix}: Question text is required.`)
  }

  const type = q.type || 'multiple_choice'
  const validTypes = ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'code']
  if (!validTypes.includes(type)) {
    errors.push(`${prefix}: Invalid question type "${type}".`)
  }

  if (type === 'multiple_choice') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`${prefix}: Single-choice question must have at least 2 options.`)
    } else {
      const emptyOpt = q.options.some(opt => typeof opt !== 'string' || !opt.trim())
      if (emptyOpt) errors.push(`${prefix}: All options must have text.`)
      const idx = Number(q.correctIndex)
      if (isNaN(idx) || idx < 0 || idx >= q.options.length) {
        errors.push(`${prefix}: Please select a valid correct option.`)
      }
    }
  } else if (type === 'multiple_select') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`${prefix}: Multi-select question must have at least 2 options.`)
    } else {
      const indices = Array.isArray(q.correctIndices) ? q.correctIndices : []
      if (indices.length === 0) {
        errors.push(`${prefix}: Multi-select question must have at least 1 correct option selected.`)
      } else {
        const outOfBounds = indices.some(i => i < 0 || i >= q.options.length)
        if (outOfBounds) errors.push(`${prefix}: Selected correct option index is out of bounds.`)
      }
    }
  } else if (type === 'true_false') {
    const idx = Number(q.correctIndex)
    if (idx !== 0 && idx !== 1) {
      errors.push(`${prefix}: True/False question must have a valid answer (True or False).`)
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
// 1. DEVELOPER ONBOARDING & PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const getDeveloperProfile = async (req, res, next) => {
  try {
    const userId = req.user._id
    let profile = await DeveloperProfile.findOne({ userId }).lean()

    return res.json({
      success: true,
      userRole: req.user.role,
      developerStatus: req.user.developerStatus || (profile ? profile.status : 'none'),
      profile: profile || null
    })
  } catch (error) {
    return next(error)
  }
}

export const applyForDeveloper = async (req, res, next) => {
  try {
    const userId = req.user._id
    const {
      displayName,
      bio = '',
      title = 'Developer',
      technicalExpertise = [],
      githubUrl = '',
      linkedinUrl = '',
      portfolioUrl = '',
      applicationReason = ''
    } = req.body

    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ success: false, message: 'Display name is required.' })
    }

    let profile = await DeveloperProfile.findOne({ userId })

    if (!profile) {
      profile = new DeveloperProfile({
        userId,
        displayName: displayName.trim(),
        email: req.user.email,
        bio: bio.trim(),
        title: title.trim(),
        technicalExpertise: Array.isArray(technicalExpertise) ? technicalExpertise : [],
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        applicationReason: applicationReason.trim(),
        status: req.user.role === 'admin' ? 'active' : 'pending'
      })
    } else {
      profile.displayName = displayName.trim()
      profile.bio = bio.trim()
      profile.title = title.trim()
      profile.technicalExpertise = Array.isArray(technicalExpertise) ? technicalExpertise : []
      profile.githubUrl = githubUrl.trim()
      profile.linkedinUrl = linkedinUrl.trim()
      profile.portfolioUrl = portfolioUrl.trim()
      profile.applicationReason = applicationReason.trim()
      if (profile.status === 'revoked' || profile.status === 'suspended') {
        profile.status = 'pending'
      }
    }

    await profile.save()

    // Update user record
    await User.findByIdAndUpdate(userId, {
      developerStatus: profile.status,
      ...(profile.status === 'active' && req.user.role === 'user' ? { role: 'developer' } : {})
    })

    return res.status(201).json({
      success: true,
      message: profile.status === 'active'
        ? 'Developer profile activated.'
        : 'Developer application submitted successfully and is pending review.',
      profile
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEVELOPER DASHBOARD OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboardOverview = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const authorFilter = isAdmin ? {} : { author: req.user._id }

    // Quiz counts
    const [totalQuizzes, publishedQuizzes, draftQuizzes, archivedQuizzes] = await Promise.all([
      Quiz.countDocuments(authorFilter),
      Quiz.countDocuments({ ...authorFilter, status: 'published' }),
      Quiz.countDocuments({ ...authorFilter, status: 'draft' }),
      Quiz.countDocuments({ ...authorFilter, status: 'archived' })
    ])

    // Get quizzes to compute questions count & attempt metrics
    const developerQuizzes = await Quiz.find(authorFilter)
      .select('_id slug title status category difficulty questionsCount questionPool updatedAt')
      .lean()

    const developerQuizIds = developerQuizzes.map(q => q._id)
    const developerQuizSlugs = developerQuizzes.map(q => q.slug)

    let totalQuestions = 0
    developerQuizzes.forEach(q => {
      totalQuestions += (q.questionPool && q.questionPool.length) || 0
    })

    // Attempts on these quizzes
    const attemptsQuery = {
      $or: [
        { quizId: { $in: developerQuizIds } },
        { quizSlug: { $in: developerQuizSlugs } }
      ],
      isRealAttempt: true
    }

    const totalAttempts = await QuizAttempt.countDocuments(attemptsQuery)

    // Aggregate average score & pass rate
    const scoreAgg = await QuizAttempt.aggregate([
      { $match: attemptsQuery },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$scorePercentage' },
          passedCount: {
            $sum: { $cond: [{ $gte: ['$scorePercentage', 60] }, 1, 0] }
          }
        }
      }
    ])

    const avgScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore || 0) : 0
    const passRate = (scoreAgg.length > 0 && totalAttempts > 0)
      ? Math.round((scoreAgg[0].passedCount / totalAttempts) * 100)
      : 0

    // Recent attempts on developer's quizzes
    const recentAttempts = await QuizAttempt.find(attemptsQuery)
      .sort({ completedAt: -1 })
      .limit(8)
      .select('quizSlug scorePercentage correctCount totalQuestions timeTaken completedAt')
      .lean()

    // Recent quizzes edited
    const recentQuizzes = await Quiz.find(authorFilter)
      .sort({ updatedAt: -1 })
      .limit(6)
      .select('slug title category difficulty status durationMinutes questionsCount questionPool updatedAt')
      .lean()

    const formattedRecentQuizzes = recentQuizzes.map(q => ({
      _id: q._id,
      slug: q.slug,
      title: q.title,
      category: q.category,
      difficulty: q.difficulty,
      status: q.status || 'published',
      durationMinutes: q.durationMinutes,
      questionsCount: (q.questionPool && q.questionPool.length) || 0,
      updatedAt: q.updatedAt
    }))

    // Quizzes needing attention (e.g. draft with < 3 questions)
    const needingAttention = developerQuizzes.filter(q => {
      const qCount = (q.questionPool && q.questionPool.length) || 0
      return q.status === 'draft' && qCount < 3
    }).slice(0, 5)

    return res.json({
      success: true,
      stats: {
        totalQuizzes,
        publishedQuizzes,
        draftQuizzes,
        archivedQuizzes,
        totalQuestions,
        totalAttempts,
        avgScore,
        passRate
      },
      recentQuizzes: formattedRecentQuizzes,
      recentAttempts,
      needingAttention
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. QUIZ CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getDeveloperQuizzes = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const { status, category, difficulty, search, page = 1, limit = 20 } = req.query

    const filter = isAdmin ? {} : { author: req.user._id }

    if (status && status !== 'all') {
      filter.status = status
    }
    if (category && category !== 'All') {
      filter.category = { $regex: category, $options: 'i' }
    }
    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { topic: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } }
      ]
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit)
    const [total, quizzes] = await Promise.all([
      Quiz.countDocuments(filter),
      Quiz.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('slug title description category topic difficulty status durationMinutes questionsCount passingScore questionPool author authorName version publishedAt updatedAt')
        .lean()
    ])

    // Attach question count and attempt count
    const quizSlugs = quizzes.map(q => q.slug)
    const attemptCounts = await QuizAttempt.aggregate([
      { $match: { quizSlug: { $in: quizSlugs }, isRealAttempt: true } },
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
      status: q.status || 'published',
      durationMinutes: q.durationMinutes,
      questionsCount: (q.questionPool && q.questionPool.length) || 0,
      passingScore: q.passingScore || 60,
      version: q.version || 1,
      authorName: q.authorName || 'Developer',
      isOwner: Boolean(q.author && q.author.toString() === req.user._id.toString()),
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
    const {
      title,
      slug,
      description = '',
      instructions = '',
      topic,
      category = 'Development',
      technicalDomain = 'Software Engineering',
      technologies = [],
      difficulty = 'Medium',
      durationMinutes = 15,
      passingScore = 60,
      randomizeQuestions = false,
      randomizeOptions = false,
      negativeMarking = false,
      showExplanations = true,
      coverTopics = [],
      iconType = 'code',
      accentColor = '#D96B43',
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
        const errs = validateQuestion(q, i)
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
          difficulty: q.difficulty || difficulty || 'Medium',
          marks: Number(q.marks) || 1,
          negativeMarks: Number(q.negativeMarks) || 0,
          order: i
        })
      }
    }

    const quiz = await Quiz.create({
      slug: finalSlug,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      topic: cleanTopic,
      category: category.trim(),
      technicalDomain: technicalDomain.trim(),
      technologies: Array.isArray(technologies) ? technologies : [],
      difficulty,
      durationMinutes: Math.max(1, Number(durationMinutes) || 15),
      questionsCount: validatedQuestions.length || 5,
      passingScore: Math.min(100, Math.max(0, Number(passingScore) || 60)),
      randomizeQuestions: Boolean(randomizeQuestions),
      randomizeOptions: Boolean(randomizeOptions),
      negativeMarking: Boolean(negativeMarking),
      showExplanations: Boolean(showExplanations),
      coverTopics: Array.isArray(coverTopics) ? coverTopics : [],
      iconType,
      accentColor,
      questionPool: validatedQuestions,
      status: 'draft',
      author: req.user._id,
      authorName: req.developerProfile?.displayName || req.user.name || 'Developer',
      version: 1
    })

    cacheManager.invalidateTag('quizzes')

    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully as draft.',
      quiz
    })
  } catch (error) {
    return next(error)
  }
}

export const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params
    let quiz = null

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      quiz = await Quiz.findById(id).lean()
    }
    if (!quiz) {
      quiz = await Quiz.findOne({ slug: id }).lean()
    }
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    // Ownership check for developer view
    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view or edit this quiz in the Developer Portal.'
      })
    }

    const safeQuiz = {
      ...quiz,
      questions: quiz.questionPool || []
    }

    return res.json({
      success: true,
      quiz: safeQuiz
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
      technicalDomain,
      technologies,
      difficulty,
      durationMinutes,
      passingScore,
      randomizeQuestions,
      randomizeOptions,
      negativeMarking,
      showExplanations,
      coverTopics,
      iconType,
      accentColor
    } = req.body

    if (title && title.trim()) quiz.title = title.trim()
    if (description !== undefined) quiz.description = String(description).trim()
    if (instructions !== undefined) quiz.instructions = String(instructions).trim()
    if (topic && topic.trim()) quiz.topic = topic.trim()
    if (category && category.trim()) quiz.category = category.trim()
    if (technicalDomain !== undefined) quiz.technicalDomain = String(technicalDomain).trim()
    if (Array.isArray(technologies)) quiz.technologies = technologies
    if (difficulty) quiz.difficulty = difficulty
    if (durationMinutes !== undefined) quiz.durationMinutes = Math.max(1, Number(durationMinutes))
    if (passingScore !== undefined) quiz.passingScore = Math.min(100, Math.max(0, Number(passingScore)))
    if (randomizeQuestions !== undefined) quiz.randomizeQuestions = Boolean(randomizeQuestions)
    if (randomizeOptions !== undefined) quiz.randomizeOptions = Boolean(randomizeOptions)
    if (negativeMarking !== undefined) quiz.negativeMarking = Boolean(negativeMarking)
    if (showExplanations !== undefined) quiz.showExplanations = Boolean(showExplanations)
    if (Array.isArray(coverTopics)) quiz.coverTopics = coverTopics
    if (iconType) quiz.iconType = iconType
    if (accentColor) quiz.accentColor = accentColor

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

    // 1. Validation checks
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

    // Validate every question thoroughly
    for (let i = 0; i < questions.length; i++) {
      const errs = validateQuestion(questions[i], i)
      if (errs.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Validation failed: ${errs.join(' ')}`
        })
      }
    }

    const currentVersion = quiz.version || 1

    // 2. Create immutable snapshot in QuizVersion
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

    // 3. Mark quiz as published
    quiz.status = 'published'
    quiz.publishedAt = new Date()
    quiz.questionsCount = Math.min(questions.length, quiz.questionsCount || questions.length)
    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: `Quiz "${quiz.title}" has been successfully published to the Career Hub!`,
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
      return res.status(403).json({ success: false, message: 'You do not have permission to archive this quiz.' })
    }

    quiz.status = 'archived'
    quiz.archivedAt = new Date()
    await quiz.save()
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: `Quiz "${quiz.title}" has been archived and removed from the public Career Hub.`,
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
      return res.status(403).json({ success: false, message: 'You do not have permission to restore this quiz.' })
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
      return res.status(403).json({ success: false, message: 'You do not have permission to duplicate this quiz.' })
    }

    const authorDisplayName = req.developerProfile?.displayName || req.user.name || 'Developer'
    const baseTitle = `${sourceQuiz.title || 'Technical Assessment'} (Copy)`
    const newSlug = await generateUniqueSlug(baseTitle)

    const clonedQuestions = (sourceQuiz.questionPool || []).map((q, idx) => ({
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${idx}`,
      question: q.question,
      type: q.type || 'multiple_choice',
      code: q.code || '',
      language: q.language || '',
      options: Array.isArray(q.options) ? [...q.options] : [],
      correctIndex: q.correctIndex !== undefined ? Number(q.correctIndex) : 0,
      correctIndices: Array.isArray(q.correctIndices) ? [...q.correctIndices] : [],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      tags: Array.isArray(q.tags) ? [...q.tags] : [],
      difficulty: q.difficulty || sourceQuiz.difficulty || 'Medium',
      marks: q.marks !== undefined ? Number(q.marks) : 1,
      negativeMarks: q.negativeMarks !== undefined ? Number(q.negativeMarks) : 0,
      order: idx
    }))

    const newQuiz = await Quiz.create({
      slug: newSlug,
      title: baseTitle,
      description: sourceQuiz.description || '',
      instructions: sourceQuiz.instructions || '',
      topic: sourceQuiz.topic,
      category: sourceQuiz.category || 'Development',
      technicalDomain: sourceQuiz.technicalDomain || 'Software Engineering',
      technologies: Array.isArray(sourceQuiz.technologies) ? [...sourceQuiz.technologies] : [],
      difficulty: sourceQuiz.difficulty || 'Medium',
      durationMinutes: sourceQuiz.durationMinutes || 15,
      questionsCount: clonedQuestions.length,
      passingScore: sourceQuiz.passingScore || 60,
      randomizeQuestions: Boolean(sourceQuiz.randomizeQuestions),
      randomizeOptions: Boolean(sourceQuiz.randomizeOptions),
      negativeMarking: Boolean(sourceQuiz.negativeMarking),
      showExplanations: Boolean(sourceQuiz.showExplanations),
      coverTopics: Array.isArray(sourceQuiz.coverTopics) ? [...sourceQuiz.coverTopics] : [],
      iconType: sourceQuiz.iconType || 'code',
      accentColor: sourceQuiz.accentColor || '#D96B43',
      questionPool: clonedQuestions,
      status: 'draft',
      author: req.user._id,
      authorName: authorDisplayName,
      version: 1
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

    // Check if real user attempts exist
    const attemptCount = await QuizAttempt.countDocuments({
      $or: [{ quizId: quiz._id }, { quizSlug: quiz.slug }],
      isRealAttempt: true
    })

    if (attemptCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete quiz because it has ${attemptCount} user attempts. You can Archive it instead to preserve user records and analytics.`
      })
    }

    await Quiz.findByIdAndDelete(id)
    cacheManager.invalidateTag('quizzes')

    return res.json({
      success: true,
      message: 'Draft quiz deleted successfully.'
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. QUESTION MANAGEMENT (BUILDER)
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
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const q = req.body
    const errs = validateQuestion(q, (quiz.questionPool || []).length)
    if (errs.length > 0) {
      return res.status(400).json({ success: false, message: errs.join(' ') })
    }

    const newQuestion = {
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
      difficulty: q.difficulty || quiz.difficulty || 'Medium',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negativeMarks) || 0,
      order: (quiz.questionPool || []).length
    }

    quiz.questionPool.push(newQuestion)
    quiz.questionsCount = quiz.questionPool.length
    await quiz.save()

    return res.status(201).json({
      success: true,
      message: 'Question added successfully.',
      question: newQuestion,
      totalQuestions: quiz.questionPool.length
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
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const index = quiz.questionPool.findIndex(q => q.id === questionId)
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Question not found in this quiz.' })
    }

    const updateData = req.body
    const errs = validateQuestion({ ...quiz.questionPool[index].toObject(), ...updateData }, index)
    if (errs.length > 0) {
      return res.status(400).json({ success: false, message: errs.join(' ') })
    }

    const target = quiz.questionPool[index]
    if (updateData.question !== undefined) target.question = updateData.question.trim()
    if (updateData.type !== undefined) target.type = updateData.type
    if (updateData.code !== undefined) target.code = updateData.code
    if (updateData.language !== undefined) target.language = updateData.language
    if (Array.isArray(updateData.options)) target.options = updateData.options.map(o => String(o).trim())
    if (updateData.correctIndex !== undefined) target.correctIndex = Number(updateData.correctIndex)
    if (Array.isArray(updateData.correctIndices)) target.correctIndices = updateData.correctIndices.map(Number)
    if (updateData.correctAnswer !== undefined) target.correctAnswer = String(updateData.correctAnswer).trim()
    if (updateData.explanation !== undefined) target.explanation = updateData.explanation
    if (Array.isArray(updateData.tags)) target.tags = updateData.tags
    if (updateData.difficulty !== undefined) target.difficulty = updateData.difficulty
    if (updateData.marks !== undefined) target.marks = Number(updateData.marks)
    if (updateData.negativeMarks !== undefined) target.negativeMarks = Number(updateData.negativeMarks)

    await quiz.save()

    return res.json({
      success: true,
      message: 'Question updated successfully.',
      question: target
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
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const initialLen = quiz.questionPool.length
    quiz.questionPool = quiz.questionPool.filter(q => q.id !== questionId)

    if (quiz.questionPool.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Question not found.' })
    }

    // Re-index order
    quiz.questionPool.forEach((q, i) => { q.order = i })
    quiz.questionsCount = quiz.questionPool.length
    await quiz.save()

    return res.json({
      success: true,
      message: 'Question deleted successfully.',
      totalQuestions: quiz.questionPool.length
    })
  } catch (error) {
    return next(error)
  }
}

export const reorderQuestions = async (req, res, next) => {
  try {
    const { id } = req.params
    const { questionIds } = req.body

    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'questionIds array is required.' })
    }

    const quiz = await Quiz.findById(id)
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const map = new Map()
    quiz.questionPool.forEach(q => map.set(q.id, q))

    const reordered = []
    questionIds.forEach((qId, idx) => {
      if (map.has(qId)) {
        const q = map.get(qId)
        q.order = idx
        reordered.push(q)
        map.delete(qId)
      }
    })

    // Append any questions not listed in array
    map.forEach(remaining => {
      remaining.order = reordered.length
      reordered.push(remaining)
    })

    quiz.questionPool = reordered
    await quiz.save()

    return res.json({
      success: true,
      message: 'Questions reordered successfully.',
      questions: quiz.questionPool
    })
  } catch (error) {
    return next(error)
  }
}

export const duplicateQuestion = async (req, res, next) => {
  try {
    const { id, questionId } = req.params
    const quiz = await Quiz.findById(id)

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const original = quiz.questionPool.find(q => q.id === questionId)
    if (!original) {
      return res.status(404).json({ success: false, message: 'Question not found to duplicate.' })
    }

    const copy = {
      ...original.toObject(),
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      question: `${original.question} (Copy)`,
      order: quiz.questionPool.length
    }

    quiz.questionPool.push(copy)
    quiz.questionsCount = quiz.questionPool.length
    await quiz.save()

    return res.status(201).json({
      success: true,
      message: 'Question duplicated successfully.',
      question: copy,
      totalQuestions: quiz.questionPool.length
    })
  } catch (error) {
    return next(error)
  }
}

export const importQuestions = async (req, res, next) => {
  try {
    const { id } = req.params
    const { questions } = req.body

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Payload must contain a non-empty array of questions.' })
    }

    const quiz = await Quiz.findById(id)
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const isOwner = Boolean(quiz.author && quiz.author.toString() === req.user._id.toString())
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const errors = []
    const validated = []
    const startOrder = quiz.questionPool.length

    questions.forEach((q, idx) => {
      const qErrors = validateQuestion(q, idx)
      if (qErrors.length > 0) {
        errors.push(...qErrors)
      } else {
        validated.push({
          id: q.id || `q_imp_${Date.now()}_${idx}`,
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
          difficulty: q.difficulty || quiz.difficulty || 'Medium',
          marks: Number(q.marks) || 1,
          negativeMarks: Number(q.negativeMarks) || 0,
          order: startOrder + idx
        })
      }
    })

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Import validation failed for ${errors.length} items.`,
        errors
      })
    }

    quiz.questionPool.push(...validated)
    quiz.questionsCount = quiz.questionPool.length
    await quiz.save()

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${validated.length} questions.`,
      importedCount: validated.length,
      totalQuestions: quiz.questionPool.length
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. QUESTION BANK (GLOBAL SEARCH ACROSS DEVELOPER QUIZZES)
// ─────────────────────────────────────────────────────────────────────────────

export const getQuestionsBank = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const authorFilter = isAdmin ? {} : { author: req.user._id }
    const { search, type, difficulty, category } = req.query

    const quizzes = await Quiz.find(authorFilter)
      .select('_id title category slug questionPool')
      .lean()

    let allQuestions = []
    quizzes.forEach(q => {
      if (category && category !== 'All' && !q.category?.toLowerCase().includes(category.toLowerCase())) {
        return
      }
      (q.questionPool || []).forEach(question => {
        allQuestions.push({
          ...question,
          quizId: q._id,
          quizTitle: q.title,
          quizSlug: q.slug,
          quizCategory: q.category
        })
      })
    })

    if (type && type !== 'all') {
      allQuestions = allQuestions.filter(q => q.type === type)
    }
    if (difficulty && difficulty !== 'All') {
      allQuestions = allQuestions.filter(q => q.difficulty === difficulty)
    }
    if (search && search.trim()) {
      const qSearch = search.trim().toLowerCase()
      allQuestions = allQuestions.filter(q =>
        q.question?.toLowerCase().includes(qSearch) ||
        (q.tags && q.tags.some(t => t.toLowerCase().includes(qSearch))) ||
        q.quizTitle?.toLowerCase().includes(qSearch)
      )
    }

    return res.json({
      success: true,
      total: allQuestions.length,
      questions: allQuestions.slice(0, 100)
    })
  } catch (error) {
    return next(error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DETAILED QUIZ ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

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
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    const matchQuery = {
      $or: [{ quizId: quiz._id }, { quizSlug: quiz.slug }],
      isRealAttempt: true
    }

    const attempts = await QuizAttempt.find(matchQuery).sort({ completedAt: -1 }).lean()

    const totalAttempts = attempts.length
    const uniqueUserIds = new Set(attempts.map(a => String(a.userId))).size

    const passingScore = quiz.passingScore || 60
    const passedAttempts = attempts.filter(a => a.scorePercentage >= passingScore).length
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.scorePercentage, 0) / totalAttempts)
      : 0
    const avgTimeTaken = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / totalAttempts)
      : 0

    // Score distribution buckets: [0-20, 21-40, 41-60, 61-80, 81-100]
    const scoreBuckets = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 }
    ]

    attempts.forEach(a => {
      const s = a.scorePercentage
      if (s <= 20) scoreBuckets[0].count++
      else if (s <= 40) scoreBuckets[1].count++
      else if (s <= 60) scoreBuckets[2].count++
      else if (s <= 80) scoreBuckets[3].count++
      else scoreBuckets[4].count++
    })

    // Question-level accuracy breakdown
    const qStatMap = {}
    ;(quiz.questionPool || []).forEach(q => {
      qStatMap[q.id] = {
        id: q.id,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        totalAnswered: 0,
        correctCount: 0,
        incorrectCount: 0
      }
    })

    attempts.forEach(attempt => {
      (attempt.answers || []).forEach(ans => {
        if (qStatMap[ans.questionId]) {
          qStatMap[ans.questionId].totalAnswered++
          if (ans.isCorrect) {
            qStatMap[ans.questionId].correctCount++
          } else {
            qStatMap[ans.questionId].incorrectCount++
          }
        }
      })
    })

    const questionPerformance = Object.values(qStatMap).map(item => ({
      ...item,
      accuracyPct: item.totalAnswered > 0
        ? Math.round((item.correctCount / item.totalAnswered) * 100)
        : 100
    }))

    return res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        slug: quiz.slug,
        status: quiz.status,
        passingScore,
        questionsCount: (quiz.questionPool && quiz.questionPool.length) || 0
      },
      analytics: {
        totalAttempts,
        uniqueParticipants: uniqueUserIds,
        avgScore,
        passRate,
        avgTimeTakenSeconds: avgTimeTaken,
        scoreDistribution: scoreBuckets,
        questionPerformance,
        recentAttempts: attempts.slice(0, 15).map(a => ({
          _id: a._id,
          scorePercentage: a.scorePercentage,
          correctCount: a.correctCount,
          totalQuestions: a.totalQuestions,
          timeTaken: a.timeTaken,
          completedAt: a.completedAt
        }))
      }
    })
  } catch (error) {
    return next(error)
  }
}
