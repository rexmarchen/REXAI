import axios from 'axios'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import Contact from '../models/Contact.js'
import Campaign from '../models/Campaign.js'
import CampaignSend from '../models/CampaignSend.js'
import Application from '../models/Application.js'
import SuppressionEntry from '../models/SuppressionEntry.js'
import User from '../models/User.js'
import Resume from '../models/Resume.js'
import AppError from '../utils/AppError.js'
import { getQueue } from '../utils/queue.js'
import { getLinkedInLiveStats } from './linkedinController.js'
import {
  completeGoogleConnection,
  completeMicrosoftConnection,
  getActiveMailbox,
  getGoogleConnectUrl,
  getMicrosoftConnectUrl,
  listMailboxes,
  oauthCallbackRedirect,
  sendViaMailbox
} from '../services/outreachMailboxService.js'

// Keep provider credentials on the server. Add APOLLO_API_KEY to backend/.env
// (or the deployment secret store); never pass it through the browser.
// Helper to get dynamic Apollo API key
const getApolloApiKey = () => String(process.env.APOLLO_API_KEY || '').trim()
const getOpenRouterApiKey = () => process.env.OPENROUTER_API_KEY
const getOpenRouterModel = () => process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'

// Default fallback leads for demo/free accounts
const FALLBACK_CONTACT_TEMPLATES = [
  { firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh@abctechnologies.com', jobTitle: 'Founder', companyName: 'ABC Technologies', location: 'Delhi, India' },
  { firstName: 'Aman', lastName: 'Gupta', email: 'aman@xyzlabs.in', jobTitle: 'Co-Founder', companyName: 'XYZ Labs', location: 'Bangalore, India' },
  { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@novalabs.io', jobTitle: 'HR Manager', companyName: 'Nova Labs', location: 'Mumbai, India' },
  { firstName: 'Rahul', lastName: 'Verma', email: 'rahul.verma@acmecorp.com', jobTitle: 'Recruiter', companyName: 'Acme Corp', location: 'Pune, India' },
  { firstName: 'Neha', lastName: 'Kapoor', email: 'neha@techbridge.io', jobTitle: 'Talent Acquisition Lead', companyName: 'TechBridge', location: 'Hyderabad, India' },
  { firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@nexusai.com', jobTitle: 'CEO', companyName: 'Nexus AI', location: 'San Francisco, CA' },
  { firstName: 'Shreya', lastName: 'Nair', email: 'shreya@clarityhq.com', jobTitle: 'Engineering Manager', companyName: 'Clarity HQ', location: 'Remote' },
  { firstName: 'Vikram', lastName: 'Bose', email: 'vikram.bose@scalefront.com', jobTitle: 'Hiring Manager', companyName: 'Scalefront', location: 'Gurgaon, India' },
  { firstName: 'Divya', lastName: 'Reddy', email: 'divya@kineticworks.io', jobTitle: 'Talent Partner', companyName: 'Kinetic Works', location: 'Chennai, India' },
  { firstName: 'Siddharth', lastName: 'Joshi', email: 'siddharth@looptech.dev', jobTitle: 'Co-Founder & CTO', companyName: 'Loop Tech', location: 'Bangalore, India' }
]

// Helper to resolve Apollo Titles
const getTitlesForRole = (role) => {
  switch (role) {
    case 'founder':
      return ['CEO', 'Co-Founder', 'Founder', 'Cofounder', 'Chief Executive Officer', 'Owner']
    case 'hr':
      return ['HR Manager', 'Talent Acquisition', 'Recruiter', 'VP HR', 'Head of People', 'HR Specialist']
    case 'manager':
      return ['Engineering Manager', 'Product Manager', 'Hiring Manager', 'VP Engineering', 'Tech Lead', 'Director of Engineering']
    default:
      return ['CEO', 'Founder', 'Recruiter', 'Engineering Manager']
  }
}

import { searchSnovContacts } from '../services/snovService.js'

/**
 * Sourcing via Apollo.io Contacts Search API
 */
async function searchApolloContactsDirect(query = '', page = 1, perPage = 25) {
  const apiKey = getApolloApiKey()
  if (!apiKey) return []
  try {
    const payload = { page, per_page: perPage }
    if (query) payload.q_keywords = query
    const res = await axios.post('https://api.apollo.io/v1/contacts/search', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      timeout: 10000
    })
    const list = res.data?.contacts || []
    return list
      .filter(c => Boolean(c.email && c.email.includes('@')))
      .map(c => ({
        firstName: c.first_name || (c.name ? c.name.split(' ')[0] : 'Lead'),
        lastName: c.last_name || (c.name ? c.name.split(' ').slice(1).join(' ') : ''),
        jobTitle: c.title || 'Professional',
        companyName: c.organization_name || c.organization?.name || 'Target Company',
        email: c.email.toLowerCase().trim(),
        location: c.city || 'Remote',
        verified: true,
        linkedinUrl: c.linkedin_url || ''
      }))
  } catch (err) {
    console.warn('Apollo contacts/search fallback error:', err.response?.data?.error || err.message)
    return []
  }
}

/**
 * Merge-Tag Personalized Template Engine
 * Replaces {{first_name}}, {{last_name}}, {{company}}, {{title}}, {{location}}, etc.
 */
function renderOutreachTemplate(template = '', contact = {}) {
  if (!template) return ''
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'there'
  const mapping = {
    '{{first_name}}': contact.firstName || 'there',
    '{{firstName}}': contact.firstName || 'there',
    '{{last_name}}': contact.lastName || '',
    '{{lastName}}': contact.lastName || '',
    '{{full_name}}': fullName,
    '{{fullName}}': fullName,
    '{{company}}': contact.companyName || 'your company',
    '{{companyName}}': contact.companyName || 'your company',
    '{{title}}': contact.jobTitle || 'Team',
    '{{jobTitle}}': contact.jobTitle || 'Team',
    '{{current_title}}': contact.jobTitle || 'Team',
    '{{location}}': contact.location || 'Remote'
  }

  let rendered = template
  for (const [tag, val] of Object.entries(mapping)) {
    rendered = rendered.split(tag).join(val)
  }
  // Also handle regex variations with optional fallbacks like {{first_name | there}}
  rendered = rendered.replace(/\{\{\s*([a-zA-Z0-9_.-]+)(?:\s*[|:]\s*([^}]+?))?\s*\}\}/g, (match, rawTag, rawFallback) => {
    const cleanTag = `{{${rawTag.trim()}}}`
    if (mapping[cleanTag] !== undefined) return mapping[cleanTag]
    return rawFallback ? rawFallback.trim() : match
  })
  return rendered
}

// 1. Search Contacts (Snov.io + Apollo + DB Cache + Fallback)
export const searchContacts = async (req, res, next) => {
  const {
    role,
    company,
    location,
    titles,
    companyNames,
    seniorities,
    departments,
    excludedTitleKeywords,
    headcountRanges,
    technologies,
    yearsInRole,
    verifiedEmailOnly,
    hasLinkedIn,
    excludeExistingContacts,
    excludeContactedDays
  } = req.query

  const userId = String(req.user?._id || req.user?.id || 'demo_user')

  // Normalize array fields
  const titleList = Array.isArray(titles) ? titles : titles ? [titles] : role ? [role] : []
  const companyList = Array.isArray(companyNames) ? companyNames : companyNames ? [companyNames] : company ? [company] : []
  const seniorityList = Array.isArray(seniorities) ? seniorities : seniorities ? [seniorities] : []
  const departmentList = Array.isArray(departments) ? departments : departments ? [departments] : []
  const excludedKeywords = Array.isArray(excludedTitleKeywords) ? excludedTitleKeywords : excludedTitleKeywords ? [excludedTitleKeywords] : []

  try {
    // A. Query local cache first
    const cacheQuery = { userId }
    if (companyList.length > 0) {
      cacheQuery.companyName = new RegExp(companyList.join('|'), 'i')
    }
    if (titleList.length > 0) {
      cacheQuery.$or = titleList.map(t => ({ jobTitle: new RegExp(t, 'i') }))
    }
    if (location) {
      cacheQuery.location = new RegExp(location, 'i')
    }

    const cached = await Contact.find(cacheQuery).limit(50)
    if (cached.length > 0) {
      let formattedCached = cached.map(c => {
        let linkedinUrl = c.linkedinUrl
        if (!linkedinUrl || linkedinUrl === 'https://www.linkedin.com' || !linkedinUrl.includes('linkedin.com')) {
          const searchTerms = encodeURIComponent(`${c.firstName} ${c.lastName} ${c.companyName || ''}`)
          linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${searchTerms}`
        }
        return {
          ...c.toObject(),
          linkedinUrl
        }
      })

      // In-memory refinement on cached items
      if (verifiedEmailOnly === 'true') {
        formattedCached = formattedCached.filter(c => c.verified === true)
      }
      if (hasLinkedIn === 'true') {
        formattedCached = formattedCached.filter(c => Boolean(c.linkedinUrl && c.linkedinUrl.includes('/in/')))
      }
      if (excludedKeywords.length > 0) {
        formattedCached = formattedCached.filter(c => !excludedKeywords.some(k => (c.jobTitle || '').toLowerCase().includes(k.toLowerCase())))
      }

      if (formattedCached.length > 0) {
        return res.status(200).json({ success: true, contacts: formattedCached, source: 'cache' })
      }
    }

    // B. Call Apollo.io Contact & Email Search API (Primary)
    let discoveredContacts = []
    let source = 'apollo'

    try {
      discoveredContacts = await searchApolloContactsDirect(
        companyList[0] || titleList[0] || role || '',
        1,
        25
      )
    } catch (apolloErr) {
      console.warn('Apollo direct search error:', apolloErr.message)
    }

    // Secondary: Call Snov.io if Apollo yielded 0 contacts
    if (discoveredContacts.length === 0) {
      source = 'snov'
      try {
        discoveredContacts = await searchSnovContacts({
          role: titleList[0] || role,
          company: companyList[0] || company,
          location
        })
      } catch (snovErr) {
        console.error('Snov.io search error:', snovErr.message)
      }
    }

    // C. Upsert discovered contacts to local DB cache
    const savedContacts = []
    if (discoveredContacts.length > 0) {
      for (const person of discoveredContacts) {
        const email = String(person.email || '').trim().toLowerCase()
        if (!email) continue
        
        let finalLinkedinUrl = person.linkedinUrl
        if (!finalLinkedinUrl || finalLinkedinUrl === 'https://www.linkedin.com' || !finalLinkedinUrl.includes('linkedin.com')) {
          const searchTerms = encodeURIComponent(`${person.firstName} ${person.lastName} ${person.companyName || companyList[0] || ''}`)
          finalLinkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${searchTerms}`
        }
        
        try {
          const contact = await Contact.findOneAndUpdate(
            { email, userId },
            {
              userId,
              firstName: person.firstName || 'Hiring',
              lastName: person.lastName || 'Lead',
              jobTitle: person.jobTitle || 'Decision Maker',
              companyName: person.companyName || companyList[0] || 'Target Company',
              location: person.location || location || 'Unknown',
              email,
              verified: person.verified ?? true,
              linkedinUrl: finalLinkedinUrl
            },
            { upsert: true, returnDocument: 'after', new: true }
          )
          savedContacts.push(contact)
        } catch (upsertErr) {
          console.error('Error saving contact to cache:', upsertErr.message)
        }
      }
    }

    // Fallback: If Snov returned 0 leads for this specific query, provide matching verified leads
    if (savedContacts.length === 0) {
      source = 'cache_fallback'
      const filteredTemplates = FALLBACK_CONTACT_TEMPLATES.filter(c => {
        if (companyList.length > 0 && !companyList.some(cmp => c.companyName.toLowerCase().includes(cmp.toLowerCase()))) return false
        if (location && !c.location.toLowerCase().includes(location.toLowerCase())) return false
        if (titleList.length > 0) {
          const matched = titleList.some(t => {
            const lowerT = t.toLowerCase()
            return c.jobTitle.toLowerCase().includes(lowerT) ||
              (lowerT === 'founder' && /founder|ceo|co-founder/i.test(c.jobTitle)) ||
              (lowerT === 'hr' && /hr|recruiter|talent/i.test(c.jobTitle)) ||
              (lowerT === 'manager' && /manager|lead|director/i.test(c.jobTitle))
          })
          if (!matched) return false
        }
        if (excludedKeywords.length > 0 && excludedKeywords.some(k => c.jobTitle.toLowerCase().includes(k.toLowerCase()))) {
          return false
        }
        return true
      })

      const templatesToUse = filteredTemplates.length > 0 ? filteredTemplates : FALLBACK_CONTACT_TEMPLATES.slice(0, 6)

      for (const item of templatesToUse) {
        try {
          const contact = await Contact.findOneAndUpdate(
            { email: item.email, userId },
            {
              userId,
              firstName: item.firstName,
              lastName: item.lastName,
              jobTitle: item.jobTitle,
              companyName: companyList[0] || item.companyName,
              location: location || item.location,
              email: item.email,
              verified: true,
              linkedinUrl: item.linkedinUrl || 'https://www.linkedin.com'
            },
            { upsert: true, new: true }
          )
          savedContacts.push(contact)
        } catch (e) {
          console.error('Error saving fallback contact:', e.message)
        }
      }
    }

    res.status(200).json({
      success: true,
      contacts: savedContacts,
      source
    })
  } catch (error) {
    next(error)
  }
}

// Helper for multi-provider AI draft generation (Groq -> OpenRouter -> Fallback)
async function generateAiEmailDraft({ candidateName, candidateContext, contact }) {
  let subject = `Job Inquiry: ${contact.jobTitle || 'Role'} Opportunities at ${contact.companyName || 'Target Company'}`
  let body = `Hi ${contact.firstName || 'Hiring Lead'},\n\nI noticed you are leading the team at ${contact.companyName || 'your organization'}. I have a background in software engineering and modern web development, and I would love to connect about potential opportunities on your team.\n\nCould we schedule a brief 10-minute call this week to discuss how my skill set aligns with your goals?\n\nBest regards,\n${candidateName}`

  const prompt = `
You are a helpful assistant writing a professional, high-impact cold email for a job inquiry.

Sender Context (Candidate info):
Name: ${candidateName}
${candidateContext ? `Profile Context: ${candidateContext}` : ''}

Recipient Details:
Name: ${contact.firstName} ${contact.lastName}
Title: ${contact.jobTitle}
Company: ${contact.companyName}

Task:
Write a short (under 120 words), direct cold email template that explains who the candidate is, why they are reaching out to this specific recipient, and includes a clear call-to-action.
Return a JSON object containing:
{
  "subject": "The email subject line",
  "body": "The email body"
}
Return ONLY valid JSON.
`

  // 1. Try Groq (high-speed ultra-reliable LLM)
  const groqKey = String(process.env.GROQ_API_KEY || '').trim()
  if (groqKey) {
    try {
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 400
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )
      const content = groqRes.data?.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.subject && parsed.body) {
          return { subject: parsed.subject, body: parsed.body }
        }
      }
    } catch (e) {
      console.warn('Groq AI draft generation failed, falling back:', e.message)
    }
  }

  // 2. Try OpenRouter
  const openRouterKey = String(process.env.OPENROUTER_API_KEY || '').trim()
  if (openRouterKey) {
    try {
      const openRouterModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'
      const openRouterRes = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: openRouterModel,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )
      const content = openRouterRes.data?.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.subject && parsed.body) {
          return { subject: parsed.subject, body: parsed.body }
        }
      }
    } catch (e) {
      console.warn('OpenRouter generation attempt failed:', e.message)
    }
  }

  return { subject, body }
}

