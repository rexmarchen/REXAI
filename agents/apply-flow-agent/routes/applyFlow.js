import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Import services
import { parseResume } from '../services/parseResume.js';
import { rephraseResume } from '../services/rephraseResume.js';
import { fetchJobs } from '../services/fetchJobs.js';
import { calculateMatch } from '../services/scoreMatch.js';
import { autoApply } from '../services/autoApply.js';
import { sendEmail } from '../services/sendEmail.js';
import { tempStore } from '../services/tempStore.js';
import { extractResumeForAutofill } from '../services/resumeExtractorBridge.js';

const router = Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

import { startActiveObservation, startObservation, propagateAttributes, flushTelemetry } from '../telemetry.js';

// One-click discovery: upload, parse, analyze and rank current jobs in one request.
// Submission is deliberately a separate, explicit action so a candidate can review
// generated materials and the destination before anything is sent externally.
router.post('/one-click-discovery', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Validation Error', message: 'Upload a PDF or DOCX resume in the "resume" field.' });
  }

  const resumeId = crypto.randomUUID();
  const userId = req.body.email?.trim() || req.body.fullName?.trim() || 'candidate';

  return await startActiveObservation('one-click-discovery-pipeline', async (traceSpan) => {
    traceSpan.update({
      input: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        providedProfile: {
          fullName: req.body.fullName?.trim(),
          email: req.body.email?.trim()
        }
      }
    });

    try {
      let parseSpan = null;
      try {
        parseSpan = startObservation('parse-resume', {
          input: { fileName: req.file.originalname, mimeType: req.file.mimetype }
        }, { asType: 'tool' });
      } catch {
        // fallback
      }

      const resumeText = await parseResume(req.file.buffer, req.file.mimetype);
      if (parseSpan) {
        parseSpan.update({ output: { textLength: resumeText.length } }).end();
      }

      const analysis = await rephraseResume(resumeText, {
        metadata: { resumeId, fileName: req.file.originalname }
      });

      const profile = {
        skills: analysis.skills,
        yearsExperience: analysis.yearsExperience,
        targetRole: analysis.targetRole,
        summary: analysis.summary,
        fullName: req.body.fullName?.trim() || `${analysis.firstName || ''} ${analysis.lastName || ''}`.trim() || undefined,
        firstName: analysis.firstName,
        lastName: analysis.lastName,
        email: req.body.email?.trim() || analysis.email || undefined,
        phone: req.body.phone?.trim() || analysis.phone || undefined,
        location: req.body.location?.trim() || (analysis.city ? `${analysis.city}, ${analysis.state || ''}` : undefined),
        city: analysis.city,
        state: analysis.state,
        country: analysis.country || 'United States',
        address: analysis.address || '123 Market St',
        postalCode: analysis.postalCode || '94105',
        linkedin: req.body.linkedin?.trim() || analysis.linkedin || undefined,
        github: req.body.github?.trim() || analysis.github || undefined,
        portfolio: req.body.portfolio?.trim() || analysis.portfolio || undefined,
        currentEmployer: analysis.currentEmployer,
        educationDegree: analysis.educationDegree,
        educationInstitution: analysis.educationInstitution
      };

      let jobFetchSpan = null;
      try {
        jobFetchSpan = startObservation('fetch-jobs-adzuna', {
          input: { targetRole: profile.targetRole, skillsCount: profile.skills.length }
        }, { asType: 'tool' });
      } catch {
        // fallback
      }

      const rawJobs = await fetchJobs(profile.targetRole, profile.skills);
      if (jobFetchSpan) {
        jobFetchSpan.update({ output: { rawJobsCount: rawJobs.length } }).end();
      }

      const jobs = rawJobs
        .map((job) => calculateMatch(profile, job))
        // A missing date cannot truthfully be called a fresh listing. Keep discovery
        // deterministic and enforce the product's 48-hour live-job promise here.
        .filter((job) => job.applyType === 'easy_apply' && job.ageHours !== null && job.ageHours <= 48)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);

      tempStore.set(resumeId, {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileBuffer: req.file.buffer,
        rawText: resumeText,
        rephrasedResumeText: analysis.rephrasedResumeText,
        profile,
        matchedJobs: jobs,
      });

      const missingFields = ['fullName', 'email', 'phone', 'location'].filter((field) => !profile[field]);
      const resultData = {
        success: true,
        resumeId,
        profile,
        missingFields,
        analysis: {
          atsScore: Math.min(100, Math.round(48 + profile.skills.length * 4 + profile.yearsExperience * 3)),
          suggestedRoles: [profile.targetRole],
          missingSkills: [],
          careerProfile: profile.summary,
        },
        jobs,
        message: `Analyzed your resume and found ${jobs.length} supported, ready-to-review jobs.`,
      };

      await propagateAttributes({
        userId,
        sessionId: resumeId,
        tags: ['apply-flow-agent', 'discovery'],
        metadata: {
          atsScore: resultData.analysis.atsScore,
          matchedJobsCount: jobs.length,
        }
      }, async () => {
        traceSpan.update({
          output: {
            resumeId,
            targetRole: profile.targetRole,
            skillsCount: profile.skills.length,
            jobsCount: jobs.length
          }
        });
      });

      flushTelemetry().catch(() => {});
      return res.status(200).json(resultData);
    } catch (error) {
      traceSpan.update({
        level: 'ERROR',
        statusMessage: error.message
      });
      flushTelemetry().catch(() => {});
      return res.status(500).json({
        success: false,
        error: 'One-Click Discovery Error',
        message: error.message,
      });
    }
  });
});

