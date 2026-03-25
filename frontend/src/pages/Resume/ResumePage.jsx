import { motion } from 'framer-motion'
import ResumeBuilder from '../../components/resume/ResumeBuilder'
import styles from './ResumePage.module.css'

const ResumePage = () => (
  <div className={styles.page}>
    <div className={styles.pageGlow} />
    <div className={styles.pageGrid} />

    <motion.section
      className={styles.pageShell}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <ResumeBuilder />
    </motion.section>
  </div>
)

export default ResumePage
