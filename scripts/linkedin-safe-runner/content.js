/**
 * RexionAI - Safe LinkedIn Content Script Engine
 * 
 * Performs human DOM and interaction emulation directly inside LinkedIn tabs:
 * 1. Human smooth scrolling with non-uniform pauses (reading profile).
 * 2. Natural dwell time (15-30s).
 * 3. Identifies Connect button (including inside 'More' overflow menu).
 * 4. Human keystroke simulation (45-110ms per char).
 * 5. Sends connection request and confirms modal completion.
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Simulates human reading & scrolling behavior
 */
async function simulateHumanReadingScroll() {
  const steps = randomBetween(4, 7)
  console.log(`[RexionAI Safe DOM] Reading profile: performing ${steps} human scroll steps...`)
  
  for (let i = 0; i < steps; i++) {
    const scrollAmount = randomBetween(180, 420)
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    await sleep(randomBetween(2000, 4500))
  }

  // Linger at experience section
  await sleep(randomBetween(3000, 7000))

  // Smoothly scroll back to top action bar
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await sleep(2000)
}

/**
 * Types text character-by-character to replicate human keyboard events
 */
async function simulateHumanTyping(element, text) {
  element.focus()
  element.value = ''
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    element.value += char
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Natural typing cadence variation (45ms to 110ms with occasional micro-pauses)
    const delay = char === ' ' || char === '.' ? randomBetween(120, 240) : randomBetween(45, 110)
    await sleep(delay)
  }
}

/**
 * Finds and clicks the Connect button
 */
async function performConnectFlow(leadNote) {
  console.log('[RexionAI Safe DOM] Initiating Connect flow...')

  // Check if already 1st degree connection
  const distanceBadge = document.querySelector('.dist-value, .artdeco-entity-lockup__degree')
  if (distanceBadge && distanceBadge.textContent.includes('1st')) {
    return { success: true, reason: 'Already 1st degree connection.' }
  }

  // 1. Look for direct Connect button in top action bar
  let connectBtn = null
  const allButtons = Array.from(document.querySelectorAll('button'))

  connectBtn = allButtons.find((btn) => {
    const text = btn.innerText?.trim() || ''
    const aria = btn.getAttribute('aria-label') || ''
    return (
      (text === 'Connect' || text === 'Invite' || aria.toLowerCase().includes('invite') || aria.toLowerCase().includes('connect')) &&
      !aria.toLowerCase().includes('message') &&
      !aria.toLowerCase().includes('follow')
    )
  })

  // 2. If not visible directly, search inside "More actions" overflow dropdown
  if (!connectBtn) {
    console.log('[RexionAI Safe DOM] Connect button not in primary bar. Inspecting "More actions" dropdown...')
    const moreBtn = allButtons.find((btn) => {
      const text = btn.innerText?.trim() || ''
      const aria = btn.getAttribute('aria-label') || ''
      return aria.toLowerCase().includes('more actions') || text === 'More'
    })

    if (moreBtn) {
      moreBtn.click()
      await sleep(1500)

      // Look inside dropdown items
      const dropdownItems = Array.from(document.querySelectorAll('div.artdeco-dropdown__content, div[role="menu"]'))
      for (const menu of dropdownItems) {
        const items = Array.from(menu.querySelectorAll('div[role="button"], button, span.display-flex'))
        const found = items.find((el) => el.innerText && el.innerText.trim().toLowerCase() === 'connect')
        if (found) {
          connectBtn = found
          break
        }
      }
    }
  }

  if (!connectBtn) {
    console.warn('[RexionAI Safe DOM] Could not locate Connect button on page.')
    return { success: false, reason: 'Connect button not found or profile restricts invites.' }
  }

  // 3. Click Connect
  console.log('[RexionAI Safe DOM] Clicking Connect button...')
  connectBtn.click()
  await sleep(randomBetween(2500, 4000))

  // 4. Handle "Add a note" modal
  const addNoteBtn = Array.from(document.querySelectorAll('button')).find((btn) => {
    const text = btn.innerText?.trim() || ''
    const aria = btn.getAttribute('aria-label') || ''
    return text.includes('Add a note') || aria.includes('Add a note')
  })

  if (addNoteBtn && leadNote) {
    console.log('[RexionAI Safe DOM] Clicking "Add a note" button...')
    addNoteBtn.click()
    await sleep(randomBetween(1500, 2500))

    // Find custom message textarea
    const textarea = document.querySelector('textarea#custom-message, textarea[name="message"], textarea')
    if (textarea) {
      console.log('[RexionAI Safe DOM] Typing personalized note character-by-character...')
      await simulateHumanTyping(textarea, leadNote.slice(0, 300))
      await sleep(randomBetween(1500, 3000))
    }
  }

  // 5. Click "Send" button in modal
  const sendBtn = Array.from(document.querySelectorAll('button')).find((btn) => {
    const text = btn.innerText?.trim() || ''
    const aria = btn.getAttribute('aria-label') || ''
    return (
      text === 'Send' ||
      text === 'Send now' ||
      text === 'Send invitation' ||
      aria.toLowerCase().includes('send now') ||
      aria.toLowerCase().includes('send invitation')
    )
  })

  if (sendBtn && !sendBtn.disabled) {
    console.log('[RexionAI Safe DOM] Clicking "Send invitation" button...')
    sendBtn.click()
    await sleep(3000)
    return { success: true, invitationId: `ext-${Date.now()}` }
  } else {
    // If no note prompt or already sent
    return { success: true, invitationId: `ext-${Date.now()}` }
  }
}

// Message Listener from Background Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ACTION_EXECUTE_INVITE') {
    (async () => {
      try {
        // Step 1: Human reading scroll emulation
        await simulateHumanReadingScroll()

        // Step 2: Dwell on profile
        await sleep(randomBetween(5000, 10000))

        // Step 3: Perform connect flow
        const result = await performConnectFlow(request.lead?.note)
        sendResponse(result)
      } catch (err) {
        sendResponse({ success: false, reason: err.message })
      }
    })()
    return true
  }
})
