import puppeteer from 'puppeteer'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import logger from '../utils/logger.js'

const ADAPTER_VERSION = 'PuppeteerAdapter v3.3.0 (Production ATS Real Submit)'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ── Platform classification ────────────────────────────────────────────────

const ATS_PATTERNS = {
  greenhouse:    /greenhouse\.io|boards\.greenhouse|job-boards\.greenhouse/i,
  lever:         /lever\.co/i,
  workday:       /myworkdayjobs\.com|\.workday\.com/i,
  manual_portal: /mygwork\.com|adzuna\.|indeed\.com|linkedin\.com|monster\.com|careerbuilder\.com|glassdoor\.com|ziprecruiter\.com|simplyhired\.com|taleo\.net|icims\.com|brassring\.com|successfactors\.com/i
}

function classifyUrl(url) {
  if (!url || typeof url !== 'string') return 'unknown'
  if (/gh_jid=/i.test(url) || /boards\.greenhouse/i.test(url)) return 'greenhouse'
  if (/lever\.co/i.test(url) || (/lever/i.test(url) && url.includes('?'))) {
    return 'lever'
  }
  for (const [platform, re] of Object.entries(ATS_PATTERNS)) {
    if (re.test(url)) return platform
  }
  return 'unknown'
}

function getBrowserExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ]
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate
    }
  }
  return undefined
}

async function resolveJobUrl(page, rawUrl) {
  let finalUrl = rawUrl
  let reachError = null
  try {
    await page.goto(rawUrl, { waitUntil: 'networkidle2', timeout: 20000 })
    finalUrl = page.url()
  } catch (err) {
    reachError = err.message
  }

  let platform = classifyUrl(finalUrl)

  if (platform === 'lever' && !finalUrl.includes('/apply')) {
    try {
      const applyUrl = `${finalUrl.replace(/\/$/, '')}/apply`
      logger.info(`[Lever] Redirecting to form: ${applyUrl}`)
      await page.goto(applyUrl, { waitUntil: 'networkidle2', timeout: 20000 })
      finalUrl = page.url()
      platform = classifyUrl(finalUrl)
    } catch (err) {
      logger.warn(`[Lever] Redirect to /apply failed: ${err.message}`)
    }
  }

  if (platform !== 'unknown') return { platform, finalUrl, reachError }

  const rawPlatform = classifyUrl(rawUrl)
  if (reachError && rawPlatform !== 'unknown') {
    return { platform: rawPlatform, finalUrl: rawUrl, reachError }
  }

  return { platform: reachError ? 'unreachable' : 'unknown', finalUrl, reachError }
}

const DEAD_LISTING_URL_PATTERN  = /[?&]error=true/i
const DEAD_LISTING_TEXT_PATTERN = /page not found|no longer active|position (has been )?filled|job (posting )?(has )?expired|this job is no longer/i

async function detectDeadListing(page, finalUrl) {
  if (DEAD_LISTING_URL_PATTERN.test(finalUrl)) return 'URL contains ?error=true'
  try {
    const text = await Promise.race([
      page.evaluate(() => document.body?.innerText || ''),
      sleep(3000).then(() => ''),
    ])
    const match = DEAD_LISTING_TEXT_PATTERN.exec(text)
    if (match) return `Page text: "${match[0]}"`
  } catch { /* ignore */ }
  return null
}

function auditLog({ reach, fill, submit, confirm, reason }) {
  const m = (v) => (v ? '✓' : '✗')
  let s = `[Audit Log] Reach Apply Page: ${m(reach)} | Form Fill: ${m(fill)} | Click Submit: ${m(submit)} | Confirmation: ${m(confirm)}`
  if (reason) s += ` (${reason})`
  return s
}

function auditJson({ reach, fill, submit, confirm, reason, evidence = null }) {
  return {
    reachApplyPage: Boolean(reach),
    formFillSucceeded: Boolean(fill),
    submitClicked: Boolean(submit),
    confirmationDetected: Boolean(confirm),
    reason: reason || null,
    evidence
  }
}

// ── Strict Confirmation Signal Validator (Rule 2: No False Applied) ───────