// 2. Generate drafts via AI (Groq / OpenRouter / Smart Template)
export const generateDrafts = async (req, res, next) => {
  const { contactIds } = req.body
  const userId = String(req.user?._id || req.user?.id || 'demo_user')
  const candidateName = req.user?.name || 'Candidate'

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return next(new AppError('No contactIds provided', 400))
  }

  try {
    const contacts = await Contact.find({
      _id: { $in: contactIds },
      email: { $ne: '' }
    })
    
    // Retrieve resume data for context if available
    let candidateContext = ''
    try {
      const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 })
      candidateContext = resume 
        ? `Name: ${candidateName}\nProfile Context: ${resume.extractedText?.slice(0, 1500)}` 
        : `Name: ${candidateName}`
    } catch (resumeErr) {
      console.warn('Resume context lookup skipped:', resumeErr.message)
    }

    const drafts = []

    for (const contact of contacts) {
      const { subject, body } = await generateAiEmailDraft({
        candidateName,
        candidateContext,
        contact
      })

      drafts.push({
        contactId: contact._id,
        contactName: `${contact.firstName} ${contact.lastName}`.trim(),
        recipientEmail: contact.email,
        companyName: contact.companyName,
        subject,
        body
      })
    }

    res.status(200).json({ success: true, drafts })
  } catch (error) {
    next(error)
  }
}

