import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/env.js'
import User from '../models/User.js'
import Resume from '../models/Resume.js'
import CandidateProfile from '../models/CandidateProfile.js'

const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const ALLOWED_DOC_EXTS = new Set(['.pdf', '.docx', '.doc', '.txt'])

/**
 * Extracts and verifies user from Authorization header or cookie/query token
 */
async function resolveAuthenticatedUser(req) {
  try {
    let token = null
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.query?.token) {
      token = req.query.token
    } else if (req.session?.userId) {
      return await User.findById(req.session.userId)
    }

    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded?.id) return null

    return await User.findById(decoded.id)
  } catch {
    return null
  }
}

/**
 * Verifies if user owns the document or has admin privileges
 */
async function verifyDocumentOwnership(user, safeFilename) {
  if (!user) return false
  if (user.role === 'admin') return true

  const userId = user._id

  // 1. Check User.profile.resumeUrl
  if (user.profile?.resumeUrl && user.profile.resumeUrl.includes(safeFilename)) {
    return true
  }

  // 2. Check Resume collection
  const resumeMatch = await Resume.findOne({
    filename: safeFilename,
    user: userId
  })
  if (resumeMatch) return true

  // 3. Check CandidateProfile collection
  const profileMatch = await CandidateProfile.findOne({
    $or: [{ userId }, { userId: String(userId) }, { email: user.email }],
    resumeFilePath: { $regex: safeFilename }
  })
  if (profileMatch) return true

  return false
}

export function createSecureUploadsHandler(uploadsDir) {
  return async (req, res, next) => {
    try {
      const rawFilename = req.params.filename || req.path.replace(/^\//, '')
      if (!rawFilename) {
        return res.status(404).json({ success: false, message: 'File not specified' })
      }

      // Prevent Directory Traversal
      const safeFilename = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '')
      const fullPath = path.resolve(uploadsDir, safeFilename)

      if (!fullPath.startsWith(uploadsDir) || !fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, message: 'File not found' })
      }

      const ext = path.extname(safeFilename).toLowerCase()

      // 1. Images: allow public access for user avatars / portfolio assets
      if (ALLOWED_IMAGE_EXTS.has(ext)) {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        return res.sendFile(fullPath)
      }

      // 2. Documents (Resumes, CVs, Transcripts): enforce strict authentication & ownership
      if (ALLOWED_DOC_EXTS.has(ext)) {
        const user = await resolveAuthenticatedUser(req)
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required to access protected candidate documents.'
          })
        }

        const isAuthorized = await verifyDocumentOwnership(user, safeFilename)
        if (!isAuthorized) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to view or download this document.'
          })
        }

        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        return res.sendFile(fullPath)
      }

      // Deny any other file types
      return res.status(403).json({
        success: false,
        message: 'Access to this file type is forbidden.'
      })
    } catch (err) {
      next(err)
    }
  }
}

export function createSecureScreenshotsHandler(screenshotsDir) {
  return async (req, res, next) => {
    try {
      const rawFilename = req.params.filename || req.path.replace(/^\//, '')
      if (!rawFilename) {
        return res.status(404).json({ success: false, message: 'Screenshot not specified' })
      }

      const safeFilename = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '')
      const fullPath = path.resolve(screenshotsDir, safeFilename)

      if (!fullPath.startsWith(screenshotsDir) || !fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, message: 'Screenshot not found' })
      }

      // Safe public demo proof assets (e.g., filled-*.png used in UI preview)
      if (safeFilename.startsWith('filled-')) {
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        return res.sendFile(fullPath)
      }

      // Candidate live form screenshots require authenticated user session
      const user = await resolveAuthenticatedUser(req)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access candidate application screenshots.'
        })
      }

      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      return res.sendFile(fullPath)
    } catch (err) {
      next(err)
    }
  }
}

export default createSecureUploadsHandler
