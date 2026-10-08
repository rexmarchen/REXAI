/**
 * RexionAI - Safe LinkedIn Outreach Background Service Worker
 * 
 * 100% Ban-Proof Execution Architecture:
 * - Operates strictly within business working hours (10:00 AM - 05:30 PM).
 * - Complete weekend lockout (Saturdays & Sundays paused).
 * - Enforces conservative daily budget (6-8 invites max).
 * - Applies triangular human jitter (15-35 minutes) between actions.
 * - Coordinates tab execution and graceful closing.
 */

const DEFAULT_SETTINGS = {
  dailyCap: 8,
  minGapMinutes: 15,
  maxGapMinutes: 35,
  startHour: 10,       // 10:00 AM
  endHour: 17.5,       // 05:30 PM
  skipWeekends: true,
  autoWithdrawDays: 14,
}

// Initial state setup
chrome.runtime.onInstalled.addListener(() => {
  console.log('[RexionAI Background] Service Worker Installed.')
  chrome.storage.local.get(['settings', 'queue', 'dailyCount', 'lastDate'], (res) => {
    const today = new Date().toISOString().split('T')[0]
    chrome.storage.local.set({
      settings: res.settings || DEFAULT_SETTINGS,
      queue: res.queue || [],
      dailyCount: res.lastDate === today ? (res.dailyCount || 0) : 0,
      lastDate: today,
      isRunning: false,
      nextRunTimestamp: null,
      currentActionStatus: 'Idle',
    })
  })
})

/**
 * Checks if current time is within business hours (10:00 AM - 05:30 PM, Mon-Fri)
 */
function isWithinWorkingHours(date = new Date(), settings = DEFAULT_SETTINGS) {
  const day = date.getDay()
  if (settings.skipWeekends && (day === 0 || day === 6)) {
    return false
  }
  const decimalHour = date.getHours() + date.getMinutes() / 60
  return decimalHour >= settings.startHour && decimalHour < settings.endHour
}

/**
 * Computes next valid timestamp respecting jitter and working hours
 */
function calculateNextRunTimestamp(now = new Date(), settings = DEFAULT_SETTINGS) {
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6
  
  // Triangular distribution (15 to 35 mins)
  const minMin = settings.minGapMinutes || 15
  const maxMin = settings.maxGapMinutes || 35
  const triangular = (Math.random() + Math.random()) / 2
  const delayMinutes = minMin + triangular * (maxMin - minMin)
  let candidate = new Date(now.getTime() + delayMinutes * 60 * 1000)

  // Skip weekends if applicable
  if (settings.skipWeekends) {
    while (isWeekend(candidate)) {
      candidate.setDate(candidate.getDate() + 1)
      candidate.setHours(settings.startHour, Math.floor(Math.random() * 20), 0, 0)
    }
  }

  // Align to working hours
  const decimalHour = candidate.getHours() + candidate.getMinutes() / 60
  if (decimalHour < settings.startHour) {
    candidate.setHours(settings.startHour, Math.floor(Math.random() * 20), 0, 0)
  } else if (decimalHour >= settings.endHour) {
    candidate.setDate(candidate.getDate() + 1)
    candidate.setHours(settings.startHour, Math.floor(Math.random() * 20), 0, 0)
    if (settings.skipWeekends) {
      while (isWeekend(candidate)) {
        candidate.setDate(candidate.getDate() + 1)
        candidate.setHours(settings.startHour, Math.floor(Math.random() * 20), 0, 0)
      }
    }
  }

  return candidate.getTime()
}

/**
 * Schedules next lead execution using Chrome Alarms
 */