async function verifyConfirmationSignal(page, frame) {
  const finalUrl = page.url().toLowerCase()
  const content = (await frame.content().catch(() => '')).toLowerCase()

  // 1. Check URL confirmation markers
  const CONFIRMATION_URL_PATTERNS = [
    '/confirmation',
    '/thank',
    '/submitted',
    '/success',
    'application_received',
    'application-received',
    'status=submitted'
  ]
  const hasUrlSignal = CONFIRMATION_URL_PATTERNS.some(pat => finalUrl.includes(pat))

  // 2. Check DOM explicit success confirmation phrases
  const CONFIRMATION_TEXT_PATTERNS = [
    'thank you for applying',
    'application submitted',
    'your application has been submitted',
    'your application has been received',
    'application received',
    'thanks for applying',
    'we have received your application',
    'successfully submitted your application'
  ]
  const matchedTextPattern = CONFIRMATION_TEXT_PATTERNS.find(pat => content.includes(pat))

  // 3. Error signals on page that invalidate confirmation
  const ERROR_TEXT_PATTERNS = [
    'please fix the following errors',
    'required fields are missing',
    'there was an error submitting your application',
    'validation failed',
    'first name is required',
    'last name is required',
    'email is required',
    'select a country'
  ]
  const hasErrorText = ERROR_TEXT_PATTERNS.some(pat => content.includes(pat))

  if (hasErrorText) {
    return { confirmed: false, reason: 'Form validation errors detected on page after submission.' }
  }

  if (hasUrlSignal || matchedTextPattern) {
    return {
      confirmed: true,
      signal: hasUrlSignal ? `URL confirmation: ${page.url()}` : `DOM text matched: "${matchedTextPattern}"`,
      confirmationUrl: page.url()
    }
  }

  return {
    confirmed: false,
    reason: 'Submission unconfirmed — no verified confirmation URL or success text signal observed.'
  }
}

// ── Smart Greenhouse Form Filler ──────────────────────────────────────────

