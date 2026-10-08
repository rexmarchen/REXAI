import multer from 'multer'
import path from 'path'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../config/constants.js'
import AppError from '../utils/AppError.js'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Invalid file type. Only PDF and Word documents are allowed.', 400), false)
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
})

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new AppError('Invalid image file. Only image formats are allowed.', 400), false)
    }
  }
})