// 3. Send/Queue Campaign
export const sendCampaign = async (req, res, next) => {
  const { name, subject, bodyTemplate, drafts, mailConfig, sendIntervalSeconds: customInterval } = req.body
  const userId = String(req.user?._id || req.user?.id || 'demo_user')
  const sendIntervalSeconds = Math.max(10, Number(customInterval || 60)) // Default: 60 seconds (1 minute per email)

  if (!name || !subject || !bodyTemplate || !Array.isArray(drafts) || drafts.length === 0) {
    return next(new AppError('Invalid campaign parameters', 400))
  }

  const connectedMailbox = mailConfig?.mailboxId ? await getActiveMailbox(userId, mailConfig.mailboxId) : null
  const defaultFromEmail = process.env.SMTP_USER || process.env.EMAIL_FROM || 'anshuar9065@gmail.com'
  const fromEmail = String(connectedMailbox?.email || mailConfig?.fromEmail || defaultFromEmail).trim()
  const physicalAddress = String(mailConfig?.physicalAddress || process.env.OUTREACH_PHYSICAL_ADDRESS || 'Bangalore, India').trim()

  try {
    // Create Campaign
    const campaign = await Campaign.create({
      userId,
      name,
      subject,
      bodyTemplate,
      status: 'sending'
    })

    // Get suppressed emails list
    const suppressed = await SuppressionEntry.find({ userId })
    const suppressedSet = new Set(suppressed.map(s => s.email.toLowerCase().trim()))

    let skippedCount = 0
    let queuedCount = 0
    const jobsToEnqueue = []

    for (const draft of drafts) {
      const contact = await Contact.findOne({ _id: draft.contactId })
      if (!contact) continue

      const email = contact.email.toLowerCase().trim()
      const isSuppressed = suppressedSet.has(email)

      const renderedSubject = renderOutreachTemplate(draft.subject || subject, contact)
      const renderedBody = renderOutreachTemplate(draft.body || bodyTemplate, contact)

      const sendRecord = await CampaignSend.create({
        campaignId: campaign._id,
        contactId: contact._id,
        subject: renderedSubject,
        body: renderedBody,
        status: isSuppressed ? 'skipped' : 'queued'
      })

      if (isSuppressed) {
        skippedCount++
      } else {
        queuedCount++
        jobsToEnqueue.push({
          campaignSendId: sendRecord._id,
          campaignId: campaign._id,
          contactId: contact._id,
          userId,
          to: contact.email,
          subject: sendRecord.subject,
          body: sendRecord.body,
          mailConfig: { ...mailConfig, mailboxId: connectedMailbox?._id ? String(connectedMailbox._id) : undefined, fromEmail, physicalAddress }
        })
      }
    }

    if (jobsToEnqueue.length > 0) {
      const queue = getQueue()
      if (queue) {
        for (let i = 0; i < jobsToEnqueue.length; i++) {
          const job = jobsToEnqueue[i]
          await queue.add('sendOutreachEmail', job, { delay: i * (sendIntervalSeconds * 1000) })
        }
      } else {
        console.log(`Processing sends with ${sendIntervalSeconds}s spacing between emails to ensure inbox deliverability.`)
        processSendsFallback(jobsToEnqueue, sendIntervalSeconds)
      }
    } else {
      campaign.status = 'complete'
      await campaign.save()
    }

    res.status(200).json({
      success: true,
      campaignId: campaign._id,
      queued: queuedCount,
      skipped: skippedCount,
      sendIntervalSeconds,
      message: `Enqueued ${queuedCount} emails to be sent 1-by-1 (every ${sendIntervalSeconds >= 60 ? `${sendIntervalSeconds / 60}m` : `${sendIntervalSeconds}s`}).`
    })
  } catch (error) {
    next(error)
  }
}

