import express from 'express'
import { generateSite, getSite } from '../controllers/rexcodeController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import { rexcodePromptSchema } from '../utils/validators.js'

const router = express.Router()

router.use(protect)

router.post('/generate', validate(rexcodePromptSchema), generateSite)
router.get('/site/:siteId', getSite)

export default router