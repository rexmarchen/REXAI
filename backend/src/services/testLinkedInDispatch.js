import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/node.js'
import fs from 'fs'

export async function testLinkedInDirectLogin(email, password) {
  console.log(`[LinkedIn Automation] Initializing browser session for ${email}...`)
  
  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

    console.log('[LinkedIn Automation] Navigating to LinkedIn Login...')
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 })

    await page.type('#username', email, { delay: 60 })
    await page.type('#password', password, { delay: 60 })

    console.log('[LinkedIn Automation] Submitting credentials...')
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
    ])

    const currentUrl = page.url()
    console.log('[LinkedIn Automation] Resulting URL:', currentUrl)

    if (currentUrl.includes('/feed') || currentUrl.includes('/check/identity') || currentUrl.includes('/challenge')) {
      const cookies = await page.cookies()
      const liAtCookie = cookies.find(c => c.name === 'li_at')

      if (liAtCookie) {
        console.log('[LinkedIn Automation] Successfully extracted active session cookie (li_at)!')
        return {
          success: true,
          status: 'AUTHENTICATED',
          cookie: liAtCookie.value,
          currentUrl
        }
      }
      
      if (currentUrl.includes('/challenge') || currentUrl.includes('/checkpoint')) {
        console.log('[LinkedIn Security] LinkedIn requested a 2FA/Email verification code (Checkpoint).')
        return {
          success: false,
          status: 'VERIFICATION_REQUIRED',
          message: 'LinkedIn sent a 6-digit security verification PIN to pookii2316@gmail.com.',
          currentUrl
        }
      }
    }

    return {
      success: true,
      currentUrl
    }
  } catch (err) {
    console.error('[LinkedIn Error]', err.message)
    return {
      success: false,
      error: err.message
    }
  } finally {
    if (browser) await browser.close()
  }
}
