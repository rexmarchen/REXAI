import { TutorSession } from '../models/TutorSession.js'
import { TutorQuiz, TutorQuizAttempt, TopicMastery } from '../models/TutorQuiz.js'
import {
  getTutorReply,
  generatePracticeQuiz,
  gradeQuizSubmission
} from '../services/aiTutorService.js'

// POST /api/tutor/chat
// Supports both Server-Sent Events (SSE) streaming and standard JSON
export async function chatWithTutor(req, res) {
  try {
    const {
      mode = 'ask',
      level = 'beginner',
      path: careerPath = 'AI Engineer',
      sessionId: existingSessionId,
      stream = false
    } = req.body

    const rawMessage = req.body.message || (Array.isArray(req.body.messages) ? req.body.messages[req.body.messages.length - 1]?.content : '')
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : ''

    const userId = req.user?._id || req.user?.id || 'guest_user'

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' })
    }

    // Reuse or create TutorSession
    let session = null
    if (existingSessionId) {
      try {
        session = await TutorSession.findOne({ _id: existingSessionId, userId })
      } catch (e) {}
    }

    if (!session) {
      session = await TutorSession.create({
        userId: String(userId),
        title: message.slice(0, 50) || 'New Conversation',
        mode,
        level,
        careerPath,
        messages: []
      })
    }

    // Add user message to history
    session.messages.push({
      role: 'user',
      content: message.trim(),
      createdAt: new Date()
    })

    const history = session.messages.slice(-10)

    // Generate tutor reply
    const { cleanText, followups } = await getTutorReply({
      message: message.trim(),
      mode,
      level,
      careerPath,
      history
    })

    // Save assistant message to session
    session.messages.push({
      role: 'assistant',
      content: cleanText,
      followups,
      createdAt: new Date()
    })
    session.updatedAt = new Date()
    await session.save()

    const lastMsg = session.messages[session.messages.length - 1]

    // If client requested Server-Sent Events (SSE) streaming:
    if (stream || req.headers.accept?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')

      res.write(`data: ${JSON.stringify({ type: 'session', id: session._id })}\n\n`)

      // Stream text in small chunks for natural reading experience
      const words = cleanText.split(' ')
      let chunk = ''
      for (let i = 0; i < words.length; i++) {
        chunk += (i > 0 ? ' ' : '') + words[i]
        if (chunk.length > 25 || i === words.length - 1) {
          res.write(`data: ${JSON.stringify({ type: 'text', t: chunk })}\n\n`)
          chunk = ''
          await new Promise(r => setTimeout(r, 15))
        }
      }

      if (followups && followups.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'followups', items: followups })}\n\n`)
      }
      res.write(`data: ${JSON.stringify({ type: 'done', messageId: lastMsg._id })}\n\n`)
      return res.end()
    }

    // Standard JSON response
    return res.json({
      success: true,
      sessionId: session._id,
      messageId: lastMsg._id,
      role: 'assistant',
      content: cleanText,
      cleanText: cleanText,
      followups,
      createdAt: lastMsg.createdAt
    })
  } catch (err) {
    console.error('[TutorController] chat error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

// GET /api/tutor/sessions
export async function getSessions(req, res) {
  try {
    const userId = String(req.user?._id || req.user?.id || 'guest_user')
    const sessions = await TutorSession.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('_id title mode level careerPath updatedAt createdAt messages')

    const formatted = sessions.map(s => ({
      id: s._id,
      title: s.title,
      mode: s.mode,
      level: s.level,
      messageCount: s.messages?.length || 0,
      updatedAt: s.updatedAt,
      time: new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))

    res.json({ success: true, sessions: formatted })
  } catch (err) {
    console.error('[TutorController] getSessions error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /api/tutor/sessions/:sessionId
export async function getSession(req, res) {
  try {
    const { sessionId } = req.params
    const session = await TutorSession.findById(sessionId)
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        mode: session.mode,
        level: session.level,
        careerPath: session.careerPath,
        messages: session.messages.map(m => ({
          id: m._id,
          role: m.role,
          content: m.content,
          followups: m.followups,
          rating: m.rating,
          createdAt: m.createdAt,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      }
    })
  } catch (err) {
    console.error('[TutorController] getSession error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/tutor/quiz
// Generates a practice quiz on any topic
export async function createQuiz(req, res) {
  try {
    const { topic = 'Python', difficulty = 'medium', count = 3 } = req.body
    const userId = String(req.user?._id || req.user?.id || 'guest_user')

    const rawQuestions = await generatePracticeQuiz({ topic, difficulty, count })

    const quiz = await TutorQuiz.create({
      userId,
      topic,
      difficulty,
      questions: rawQuestions
    })

    // Never leak correctIndex or rubric to the client before submission
    const safeQuestions = rawQuestions.map(q => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options || []
    }))

    res.json({
      success: true,
      quizId: quiz._id,
      quiz: {
        id: quiz._id,
        topic,
        difficulty,
        questions: safeQuestions
      },
      topic,
      difficulty,
      questions: safeQuestions
    })
  } catch (err) {
    console.error('[TutorController] createQuiz error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/tutor/quiz/:id/submit
// Grades quiz, updates TopicMastery for Skill Graph, and returns feedback
export async function submitQuiz(req, res) {
  try {
    const { id } = req.params
    const { answers = [] } = req.body
    const userId = String(req.user?._id || req.user?.id || 'guest_user')

    const quiz = await TutorQuiz.findById(id)
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' })
    }

    // Normalize answers format whether provided as Array or Object map
    let normalizedAnswers = []
    if (Array.isArray(answers)) {
      normalizedAnswers = answers
    } else if (answers && typeof answers === 'object') {
      normalizedAnswers = Object.entries(answers).map(([qid, val]) => {
        if (typeof val === 'number') {
          return { id: qid, choice: val }
        } else if (typeof val === 'object' && val !== null) {
          return { id: qid, ...val }
        } else {
          return { id: qid, text: String(val) }
        }
      })
    }

    const { score, results } = gradeQuizSubmission(quiz.questions, normalizedAnswers)

    // Save attempt
    await TutorQuizAttempt.findOneAndUpdate(
      { quizId: quiz._id, userId },
      { score, results, createdAt: new Date() },
      { upsert: true }
    )

    // Update TopicMastery with moving average
    const topicKey = quiz.topic.toLowerCase()
    const prev = await TopicMastery.findOne({ userId, topic: topicKey })
    const nextMastery = prev ? Number((prev.mastery * 0.7 + (score / 100) * 0.3).toFixed(2)) : Number((score / 100).toFixed(2))

    await TopicMastery.findOneAndUpdate(
      { userId, topic: topicKey },
      { mastery: nextMastery, updatedAt: new Date() },
      { upsert: true }
    )

    res.json({
      success: true,
      score,
      mastery: nextMastery,
      topicMastery: nextMastery,
      passed: score >= 70,
      results,
      feedback: results.map(r => ({ id: r.id, correct: r.correct, score: r.score, feedback: r.feedback || r.explanation })),
      questions: quiz.questions.map(q => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options
      }))
    })
  } catch (err) {
    console.error('[TutorController] submitQuiz error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/tutor/messages/:id/rate
export async function rateMessage(req, res) {
  try {
    const { id } = req.params
    const { rating, sessionId } = req.body

    const numRating = (rating === 'up' || rating === 1) ? 1 : (rating === 'down' || rating === -1) ? -1 : null

    if (sessionId) {
      await TutorSession.updateOne(
        { _id: sessionId, 'messages._id': id },
        { $set: { 'messages.$.rating': numRating } }
      )
    } else {
      await TutorSession.updateOne(
        { 'messages._id': id },
        { $set: { 'messages.$.rating': numRating } }
      )
    }

    res.json({ success: true, message: 'Rating recorded' })
  } catch (err) {
    console.error('[TutorController] rateMessage error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