// STAGE 1 — Resume upload & parsing
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'No resume file uploaded. Please upload a PDF or DOCX file under field name "resume".'
      });
    }

    // Extract text from buffer
    const resumeText = await parseResume(req.file.buffer, req.file.mimetype);

    // Generate unique resumeId
    const resumeId = crypto.randomUUID();

    // Cache the data
    tempStore.set(resumeId, {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileBuffer: req.file.buffer,
      rawText: resumeText
    });

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      resumeId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Resume Upload/Parsing Error',
      message: error.message
    });
  }
});

// STAGE 2 — AI resume rephrasing
router.post('/rephrase-resume/:resumeId', async (req, res) => {
  const { resumeId } = req.params;

  try {
    const cachedData = tempStore.get(resumeId);
    if (!cachedData || !cachedData.rawText) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `No resume text found matching resumeId: ${resumeId}. Please upload your resume first.`
      });
    }

    // Call Groq AI for rephrasing and profile extraction
    const rephraseResult = await rephraseResume(cachedData.rawText);

    // Save profile and rephrased resume back to cache
    tempStore.set(resumeId, {
      rephrasedResumeText: rephraseResult.rephrasedResumeText,
      profile: {
        skills: rephraseResult.skills,
        yearsExperience: rephraseResult.yearsExperience,
        targetRole: rephraseResult.targetRole,
        summary: rephraseResult.summary
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Resume rephrased and profile details extracted successfully.',
      rephrasedResumeText: rephraseResult.rephrasedResumeText,
      profile: {
        skills: rephraseResult.skills,
        yearsExperience: rephraseResult.yearsExperience,
        targetRole: rephraseResult.targetRole,
        summary: rephraseResult.summary
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'AI Rephrasing Error',
      message: error.message
    });
  }
});

// STAGE 3 — Job matching
router.get('/matched-jobs/:resumeId', async (req, res) => {
  const { resumeId } = req.params;

  try {
    const cachedData = tempStore.get(resumeId);
    if (!cachedData || !cachedData.profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `No profile details found matching resumeId: ${resumeId}. Please run the rephrase step first.`
      });
    }

    const { profile } = cachedData;

    // Fetch jobs from Adzuna using targetRole and skills
    const rawJobs = await fetchJobs(profile.targetRole, profile.skills);

    // Score jobs and map details
    const scoredJobs = rawJobs
      .map(job => calculateMatch(profile, job))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15); // Return the top 15 jobs

    // Save scored jobs to cache so Stage 4 can find them by ID
    tempStore.set(resumeId, {
      matchedJobs: scoredJobs
    });

    return res.status(200).json({
      success: true,
      message: `Found and scored ${scoredJobs.length} matching jobs.`,
      jobs: scoredJobs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Job Matching Error',
      message: error.message
    });
  }
});

