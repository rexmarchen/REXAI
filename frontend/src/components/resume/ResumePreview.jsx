import { useDeferredValue } from 'react'
import styles from './ResumeBuilder.module.css'
import { SECTION_LABELS, TEMPLATE_OPTIONS, normalizeFormData } from '../../utils/resumeBuilder'

const PROFESSIONAL_SECTION_LABELS = {
  summary: 'Career Objective',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects & Learning Activities',
  certifications: 'Achievements & Certifications',
}

const buildInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return 'R'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

const ResumePreview = ({ resume, sheetRef }) => {
  const deferredResume = useDeferredValue(resume)
  const formData = normalizeFormData(deferredResume?.formData)
  const templateId = deferredResume?.template || 'modern'
  const previewMode = deferredResume?.previewMode || 'light'
  const sectionOrder = deferredResume?.sectionOrder || []
  const template = TEMPLATE_OPTIONS.find((item) => item.id === templateId) || TEMPLATE_OPTIONS[0]
  const isDark = previewMode === 'dark'
  const isProfessional = templateId === 'professional'
  const isCreative = templateId === 'creative'

  const contactDetails = [
    { label: 'Location', value: formData.personal.location },
    { label: 'Phone', value: formData.personal.phone },
    { label: 'Email', value: formData.personal.email },
    { label: 'Portfolio', value: formData.personal.website },
    { label: 'LinkedIn', value: formData.personal.linkedin },
  ].filter((item) => String(item.value || '').trim())

  const contactItems = contactDetails.map((item) => item.value)
  const emptyClassName = `${styles.sheetParagraph} ${isDark ? styles.sheetEmptyDark : styles.sheetEmpty}`
  const metaClassName = `${styles.sheetEntryMeta} ${isDark ? styles.sheetEntryMetaDark : ''}`
  const contactClassName = `${styles.sheetContact} ${isDark ? styles.sheetContactDark : ''}`
  const initials = buildInitials(formData.personal.name)
  const summaryHighlight = formData.summary
    .split(/[.!?]/)
    .find((item) => String(item || '').trim())
    ?.trim()

  const sidebarHighlights =
    formData.certifications.length > 0
      ? formData.certifications.map((entry) => entry.name).filter(Boolean).slice(0, 3)
      : [
          formData.education[0]
            ? [formData.education[0].degree, formData.education[0].institution]
                .filter(Boolean)
                .join(' at ')
            : '',
          formData.projects[0]?.name ? `Featured project: ${formData.projects[0].name}` : '',
          summaryHighlight ? `${summaryHighlight}.` : '',
        ].filter(Boolean)

  const renderProfessionalHeading = (sectionId) => (
    <div className={styles.sheetProfileSectionHeader}>
      <span className={styles.sheetProfileSectionMarker} aria-hidden="true" />
      <h2 className={styles.sheetProfileSectionTitle}>
        {PROFESSIONAL_SECTION_LABELS[sectionId] || SECTION_LABELS[sectionId] || sectionId}
      </h2>
    </div>
  )

  const renderSummary = ({ professional = false } = {}) => (
    <section className={professional ? styles.sheetProfileSection : styles.sheetSectionBlock}>
      {professional ? (
        renderProfessionalHeading('summary')
      ) : (
        <h2 className={styles.sheetSectionTitle}>{SECTION_LABELS.summary}</h2>
      )}
      {formData.summary ? (
        <p className={professional ? styles.sheetProfileParagraph : styles.sheetParagraph}>
          {formData.summary}
        </p>
      ) : (
        <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
          Add a concise summary to position your experience and value.
        </p>
      )}
    </section>
  )

  const renderSkills = ({ professional = false } = {}) => (
    <section className={professional ? styles.sheetProfileSection : styles.sheetSectionBlock}>
      {professional ? (
        renderProfessionalHeading('skills')
      ) : (
        <h2 className={styles.sheetSectionTitle}>{SECTION_LABELS.skills}</h2>
      )}
      {formData.skills.length > 0 ? (
        professional ? (
          <ul className={styles.sheetProfileList}>
            {formData.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <div className={styles.sheetSkillRow}>
            {formData.skills.map((skill) => (
              <span key={skill} className={styles.sheetSkill}>
                {skill}
              </span>
            ))}
          </div>
        )
      ) : (
        <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
          Add your strongest technical, domain, or leadership skills.
        </p>
      )}
    </section>
  )

  const renderExperience = ({ professional = false } = {}) => (
    <section className={professional ? styles.sheetProfileSection : styles.sheetSectionBlock}>
      {professional ? (
        renderProfessionalHeading('experience')
      ) : (
        <h2 className={styles.sheetSectionTitle}>{SECTION_LABELS.experience}</h2>
      )}
      {formData.experience.length > 0 ? (
        formData.experience.map((entry) => (
          <article
            key={entry.id}
            className={professional ? styles.sheetProfileEntry : styles.sheetEntry}
          >
            <div
              className={professional ? styles.sheetProfileEntryHeader : styles.sheetEntryHeader}
            >
              <div>
                <h3
                  className={professional ? styles.sheetProfileEntryTitle : styles.sheetEntryTitle}
                >
                  {professional
                    ? entry.role || 'Experience'
                    : [entry.role, entry.company].filter(Boolean).join(' at ') || 'Experience'}
                </h3>
                {professional && entry.company ? (
                  <p className={styles.sheetProfileEntrySubline}>{entry.company}</p>
                ) : null}
              </div>
              <span className={professional ? styles.sheetProfileEntryMeta : metaClassName}>
                {[entry.location, entry.startDate, entry.current ? 'Present' : entry.endDate]
                  .filter(Boolean)
                  .join(' | ')}
              </span>
            </div>
            {(entry.bullets || []).filter(Boolean).length > 0 ? (
              <ul className={professional ? styles.sheetProfileList : styles.sheetList}>
                {(entry.bullets || []).filter(Boolean).map((bullet, index) => (
                  <li key={`${entry.id}-${index}`}>{bullet}</li>
                ))}
              </ul>
            ) : (
              <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
                Add at least one achievement bullet for this role.
              </p>
            )}
          </article>
        ))
      ) : (
        <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
          Add work experience or keep projects strong enough to carry your profile.
        </p>
      )}
    </section>
  )

  const renderEducation = ({ professional = false } = {}) => (
    <section className={professional ? styles.sheetProfileSection : styles.sheetSectionBlock}>
      {professional ? (
        renderProfessionalHeading('education')
      ) : (
        <h2 className={styles.sheetSectionTitle}>{SECTION_LABELS.education}</h2>
      )}
      {formData.education.length > 0 ? (
        formData.education.map((entry) => (
          <article
            key={entry.id}
            className={professional ? styles.sheetProfileEntry : styles.sheetEntry}
          >
            <div
              className={professional ? styles.sheetProfileEntryHeader : styles.sheetEntryHeader}
            >
              <div>
                <h3
                  className={professional ? styles.sheetProfileEntryTitle : styles.sheetEntryTitle}
                >
                  {professional
                    ? entry.institution || 'Education'
                    : [entry.degree, entry.institution].filter(Boolean).join(' - ') || 'Education'}
                </h3>
                {professional && entry.degree ? (
                  <p className={styles.sheetProfileEntrySubline}>{entry.degree}</p>
                ) : null}
              </div>
              <span className={professional ? styles.sheetProfileEntryMeta : metaClassName}>
                {[entry.location, entry.startDate, entry.endDate].filter(Boolean).join(' | ')}
              </span>
            </div>
            {entry.grade ? (
              <p className={professional ? styles.sheetProfileFootnote : styles.sheetParagraph}>
                Grade: {entry.grade}
              </p>
            ) : null}
          </article>
        ))
      ) : (
        <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
          Add an education entry to complete the academic profile.
        </p>
      )}
    </section>
  )

  const renderProjects = ({ professional = false } = {}) => (
    <section className={professional ? styles.sheetProfileSection : styles.sheetSectionBlock}>
      {professional ? (
        renderProfessionalHeading('projects')
      ) : (
        <h2 className={styles.sheetSectionTitle}>{SECTION_LABELS.projects}</h2>
      )}
      {formData.projects.length > 0 ? (
        formData.projects.map((entry) => (
          <article
            key={entry.id}
            className={professional ? styles.sheetProfileEntry : styles.sheetEntry}
          >
            <div
              className={professional ? styles.sheetProfileEntryHeader : styles.sheetEntryHeader}
            >
              <div>
                <h3
                  className={professional ? styles.sheetProfileEntryTitle : styles.sheetEntryTitle}
                >
                  {entry.name || 'Project'}
                </h3>
                {professional && entry.role ? (
                  <p className={styles.sheetProfileEntrySubline}>{entry.role}</p>
                ) : null}
              </div>
              {entry.url ? (
                <span className={professional ? styles.sheetProfileEntryMeta : metaClassName}>
                  {entry.url}
                </span>
              ) : null}
            </div>
            {entry.description ? (
              <p className={professional ? styles.sheetProfileParagraph : styles.sheetParagraph}>
                {entry.description}
              </p>
            ) : (
              <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
                Add a short project summary.
              </p>
            )}
            {entry.technologies.length > 0 ? (
              <p className={professional ? styles.sheetProfileFootnote : styles.sheetParagraph}>
                {professional ? 'Tools: ' : 'Stack: '}
                {entry.technologies.join(', ')}
              </p>
            ) : null}
          </article>
        ))
      ) : (
        <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
          Add project case studies to showcase proof of execution.
        </p>
      )}
    </section>
  )

  const renderCertifications = ({ professional = false } = {}) => (
    <section className={professional ? styles.sheetProfileSection : styles.sheetSectionBlock}>
      {professional ? (
        renderProfessionalHeading('certifications')
      ) : (
        <h2 className={styles.sheetSectionTitle}>{SECTION_LABELS.certifications}</h2>
      )}
      {formData.certifications.length > 0 ? (
        formData.certifications.map((entry) => (
          <article
            key={entry.id}
            className={professional ? styles.sheetProfileEntry : styles.sheetEntry}
          >
            <div
              className={professional ? styles.sheetProfileEntryHeader : styles.sheetEntryHeader}
            >
              <div>
                <h3
                  className={professional ? styles.sheetProfileEntryTitle : styles.sheetEntryTitle}
                >
                  {entry.name || 'Certification'}
                </h3>
                {professional && entry.issuer ? (
                  <p className={styles.sheetProfileEntrySubline}>{entry.issuer}</p>
                ) : null}
              </div>
              <span className={professional ? styles.sheetProfileEntryMeta : metaClassName}>
                {entry.date}
              </span>
            </div>
            {!professional ? (
              <p className={styles.sheetParagraph}>
                {[entry.issuer, entry.credentialId, entry.url].filter(Boolean).join(' | ')}
              </p>
            ) : entry.credentialId || entry.url ? (
              <p className={styles.sheetProfileFootnote}>
                {[entry.credentialId, entry.url].filter(Boolean).join(' | ')}
              </p>
            ) : null}
          </article>
        ))
      ) : (
        <p className={professional ? styles.sheetProfileEmpty : emptyClassName}>
          Optional certifications can reinforce role-specific credibility.
        </p>
      )}
    </section>
  )

  const sectionMap = {
    summary: (options) => renderSummary(options),
    skills: (options) => renderSkills(options),
    experience: (options) => renderExperience(options),
    education: (options) => renderEducation(options),
    projects: (options) => renderProjects(options),
    certifications: (options) => renderCertifications(options),
  }

  const renderedSections = sectionOrder
    .map((sectionId) => {
      const renderSection = sectionMap[sectionId]

      if (!renderSection) {
        return null
      }

      return <div key={sectionId}>{renderSection()}</div>
    })
    .filter(Boolean)

  const professionalSections = (sectionOrder.length > 0
    ? sectionOrder.filter((sectionId) => sectionId !== 'skills')
    : ['summary', 'education', 'experience', 'projects', 'certifications']
  )
    .map((sectionId) => {
      const renderSection = sectionMap[sectionId]

      if (!renderSection) {
        return null
      }

      return <div key={sectionId}>{renderSection({ professional: true })}</div>
    })
    .filter(Boolean)

  const standardLayout = (
    <div className={styles.sheetInner}>
      <header className={styles.sheetHeader}>
        <h1 className={styles.sheetName}>{formData.personal.name || 'Your Name'}</h1>
        <p className={styles.sheetRole}>{formData.personal.role || 'Target Role'}</p>
        <div className={contactClassName}>
          {contactItems.length > 0 ? (
            contactItems.map((item) => <span key={item}>{item}</span>)
          ) : (
            <span>Location | Phone | Email | Portfolio</span>
          )}
        </div>
      </header>
      <div className={styles.sheetBody}>{renderedSections}</div>
    </div>
  )

  const creativeLayout = (
    <>
      <aside className={styles.sheetCreativeRail}>
        <div className={styles.sheetRailBlock}>
          <h2 className={styles.sheetName}>{formData.personal.name || 'Your Name'}</h2>
          <p className={styles.sheetRailText}>{formData.personal.role || 'Target Role'}</p>
        </div>

        <div className={styles.sheetRailBlock}>
          <h3 className={styles.sheetRailTitle}>Contact</h3>
          {contactItems.length > 0 ? (
            contactItems.map((item) => (
              <p key={item} className={styles.sheetRailText}>
                {item}
              </p>
            ))
          ) : (
            <p className={styles.sheetRailText}>Add contact details to complete the rail.</p>
          )}
        </div>

        <div className={styles.sheetRailBlock}>
          <h3 className={styles.sheetRailTitle}>Skills Snapshot</h3>
          {formData.skills.length > 0 ? (
            formData.skills.slice(0, 8).map((skill) => (
              <p key={skill} className={styles.sheetRailText}>
                {skill}
              </p>
            ))
          ) : (
            <p className={styles.sheetRailText}>Your top skills will appear here.</p>
          )}
        </div>
      </aside>
      <div className={styles.sheetCreativeMain}>
        <div className={styles.sheetBody}>{renderedSections}</div>
      </div>
    </>
  )

  const professionalLayout = (
    <div className={styles.sheetProfessionalFrame}>
      <aside className={styles.sheetProfileSidebar}>
        <div className={styles.sheetProfileAvatarCluster}>
          <div className={styles.sheetProfileAvatar}>{initials}</div>
        </div>

        <section className={styles.sheetProfileSidebarSection}>
          <h3 className={styles.sheetProfileSidebarTitle}>Contacts</h3>
          {contactDetails.length > 0 ? (
            <div className={styles.sheetProfileSidebarList}>
              {contactDetails.map((item) => (
                <div key={`${item.label}-${item.value}`} className={styles.sheetProfileContactItem}>
                  <span className={styles.sheetProfileContactLabel}>{item.label}</span>
                  <span className={styles.sheetProfileContactValue}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.sheetProfileSidebarEmpty}>
              Add location, phone, email, and profile links.
            </p>
          )}
        </section>

        <section className={styles.sheetProfileSidebarSection}>
          <h3 className={styles.sheetProfileSidebarTitle}>Skills</h3>
          {formData.skills.length > 0 ? (
            <ul className={styles.sheetProfileBulletList}>
              {formData.skills.slice(0, 10).map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.sheetProfileSidebarEmpty}>Add your strongest skills to fill this rail.</p>
          )}
        </section>

        <section className={styles.sheetProfileSidebarSection}>
          <h3 className={styles.sheetProfileSidebarTitle}>
            {formData.certifications.length > 0 ? 'Achievements' : 'Highlights'}
          </h3>
          {sidebarHighlights.length > 0 ? (
            <ul className={styles.sheetProfileBulletList}>
              {sidebarHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.sheetProfileSidebarEmpty}>
              Certifications, project wins, or standout highlights will appear here.
            </p>
          )}
        </section>
      </aside>

      <div className={styles.sheetProfileMain}>
        <header className={styles.sheetProfileHeader}>
          <h1 className={styles.sheetProfileName}>{formData.personal.name || 'Your Name'}</h1>
          <p className={styles.sheetProfileBanner}>
            {formData.personal.role || 'Target role, specialization, and positioning headline'}
          </p>
        </header>

        <div className={styles.sheetProfileMainBody}>{professionalSections}</div>
      </div>
    </div>
  )

  const sheetToneClass = isProfessional ? styles.sheetProfessionalPaper : isDark ? styles.sheetDark : styles.sheetLight

  return (
    <div className={isDark ? styles.previewChromeDark : styles.previewChromeLight}>
      <article
        ref={sheetRef}
        className={`${styles.sheet} ${sheetToneClass} ${
          isProfessional ? styles.sheetProfessional : ''
        } ${isCreative ? styles.sheetCreative : !isProfessional ? styles.sheetModern : ''}`}
        style={{ '--template-accent': template.accent }}
      >
        {isProfessional ? professionalLayout : isCreative ? creativeLayout : standardLayout}
      </article>
    </div>
  )
}

export default ResumePreview
