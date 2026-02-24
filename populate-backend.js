import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, 'backend');

const files = {
  'src/config/env.js': `import dotenv from 'dotenv'
dotenv.config()

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = process.env.PORT || 5000
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rexion'
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d'
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads/'
export const LLM_PROVIDER = process.env.LLM_PROVIDER || 'local'
`,

  'src/config/database.js': `import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✓ MongoDB connected')
  } catch (err) {
    console.error('✗ MongoDB error:', err.message)
    process.exit(1)
  }
}
`,

  'src/config/constants.js': `export const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
}

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  TOKEN_INVALID: 'Invalid token',
  UNAUTHORIZED: 'Not authorized',
  FILE_REQUIRED: 'File is required',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error'
}
`,

  'src/utils/AppError.js': `class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export default AppError
`,

  'src/utils/catchAsync.js': `export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
`,

  'src/utils/logger.js': `import fs from 'fs'
import path from 'path'

const logFile = path.join(process.cwd(), 'logs', 'app.log')

const ensureLogDir = () => {
  const logDir = path.dirname(logFile)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
}

const log = (level, message) => {
  ensureLogDir()
  const timestamp = new Date().toISOString()
  const logMessage = \`[\${timestamp}] [\${level}] \${message}\`
  console.log(logMessage)
  fs.appendFileSync(logFile, logMessage + '\\n')
}

export default {
  info: (msg) => log('INFO', msg),
  error: (msg) => log('ERROR', msg),
  warn: (msg) => log('WARN', msg),
  debug: (msg) => log('DEBUG', msg)
}
`,

  'src/utils/validators.js': `import Joi from 'joi'

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

export const resumeUploadSchema = Joi.object({
  userId: Joi.string().required()
})

export const rexcodePromptSchema = Joi.object({
  prompt: Joi.string().min(5).max(2000).required(),
  userId: Joi.string().required()
})
`,

  'src/middleware/errorMiddleware.js': `import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  logger.error(\`\${err.statusCode} - \${err.message}\`)

  if (err.code === 11000) {
    err.statusCode = 400
    err.message = 'Duplicate field value'
  }

  if (err.name === 'ValidationError') {
    err.statusCode = 400
    err.message = Object.values(err.errors).map(v => v.message).join(', ')
  }

  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401
    err.message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401
    err.message = 'Token expired'
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}
`,

  'src/middleware/authMiddleware.js': `import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { JWT_SECRET } from '../config/env.js'

export const protect = catchAsync(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('Not logged in', 401))
  }

  const decoded = jwt.verify(token, JWT_SECRET)
  const user = await User.findById(decoded.id)

  if (!user) {
    return next(new AppError('User not found', 401))
  }

  req.user = user
  next()
})
`,

  'src/middleware/validationMiddleware.js': `import AppError from '../utils/AppError.js'

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      const message = error.details.map(d => d.message).join(', ')
      return next(new AppError(message, 400))
    }
    next()
  }
}
`,

  'src/middleware/uploadMiddleware.js': `import multer from 'multer'
import path from 'path'
import { UPLOAD_PATH } from '../config/env.js'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH)
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
`,

  'src/models/User.js': `import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)
export default User
`,

  'src/models/Resume.js': `import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: String,
  fileUrl: String,
  content: String,
  analysis: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const Resume = mongoose.model('Resume', resumeSchema)
export default Resume
`,

  'src/models/Prediction.js': `import mongoose from 'mongoose'

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  prediction: String,
  confidence: Number,
  details: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const Prediction = mongoose.model('Prediction', predictionSchema)
export default Prediction
`,

  'src/models/GeneratedSite.js': `import mongoose from 'mongoose'

const generatedSiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prompt: String,
  htmlCode: String,
  cssCode: String,
  jsCode: String,
  previewUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const GeneratedSite = mongoose.model('GeneratedSite', generatedSiteSchema)
export default GeneratedSite
`,

  'src/routes/authRoutes.js': `import express from 'express'
import { register, login, getMe } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import { registerSchema, loginSchema } from '../utils/validators.js'

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/me', protect, getMe)

export default router
`,

  'src/routes/resumeRoutes.js': `import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'
import { uploadResume, analyzeResume, getPrediction } from '../controllers/resumeController.js'

const router = express.Router()

router.post('/upload', protect, upload.single('resume'), uploadResume)
router.post('/analyze', protect, analyzeResume)
router.get('/predict/:id', protect, getPrediction)

export default router
`,

  'src/routes/rexcodeRoutes.js': `import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { generateCode, getGeneratedSites } from '../controllers/rexcodeController.js'

const router = express.Router()

router.post('/generate', protect, generateCode)
router.get('/sites', protect, getGeneratedSites)

export default router
`,

  'src/controllers/authController.js': `import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { JWT_SECRET, JWT_EXPIRE } from '../config/env.js'

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return next(new AppError('User already exists', 400))
  }

  const user = await User.create({ name, email, password })
  const token = signToken(user._id)

  res.status(201).json({
    success: true,
    token,
    data: { id: user._id, name: user.name, email: user.email, role: user.role }
  })
})

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401))
  }

  const token = signToken(user._id)

  res.status(200).json({
    success: true,
    token,
    data: { id: user._id, name: user.name, email: user.email, role: user.role }
  })
})

export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
  res.status(200).json({
    success: true,
    data: user
  })
})
`,

  'src/controllers/resumeController.js': `import Resume from '../models/Resume.js'
import Prediction from '../models/Prediction.js'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'

export const uploadResume = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('File is required', 400))
  }

  const resume = await Resume.create({
    userId: req.user.id,
    fileName: req.file.originalname,
    fileUrl: req.file.path
  })

  res.status(201).json({
    success: true,
    data: resume
  })
})

export const analyzeResume = catchAsync(async (req, res, next) => {
  const { resumeId } = req.body

  const resume = await Resume.findById(resumeId)
  if (!resume) {
    return next(new AppError('Resume not found', 404))
  }

  res.status(200).json({
    success: true,
    data: { message: 'Analysis in progress' }
  })
})

export const getPrediction = catchAsync(async (req, res, next) => {
  const prediction = await Prediction.findById(req.params.id)
  if (!prediction) {
    return next(new AppError('Prediction not found', 404))
  }

  res.status(200).json({
    success: true,
    data: prediction
  })
})
`,

  'src/controllers/rexcodeController.js': `import GeneratedSite from '../models/GeneratedSite.js'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'

export const generateCode = catchAsync(async (req, res, next) => {
  const { prompt } = req.body

  if (!prompt) {
    return next(new AppError('Prompt is required', 400))
  }

  const site = await GeneratedSite.create({
    userId: req.user.id,
    prompt,
    htmlCode: '<div>Generated code</div>',
    cssCode: 'body { color: black; }',
    jsCode: 'console.log("Generated")'
  })

  res.status(201).json({
    success: true,
    data: site
  })
})

export const getGeneratedSites = catchAsync(async (req, res, next) => {
  const sites = await GeneratedSite.find({ userId: req.user.id })

  res.status(200).json({
    success: true,
    data: sites
  })
})
`,

  'src/services/aiService.js': `import OpenAI from 'openai'
import { OPENAI_API_KEY } from '../config/env.js'
import AppError from '../utils/AppError.js'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

export const generatePrediction = async (resumeText) => {
  try {
    const prompt = \`Based on the resume, predict career path in 5 years including job titles and industry. Resume: \${resumeText}\`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('OpenAI error:', error)
    throw new AppError('Failed to generate prediction', 500)
  }
}

export const generateWebsite = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert web developer. Generate complete HTML, CSS, and JavaScript code.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('OpenAI error:', error)
    throw new AppError('Failed to generate website', 500)
  }
}
`,

  'src/services/resumeParser.js': `import { readFileSync } from 'fs'

export const parseResume = async (filePath) => {
  try {
    let content = readFileSync(filePath, 'utf8')
    return content
  } catch (error) {
    throw new Error('Unable to parse resume')
  }
}
`,

  'src/services/siteGenerator.js': `export const generateSiteCode = async (prompt) => {
  const htmlTemplate = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>Generated Site</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Generated Content</h1>
  <p>\${prompt}</p>
  <script src="script.js"><\/script>
</body>
</html>\`

  return {
    html: htmlTemplate,
    css: 'body { font-family: Arial; margin: 0; padding: 20px; }',
    js: 'console.log("Site generated");'
  }
}
`
};

async function populateFiles() {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(basePath, filePath);
    const dir = path.dirname(fullPath);
    
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(`✓ Created: ${filePath}`);
    } catch (error) {
      console.error(`✗ Failed: ${filePath}`, error.message);
    }
  }
  console.log('\n✓ All files populated successfully!');
}

populateFiles().catch(err => {
  console.error('Population failed:', err);
  process.exit(1);
});
