import { motion } from 'framer-motion'
import styles from './ResumeBuilder.module.css'
import { TEMPLATE_OPTIONS } from '../../utils/resumeBuilder'

const TemplateSelector = ({ activeTemplate, onSelectTemplate, showHeader = true }) => (
  <section className={styles.templateRail}>
    {showHeader ? (
      <div className={styles.toolbarHeader}>
        <div>
          <h2 className={styles.panelTitle}>Template System</h2>
          <p className={styles.helperText}>
            Switch between ATS-friendly layouts without losing any content.
          </p>
        </div>
      </div>
    ) : null}

    <div className={styles.templateGrid}>
      {TEMPLATE_OPTIONS.map((template) => {
        const isActive = template.id === activeTemplate

        return (
          <motion.button
            key={template.id}
            type="button"
            className={`${styles.templateCard} ${isActive ? styles.templateCardActive : ''}`}
            style={{ '--template-accent': template.accent }}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className={styles.templateCopy}>
              <div className={styles.templateName}>
                <span>{template.name}</span>
                <span className={styles.chipMuted}>{template.label}</span>
              </div>
              <div className={styles.templateAccent} />
              <p className={styles.templateDescription}>{template.description}</p>
            </div>

            <div className={styles.templatePreview}>
              {template.id === 'creative' ? (
                <>
                  <div className={styles.templatePreviewHeader} />
                  <div className={styles.templatePreviewSplit}>
                    <div className={styles.templatePreviewSidebar} />
                    <div>
                      <div className={styles.templatePreviewLine} />
                      <div className={styles.templatePreviewLine} />
                      <div
                        className={`${styles.templatePreviewLine} ${styles.templatePreviewLineShort}`}
                      />
                    </div>
                  </div>
                </>
              ) : template.id === 'professional' ? (
                <div className={styles.templatePreviewProfile}>
                  <div className={styles.templatePreviewSidebar} />
                  <div className={styles.templatePreviewColumn}>
                    <div className={styles.templatePreviewHeader} />
                    <div className={styles.templatePreviewBanner} />
                    <div className={styles.templatePreviewLine} />
                    <div
                      className={`${styles.templatePreviewLine} ${styles.templatePreviewLineShort}`}
                    />
                  </div>
                  <div className={styles.templatePreviewColumn}>
                    <div className={styles.templatePreviewAvatar} />
                    <div className={styles.templatePreviewLine} />
                    <div className={styles.templatePreviewLine} />
                    <div
                      className={`${styles.templatePreviewLine} ${styles.templatePreviewLineShort}`}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.templatePreviewHeader} />
                  <div className={styles.templatePreviewLine} />
                  <div className={styles.templatePreviewLine} />
                  <div
                    className={`${styles.templatePreviewLine} ${styles.templatePreviewLineShort}`}
                  />
                </>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  </section>
)

export default TemplateSelector
