import React, { useEffect, useRef, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID } from '../../config/googleAuth'
import styles from './GoogleSignInButton.module.css'

const GoogleSignInButton = ({ text = 'continue_with', disabled = false, onCredential }) => {
  const mountRef = useRef(null)
  const [helperMessage, setHelperMessage] = useState('')
  const [buttonWidth, setButtonWidth] = useState(320)

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

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.helper}>
          Google sign-in is unavailable until `VITE_GOOGLE_CLIENT_ID` is configured.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div ref={mountRef} className={`${styles.surface} ${disabled ? styles.disabled : ''}`}>
        <GoogleLogin
          onSuccess={(response) => {
            if (!response?.credential) {
              setHelperMessage('Google sign-in did not return a credential. Please try again.')
              return
            }

            setHelperMessage('')
            onCredential?.(response.credential)
          }}
          onError={() => {
            setHelperMessage('Google sign-in could not load. Refresh the page and try again.')
          }}
          ux_mode="popup"
          context={text === 'signup_with' ? 'signup' : 'signin'}
          cancel_on_tap_outside={false}
          auto_select={false}
          type="standard"
          theme="outline"
          size="large"
          text={text}
          shape="pill"
          width={buttonWidth}
          logo_alignment="left"
          containerProps={{
            className: styles.mount,
            'aria-live': 'polite'
          }}
        />
      </div>
      {helperMessage && <p className={styles.helper}>{helperMessage}</p>}
    </div>
  )
}

export default GoogleSignInButton
