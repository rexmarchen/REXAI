import express from 'express'
import { register, login, googleAuth, getMe } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import { registerSchema, loginSchema, googleAuthSchema } from '../utils/validators.js'

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/google', validate(googleAuthSchema), googleAuth)
router.get('/me', protect, getMe)

export default router
