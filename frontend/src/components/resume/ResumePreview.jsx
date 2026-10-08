import { useDeferredValue } from 'react'
import './ResumeTemplates.css'
import styles from './ResumeBuilder.module.css'
import {
  SECTION_LABELS,
  TEMPLATE_OPTIONS,
  getTemplateConfig,
  normalizeFormData,
} from '../../utils/resumeBuilder'

const ResumePreview = ({
  resume,
  sheetRef,
  zoom = 1,
  customAccent = null,
  customFont = null,
  showPageGuide = true,
}) => {
  const deferredResume = useDeferredValue(resume)
  const formData = normalizeFormData(deferredResume?.formData)
  const templateId = deferredResume?.template || 'rec-1'
  const previewMode = deferredResume?.previewMode || 'light'
  const template = getTemplateConfig(templateId)
  const isDark = previewMode === 'dark'

  const activeAccent = customAccent || deferredResume?.customAccent || template.accent
  const activeFont = customFont || deferredResume?.customFont || null

  const name = formData.personal?.name || 'Your Name'
  const role = formData.personal?.role || 'Target Role / Specialization'
  const email = formData.personal?.email
  const phone = formData.personal?.phone
  const location = formData.personal?.location
  const website = formData.personal?.website
  const linkedin = formData.personal?.linkedin
  const initials =
    (name || '')
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CV'

  const hasContent =
    Boolean(formData.summary?.trim()) ||
    (formData.experience && formData.experience.length > 0) ||
    (formData.projects && formData.projects.length > 0) ||
    (formData.education && formData.education.length > 0) ||
    (formData.skills && formData.skills.length > 0)

  const pageCutoffGuide = showPageGuide && (
    <div
      style={{
        position: 'absolute',
        top: '1123px',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div style={{ flex: 1, borderTop: '1.5px dashed #E97852', opacity: 0.65 }} />
      <span
        style={{
          fontSize: '10px',
          fontWeight: 800,
          color: '#E97852',
          background: '#FFF8F4',
          padding: '2px 9px',
          borderRadius: '999px',
          border: '1px solid #FCD9CD',
          margin: '0 8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          letterSpacing: '0.02em',
        }}
      >
        ✂ A4 Page 1 Boundary (1123px)
      </span>
      <div style={{ flex: 1, borderTop: '1.5px dashed #E97852', opacity: 0.65 }} />
    </div>
  )

  // TOP RECOMMENDED PROFESSIONAL TEMPLATES (.r L1..L5 H1..H6)
  if (template.isRecommended || (template.id && template.id.startsWith('rec-'))) {
    const layout = template.layout || 1
    const heading = template.heading || 1
    const flags = template.flags || ''

    return (
      <div
        className={isDark ? styles.previewChromeDark : styles.previewChromeLight}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 10px',
          overflowX: 'auto',
          width: '100%',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.18s ease-out',
            position: 'relative',
            width: '794px',
            minWidth: '794px',
            minHeight: '1123px',
          }}
        >
          {pageCutoffGuide}
          <article
            ref={sheetRef}
            className={`r L${layout} H${heading} ${flags}`}
            style={{
              '--c': activeAccent,
              '--hb': template.headerBg,
              '--ht': template.headerText,
              '--sb': template.sideBg,
              '--st': template.sideText,
              '--f': activeFont || template.font,
              '--hf': activeFont || template.font,
              width: '794px',
              minWidth: '794px',
              minHeight: '1123px',
            }}
          >
            <header>
              <div className="av">{initials}</div>
              <h1>{name}</h1>
              <div className="role">{role}</div>
              <ul className="ct">
                {email && <li>✉ {email}</li>}
                {phone && <li>☏ {phone}</li>}
                {location && <li>📍 {location}</li>}
                {website && <li>🌐 {website}</li>}
                {linkedin && <li>in {linkedin}</li>}
                {!email && !phone && !location && (
                  <li style={{ opacity: 0.75 }}>your.email@example.com • +1 555-0100 • City, Country</li>
                )}
              </ul>
            </header>

            <main>
              {formData.summary ? (
                <>
                  <h2>Profile</h2>
                  <p>{formData.summary}</p>
                </>
              ) : !hasContent ? (
                <>
                  <h2>Profile</h2>
                  <p style={{ opacity: 0.65 }}>
                    Dedicated professional with a proven record of translating organizational goals into robust, measurable outcomes. Fill in your summary in the editor to personalize.
                  </p>
                </>
              ) : null}

              {formData.experience?.length > 0 ? (
                <>
                  <h2>Experience</h2>
                  {formData.experience.map((job) => (
                    <div key={job.id} className="job">
                      <div className="jh">
                        <span>{job.role || 'Job Role'}</span>
                        <em>{[job.startDate, job.endDate, job.location].filter(Boolean).join(' • ')}</em>
                      </div>
                      <div className="jc">{job.company || 'Company Name'}</div>
                      {job.bullets?.filter(Boolean).length > 0 && (
                        <ul>
                          {job.bullets.filter(Boolean).map((bullet, idx) => (
                            <li key={idx}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </>
              ) : !hasContent ? (
                <>
                  <h2>Experience</h2>
                  <div className="job" style={{ opacity: 0.65 }}>
                    <div className="jh">
                      <span>Lead Engineer / Specialist</span>
                      <em>2022 - Present • Remote</em>
                    </div>
                    <div className="jc">Tech Innovations Inc.</div>
                    <ul>
                      <li>Spearheaded core development cycle, boosting system reliability by 35%.</li>
                      <li>Collaborated across cross-functional engineering and design squads.</li>
                    </ul>
                  </div>
                  <div className="job" style={{ opacity: 0.65 }}>
                    <div className="jh">
                      <span>Software Associate</span>
                      <em>2020 - 2022 • New York, NY</em>
                    </div>
                    <div className="jc">Global Systems Corp</div>
                    <ul>
                      <li>Delivered key customer-facing features supporting 100k+ active users.</li>
                    </ul>
                  </div>
                </>
              ) : null}

              {formData.projects?.length > 0 && (
                <>
                  <h2>Projects</h2>
                  {formData.projects.map((proj) => (
                    <div key={proj.id} className="job">
                      <div className="jh">
                        <span>{proj.name}</span>
                        <em>{proj.role}</em>
                      </div>
                      {proj.url && <div className="jc">{proj.url}</div>}
                      {proj.description && <p>{proj.description}</p>}
                      {proj.technologies?.length > 0 && (
                        <p style={{ fontSize: '12px', opacity: 0.85, margin: '2px 0' }}>
                          Stack: {proj.technologies.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}

              {formData.education?.length > 0 ? (
                <>
                  <h2>Education</h2>
                  {formData.education.map((edu) => (
                    <div key={edu.id} className="job">
                      <div className="jh">
                        <span>{edu.degree || 'Degree / Credential'}</span>
                        <em>{[edu.startDate, edu.endDate, edu.location].filter(Boolean).join(' • ')}</em>
                      </div>
                      <div className="jc">{edu.institution || 'University Name'}</div>
                      {edu.grade && <small style={{ opacity: 0.8 }}>Grade / GPA: {edu.grade}</small>}
                    </div>
                  ))}
                </>
              ) : !hasContent ? (
                <>
                  <h2>Education</h2>
                  <div className="job" style={{ opacity: 0.65 }}>
                    <div className="jh">
                      <span>B.S. in Computer Science & Engineering</span>
                      <em>2016 - 2020</em>
                    </div>
                    <div className="jc">State University of Technology</div>
                  </div>
                </>
              ) : null}
            </main>

            <aside>
              {formData.skills?.length > 0 ? (
                <div>
                  <h2>Skills</h2>
                  <ul className="sk">
                    {formData.skills.map((skill, index) => {
                      const percent = Math.max(65, 95 - index * 4)
                      return (
                        <li key={skill}>
                          {skill}
                          <i style={{ '--p': `${percent}%` }}></i>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : !hasContent ? (
                <div>
                  <h2>Skills</h2>
                  <ul className="sk" style={{ opacity: 0.65 }}>
                    <li>TypeScript <i style={{ '--p': '92%' }}></i></li>
                    <li>React.js <i style={{ '--p': '90%' }}></i></li>
                    <li>Node.js <i style={{ '--p': '85%' }}></i></li>
                    <li>Python & AI <i style={{ '--p': '88%' }}></i></li>
                    <li>System Design <i style={{ '--p': '82%' }}></i></li>
                    <li>PostgreSQL <i style={{ '--p': '80%' }}></i></li>
                  </ul>
                </div>
              ) : null}

              {formData.certifications?.length > 0 && (
                <div>
                  <h2>Certifications</h2>
                  <ul className="cert">
                    {formData.certifications.map((c) => (
                      <li key={c.id || c.name}>
                        <strong>{c.name}</strong>
                        {c.issuer && <small>{c.issuer} {c.date ? `(${c.date})` : ''}</small>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </article>
        </div>
      </div>
    )
  }

  // ATELIER CLASSIC TEMPLATES (.resume.t1 .. .resume.t24)
  let templateClass = 't1'
  if (template.id && template.id.startsWith('t')) {
    templateClass = template.id
  } else if (template.id === 'modern') {
    templateClass = 't1'
  } else if (template.id === 'professional') {
    templateClass = 't2'
  } else if (template.id === 'creative') {
    templateClass = 't5'
  }

  return (
    <div
      className={isDark ? styles.previewChromeDark : styles.previewChromeLight}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 10px',
        overflowX: 'auto',
        width: '100%',
      }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.18s ease-out',
          position: 'relative',
          width: '794px',
          minWidth: '794px',
          minHeight: '1123px',
        }}
      >
        {pageCutoffGuide}
        <article
          ref={sheetRef}
          className={`resume ${templateClass}`}
          style={{
            '--c': activeAccent,
            ...(template.bg ? { '--bg': template.bg } : {}),
            ...(template.side ? { '--side': template.side } : {}),
            ...(activeFont ? { '--ft': activeFont } : template.font ? { '--ft': template.font } : {}),
            width: '794px',
            minWidth: '794px',
            minHeight: '1123px',
          }}
        >
          <aside>
            <h1>{name}</h1>
            <div className="role">{role}</div>

            <h2>Contact</h2>
            <ul className="contact">
              {email && (
                <li>
                  <span>✉</span> {email}
                </li>
              )}
              {phone && (
                <li>
                  <span>☏</span> {phone}
                </li>
              )}
              {location && (
                <li>
                  <span>📍</span> {location}
                </li>
              )}
              {website && (
                <li>
                  <span>🌐</span> {website}
                </li>
              )}
              {linkedin && (
                <li>
                  <span>in</span> {linkedin}
                </li>
              )}
              {!email && !phone && !location && (
                <li style={{ opacity: 0.75 }}>your.email@example.com • City, Country</li>
              )}
            </ul>

            {formData.skills?.length > 0 ? (
              <div className="skillsWrap">
                <h2>Skills</h2>
                <div>
                  {formData.skills.map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : !hasContent ? (
              <div className="skillsWrap" style={{ opacity: 0.65 }}>
                <h2>Skills</h2>
                <div>
                  {['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Docker'].map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {formData.certifications?.length > 0 && (
              <div className="certWrap">
                <h2>Certifications</h2>
                <ul>
                  {formData.certifications.map((c) => (
                    <li key={c.id || c.name} className="job">
                      <b>{c.name}</b>
                      {c.issuer && (
                        <small>
                          {c.issuer} {c.date ? `(${c.date})` : ''}
                        </small>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <main>
            {formData.summary ? (
              <>
                <h2>Profile</h2>
                <p>{formData.summary}</p>
              </>
            ) : !hasContent ? (
              <>
                <h2>Profile</h2>
                <p style={{ opacity: 0.65 }}>
                  Passionate and results-oriented professional with a strong track record of designing, building, and delivering mission-critical solutions. Fill in your summary in the editor to customize.
                </p>
              </>
            ) : null}

            {formData.experience?.length > 0 ? (
              <>
                <h2>Experience</h2>
                {formData.experience.map((job) => (
                  <div key={job.id} className="job">
                    <b>
                      {job.role || 'Job Role'} — {job.company || 'Company Name'}
                    </b>
                    <small>
                      {[job.startDate, job.endDate, job.location].filter(Boolean).join(' • ')}
                    </small>
                    {job.bullets?.filter(Boolean).length > 0 && (
                      <ul>
                        {job.bullets.filter(Boolean).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </>
            ) : !hasContent ? (
              <>
                <h2>Experience</h2>
                <div className="job" style={{ opacity: 0.65 }}>
                  <b>Senior Engineer — Tech Innovations Inc.</b>
                  <small>2022 - Present • Remote</small>
                  <ul>
                    <li>Spearheaded core application architecture, boosting throughput by 40%.</li>
                    <li>Mentored team of 6 engineers on scalable patterns and testing hygiene.</li>
                  </ul>
                </div>
                <div className="job" style={{ opacity: 0.65 }}>
                  <b>Software Developer — Digital Labs Co.</b>
                  <small>2020 - 2022 • New York, NY</small>
                  <ul>
                    <li>Engineered responsive user interfaces and modular microservices.</li>
                  </ul>
                </div>
              </>
            ) : null}

            {formData.education?.length > 0 ? (
              <>
                <h2>Education</h2>
                {formData.education.map((edu) => (
                  <div key={edu.id} className="job">
                    <b>
                      {edu.degree || 'Degree'} — {edu.institution || 'Institution'}
                    </b>
                    <small>
                      {[edu.startDate, edu.endDate, edu.location].filter(Boolean).join(' • ')}
                    </small>
                    {edu.grade && (
                      <p style={{ margin: '2px 0', fontSize: '12.5px', opacity: 0.85 }}>
                        Grade / GPA: {edu.grade}
                      </p>
                    )}
                  </div>
                ))}
              </>
            ) : !hasContent ? (
              <>
                <h2>Education</h2>
                <div className="job" style={{ opacity: 0.65 }}>
                  <b>B.S. in Computer Science — State University</b>
                  <small>2016 - 2020</small>
                </div>
              </>
            ) : null}

            {formData.projects?.length > 0 && (
              <>
                <h2>Projects</h2>
                {formData.projects.map((proj) => (
                  <div key={proj.id} className="job">
                    <b>
                      {proj.name} {proj.role ? `(${proj.role})` : ''}
                    </b>
                    {proj.description && (
                      <p style={{ margin: '3px 0' }}>{proj.description}</p>
                    )}
                    {proj.technologies?.length > 0 && (
                      <p style={{ margin: '3px 0', fontSize: '12px', opacity: 0.85 }}>
                        Stack: {proj.technologies.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* For horizontal banner templates (t6, t7, t13, t19), show skills in main */}
            {['t6', 't7', 't13', 't19'].includes(templateClass) &&
              formData.skills?.length > 0 && (
                <>
                  <h2>Skills</h2>
                  <div>
                    {formData.skills.map((skill) => (
                      <span key={skill} className="tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
          </main>
        </article>
      </div>
    </div>
  )
}

export default ResumePreview
