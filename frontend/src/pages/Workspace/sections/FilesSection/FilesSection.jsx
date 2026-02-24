import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const FilesSection = () => {
  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Files</h2>
      <p className={styles.pageSubtitle}>
        Organize project files, inspect generated code, and review AI output.
      </p>

      <div className={styles.filesLayout}>
        <aside className={styles.fileTreePane}>
          <div className={styles.fileTree}>
            <div className={`${styles.fileTreeItem} ${styles.fileTreeDir}`}>project-root</div>
            <div className={`${styles.fileTreeItem} ${styles.fileTreeDir}`}>api</div>
            <div className={`${styles.fileTreeItem} ${styles.fileTreeActive}`}>auth.ts</div>
            <div className={styles.fileTreeItem}>routes.ts</div>
            <div className={styles.fileTreeItem}>middleware.ts</div>
            <div className={`${styles.fileTreeItem} ${styles.fileTreeDir}`}>components</div>
            <div className={styles.fileTreeItem}>Button.tsx</div>
            <div className={styles.fileTreeItem}>Modal.tsx</div>
            <div className={styles.fileTreeItem}>package.json</div>
            <div className={styles.fileTreeItem}>README.md</div>
          </div>
        </aside>

        <article className={styles.filePreviewPane}>
          <p className={styles.filePreviewTitle}>api/auth.ts · AI generated</p>
          <pre className={styles.codePane}>{`import jwt from 'jsonwebtoken'
import type { NextRequest } from 'next/server'

export async function verifyAuth(req: NextRequest) {
  const token = req.headers.get('authorization')
  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch {
    return null
  }
}`}</pre>
        </article>
      </div>
    </section>
  )
}

export default FilesSection
