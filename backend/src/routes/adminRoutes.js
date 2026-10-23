import express from 'express'
import { protect, restrictTo } from '../middleware/authMiddleware.js'
import {
  getAdminOverview,
  getSystemHealth,
  getUserGrowthAnalytics,
  getUsersList,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getFeatureFlags,
  updateFeatureFlag,
  getAuditLogs,
  getBillingOverview,
  getUserSubscriptions,
  overrideUserSubscription,
  getBillingFailuresAndBlockedJobs
} from '../controllers/adminController.js'

const router = express.Router()

// Enforce authentication & strict admin access on all routes
router.use(protect, restrictTo('admin'))

router.get('/overview', getAdminOverview)
router.get('/system-health', getSystemHealth)
router.get('/analytics/user-growth', getUserGrowthAnalytics)
router.get('/users', getUsersList)
router.patch('/users/:id/role', updateUserRole)
router.patch('/users/:id/status', updateUserStatus)
router.delete('/users/:id', deleteUser)

// Feature controls & Platform settings
router.get('/features', getFeatureFlags)
router.patch('/features/:key', updateFeatureFlag)

// Security & Audit Logs
router.get('/audit-logs', getAuditLogs)

// Subscriptions & Billing
router.get('/billing', getBillingOverview)
router.get('/subscriptions', getUserSubscriptions)
router.post('/subscriptions/:userId/override', overrideUserSubscription)
router.get('/billing-failures', getBillingFailuresAndBlockedJobs)

export default router