async function fillGreenhouse(page, candidateProfile, resumeFilePath, appId, evidenceDir) {
  let frame = page
  let emailInput = null

  for (let attempt = 0; attempt < 10; attempt++) {
    emailInput = await page.$('input[type="email"], input[name*="email" i], input[id*="email" i]').catch(() => null)
    if (emailInput) break

    const allFrames = page.frames()
    for (const f of allFrames) {
      if (/greenhouse|boards|job_app|stripe|airbnb|lever/i.test(f.url())) {
        const found = await f.$('input[type="email"], input[name*="email" i], input[id*="email" i]').catch(() => null)
        if (found) {
          frame = f
          emailInput = found
          logger.info(`[GH #${appId}] Attached to form frame: ${f.url()}`)
          break
        }
      }
    }
    if (emailInput) break
    await sleep(1000)
  }

  if (!emailInput) {
    const shot = path.join(evidenceDir, `${appId}_fill_fail.png`)
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
    return {
      status: 'failed',
      errorMessage: auditLog({ reach: true, fill: false, submit: false, confirm: false, reason: 'Email field not found in Greenhouse form.' }),
      auditJson: auditJson({ reach: true, fill: false, submit: false, confirm: false, reason: 'Email field not found in Greenhouse form.' }),
      evidenceScreenshotPath: shot
    }
  }

  // Real candidate profile data
  const fullName = String(candidateProfile.fullName || candidateProfile.name || 'Shrayas Pal').trim()
  const email = String(candidateProfile.email || 'anshuar9065@gmail.com').trim()
  const phone = String(candidateProfile.phone || '+919876543210').trim()
  const linkedinUrl = String(candidateProfile.linkedinUrl || 'https://www.linkedin.com/in/shrayas-undefined-169193430').trim()
  const githubUrl = String(candidateProfile.githubUrl || 'https://github.com/shrayas').trim()
  const currentCompany = String(candidateProfile.currentCompany || candidateProfile.employer || 'Rexion AI').trim()
  const currentTitle = String(candidateProfile.targetRole || candidateProfile.currentRole || 'Senior Software Engineer').trim()

  const [firstName, ...rest] = fullName.split(/\s+/)
  const lastName = rest.join(' ') || 'Pal'

  // Helper for clicking & typing into iframe inputs
  async function typeInput(sel, val) {
    if (!val) return
    try {
      const el = await frame.$(sel)
      if (el) {
        await el.click({ clickCount: 3 })
        await el.type(val, { delay: 15 })
        await sleep(100)
      }
    } catch {}
  }

  let cleanPhone = phone
  const hasCountryPicker = await frame.$('.intl-tel-input, .flag-container, select[name*="country" i], .country-select').catch(() => null)
  if (hasCountryPicker) {
    // Strip leading country dial code like +91 or +1 if country dropdown is separate
    cleanPhone = phone.replace(/^\+\d{1,4}\s?/, '').replace(/[-.\s]/g, '')
  }

  // 1. Standard text fields with el.click() + el.type()
  await typeInput('#first_name, input[name*="first_name" i]', firstName)
  await typeInput('#last_name, input[name*="last_name" i]', lastName)
  await typeInput('#name, input[name="name" i]', fullName)
  await typeInput('input[type="email"], input[name*="email" i], input[id*="email" i]', email)
  await typeInput('#phone, input[type="tel"], input[name*="phone" i]', cleanPhone)
  await typeInput('#linkedin, input[name*="linkedin" i], input[autocomplete*="url" i]', linkedinUrl)
  await typeInput('#github, input[name*="github" i]', githubUrl)
  await typeInput('#website, input[name*="website" i], input[name*="portfolio" i], input[name*="urls" i], input[name*="other_url" i]', linkedinUrl || githubUrl)

  // 2. Comprehensive custom text fields (Preferred Name, Employer, Role, Notice Period, etc.)
  await frame.evaluate((profile) => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type]), textarea'))
    inputs.forEach(input => {
      if (input.classList.contains('select__input')) return
      const label = (input.closest('.field-wrapper')?.innerText || input.closest('label')?.innerText || input.getAttribute('aria-label') || input.placeholder || input.id || input.name || '').toLowerCase()
      if (!input.value || input.value.trim() === '') {
        if (label.includes('preferred') || label.includes('prefer') || label.includes('interview process')) {
          input.value = profile.firstName
        } else if (label.includes('employer') || label.includes('company')) {
          input.value = profile.currentCompany
        } else if (label.includes('title') || label.includes('job title') || label.includes('role')) {
          input.value = profile.currentTitle
        } else if (label.includes('website') || label.includes('portfolio') || label.includes('link') || label.includes('url')) {
          input.value = profile.linkedinUrl || profile.githubUrl || 'https://linkedin.com'
        } else if (label.includes('notice') || label.includes('availability') || label.includes('start date')) {
          input.value = 'Available immediately / 30 days'
        } else if (label.includes('salary') || label.includes('compensation') || label.includes('ctc') || label.includes('expectation')) {
          input.value = 'Competitive / Open to discussion'
        } else if (label.includes('years of experience') || label.includes('years experience')) {
          input.value = String(profile.experienceYears || '3')
        } else if (label.includes('city') || label.includes('location') || label.includes('reside')) {
          input.value = profile.location || 'Bengaluru, India'
        } else if (label.includes('hear about') || label.includes('source')) {
          input.value = 'LinkedIn'
        }
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
  }, { firstName, fullName, currentCompany, currentTitle, linkedinUrl, githubUrl, experienceYears: candidateProfile.experienceYears, location: candidateProfile.location }).catch(() => {})

  // 3. React-Select Comboboxes & Dropdowns
  try {
    const comboboxes = await frame.$$('input.select__input, input[role="combobox"]')
    for (const combo of comboboxes.slice(0, 15)) {
      const label = await frame.evaluate(el => {
        const parent = el.closest('.select__container') || el.closest('.field-wrapper') || el.parentElement
        return (parent?.innerText || el.id || el.name || '').toLowerCase()
      }, combo).catch(() => '')

      let valueToType = null
      if (label.includes('school')) valueToType = candidateProfile.school || 'University'
      else if (label.includes('degree')) valueToType = candidateProfile.degree || "Bachelor's Degree"
      else if (label.includes('discipline') || label.includes('major')) valueToType = candidateProfile.major || 'Computer Science'
      else if (label.includes('country') || label.includes('reside')) valueToType = candidateProfile.country || 'India'
      else if (label.includes('city') || label.includes('location')) valueToType = candidateProfile.location || 'Bengaluru, India'
      else if (label.includes('authorized') || label.includes('legally')) valueToType = 'Yes'
      else if (label.includes('sponsor') || label.includes('visa')) valueToType = 'No'
      else if (label.includes('remote') || label.includes('remotely')) valueToType = 'Yes'
      else if (label.includes('pronoun')) valueToType = 'He/Him'
      else if (label.includes('ever been employed') || label.includes('previous') || label.includes('affiliate')) valueToType = 'No'
      else if (label.includes('gender') || label.includes('race') || label.includes('veteran') || label.includes('disability')) valueToType = 'Decline'
      else if (label.includes('whatsapp') || label.includes('brighthire') || label.includes('consent') || label.includes('opt-in')) valueToType = 'Yes'

      if (valueToType) {
        await combo.click().catch(() => {})
        await sleep(150)
        await combo.type(valueToType, { delay: 20 }).catch(() => {})
        await sleep(250)
        await page.keyboard.press('Enter').catch(() => {})
        await sleep(250)
      }
    }
  } catch { /* ignore */ }

  // 4. Resume upload
  try {
    const fileEls = await frame.$$('input[type="file"]')
    if (fileEls.length > 0 && resumeFilePath && existsSync(resumeFilePath)) {
      for (const el of fileEls) {
        await el.uploadFile(resumeFilePath).catch(() => {})
        await el.evaluate(e => {
          e.dispatchEvent(new Event('change', { bubbles: true }))
          e.dispatchEvent(new Event('input', { bubbles: true }))
        }).catch(() => {})
      }
      await sleep(1500)
    }
  } catch { /* ignore */ }

  // 5. All required checkboxes (terms, consent, AI policy, etc.)
  await frame.evaluate(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'))
    checkboxes.forEach(cb => {
      if (!cb.checked) {
        cb.click()
      }
    })
  }).catch(() => {})

  await sleep(1000)

  // Find submit button
  const submitBtn = await frame.waitForSelector(
    'button[type="submit"], input[type="submit"], #submit_app, .btn-submit',
    { timeout: 6000 }
  ).catch(() => null)

  if (!submitBtn) {
    const shot = path.join(evidenceDir, `${appId}_fill_fail.png`)
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
    return {
      status: 'failed',
      errorMessage: auditLog({ reach: true, fill: true, submit: false, confirm: false, reason: 'Submit button not found.' }),
      auditJson: auditJson({ reach: true, fill: true, submit: false, confirm: false, reason: 'Submit button not found.' }),
      evidenceScreenshotPath: shot
    }
  }

  await submitBtn.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {})
  await sleep(500)

  return { status: 'ready', frame, submitBtn }
}

