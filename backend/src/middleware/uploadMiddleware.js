import multer from 'multer'
import { mkdirSync } from 'node:fs'
import path from 'path'
import process from 'node:process'
import { UPLOAD_PATH } from '../config/env.js'

const resolvedUploadPath = path.isAbsolute(UPLOAD_PATH)
  ? UPLOAD_PATH
  : path.resolve(process.cwd(), UPLOAD_PATH)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    mkdirSync(resolvedUploadPath, { recursive: true })
    cb(null, resolvedUploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'), false)
    }
  }
})
