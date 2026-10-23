import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { MAX_FILE_SIZE } from '../config/constants.js'
import AppError from '../utils/AppError.js'

const ALLOWED_DOC_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.txt'])
const ALLOWED_DOC_MIMETYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
])

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const ALLOWED_IMAGE_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
])

const createSafeStorage = (allowedExts) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      const rawExt = path.extname(file.originalname || '').toLowerCase()
      const ext = allowedExts.has(rawExt) ? rawExt : '.bin'
      const randomId = crypto.randomBytes(16).toString('hex')
      const safePrefix = (file.fieldname || 'file').replace(/[^a-zA-Z0-9_-]/g, '')
      cb(null, `${safePrefix}-${Date.now()}-${randomId}${ext}`)
    }
  })

const documentFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase()
  const mime = String(file.mimetype || '').toLowerCase()

  if (ALLOWED_DOC_EXTENSIONS.has(ext) && ALLOWED_DOC_MIMETYPES.has(mime)) {
    return cb(null, true)
  }
  return cb(new AppError('Invalid file type. Only PDF and Word documents are permitted.', 400), false)
}

const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase()
  const mime = String(file.mimetype || '').toLowerCase()

  // Explicitly disallow SVG or HTML to prevent Stored XSS
  if (ext === '.svg' || mime.includes('svg') || mime.includes('html')) {
    return cb(new AppError('SVG and HTML files are forbidden for security reasons.', 400), false)
  }

  if (ALLOWED_IMAGE_EXTENSIONS.has(ext) && ALLOWED_IMAGE_MIMETYPES.has(mime)) {
    return cb(null, true)
  }
  return cb(new AppError('Invalid image format. Allowed formats: JPEG, PNG, WEBP, GIF.', 400), false)
}

export const upload = multer({
  storage: createSafeStorage(ALLOWED_DOC_EXTENSIONS),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: documentFileFilter
})

export const uploadImage = multer({
  storage: createSafeStorage(ALLOWED_IMAGE_EXTENSIONS),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
})