// ── Smart Lever Form Filler ───────────────────────────────────────────────

async function fillLever(page, candidateProfile, resumeFilePath, appId, evidenceDir) {
  let frame = page
  let emailInput = null

  for (let attempt = 0; attempt < 10; attempt++) {
    emailInput = await page.$('input[type="email"], input[name*="email" i]').catch(() => null)
    if (emailInput) break

    const allFrames = page.frames()
    for (const f of allFrames) {
      if (/lever\.co/i.test(f.url())) {
        const found = await f.$('input[type="email"], input[name*="email" i]').catch(() => null)
        if (found) {
          frame = f
          emailInput = found
          logger.info(`[Lever #${appId}] Attached to form frame: ${f.url()}`)
          break
        }
      }
    }
    if (emailInput) break
    await sleep(1000)
  }

  if (!emailInput) {
    const shot = path.join(evidenceDir, `${appId}_fill_fail.png`)
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
    return {
      status: 'failed',
      errorMessage: auditLog({ reach: true, fill: false, submit: false, confirm: false, reason: 'Email field not found in Lever form.' }),
      auditJson: auditJson({ reach: true, fill: false, submit: false, confirm: false, reason: 'Email field not found in Lever form.' }),
      evidenceScreenshotPath: shot
    }
  }

  const fullName = String(candidateProfile.fullName || candidateProfile.name || 'Shrayas Pal').trim()
  const email    = String(candidateProfile.email || 'anshuar9065@gmail.com').trim()
  const phone    = String(candidateProfile.phone || '+919876543210').trim()
  const linkedinUrl = String(candidateProfile.linkedinUrl || 'https://www.linkedin.com/in/shrayas-undefined-169193430').trim()

  async function typeInput(sel, val) {
    if (!val) return
    try {
      const el = await frame.$(sel)
      if (el) {
        await el.click({ clickCount: 3 })
        await el.type(val, { delay: 15 })
        await sleep(100)
      }
    } catch {}
  }

  await typeInput('input[name="name" i], input[id="name" i]', fullName)
  await typeInput('input[type="email"], input[name*="email" i]', email)
  await typeInput('input[type="tel"], input[name*="phone" i]', phone)
  await typeInput('input[name*="urls[LinkedIn]" i], input[name*="linkedin" i]', linkedinUrl)

  const fileEl = await frame.$('input[type="file"]')
  if (fileEl && resumeFilePath && existsSync(resumeFilePath)) {
    await fileEl.uploadFile(resumeFilePath).catch(() => {})
    await sleep(1500)
  }

  const submitBtn = await frame.waitForSelector(
    '#btn-submit, button[type="submit"]:not(#hcaptchaSubmitBtn), .btn-submit, input[type="submit"]',
    { timeout: 6000 }
  ).catch(() => null)

  if (!submitBtn) {
    const shot = path.join(evidenceDir, `${appId}_fill_fail.png`)
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
    return {
      status: 'failed',
      errorMessage: auditLog({ reach: true, fill: true, submit: false, confirm: false, reason: 'Submit button not found.' }),
      auditJson: auditJson({ reach: true, fill: true, submit: false, confirm: false, reason: 'Submit button not found.' }),
      evidenceScreenshotPath: shot
    }
  }

  await submitBtn.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {})
  await sleep(500)

  return { status: 'ready', frame, submitBtn }
}

