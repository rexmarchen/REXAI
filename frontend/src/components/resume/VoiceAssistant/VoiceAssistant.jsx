import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './VoiceAssistant.module.css'

const VoiceAssistant = ({
  message,
  title = 'AI Voice Assistant',
  description = 'The assistant explains your weaknesses and improvement priorities automatically.',
  autoPlay = true
}) => {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const cleanedMessage = useMemo(() => String(message || '').trim(), [message])

  useEffect(() => {
    const canSpeak =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined'
    setSupported(canSpeak)
  }, [])

  const stop = useCallback(() => {
    if (!supported) {
      return
    }
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(() => {
    if (!supported || !cleanedMessage) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new window.SpeechSynthesisUtterance(cleanedMessage)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    const englishVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => String(voice.lang || '').toLowerCase().startsWith('en'))

    if (englishVoice) {
      utterance.voice = englishVoice
    }

    window.speechSynthesis.speak(utterance)
  }, [supported, cleanedMessage])

  useEffect(() => {
    if (!supported || !cleanedMessage || !autoPlay) {
      return
    }

    speak()
    return () => {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [supported, cleanedMessage, autoPlay, speak])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>{title}</h4>
        {!supported && <span className={styles.unsupported}>Voice not supported on this browser.</span>}
      </div>
      <p className={styles.copy}>{description}</p>
      <p className={styles.status}>
        {supported
          ? speaking
            ? 'Speaking now...'
            : 'Ready to speak.'
          : 'Switch to a supported browser to enable voice playback.'}
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={speak}
          disabled={!supported || !cleanedMessage}
        >
          Play
        </button>
        <button type="button" className={styles.button} onClick={stop} disabled={!supported || !speaking}>
          Stop
        </button>
      </div>
    </div>
  )
}

export default VoiceAssistant
