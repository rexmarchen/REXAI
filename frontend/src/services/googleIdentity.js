const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let googleIdentityScriptPromise = null

export const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Identity Services is only available in the browser.'))
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google)
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`)

    if (script && script.getAttribute('data-loaded') !== 'true') {
      script.parentNode?.removeChild(script)
      script = null
    }

    const handleLoad = () => {
      script?.setAttribute('data-loaded', 'true')
      if (window.google?.accounts?.id) {
        resolve(window.google)
        return
      }

      reject(new Error('Google Identity Services loaded without the expected API.'))
    }

    const handleError = () => {
      reject(new Error('Unable to load Google Identity Services.'))
    }

    if (script) {
      if (script.getAttribute('data-loaded') === 'true') {
        handleLoad()
        return
      }

      script.addEventListener('load', handleLoad, { once: true })
      script.addEventListener('error', handleError, { once: true })
      return
    }

    script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => {
      script?.setAttribute('data-loaded', 'true')
      handleLoad()
    }, { once: true })
    script.addEventListener('error', handleError, { once: true })
    document.head.appendChild(script)
  }).catch((error) => {
    googleIdentityScriptPromise = null
    throw error
  })

  return googleIdentityScriptPromise
}
