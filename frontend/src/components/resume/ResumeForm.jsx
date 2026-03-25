import { startTransition, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './ResumeBuilder.module.css'
import useResumeStore from '../../store/resumeStore'
import { improveBulletPoints, generateSummary, suggestSkills } from '../../utils/resumeAI'
import { RESUME_STEPS } from '../../utils/resumeBuilder'
import { getCompletedStepCount, validateResumeStep } from '../../utils/resumeValidation'
import PersonalInfo from './sections/PersonalInfo'
import Summary from './sections/Summary'
import Skills from './sections/Skills'
import Experience from './sections/Experience'
import Education from './sections/Education'
import Projects from './sections/Projects'
import Certifications from './sections/Certifications'

const ResumeForm = ({ resume }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [stepErrors, setStepErrors] = useState({})
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false)
  const [improvingExperienceId, setImprovingExperienceId] = useState(null)

  const updatePersonalField = useResumeStore((state) => state.updatePersonalField)
  const setSummary = useResumeStore((state) => state.setSummary)
  const addSkill = useResumeStore((state) => state.addSkill)
  const removeSkill = useResumeStore((state) => state.removeSkill)
  const setSkills = useResumeStore((state) => state.setSkills)
  const addExperience = useResumeStore((state) => state.addExperience)
  const updateExperience = useResumeStore((state) => state.updateExperience)
  const removeExperience = useResumeStore((state) => state.removeExperience)
  const addExperienceBullet = useResumeStore((state) => state.addExperienceBullet)
  const updateExperienceBullet = useResumeStore((state) => state.updateExperienceBullet)
  const removeExperienceBullet = useResumeStore((state) => state.removeExperienceBullet)
  const addEducation = useResumeStore((state) => state.addEducation)
  const updateEducation = useResumeStore((state) => state.updateEducation)
  const removeEducation = useResumeStore((state) => state.removeEducation)
  const addProject = useResumeStore((state) => state.addProject)
  const updateProject = useResumeStore((state) => state.updateProject)
  const removeProject = useResumeStore((state) => state.removeProject)
  const addCertification = useResumeStore((state) => state.addCertification)
  const updateCertification = useResumeStore((state) => state.updateCertification)
  const removeCertification = useResumeStore((state) => state.removeCertification)

  useEffect(() => {
    setStepErrors({})
  }, [resume.id, activeStepIndex])

  const currentStep = RESUME_STEPS[activeStepIndex]
  const completedSteps = getCompletedStepCount(resume)
  const progressValue = Math.round((completedSteps / RESUME_STEPS.length) * 100)
  const currentValidation = validateResumeStep(resume, currentStep.id)

  const goToStep = (nextIndex) => {
    startTransition(() => setActiveStepIndex(nextIndex))
  }

  const handleNext = () => {
    const validation = validateResumeStep(resume, currentStep.id)

    if (!validation.isValid) {
      setStepErrors(validation.errors)
      return
    }

    if (activeStepIndex < RESUME_STEPS.length - 1) {
      goToStep(activeStepIndex + 1)
    }
  }

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true)

    try {
      const summary = await generateSummary({
        personal: resume.formData.personal,
        skills: resume.formData.skills,
        experience: resume.formData.experience,
        jobDescription: resume.jobDescription,
      })

      setSummary(summary)
    } catch (error) {
      console.error('Summary generation failed:', error)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleSuggestSkills = async () => {
    setIsSuggestingSkills(true)

    try {
      const nextSkills = await suggestSkills({
        role: resume.formData.personal.role,
        existingSkills: resume.formData.skills,
        jobDescription: resume.jobDescription,
      })

      setSkills([...resume.formData.skills, ...nextSkills])
    } catch (error) {
      console.error('Skill suggestion failed:', error)
    } finally {
      setIsSuggestingSkills(false)
    }
  }

  const handleImproveBullets = async (experienceId) => {
    const entry = resume.formData.experience.find((item) => item.id === experienceId)

    if (!entry) {
      return
    }

    setImprovingExperienceId(experienceId)

    try {
      const improvedBullets = await improveBulletPoints({
        bullets: entry.bullets,
        role: resume.formData.personal.role,
        jobDescription: resume.jobDescription,
      })

      updateExperience(experienceId, { bullets: improvedBullets })
    } catch (error) {
      console.error('Bullet improvement failed:', error)
    } finally {
      setImprovingExperienceId(null)
    }
  }

  let content = null

  if (currentStep.id === 'personal') {
    content = (
      <PersonalInfo
        personal={resume.formData.personal}
        errors={stepErrors}
        onFieldChange={updatePersonalField}
      />
    )
  }

  if (currentStep.id === 'summary') {
    content = (
      <Summary
        summary={resume.formData.summary}
        errors={stepErrors}
        onChange={setSummary}
        onGenerate={handleGenerateSummary}
        isGenerating={isGeneratingSummary}
      />
    )
  }

  if (currentStep.id === 'skills') {
    content = (
      <Skills
        skills={resume.formData.skills}
        errors={stepErrors}
        onAddSkill={addSkill}
        onRemoveSkill={removeSkill}
        onSuggestSkills={handleSuggestSkills}
        isSuggesting={isSuggestingSkills}
      />
    )
  }

  if (currentStep.id === 'experience') {
    content = (
      <Experience
        items={resume.formData.experience}
        errors={stepErrors}
        onAdd={addExperience}
        onUpdate={updateExperience}
        onRemove={removeExperience}
        onAddBullet={addExperienceBullet}
        onUpdateBullet={updateExperienceBullet}
        onRemoveBullet={removeExperienceBullet}
        onImproveBullets={handleImproveBullets}
        improvingId={improvingExperienceId}
      />
    )
  }

  if (currentStep.id === 'education') {
    content = (
      <Education
        items={resume.formData.education}
        errors={stepErrors}
        onAdd={addEducation}
        onUpdate={updateEducation}
        onRemove={removeEducation}
      />
    )
  }

  if (currentStep.id === 'projects') {
    content = (
      <Projects
        items={resume.formData.projects}
        errors={stepErrors}
        onAdd={addProject}
        onUpdate={updateProject}
        onRemove={removeProject}
      />
    )
  }

  if (currentStep.id === 'certifications') {
    content = (
      <Certifications
        items={resume.formData.certifications}
        errors={stepErrors}
        onAdd={addCertification}
        onUpdate={updateCertification}
        onRemove={removeCertification}
      />
    )
  }

  return (
    <section className={`${styles.panel} ${styles.formPanel}`}>
      <div className={styles.formHeader}>
        <div>
          <span className={styles.stepEyebrow}>{currentStep.eyebrow}</span>
          <h2 className={styles.stepTitle}>{currentStep.title}</h2>
          <p className={styles.stepDescription}>{currentStep.description}</p>
        </div>
        <div className={styles.progressMeta}>
          <span className={styles.progressValue}>{progressValue}%</span>
          <span className={styles.progressLabel}>
            {completedSteps}/{RESUME_STEPS.length} steps validated
          </span>
        </div>
      </div>

      <div className={styles.progressBar}>
        <motion.div
          className={styles.progressFill}
          initial={false}
          animate={{ width: `${progressValue}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>

      <div className={styles.stepGrid}>
        {RESUME_STEPS.map((step, index) => {
          const isActive = index === activeStepIndex
          const isValid = validateResumeStep(resume, step.id).isValid

          return (
            <button
              key={step.id}
              type="button"
              className={`${styles.stepButton} ${isActive ? styles.stepButtonActive : ''}`}
              onClick={() => goToStep(index)}
            >
              <span className={styles.stepButtonTitle}>{step.title}</span>
              <span className={styles.stepButtonMeta}>{isValid ? 'Ready' : 'Needs work'}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.stepContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {content}
          </motion.div>
        </AnimatePresence>

        {!currentValidation.isValid && Object.keys(stepErrors).length > 0 ? (
          <div className={styles.sectionMessage}>
            Complete the highlighted fields before moving to the next step.
          </div>
        ) : null}

        <div className={styles.formFooter}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => goToStep(Math.max(0, activeStepIndex - 1))}
            disabled={activeStepIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleNext}
            disabled={activeStepIndex === RESUME_STEPS.length - 1}
          >
            {activeStepIndex === RESUME_STEPS.length - 2 ? 'Review Final Step' : 'Next'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default ResumeForm