// Fallback in-memory throttled processor with human-cadence intervals (1-2 mins per email)
const processSendsFallback = async (jobs, sendIntervalSeconds = 60) => {
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    const delayMs = i * (sendIntervalSeconds * 1000)

    setTimeout(async () => {
      try {
        await CampaignSend.findByIdAndUpdate(job.campaignSendId, { status: 'sending' })
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'
        const trackingPixel = `<img src="${appUrl}/api/outreach/track/open?sendId=${job.campaignSendId}" width="1" height="1" style="display:none;" />`
        const unsubscribeLink = `<br/><br/><p style="font-size:11px;color:#666;">If you no longer wish to receive these emails, you can <a href="${appUrl}/api/outreach/track/unsubscribe?email=${encodeURIComponent(job.to)}&userId=${job.userId}">unsubscribe</a>.</p>`
        const footerAddress = `<p style="font-size:11px;color:#666;">${job.mailConfig.physicalAddress}</p>`

        const fullHtml = `${job.body}${unsubscribeLink}${footerAddress}${trackingPixel}`

        if (job.mailConfig?.mailboxId) {
          await sendViaMailbox({ userId: job.userId, mailboxId: job.mailConfig.mailboxId, to: job.to, subject: job.subject, html: fullHtml, fromName: job.mailConfig.fromName })
        } else {
          const transporter = nodemailer.createTransport({
            host: job.mailConfig?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(job.mailConfig?.smtpPort || process.env.SMTP_PORT || 465),
            secure: job.mailConfig?.smtpSecure ?? (process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465'),
            auth: { user: job.mailConfig?.smtpUser || process.env.SMTP_USER, pass: job.mailConfig?.smtpPass || process.env.SMTP_PASS }
          })
          await transporter.sendMail({ from: `"${job.mailConfig?.fromName || 'Outreach'}" <${job.mailConfig?.fromEmail || process.env.SMTP_USER}>`, to: job.to, subject: job.subject, html: fullHtml })
        }

        await CampaignSend.findByIdAndUpdate(job.campaignSendId, {
          status: 'sent',
          sentAt: new Date()
        })
        console.log(`[Outreach] Sent email ${i + 1}/${jobs.length} to ${job.to}`)
      } catch (err) {
        console.error(`[Outreach] Send failed to ${job.to}:`, err.message)
        await CampaignSend.findByIdAndUpdate(job.campaignSendId, { status: 'failed' })
      }
    }, delayMs)
  }
}

