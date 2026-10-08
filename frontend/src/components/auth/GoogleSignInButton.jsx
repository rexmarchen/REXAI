import React, { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../../config/googleAuth'
import styles from './GoogleSignInButton.module.css'

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client'
let googleScriptPromise = null
let initializedGoogleClientId = ''
let googleCredentialListener = null

const missingGoogleSetupMessage =
  'Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured on the frontend and the same client ID is allowed for this localhost origin in Google Cloud.'

const isGoogleIdentityReady = () =>
  typeof window !== 'undefined' && Boolean(window.google?.accounts?.id)

const waitForGoogleIdentity = (timeoutMs = 10000) =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now()

    const poll = () => {
      if (isGoogleIdentityReady()) {
        resolve(window.google.accounts.id)
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error('Google Identity Services did not finish loading in time.'))
        return
      }

      window.setTimeout(poll, 50)
    }

    poll()
  })

const loadGoogleIdentityScript = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Google Identity Services requires a browser environment.')
  }

  if (isGoogleIdentityReady()) {
    return window.google.accounts.id
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_GSI_SRC}"]`)

      if (!existingScript) {
        const script = document.createElement('script')
        script.src = GOOGLE_GSI_SRC
        script.async = true
        script.defer = true
        script.onerror = () => {
          googleScriptPromise = null
          reject(new Error('Google Identity Services failed to load.'))
        }
        document.head.appendChild(script)
      }

      waitForGoogleIdentity().then(resolve).catch((error) => {
        googleScriptPromise = null
        reject(error)
      })
    })
  }

  return googleScriptPromise
}

const ensureGoogleIdentityInitialized = async ({ clientId, onCredential }) => {
  const googleIdentity = await loadGoogleIdentityScript()
  googleCredentialListener = onCredential

  if (initializedGoogleClientId !== clientId) {
    googleIdentity.initialize({
      client_id: clientId,
      callback: (response) => {
        const credential = String(response?.credential || '').trim()
        googleCredentialListener?.(credential)
      },
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: false
    })

    initializedGoogleClientId = clientId
  }

  return googleIdentity
}

const GoogleSignInButton = ({ text = 'continue_with', disabled = false, onCredential }) => {
  const mountRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [helperMessage, setHelperMessage] = useState('')
  const [buttonWidth, setButtonWidth] = useState(320)

  useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!mountRef.current) {
      return undefined
    }

    const syncWidth = () => {
      setButtonWidth(Math.min(mountRef.current?.offsetWidth || 320, 360))
    }

    syncWidth()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncWidth)

      return () => {
        window.removeEventListener('resize', syncWidth)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      syncWidth()
    })

    resizeObserver.observe(mountRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!mountRef.current || !GOOGLE_CLIENT_ID) {
      return undefined
    }

    let isCancelled = false

    const handleCredential = (credential) => {
      if (isCancelled) {
        return
      }

      if (!credential) {
        setHelperMessage('Google sign-in did not return a credential. Please try again.')
        return
      }

      setHelperMessage('')
      onCredentialRef.current?.(credential)
    }

    const renderGoogleButton = async () => {
      try {
        const googleIdentity = await ensureGoogleIdentityInitialized({
          clientId: GOOGLE_CLIENT_ID,
          onCredential: handleCredential
        })

        if (isCancelled || !mountRef.current) {
          return
        }

        mountRef.current.replaceChildren()
        googleIdentity.renderButton(mountRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'pill',
          width: buttonWidth,
          logo_alignment: 'left'
        })
      } catch {
        if (!isCancelled) {
          setHelperMessage(
            'Google sign-in could not load. Make sure this origin is listed in the Google OAuth client and that the same client ID is configured on both frontend and backend.'
          )
        }
      }
    }

    void renderGoogleButton()

    return () => {
      isCancelled = true

      if (googleCredentialListener === handleCredential) {
        googleCredentialListener = null
      }

      mountRef.current?.replaceChildren()
    }
  }, [buttonWidth, text])

  if (!GOOGLE_CLIENT_ID) {
    if (import.meta.env.DEV) {
      // Log once to console for developer guidance without degrading user UI
      // console.info('[Auth] Google OAuth is not configured (VITE_GOOGLE_CLIENT_ID is empty).')
    }
    return null
  }

  return (
    <div className={styles.wrapper}>
      <div
        ref={mountRef}
        className={`${styles.surface} ${disabled ? styles.disabled : ''} ${styles.mount}`}
        aria-live="polite"
      />
      {helperMessage && <p className={styles.helper}>{helperMessage}</p>}
    </div>
  )
}

export default GoogleSignInButton
