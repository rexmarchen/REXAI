/**
 * REXION AI Lightweight Privacy-Friendly Analytics
 * Respects 'Do Not Track' and user cookie consent.
 */

const STORAGE_KEY = 'rexion_cookie_consent'

function hasTrackingConsent() {
  try {
    if (typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || window.doNotTrack === '1')) {
      return false
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return true // Default soft telemetry or wait for banner
    const parsed = JSON.parse(stored)
    return parsed.status === 'all'
  } catch {
    return false
  }
}

class AnalyticsService {
  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 15)
    this.sessionStart = Date.now()
  }

  trackPageView(path) {
    if (!hasTrackingConsent()) return
    const eventData = {
      type: 'page_view',
      path: path || (typeof window !== 'undefined' ? window.location.pathname : ''),
      title: typeof document !== 'undefined' ? document.title : '',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    }

    // In dev / client environment, dispatch custom event and log if debug
    if (import.meta.env.DEV) {
      // console.debug('[Analytics:PageView]', eventData)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rexion:pageview', { detail: eventData }))
    }
  }

  trackEvent(eventName, properties = {}) {
    if (!hasTrackingConsent()) return
    const eventData = {
      type: 'event',
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }

    if (import.meta.env.DEV) {
      // console.debug('[Analytics:Event]', eventName, eventData)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rexion:event', { detail: eventData }))
    }
  }
}

export const analytics = new AnalyticsService()
export default analytics
