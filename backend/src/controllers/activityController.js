import {
  getUserActivities,
  getUserActivitySummary,
  exportUserActivitiesCsv
} from '../services/activityService.js'
import ActivityLog from '../models/ActivityLog.js'

/**
 * GET /api/activities
 * List activities for the authenticated user with filtering & pagination
 */
export const getActivities = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const {
      category,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query

    const result = await getUserActivities({
      userId,
      category,
      status,
      startDate,
      endDate,
      search,
      page,
      limit
    })

    return res.status(200).json({
      success: true,
      activities: result.activities,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasMore: result.hasMore
    })
  } catch (error) {
    console.error('[ActivityController] getActivities error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activities',
      error: error.message
    })
  }
}

/**
 * GET /api/activities/summary
 * Summary metrics, breakdown, and top activities for the authenticated user
 */
export const getActivitySummary = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { startDate, endDate } = req.query

    const summary = await getUserActivitySummary({
      userId,
      startDate,
      endDate
    })

    return res.status(200).json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('[ActivityController] getActivitySummary error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity summary',
      error: error.message
    })
  }
}

/**
 * GET /api/activities/export
 * Download CSV of activity logs for the authenticated user
 */
export const exportActivities = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { category, startDate, endDate, search } = req.query

    const csvData = await exportUserActivitiesCsv({
      userId,
      category,
      startDate,
      endDate,
      search
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rexion-activity-tracker-${Date.now()}.csv"`
    )
    return res.status(200).send(csvData)
  } catch (error) {
    console.error('[ActivityController] exportActivities error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to export activities',
      error: error.message
    })
  }
}

/**
 * DELETE /api/activities/:id
 * Delete a specific activity record belonging to the authenticated user
 */
export const deleteActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const activity = await ActivityLog.findOne({ _id: id })
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity record not found' })
    }

    // Strict user isolation check
    if (activity.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another user activity' })
    }

    await ActivityLog.deleteOne({ _id: id })

    return res.status(200).json({
      success: true,
      message: 'Activity removed successfully'
    })
  } catch (error) {
    console.error('[ActivityController] deleteActivity error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    })
  }
}
