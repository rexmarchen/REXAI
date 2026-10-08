import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { upload, uploadImage } from '../middleware/uploadMiddleware.js'
import { getProfile, updateProfile, uploadProfileResume, uploadProfileImage } from '../controllers/profileController.js'

const router = express.Router()

// All profile routes require authentication
router.get('/', protect, getProfile)
router.post('/', protect, updateProfile)
router.put('/', protect, updateProfile)
router.patch('/', protect, updateProfile)
router.post('/resume', protect, upload.single('resume'), uploadProfileResume)
router.post('/image', protect, uploadImage.single('image'), uploadProfileImage)

export default router