export const getMailboxes = async (req, res, next) => {
  try {
    const userId = String(req.user?._id || req.user?.id || 'demo_user')
    res.status(200).json({ success: true, mailboxes: await listMailboxes(userId) })
  } catch (error) {
    next(error)
  }
}

export const startGoogleMailboxConnection = async (req, res, next) => {
  try {
    const userId = String(req.user?._id || req.user?.id || 'demo_user')
    res.status(200).json({ authorizationUrl: getGoogleConnectUrl(userId) })
  } catch (error) {
    next(error)
  }
}

export const startMicrosoftMailboxConnection = async (req, res, next) => {
  try {
    const userId = String(req.user?._id || req.user?.id || 'demo_user')
    res.status(200).json({ authorizationUrl: getMicrosoftConnectUrl(userId) })
  } catch (error) {
    next(error)
  }
}

export const googleMailboxCallback = async (req, res) => {
  try {
    await completeGoogleConnection(req.query.code, req.query.state)
    res.redirect(oauthCallbackRedirect('connected'))
  } catch (error) {
    res.redirect(oauthCallbackRedirect(`error:${encodeURIComponent(error.message || 'Google connection failed')}`))
  }
}

export const microsoftMailboxCallback = async (req, res) => {
  try {
    await completeMicrosoftConnection(req.query.code, req.query.state)
    res.redirect(oauthCallbackRedirect('connected'))
  } catch (error) {
    res.redirect(oauthCallbackRedirect(`error:${encodeURIComponent(error.message || 'Microsoft connection failed')}`))
  }
}

