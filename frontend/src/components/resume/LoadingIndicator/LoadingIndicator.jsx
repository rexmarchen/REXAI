import React from 'react'
import styles from './LoadingIndicator.module.css'

const LoadingIndicator = () => {
  return (
    <div className={styles.loaderWrap}>
      <div className={styles.spinner} />
      <p className={styles.text}>Processing...</p>
    </div>
  )
}

export default LoadingIndicator