// ── Main Export: Apply to Job (Zero Tolerance for False Success) ──────────

export async function applyToJob({ application, candidateProfile, resumeFilePath }) {
  const appId      = application.id
  const postingUrl = application.postingUrl || application.posting_url || ''

  logger.info(`[Apply #${appId}] Starting automated application → ${postingUrl}`)

  const evidenceDir = path.join(process.cwd(), 'uploads', 'evidence')
  if (!existsSync(evidenceDir)) mkdirSync(evidenceDir, { recursive: true })

  const rawPlatform = classifyUrl(postingUrl)
  const isRedirect = /adzuna|click|redirect|lnk/i.test(postingUrl)

  if (rawPlatform === 'workday') {
    logger.info(`[Apply #${appId}] Workday detected — manual_required`)
    return {
      status: 'manual_required',
      errorMessage: auditLog({ reach: false, fill: false, submit: false, confirm: false, reason: 'Workday requires an employer account. Manual apply only.' }),
      auditJson: auditJson({ reach: false, fill: false, submit: false, confirm: false, reason: 'Workday requires employer account' }),
      channelUsed: 'manual'
    }
  }

  if (rawPlatform === 'unknown' && !isRedirect) {
    logger.info(`[Apply #${appId}] Non-ATS custom portal detected — manual_required`)
    return {
      status: 'manual_required',
      errorMessage: auditLog({ reach: false, fill: false, submit: false, confirm: false, reason: 'Custom company portal requires manual completion.' }),
      auditJson: auditJson({ reach: false, fill: false, submit: false, confirm: false, reason: 'Custom company portal' }),
      channelUsed: 'manual'
    }
  }

  let browser
  let resolvedUrl = postingUrl
  let platform    = rawPlatform

  try {
    const executablePath = getBrowserExecutablePath()
    browser = await puppeteer.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    const resolved = await resolveJobUrl(page, postingUrl)
    resolvedUrl = resolved.finalUrl
    platform    = resolved.platform

    if (platform === 'unreachable') {
      await browser.close()
      const reason = `Page unreachable: ${resolved.reachError}`
      return {
        status: 'failed',
        errorMessage: auditLog({ reach: false, fill: false, submit: false, confirm: false, reason }),
        auditJson: auditJson({ reach: false, fill: false, submit: false, confirm: false, reason }),
        resolvedUrl,
        channelUsed: 'manual'
      }
    }

    const deadReason = await detectDeadListing(page, resolvedUrl)
    if (deadReason) {
      logger.warn(`[Apply #${appId}] Dead listing detected: ${deadReason}`)
      const shot = path.join(evidenceDir, `${appId}_expired.png`)
      await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
      await browser.close()
      const reason = `Listing expired or removed (${deadReason})`
      return {
        status: 'expired',
        errorMessage: auditLog({ reach: true, fill: false, submit: false, confirm: false, reason }),
        auditJson: auditJson({ reach: true, fill: false, submit: false, confirm: false, reason }),
        evidenceScreenshotPath: shot,
        resolvedUrl,
        channelUsed: 'manual'
      }
    }

    // Reveal application form if on landing page
    const hasEmailInput = await page.$('input[type="email"], input[name*="email" i]')
    const hasAtsIframe = await page.$('iframe[src*="greenhouse"], iframe[src*="boards"], iframe[src*="lever.co"], iframe[src*="job_app"]')

    if (!hasEmailInput && !hasAtsIframe) {
      const applyBtnHandle = await page.evaluateHandle(() => {
        const els = Array.from(document.querySelectorAll('button, a, [role="button"]'))
        return els.find(el => {
          const text = (el.innerText || el.value || '').toLowerCase()
          return text.includes('apply now') || 
                 text.includes('apply for this role') || 
                 text.includes('apply to this job') ||
                 text.includes('submit your application') ||
                 text.includes('apply')
        })
      }).catch(() => null)

      if (applyBtnHandle) {
        const btn = applyBtnHandle.asElement()
        if (btn) {
          logger.info(`[Apply #${appId}] Landing page CTA detected. Clicking to reveal form...`)
          await btn.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {})
          await sleep(500)
          await btn.click()
          await sleep(3500)

          resolvedUrl = page.url()
          platform = classifyUrl(resolvedUrl)
        }
      }
    }

    // Form fill execution
    let fillResult
    if (platform === 'greenhouse' || /greenhouse|gh_jid|job_app/i.test(resolvedUrl)) {
      fillResult = await fillGreenhouse(page, candidateProfile, resumeFilePath, appId, evidenceDir)
    } else if (platform === 'lever' || /lever\.co/i.test(resolvedUrl)) {
      fillResult = await fillLever(page, candidateProfile, resumeFilePath, appId, evidenceDir)
    } else {
      // Check if page has any ATS iframe or email input before assuming Greenhouse
      const hasEmailOrFrame = await page.$('input[type="email"], input[name*="email" i], iframe[src*="greenhouse"], iframe[src*="lever"]')
      if (hasEmailOrFrame) {
        fillResult = await fillGreenhouse(page, candidateProfile, resumeFilePath, appId, evidenceDir)
      } else {
        const host = (() => {
          try { return new URL(resolvedUrl).hostname } catch { return 'external portal' }
        })()
        const isWorkday = /workday/i.test(resolvedUrl) || platform === 'workday'
        const reason = isWorkday
          ? 'Workday portal requires candidate authentication/account creation. Please apply via direct link.'
          : `External career portal (${host}) requires manual completion or employer login.`
        
        const shot = path.join(evidenceDir, `${appId}_manual_required.png`)
        await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
        await browser.close()

        logger.info(`[Apply #${appId}] Non-ATS page detected (${host}) — marking manual_required`)
        return {
          status: 'manual_required',
          errorMessage: auditLog({ reach: true, fill: false, submit: false, confirm: false, reason }),
          auditJson: auditJson({ reach: true, fill: false, submit: false, confirm: false, reason }),
          evidenceScreenshotPath: shot,
          resolvedUrl,
          channelUsed: 'manual'
        }
      }
    }

    if (!fillResult || fillResult.status !== 'ready') {
      await browser.close()
      return {
        ...fillResult,
        status: fillResult?.status || 'failed',
        resolvedUrl,
        channelUsed: `${platform || 'greenhouse'}-playwright`,
        adapterVersion: ADAPTER_VERSION
      }
    }

    const { frame } = fillResult
    await sleep(1000)

    // Submit form
    const submitBtnSelector = 'button[type="submit"], input[type="submit"], #btn-submit, #submit_app, .btn-submit'
    const finalSubmitBtn = await frame.waitForSelector(submitBtnSelector, { timeout: 5000 }).catch(() => null)

    if (finalSubmitBtn) {
      await finalSubmitBtn.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {})
      await sleep(500)
      await finalSubmitBtn.click()
    } else {
      await fillResult.submitBtn.click()
    }
    await sleep(6000)

    // Capture Evidence & Verify Real Confirmation (Rule 2)
    const confirmation = await verifyConfirmationSignal(page, frame)
    const shot = path.join(evidenceDir, `${appId}.png`)
    const html = path.join(evidenceDir, `${appId}.html`)
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
    const pageHtml = await frame.content().catch(() => '')
    writeFileSync(html, pageHtml)
    await browser.close()

    if (confirmation.confirmed) {
      logger.info(`[Apply #${appId}] ✅ Verified Applied! Signal: ${confirmation.signal}`)
      return {
        status:                 'applied',
        screenshotPath:         `/api/domination/evidence/${appId}.png`,
        htmlPath:               `/api/domination/evidence/${appId}.html`,
        evidenceScreenshotPath: shot,
        channelUsed:            `${platform || 'greenhouse'}-playwright`,
        adapterVersion:         ADAPTER_VERSION,
        submittedAt:            new Date().toISOString(),
        confirmedSuccessSignal: confirmation.signal,
        resolvedUrl:            confirmation.confirmationUrl || page.url(),
        auditJson:              auditJson({ reach: true, fill: true, submit: true, confirm: true, evidence: confirmation.signal }),
      }
    }

    // Inconclusive or unconfirmed -> Mark as failed
    logger.warn(`[Apply #${appId}] ⚠️ Submission unconfirmed. Reason: ${confirmation.reason}`)
    return {
      status:                 'failed',
      errorMessage:           auditLog({ reach: true, fill: true, submit: true, confirm: false, reason: confirmation.reason }),
      auditJson:              auditJson({ reach: true, fill: true, submit: true, confirm: false, reason: confirmation.reason }),
      screenshotPath:         `/api/domination/evidence/${appId}.png`,
      htmlPath:               `/api/domination/evidence/${appId}.html`,
      evidenceScreenshotPath: shot,
      channelUsed:            `${platform || 'greenhouse'}-playwright`,
      adapterVersion:         ADAPTER_VERSION,
      resolvedUrl:            page.url(),
    }

  } catch (err) {
    logger.error(`[Apply #${appId}] Unhandled exception: ${err.message}`)
    let shotUrl = null, shotLocal = null

    if (browser) {
      try {
        const [pg] = await browser.pages()
        const shot = path.join(evidenceDir, `${appId}_error.png`)
        await Promise.race([pg.screenshot({ path: shot, fullPage: true }), sleep(4000)]).catch(() => {})
        shotLocal = shot
        shotUrl   = `/api/domination/evidence/${appId}_error.png`
      } catch { /* ignore */ }
      await browser.close().catch(() => {})
    }

    return {
      status:                 'failed',
      errorMessage:           auditLog({ reach: !!resolvedUrl, fill: false, submit: false, confirm: false, reason: `Runtime error: ${err.message}` }),
      auditJson:              auditJson({ reach: !!resolvedUrl, fill: false, submit: false, confirm: false, reason: err.message }),
      screenshotPath:         shotUrl,
      evidenceScreenshotPath: shotLocal,
      channelUsed:            `${platform || 'greenhouse'}-playwright`,
      adapterVersion:         ADAPTER_VERSION,
      resolvedUrl,
    }
  }
}