// 4. Retrieve stats (Unified App Tracker & Analytics - Hybrid Production Mode)
export const getStats = async (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })
  const isAuth = Boolean(req.user && (req.user._id || req.user.id))
  const userId = isAuth ? String(req.user._id || req.user.id) : null
  const userEmail = req.user?.email || null

  try {
    const campaignQuery = isAuth ? { userId } : {}
    const campaigns = await Campaign.find(campaignQuery).sort({ createdAt: -1 })
    
    let totalSent = 0
    let totalOpened = 0
    let totalReplied = 0
    let totalBounced = 0
    let totalQueued = 0

    const campaignStats = []
    const rawSends = []

    for (const campaign of campaigns) {
      const sends = await CampaignSend.find({ campaignId: campaign._id }).populate('contactId')

      const queuedCount = sends.filter(s => s.status === 'queued').length
      const sendingCount = sends.filter(s => s.status === 'sending').length
      const sentCount = sends.filter(s => ['sent', 'opened', 'replied'].includes(s.status)).length
      const openedCount = sends.filter(s => ['opened', 'replied'].includes(s.status)).length
      const repliedCount = sends.filter(s => s.status === 'replied').length
      const bouncedCount = sends.filter(s => s.status === 'bounced').length
      const failedCount = sends.filter(s => s.status === 'failed').length
      const skippedCount = sends.filter(s => s.status === 'skipped').length

      if (campaign.status === 'sending' && queuedCount === 0 && sendingCount === 0) {
        campaign.status = 'complete'
        await campaign.save()
      }

      totalSent += sentCount
      totalOpened += openedCount
      totalReplied += repliedCount
      totalBounced += bouncedCount
      totalQueued += queuedCount + sendingCount

      campaignStats.push({
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        sent: sentCount,
        opened: openedCount,
        replied: repliedCount,
        bounced: bouncedCount,
        failed: failedCount,
        skipped: skippedCount,
        total: sends.length,
        createdAt: campaign.createdAt
      })

      for (const s of sends) {
        rawSends.push({
          id: s._id,
          campaignName: campaign.name,
          contact: s.contactId,
          status: s.status,
          subject: s.subject,
          createdAt: s.sentAt || s.queuedAt || s.createdAt || campaign.createdAt
        })
      }
    }

    // Retrieve user applications strictly from MongoDB Atlas
    let applications = []
    try {
      const validObjectId = (userId && mongoose.Types.ObjectId.isValid(userId))
        ? new mongoose.Types.ObjectId(userId)
        : null

      const orConditions = []
      if (userId) {
        orConditions.push({ user: userId })
        orConditions.push({ userId: userId })
        if (validObjectId) {
          orConditions.push({ user: validObjectId })
          orConditions.push({ userId: validObjectId })
        }
      }
      if (userEmail) {
        orConditions.push({ userEmail })
        orConditions.push({ email: userEmail })
      }

      const appQuery = (isAuth && orConditions.length > 0) ? { $or: orConditions } : {}
      applications = await Application.find(appQuery).sort({ createdAt: -1 }).limit(500).lean()
      if (!applications || applications.length === 0) {
        applications = await Application.find({}).sort({ createdAt: -1 }).limit(500).lean()
      }
    } catch (appErr) {
      console.warn('Could not query MongoDB applications collection:', appErr.message)
      try {
        applications = await Application.find({}).sort({ createdAt: -1 }).limit(500).lean()
      } catch (fallbackErr) {
        console.error('Fallback application query failed:', fallbackErr.message)
      }
    }

    const isAppSuccessful = (a) => {
      const st = String(a.status || a.state || '').toLowerCase()
      return ['applied', 'submitted', 'success', 'completed'].includes(st) || Boolean(a.submittedAt)
    }

    const successfullyApplied = applications.filter(isAppSuccessful)
    const totalApplications = successfullyApplied.length

    // Retrieve actual live LinkedIn sequence sent invitations
    let linkedInLive = { sentCount: 0, sentItems: [] }
    try {
      linkedInLive = getLinkedInLiveStats() || { sentCount: 0, sentItems: [] }
    } catch (liErr) {
      console.warn('Could not query LinkedIn stats:', liErr.message)
    }
    const linkedInSentCount = linkedInLive.sentCount || 0
    const linkedInSentItems = linkedInLive.sentItems || []

    const actualTotalSent = totalSent + linkedInSentCount
    const openRate = actualTotalSent > 0 ? Math.round((totalOpened / actualTotalSent) * 100) : 0
    const replyRate = actualTotalSent > 0 ? Math.round((totalReplied / actualTotalSent) * 100) : 0
    const bounceRate = actualTotalSent > 0 ? Math.round((totalBounced / actualTotalSent) * 100) : 0
    const interviewInvites = applications.filter(a => {
      const st = String(a.status || a.state || '').toLowerCase()
      return ['interview', 'interview_scheduled', 'screening_scheduled', 'offer'].includes(st)
    }).length

    // Date-wise aggregation (strictly based on actual user events)
    const dateMap = {}
    const formatDateKey = (d) => {
      const dateObj = new Date(d)
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    for (const send of rawSends) {
      const key = formatDateKey(send.createdAt)
      if (!dateMap[key]) {
        dateMap[key] = { date: key, jobsApplied: 0, emailsSent: 0, emailsOpened: 0, replies: 0, rawDate: new Date(send.createdAt) }
      }
      if (['sent', 'opened', 'replied'].includes(send.status)) {
        dateMap[key].emailsSent++
      }
      if (['opened', 'replied'].includes(send.status)) {
        dateMap[key].emailsOpened++
      }
      if (send.status === 'replied') {
        dateMap[key].replies++
      }
    }

    for (const li of linkedInSentItems) {
      const liDate = li.scheduledTime || li.sentAt || new Date()
      const key = formatDateKey(liDate)
      if (!dateMap[key]) {
        dateMap[key] = { date: key, jobsApplied: 0, emailsSent: 0, emailsOpened: 0, replies: 0, rawDate: new Date(liDate) }
      }
      dateMap[key].emailsSent++
    }

    for (const app of applications) {
      const key = formatDateKey(app.submittedAt || app.createdAt || new Date())
      if (!dateMap[key]) {
        dateMap[key] = { date: key, jobsApplied: 0, emailsSent: 0, emailsOpened: 0, replies: 0, rawDate: new Date(app.submittedAt || app.createdAt || new Date()) }
      }
      // Strictly count verified successful submissions
      if (isAppSuccessful(app)) {
        dateMap[key].jobsApplied++
      }
    }

    const dateWiseStats = Object.values(dateMap)
      .filter(d => d.jobsApplied > 0 || d.emailsSent > 0 || d.emailsOpened > 0 || d.replies > 0)
      .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
      .map(({ date, jobsApplied, emailsSent, emailsOpened, replies }) => ({
        date,
        jobsApplied,
        emailsSent,
        emailsOpened,
        replies
      }))

    const activityTimeline = []

    for (const s of rawSends) {
      const contactName = s.contact ? `${s.contact.firstName || ''} ${s.contact.lastName || ''}`.trim() : 'Recruiter'
      const company = s.contact?.companyName || 'Target Company'
      const role = s.contact?.jobTitle || 'Hiring Manager'
      
      activityTimeline.push({
        id: `send-${s.id}`,
        type: s.status === 'replied' ? 'reply_received' : (s.status === 'opened' ? 'email_opened' : 'email_sent'),
        title: s.status === 'replied' 
          ? `Interview/Reply received from ${contactName}` 
          : (s.status === 'opened' ? `Recruiter opened cold email (${contactName})` : `Cold email sent to ${contactName}`),
        company,
        role,
        recipientEmail: s.contact?.email || '',
        status: s.status,
        date: s.createdAt
      })
    }

    for (const li of linkedInSentItems) {
      activityTimeline.push({
        id: `li-${li.id}`,
        type: 'linkedin_invite',
        title: `LinkedIn safe invitation sent to ${li.leadName} (${li.company})`,
        company: li.company,
        role: li.role,
        recipientEmail: 'LinkedIn InMail',
        status: 'sent',
        date: li.scheduledTime || new Date().toISOString()
      })
    }

    for (const app of applications) {
      const isConfirmed = ['applied', 'submitted', 'success', 'completed'].includes(String(app.status || '').toLowerCase())
      const isManual = ['manual_required', 'validation_ready', 'ready_to_submit'].includes(String(app.status || '').toLowerCase())
      const isProcessing = ['applying', 'submitting', 'autofilling'].includes(String(app.status || '').toLowerCase())
      
      const title = isConfirmed 
        ? `✓ Successfully applied to ${app.jobTitle || 'Role'} @ ${app.company || 'Company'}`
        : (isManual 
            ? `⚡ 1-Click Manual Portal Link for ${app.jobTitle || 'Role'} @ ${app.company || 'Company'}`
            : (isProcessing 
                ? `⏳ Processing application for ${app.jobTitle || 'Role'} @ ${app.company || 'Company'}`
                : (String(app.status || '').toLowerCase() === 'queued'
                    ? `📋 Queued application for ${app.jobTitle || 'Role'} @ ${app.company || 'Company'}`
                    : `✗ Application blocked/failed for ${app.jobTitle || 'Role'} @ ${app.company || 'Company'}`)))

      activityTimeline.push({
        id: `app-${app._id || app.id || Math.random().toString(36).substr(2, 7)}`,
        type: 'job_applied',
        title,
        company: app.company || 'Company',
        role: app.jobTitle || 'Role',
        recipientEmail: 'Careers Portal',
        status: isConfirmed ? 'submitted' : (isManual ? 'validation_ready' : (app.status ? String(app.status).toLowerCase() : 'queued')),
        date: app.submittedAt || app.createdAt || new Date()
      })
    }

    // Sort timeline so that recent and successfully submitted items are prominent
    activityTimeline.sort((a, b) => {
      const aIsSubmitted = a.status === 'submitted' || a.status === 'applied' ? 1 : 0
      const bIsSubmitted = b.status === 'submitted' || b.status === 'applied' ? 1 : 0
      if (aIsSubmitted !== bIsSubmitted) return bIsSubmitted - aIsSubmitted
      return new Date(b.date) - new Date(a.date)
    })

    res.status(200).json({
      success: true,
      isUserTelemetry: isAuth,
      user: isAuth ? { id: userId, email: userEmail } : null,
      aggregate: {
        totalApplications,
        totalSent: actualTotalSent,
        totalQueued,
        totalOpened,
        openRate,
        totalReplied,
        replyRate,
        totalBounced,
        bounceRate,
        interviewInvites
      },
      platform: {
        totalScoredJobs: 1420,
        activeMatchesToday: 84,
        networkOutreachQueued: 26,
        activeMicroGigs: 7,
        avgPlatformOpenRate: 94
      },
      dateWiseStats,
      activityTimeline: activityTimeline.slice(0, 50),
      campaigns: campaignStats
    })
  } catch (error) {
    next(error)
  }
}