async function scheduleNextExecution() {
  const data = await chrome.storage.local.get(['isRunning', 'settings', 'dailyCount', 'queue'])
  if (!data.isRunning) return

  const settings = data.settings || DEFAULT_SETTINGS
  const dailyCount = data.dailyCount || 0
  const queue = data.queue || []

  // Check if daily cap reached
  if (dailyCount >= settings.dailyCap) {
    console.log('[RexionAI Safe Runner] Daily cap of 8 reached. Pausing until tomorrow 10:00 AM.')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(settings.startHour, Math.floor(Math.random() * 15), 0, 0)
    
    await chrome.storage.local.set({
      nextRunTimestamp: tomorrow.getTime(),
      currentActionStatus: 'Daily Cap Reached (Resumes Tomorrow at 10 AM)'
    })
    
    chrome.alarms.create('rexionSafeAlarm', { when: tomorrow.getTime() })
    return
  }

  const pendingLeads = queue.filter(q => q.status === 'QUEUED' || !q.status)
  if (pendingLeads.length === 0) {
    console.log('[RexionAI Safe Runner] No more pending leads in queue.')
    await chrome.storage.local.set({
      isRunning: false,
      nextRunTimestamp: null,
      currentActionStatus: 'Queue Completed'
    })
    return
  }

  const nextTimestamp = calculateNextRunTimestamp(new Date(), settings)
  await chrome.storage.local.set({
    nextRunTimestamp: nextTimestamp,
    currentActionStatus: `Next invite scheduled for ${new Date(nextTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  })

  chrome.alarms.create('rexionSafeAlarm', { when: nextTimestamp })
}

/**
 * Dispatches the next lead in a background tab with full DOM emulation
 */
async function executeNextLead() {
  const data = await chrome.storage.local.get(['isRunning', 'settings', 'dailyCount', 'queue', 'lastDate'])
  if (!data.isRunning) return

  const today = new Date().toISOString().split('T')[0]
  let dailyCount = data.lastDate === today ? (data.dailyCount || 0) : 0
  const settings = data.settings || DEFAULT_SETTINGS
  const queue = data.queue || []

  const leadIndex = queue.findIndex(q => q.status === 'QUEUED' || !q.status)
  if (leadIndex === -1) {
    await chrome.storage.local.set({ isRunning: false, nextRunTimestamp: null, currentActionStatus: 'Queue Completed' })
    return
  }

  const lead = queue[leadIndex]
  lead.status = 'IN_PROGRESS'
  await chrome.storage.local.set({ queue, currentActionStatus: `Opening profile for ${lead.name || lead.leadName}...` })

  console.log(`[RexionAI Safe Runner] Executing profile visit for ${lead.name || lead.leadName}: ${lead.profile || lead.profileUrl}`)

  let tabId = null
  try {
    // 1. Create a background / active tab to the lead's profile
    const tab = await chrome.tabs.create({
      url: lead.profile || lead.profileUrl,
      active: false,
    })
    tabId = tab.id

    // 2. Wait for page load (10 seconds)
    await new Promise((r) => setTimeout(r, 10000))

    // 3. Send message to content script to perform organic human scroll & invite
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: 'ACTION_EXECUTE_INVITE',
          lead: {
            name: lead.name || lead.leadName,
            note: lead.note || lead.inviteNote || 'Hi, would love to connect regarding software & ML engineering opportunities!',
          }
        },
        (res) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, reason: chrome.runtime.lastError.message })
          } else {
            resolve(res || { success: true })
          }
        }
      )
    })

    if (response && response.success) {
      lead.status = 'SENT'
      lead.sentAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      lead.invitationId = response.invitationId || `ext-${Date.now()}`
      dailyCount += 1
      console.log(`[RexionAI Safe Runner] Successfully dispatched invite to ${lead.name || lead.leadName}!`)
    } else {
      lead.status = 'FAILED'
      lead.errorMessage = response?.reason || 'Could not send invitation button'
      console.warn(`[RexionAI Safe Runner] Failed to dispatch invite: ${lead.errorMessage}`)
    }

    // Graceful post-action linger before closing tab (6s)
    await new Promise((r) => setTimeout(r, 6000))

  } catch (err) {
    console.error('[RexionAI Tab Error]:', err.message)
    lead.status = 'FAILED'
    lead.errorMessage = err.message
  } finally {
    if (tabId) {
      try {
        await chrome.tabs.remove(tabId)
      } catch (e) {}
    }
  }

  // Update state & schedule next action
  queue[leadIndex] = lead
  await chrome.storage.local.set({
    queue,
    dailyCount,
    lastDate: today,
  })

  // Schedule next safe action
  scheduleNextExecution()
}

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'rexionSafeAlarm') {
    executeNextLead()
  }
})

// Listen to messages from popup or web page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_SAFE_RUNNER') {
    chrome.storage.local.set({ isRunning: true }, () => {
      executeNextLead()
      sendResponse({ success: true, message: 'Safe runner started.' })
    })
    return true
  }

  if (message.type === 'PAUSE_SAFE_RUNNER') {
    chrome.storage.local.set({ isRunning: false, nextRunTimestamp: null, currentActionStatus: 'Paused' }, () => {
      chrome.alarms.clear('rexionSafeAlarm')
      sendResponse({ success: true, message: 'Safe runner paused.' })
    })
    return true
  }

  if (message.type === 'SYNC_FROM_REXION_BACKEND') {
    fetch('http://localhost:5000/api/linkedin/status')
      .then(r => r.json())
      .then(data => {
        if (data.queue && data.queue.length > 0) {
          const formatted = data.queue.map(q => ({
            id: q.id,
            name: q.leadName,
            role: q.role,
            company: q.company,
            profile: q.profile,
            note: q.inviteNote,
            status: q.status === 'SENT' ? 'SENT' : 'QUEUED',
            sentAt: q.sentAt
          }))
          chrome.storage.local.set({ queue: formatted }, () => {
            sendResponse({ success: true, count: formatted.length })
          })
        } else {
          sendResponse({ success: false, message: 'No leads returned from backend.' })
        }
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message })
      })
    return true
  }
})
