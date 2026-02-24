import React from 'react'
import styles from './GeneratedSite.module.css'

const GeneratedSite = ({ url }) => {
  return (
    <div className={styles.site}>
      <h3>Live Preview</h3>
      <iframe
        src={url}
        title="Generated Site"
        className={styles.iframe}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}

export default GeneratedSite