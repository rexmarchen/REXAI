import React, { useEffect, useRef, useState } from 'react'
import { loadGoogleIdentityScript } from '../../services/googleIdentity'
import styles from './GoogleSignInButton.module.css'

const getUnavailableMessage = () => {
  return 'Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured.'
}

const GoogleSignInButton = ({ clientId, text = 'continue_with', disabled = false, onCredential }) => {
  const buttonRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [helperMessage, setHelperMessage] = useState('')

  useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let isActive = true

    const mountButton = async () => {
      if (!clientId) {
        setHelperMessage(getUnavailableMessage())
        return
      }

      try {
        setHelperMessage('')
        await loadGoogleIdentityScript()

        if (!isActive || !buttonRef.current || !window.google?.accounts?.id) {
          return
        }

        buttonRef.current.innerHTML = ''
        const buttonWidth = Math.min(buttonRef.current.offsetWidth || 320, 360)

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential) {
              setHelperMessage('Google sign-in did not return a credential. Please try again.')
              return
            }

            setHelperMessage('')
            onCredentialRef.current?.(response.credential)
          },
          ux_mode: 'popup',
          context: text === 'signup_with' ? 'signup' : 'signin',
          cancel_on_tap_outside: false,
          auto_select: false
        })

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'pill',
          width: buttonWidth,
          logo_alignment: 'left'
        })
      } catch {
        if (!isActive) {
          return
        }

        setHelperMessage('Google sign-in could not load. Refresh the page after setting the client ID.')
      }
    }

    mountButton()

    return () => {
      isActive = false

      if (buttonRef.current) {
        buttonRef.current.innerHTML = ''
      }
    }
  }, [clientId, text])

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.surface} ${disabled ? styles.disabled : ''}`}>
        <div ref={buttonRef} className={styles.mount} aria-live="polite" />
      </div>
      {helperMessage && <p className={styles.helper}>{helperMessage}</p>}
    </div>
  )
}

export default GoogleSignInButton
