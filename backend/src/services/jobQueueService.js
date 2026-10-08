import { existsSync, statSync } from 'node:fs'
import logger from '../utils/logger.js'
import { applyToJob } from './formFillerService.js'
import {
  updateApplicationBatchStatus,
  updateApplicationEvidence,
  updateApplicationStatus,
  findApplicationsByBatchId,
  findApplicationBatchById
} from '../../server.js'
import { sendDominationCompletionEmail } from './dominationEmailService.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class JobQueueService {
  constructor() {
    this.queue = []
    this.isProcessing = false
  }

  // Add a new batch to process
  enqueueBatch(batchId, candidateProfile, resumeFilePath) {
    logger.info(`Enqueuing Batch #${batchId} for background execution...`)
    this.queue.push({ batchId, candidateProfile, resumeFilePath })
    
    // Trigger processing asynchronously
    if (!this.isProcessing) {
      this.processQueue().catch(err => {
        logger.error(`Error in queue processor loop: ${err.message}`)
      })
    }
  }

  // Verification Checkpoint (Rule 5: Verify applied records have genuine, intact evidence)
  async runVerificationCheckpoint(batchId) {
    const apps = await findApplicationsByBatchId(batchId)
    logger.info(`[Verification Checkpoint] Auditing evidence for ${apps.length} applications in Batch #${batchId}...`)

    for (const app of apps) {
      if (app.status === 'applied') {
        const screenshot = app.screenshotPath
        let evidenceValid = false

        if (screenshot) {
          // If relative, check on disk
          const diskPath = screenshot.startsWith('http') ? null : (
            screenshot.includes('evidence') ? (
              screenshot.startsWith('C:') ? screenshot : (
                screenshot.startsWith('/api') ? screenshot.replace('/api/domination/evidence', 'uploads/evidence') : screenshot
              )
            ) : screenshot
          )

          if (diskPath && existsSync(diskPath)) {
            try {
              const stats = statSync(diskPath)
              if (stats.size > 1000) {
                evidenceValid = true
              }
            } catch { /* ignore */ }
          } else if (app.evidenceScreenshotPath && existsSync(app.evidenceScreenshotPath)) {
            const stats = statSync(app.evidenceScreenshotPath)
            if (stats.size > 1000) evidenceValid = true
          }
        }

        // Check if explicit success signal was captured
        const hasSignal = Boolean(app.confirmedSuccessSignal || (app.auditJson && app.auditJson.confirmationDetected))
        if (!evidenceValid || !hasSignal) {
          logger.warn(`[Verification Checkpoint] Downgrading App #${app.id} (${app.jobTitle} at ${app.company}) from 'applied' to 'failed' due to missing/inconclusive confirmation evidence.`)
          await updateApplicationEvidence(app.id, {
            status: 'failed',
            errorMessage: '[Verification Checkpoint] Downgraded: Confirmation screenshot or success signal is missing or inconclusive.',
            confirmedSuccessSignal: null
          })
        }
      }
    }
  }

  // Main background processing loop
  async processQueue() {
    this.isProcessing = true

    while (this.queue.length > 0) {
      const { batchId, candidateProfile, resumeFilePath } = this.queue.shift()
      logger.info(`Processing Batch #${batchId}...`)

      try {
        await updateApplicationBatchStatus(batchId, 'processing')
        
        // Fetch applications in the batch
        const applications = await findApplicationsByBatchId(batchId)
        logger.info(`Found ${applications.length} applications in Batch #${batchId}`)

        for (let i = 0; i < applications.length; i++) {
          const app = applications[i]
          logger.info(`Processing application ${i + 1}/${applications.length}: Job "${app.jobTitle}" at ${app.company}`)

          // Pre-classified jobs (Adzuna/Workday) skip the browser queue entirely
          if (app.status === 'manual_required') {
            logger.info(`  ↳ Skipped (pre-classified manual_required — no browser run needed)`)
            continue
          }

          // Mark as currently applying
          await updateApplicationStatus(app.id, 'applying')

          let result
          try {
            // Run form filler
            result = await applyToJob({
              application: app,
              candidateProfile,
              resumeFilePath
            })
          } catch (jobErr) {
            // Rule 4: Catch and log any Playwright/runtime exception as explicit 'failed'
            logger.error(`[JobQueue #${app.id}] Exception during job application: ${jobErr.message}`)
            result = {
              status: 'failed',
              errorMessage: `Automation execution error: ${jobErr.message}`,
              auditJson: { reachApplyPage: false, formFillSucceeded: false, submitClicked: false, confirmationDetected: false, reason: jobErr.message }
            }
          }

          // Rule 2 & 4: Ensure terminal status is explicit and strictly recorded in DB
          const finalStatus = ['applied', 'manual_required', 'expired', 'failed'].includes(result.status)
            ? result.status
            : 'failed'

          await updateApplicationEvidence(app.id, {
            status:                 finalStatus,
            screenshotPath:         result.evidenceScreenshotPath || result.screenshotPath || null,
            htmlPath:               result.htmlPath || null,
            errorMessage:           result.errorMessage || null,
            submittedAt:            result.submittedAt || (finalStatus === 'applied' ? new Date() : null),
            auditJson:              result.auditJson || null,
            confirmedSuccessSignal: result.confirmedSuccessSignal || null
          })

          try {
            const Application = (await import('../models/Application.js')).default
            if (Application) {
              await Application.create({
                user: app.userId || candidateProfile?.userId || 'guest_user_123',
                batchId: String(batchId),
                jobId: app.id || app.jobId || `job-${Date.now()}`,
                company: app.company || 'Target Company',
                jobTitle: app.jobTitle || 'Target Role',
                applyUrl: app.applyUrl || app.jobUrl || '',
                status: finalStatus,
                submittedAt: result.submittedAt || (finalStatus === 'applied' ? new Date() : null),
                evidenceScreenshotPath: result.evidenceScreenshotPath || result.screenshotPath || null,
                createdAt: new Date()
              }).catch(() => {})
            }
          } catch {}

          // Random stagger between applications (3 - 7 seconds)
          if (i < applications.length - 1) {
            const staggerDelay = Math.floor(Math.random() * 4000) + 3000
            logger.info(`Staggering next application in Batch #${batchId} by ${staggerDelay}ms...`)
            await sleep(staggerDelay)
          }
        }

        // Rule 5: Verification Checkpoint
        await this.runVerificationCheckpoint(batchId)

        // Rule 3: Re-query database directly to compute 100% accurate per-job outcomes
        const freshApps = await findApplicationsByBatchId(batchId)
        const appliedJobs = freshApps.filter(r => r.status === 'applied')
        const failedJobs  = freshApps.filter(r => ['failed', 'expired'].includes(r.status))
        const manualJobs  = freshApps.filter(r => r.status === 'manual_required')

        const appliedCount = appliedJobs.length
        const failedCount  = failedJobs.length
        const manualCount  = manualJobs.length

        let batchStatus = 'completed'
        if (appliedCount === 0 && (failedCount > 0 || manualCount > 0)) {
          batchStatus = 'failed'
        } else if (appliedCount > 0 && (failedCount > 0 || manualCount > 0)) {
          batchStatus = 'partial'
        }

        await updateApplicationBatchStatus(batchId, batchStatus)
        logger.info(`[Batch #${batchId}] Final Verified Summary: Total=${freshApps.length}, Applied=${appliedCount}, Failed=${failedCount}, Manual=${manualCount}`)

        // Dispatch completion email with database-verified counts
        try {
          const emailRecipient = candidateProfile.email || 'candidate@example.com'
          const emailName = candidateProfile.fullName || candidateProfile.name || 'Candidate'
          
          logger.info(`Sending completion summary email for Batch #${batchId} to ${emailRecipient}`)
          const emailRes = await sendDominationCompletionEmail({
            to: emailRecipient,
            fullName: emailName,
            targetRole: candidateProfile.targetRole || 'Automated Job Match',
            runId: String(batchId),
            status: batchStatus,
            expectedUserEmail: emailRecipient,
            summary: {
              totalJobsFound: freshApps.length,
              totalApplied: appliedCount,
              avgScore: null
            },
            appliedJobs: appliedJobs.map(a => ({
              title: a.jobTitle,
              company: a.company,
              status: a.status,
              evidence: a.confirmedSuccessSignal || a.screenshotPath || 'Verified submission'
            })),
            failedJobs: [...failedJobs, ...manualJobs].map(a => ({
              title: a.jobTitle,
              company: a.company,
              status: a.status,
              reason: a.errorMessage || (a.status === 'manual_required' ? 'Custom fields require manual review.' : 'Submission could not be completed.')
            }))
          })

          if (emailRes && emailRes.provider === 'local_preview' && emailRes.filename) {
            const { updateApplicationBatchEmailPreview } = await import('../../server.js')
            await updateApplicationBatchEmailPreview(batchId, emailRes.filename)
          }
        } catch (emailErr) {
          logger.error(`Failed to send summary email for Batch #${batchId}: ${emailErr.message}`)
        }

      } catch (err) {
        logger.error(`Failed to process Batch #${batchId}: ${err.message}`)
        await updateApplicationBatchStatus(batchId, 'failed').catch(() => null)
      }
    }

    this.isProcessing = false
  }
}

export const jobQueueService = new JobQueueService()
export default jobQueueService
