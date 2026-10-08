/**
 * RexionAI Safe Runner - Popup Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn')
  const tabContents = document.querySelectorAll('.tab-content')
  
  const statusBadge = document.getElementById('statusBadge')
  const statusText = document.getElementById('statusText')
  const budgetPill = document.getElementById('budgetPill')
  const progressFill = document.getElementById('progressFill')
  const remainingActions = document.getElementById('remainingActions')
  const countdownTimer = document.getElementById('countdownTimer')
  const actionDetailText = document.getElementById('actionDetailText')
  
  const startBtn = document.getElementById('startBtn')
  const pauseBtn = document.getElementById('pauseBtn')
  const syncBtn = document.getElementById('syncBtn')
  const clearQueueBtn = document.getElementById('clearQueueBtn')
  const queueCount = document.getElementById('queueCount')
  const queueList = document.getElementById('queueList')

  const accountDot = document.getElementById('accountDot')
  const accountLabel = document.getElementById('accountLabel')

  // Check LinkedIn Account Session via active browser cookies
  function checkLinkedInSession() {
    if (chrome.cookies) {
      chrome.cookies.get({ url: 'https://www.linkedin.com', name: 'li_at' }, (cookie) => {
        if (cookie && cookie.value) {
          accountDot.className = 'account-dot dot-green'
          accountLabel.textContent = 'LinkedIn: Connected & Verified'
        } else {
          accountDot.className = 'account-dot dot-amber'
          accountLabel.textContent = 'LinkedIn: Please log in on linkedin.com'
        }
      })
    }
  }

  // Pre-seed default curated tech leads if queue is empty
  const DEFAULT_LEADS = [
    {
      id: 'lead-1',
      name: 'Meenakshi G Shanaiah',
      company: 'Google',
      role: 'Talent Acquisition at Google Operations Center',
      profile: 'https://www.linkedin.com/in/meenakshi-g-shanaiah-23464ba1',
      note: "Hi Meenakshi, saw your tech hiring at Google. I'm a Software & ML Engineer with hands-on experience in high-scale systems. Would love to connect!",
      status: 'QUEUED'
    },
    {
      id: 'lead-2',
      name: 'Ranjana T',
      company: 'Google',
      role: 'Senior Talent Acquisition @ Google',
      profile: 'https://www.linkedin.com/in/ranjana-t-443746181',
      note: "Hi Ranjana, noticed your tech hiring at Google. Excited to connect regarding software & ML engineering openings.",
      status: 'QUEUED'
    },
    {
      id: 'lead-3',
      name: 'Siddharth Pandey',
      company: 'Google',
      role: 'Talent Acquisition Partner',
      profile: 'https://www.linkedin.com/in/siddharthpandey5',
      note: "Hi Siddharth, following Google's AI and cloud engineering updates. Would love to connect regarding software engineer roles!",
      status: 'QUEUED'
    },
    {
      id: 'lead-4',
      name: 'Akshay Pati',
      company: 'Google',
      role: 'Talent Acquisition Specialist',
      profile: 'https://www.linkedin.com/in/akshay-pati-952602128',
      note: "Hi Akshay, saw your engineering hiring at Google. I'm a Full Stack & ML Engineer interested in upcoming opportunities.",
      status: 'QUEUED'
    },
    {
      id: 'lead-5',
      name: 'Mandeep Singhania',
      company: 'Google',
      role: 'Talent Acquisition Manager at Google',
      profile: 'https://www.linkedin.com/in/mandeep-singhania-b50679209',
      note: "Hi Mandeep, following Google's engineering leadership. Excited to connect and exchange insights on software systems.",
      status: 'QUEUED'
    },
    {
      id: 'lead-6',
      name: 'Ritika Rawat',
      company: 'Google',
      role: 'Talent Acquisition Specialist at Google',
      profile: 'https://www.linkedin.com/in/ritika-rawat-22a3ba335',
      note: "Hi Ritika, admire Google's engineering bar. Reaching out to connect regarding software engineering opportunities.",
      status: 'QUEUED'
    },
    {
      id: 'lead-7',
      name: 'Pavani Madishetti',
      company: 'Google',
      role: 'Talent Acquisition Specialist for Google',
      profile: 'https://www.linkedin.com/in/pavani-madishetti-69483311b',
      note: "Hi Pavani, noticed your tech hiring work. Excited to connect and share insights on cloud tech stacks!",
      status: 'QUEUED'
    },
    {
      id: 'lead-8',
      name: 'Gayathri D.',
      company: 'Google Operations Center',
      role: 'Talent Acquisition Specialist',
      profile: 'https://www.linkedin.com/in/gayathri-d-8967bb169',
      note: "Hi Gayathri, saw your tech recruiting work at Google Operations Center. I am a Software & ML Engineer with hands-on systems experience. Would love to connect!",
      status: 'QUEUED'
    }
  ]

  chrome.storage.local.get(['queue'], (res) => {
    if (!res.queue || res.queue.length === 0) {
      chrome.storage.local.set({ queue: DEFAULT_LEADS })
    }
  })

  // Tab navigation
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'))
      tabContents.forEach((c) => c.classList.remove('active'))
      btn.classList.add('active')
      const targetTab = document.getElementById(btn.dataset.tab)
      if (targetTab) targetTab.classList.add('active')
    })
  })

  // Render Queue UI
  function renderQueue(queue = []) {
    queueCount.textContent = queue.length
    if (queue.length === 0) {
      queueList.innerHTML = '<div style="padding: 12px; text-align: center; color: #64748b;">No candidates in queue. Click "Sync from Rexion App".</div>'
      return
    }

    queueList.innerHTML = queue
      .map(
        (lead, idx) => `
      <div class="queue-item">
        <div class="queue-item-top">
          <span>${idx + 1}. ${lead.name || lead.leadName}</span>
          <span style="font-size: 9px; padding: 2px 5px; border-radius: 4px; ${
            lead.status === 'SENT'
              ? 'background: rgba(16,185,129,0.15); color: #10b981;'
              : lead.status === 'IN_PROGRESS'
              ? 'background: rgba(56,189,248,0.15); color: #38bdf8;'
              : 'background: rgba(148,163,184,0.1); color: #94a3b8;'
          }">
            ${lead.status || 'QUEUED'}
          </span>
        </div>
        <div class="queue-item-role">${lead.role || 'Talent Acquisition'} · ${lead.company || 'Tech'}</div>
      </div>
    `
      )
      .join('')
  }

  // Refresh State from Storage
  function updateUI() {
    checkLinkedInSession()
    chrome.storage.local.get(['isRunning', 'dailyCount', 'settings', 'nextRunTimestamp', 'currentActionStatus', 'queue'], (res) => {
      const isRunning = res.isRunning || false
      const dailyCount = res.dailyCount || 0
      const settings = res.settings || { dailyCap: 8 }
      const nextRun = res.nextRunTimestamp
      const queue = res.queue || []

      // 1. Controls
      if (isRunning) {
        startBtn.style.display = 'none'
        pauseBtn.style.display = 'flex'
        statusBadge.className = 'status-pill status-active'
        statusText.textContent = 'Active (Safe Mode)'
      } else {
        startBtn.style.display = 'flex'
        pauseBtn.style.display = 'none'
        statusBadge.className = 'status-pill status-idle'
        statusText.textContent = 'Idle'
      }

      // 2. Daily Budget Progress
      const cap = settings.dailyCap || 8
      budgetPill.textContent = `${dailyCount} / ${cap} Used`
      const percent = Math.min(100, (dailyCount / cap) * 100)
      progressFill.style.width = `${percent}%`
      remainingActions.textContent = `${Math.max(0, cap - dailyCount)} actions remaining today`

      // 3. Queue rendering
      renderQueue(queue)

      // 4. Countdown calculation
      if (isRunning && nextRun && nextRun > Date.now()) {
        const diffSec = Math.max(0, Math.round((nextRun - Date.now()) / 1000))
        const mins = Math.floor(diffSec / 60)
        const secs = diffSec % 60
        countdownTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        actionDetailText.textContent = res.currentActionStatus || 'Next safe human dispatch scheduled.'
      } else if (isRunning) {
        countdownTimer.textContent = '00:00'
        actionDetailText.textContent = res.currentActionStatus || 'Dispatching profile visit...'
      } else {
        countdownTimer.textContent = '--:--'
        actionDetailText.textContent = 'Runner paused. Click Start to begin.'
      }
    })
  }

  // Initial call & live timer ticker
  updateUI()
  const interval = setInterval(updateUI, 1000)

  // Start Button Click
  startBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'START_SAFE_RUNNER' }, () => {
      updateUI()
    })
  })

  // Pause Button Click
  pauseBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'PAUSE_SAFE_RUNNER' }, () => {
      updateUI()
    })
  })

  // Sync Button Click
  syncBtn.addEventListener('click', () => {
    syncBtn.innerHTML = '<span>⏳</span> Syncing...'
    chrome.runtime.sendMessage({ type: 'SYNC_FROM_REXION_BACKEND' }, (res) => {
      syncBtn.innerHTML = '<span>🔄</span> Sync from Rexion App'
      if (res && res.success) {
        alert(`✅ Successfully synced ${res.count} target leads from Rexion AI!`)
      } else {
        alert('⚠️ Could not sync leads. Make sure Rexion backend is running at http://localhost:5000.')
      }
      updateUI()
    })
  })

  // Clear Queue
  clearQueueBtn.addEventListener('click', () => {
    chrome.storage.local.get(['queue'], (res) => {
      const remaining = (res.queue || []).filter((q) => q.status !== 'SENT')
      chrome.storage.local.set({ queue: remaining }, () => {
        updateUI()
      })
    })
  })
})