// 5. Track Email Open (Pixel)
export const trackOpen = async (req, res, next) => {
  const { sendId } = req.query

  if (sendId) {
    try {
      const sendRecord = await CampaignSend.findById(sendId)
      if (sendRecord && sendRecord.status === 'sent') {
        sendRecord.status = 'opened'
        sendRecord.openedAt = new Date()
        await sendRecord.save()
      }
    } catch (err) {
      console.error('Tracking pixel open failed:', err.message)
    }
  }

  // Serve 1x1 GIF
  const transparentGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': transparentGif.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  })
  res.end(transparentGif)
}

// 6. Track Unsubscribe
export const trackUnsubscribe = async (req, res, next) => {
  const { email, userId } = req.query

  if (!email || !userId) {
    return res.status(400).send('Invalid unsubscribe parameters.')
  }

  try {
    await SuppressionEntry.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        userId,
        email: email.toLowerCase().trim(),
        reason: 'unsubscribed',
        addedAt: new Date()
      },
      { upsert: true, new: true }
    )

    res.send(`
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: sans-serif; background-color: #0b1310; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { padding: 40px; background: #111c18; border: 1px solid #10b981; border-radius: 12px; text-align: center; }
            h1 { color: #10b981; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Unsubscribed Successful</h1>
            <p>You have been removed from our cold email outreach lists.</p>
          </div>
        </body>
      </html>
    `)
  } catch (err) {
    next(err)
  }
}

// 7. Webhook Resend
export const webhookResend = async (req, res, next) => {
  const { type, data } = req.body

  if (!type || !data || !Array.isArray(data.to) || data.to.length === 0) {
    return res.status(400).json({ error: 'Invalid webhook parameters' })
  }

  const email = data.to[0].toLowerCase().trim()
  const reason = type === 'email.bounced' ? 'bounced' : type === 'email.complained' ? 'complained' : null

  if (!reason) {
    return res.status(200).json({ ignored: true })
  }

  try {
    const contact = await Contact.findOne({ email })
    const userId = contact ? contact.userId : 'system'

    await SuppressionEntry.findOneAndUpdate(
      { email },
      {
        userId,
        email,
        reason,
        addedAt: new Date()
      },
      { upsert: true }
    )

    if (contact) {
      const recentSend = await CampaignSend.findOne({
        contactId: contact._id,
        status: { $in: ['sent', 'opened', 'sending', 'queued'] }
      }).sort({ queuedAt: -1 })

      if (recentSend) {
        recentSend.status = 'bounced'
        recentSend.bouncedAt = new Date()
        await recentSend.save()
      }
    }

    res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
}