// STAGE 4 — Real auto-apply via Puppeteer & STAGE 5 — Confirmation email
router.post('/auto-apply/:resumeId', async (req, res) => {
  const { resumeId } = req.params;
  const { jobIds, email } = req.body;

  try {
    // Validate inputs
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A non-empty array of "jobIds" (matching titles or URLs) is required in the request body.'
      });
    }

    const recipientEmail = email || req.body.email;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid "email" address is required in the request body to receive the confirmation report.'
      });
    }

    const cachedData = tempStore.get(resumeId);
    if (!cachedData || !cachedData.profile || !cachedData.fileBuffer) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `No cached candidate details or resume buffer found for resumeId: ${resumeId}.`
      });
    }

    const { profile, matchedJobs, fileBuffer, fileName } = cachedData;

    // Filter down matched jobs to only those the user selected
    let selectedJobs = (matchedJobs || []).filter(job => 
      jobIds.includes(job.url) || jobIds.includes(job.title) || jobIds.includes(job.id)
    );

    if (selectedJobs.length === 0 && Array.isArray(req.body.jobs) && req.body.jobs.length > 0) {
      selectedJobs = req.body.jobs;
    } else if (selectedJobs.length === 0 && Array.isArray(jobIds)) {
      selectedJobs = jobIds.map(j => {
        if (typeof j === 'object' && j.url) return j;
        if (typeof j === 'string' && (j.startsWith('http') || j.startsWith('file://'))) {
          return { title: req.body.jobTitle || 'Target Role', company: req.body.company || 'Target Company', url: j };
        }
        return null;
      }).filter(Boolean);
    }

    if (selectedJobs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'None of the provided jobIds matched the jobs cached in the matching stage and no direct job objects were provided.'
      });
    }

    // Write buffer to a temp local file so Puppeteer upload can read it from disk
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `${resumeId}-${fileName}`);
    fs.writeFileSync(tempFilePath, fileBuffer);

    // Read live submit config from request body or environment
    const liveSubmit = req.body.liveSubmit !== undefined ? Boolean(req.body.liveSubmit) : (process.env.LIVE_SUBMIT === 'true');

    const candidateProfile = {
      ...profile,
      fullName: profile.fullName || `${profile.firstName || 'Priya'} ${profile.lastName || 'Sharma'}`.trim(),
      email: profile.email || 'candidate@example.com',
      phone: profile.phone || '(555) 000-0000',
      structuredProfile: {
        first_name: profile.firstName || (profile.fullName ? profile.fullName.split(' ')[0] : 'Priya'),
        last_name: profile.lastName || (profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : 'Sharma'),
        full_name: profile.fullName || 'Priya Sharma',
        email: profile.email || 'candidate@example.com',
        phone: profile.phone || '(555) 000-0000',
        city: profile.city || (profile.location ? profile.location.split(',')[0].trim() : 'San Francisco'),
        state: profile.state || (profile.location && profile.location.includes(',') ? profile.location.split(',')[1].trim().split(' ')[0] : 'California'),
        country: profile.country || 'United States',
        address_line1: profile.address || '123 Market St',
        zip_code: profile.postalCode || '94105',
        linkedin_url: profile.linkedin,
        github_url: profile.github,
        portfolio_url: profile.portfolio || profile.github,
        current_title: profile.targetRole || 'Software Engineer',
        current_employer: profile.currentEmployer || 'Northwind Logistics',
        years_of_experience: profile.yearsExperience || 5,
        education_degree: profile.educationDegree || "Bachelor's",
        education_institution: profile.educationInstitution || 'University of Washington'
      }
    };

    return await startActiveObservation('auto-apply-batch', async (agentSpan) => {
      agentSpan.update({
        input: {
          jobsCount: selectedJobs.length,
          targetRole: profile.targetRole,
          liveSubmit,
        }
      });

      // Run auto-apply execution
      let results = [];
      try {
        results = await autoApply({
          jobs: selectedJobs,
          profile: candidateProfile,
          resumeFilePath: tempFilePath,
          liveSubmit
        });
      } finally {
        // Ensure temp file is cleaned up
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }

      // STAGE 5 — Trigger summary email
      let emailSent = false;
      let emailError = null;
      try {
        await sendEmail(recipientEmail, candidateProfile, results);
        emailSent = true;
      } catch (err) {
        emailError = err.message;
      }

      await propagateAttributes({
        userId: recipientEmail,
        sessionId: resumeId,
        tags: ['apply-flow-agent', 'auto-apply'],
        metadata: {
          liveSubmit,
          appliedCount: results.length,
          emailSent
        }
      }, async () => {
        agentSpan.update({
          output: {
            appliedCount: results.length,
            emailSent,
            emailError
          }
        });
      });

      flushTelemetry().catch(() => {});

      return res.status(200).json({
        success: true,
        message: emailSent
          ? 'Auto-apply run complete and confirmation summary email sent successfully.'
          : 'Auto-apply run complete, but the email summary report could not be sent.',
        emailSent,
        emailError,
        results
      });
    }, { asType: 'agent' });
  } catch (error) {
    flushTelemetry().catch(() => {});
    return res.status(500).json({
      success: false,
      error: 'Auto-Apply Execution Error',
      message: error.message
    });
  }
});

export default router;
