import React, { useEffect } from 'react'
import rexProHtml from './rex-pro.html?raw'
import styles from './RexPro.module.css'

const RexPro = () => {
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')
  ).replace(/\/+$/, '')
  const renderedHtml = rexProHtml.replaceAll('__REXION_API_BASE_URL__', encodeURIComponent(apiBaseUrl))

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'REX PRO'

    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <section className={styles.page}>
      <iframe
        title="REX PRO"
        className={styles.frame}
        srcDoc={renderedHtml}
      />
    </section>
  )
}

export default RexPro
