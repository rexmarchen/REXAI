import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, LayoutTemplate, Star } from 'lucide-react'
import styles from './TemplateSelector.module.css'
import './ResumeTemplates.css'
import { TEMPLATE_OPTIONS } from '../../utils/resumeBuilder'

const SAMPLE_PREVIEW = {
  name: 'Jordan Rivera',
  role: 'Product Designer',
  email: 'jordan@example.com',
  phone: '+1 555 010 2030',
  location: 'Austin, TX',
  summary: 'Designer with 8+ years shipping web and mobile products used by millions.',
  skills: ['Figma', 'React', 'UX', 'Design Systems', 'Prototyping'],
  jobs: [
    {
      title: 'Senior Designer',
      company: 'Northwind Labs',
      dates: '2021 - Present',
      text: 'Led redesign of checkout flow, lifting conversion 18%.',
    },
    {
      title: 'Product Designer',
      company: 'Brightly Co.',
      dates: '2018 - 2021',
      text: 'Built the core design system adopted by 12 product teams.',
    },
  ],
  education: [
    { title: 'B.A. Graphic Design', company: 'State University', dates: '2014 - 2018' },
  ],
}

const CATEGORIES = [
  { id: 'recommended', label: '⭐ Top Recommended (24)' },
  { id: 'all', label: 'All Templates (48)' },
  { id: 'Executive', label: 'Executive' },
  { id: 'Modern', label: 'Modern' },
  { id: 'Creative', label: 'Creative' },
  { id: 'Minimal', label: 'Minimal' },
  { id: 'Tech', label: 'Tech & Monospace' },
  { id: 'atelier', label: 'Atelier Classics (24)' },
]

const TemplateSelector = ({
  activeTemplate = 'rec-1',
  onSelectTemplate,
  showHeader = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('recommended')

  // Filter distinct templates (skip legacy duplicates)
  const templates = TEMPLATE_OPTIONS.filter((t) => !t.isLegacy)

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === 'recommended') return t.isRecommended
    if (selectedCategory === 'atelier') return !t.isRecommended
    if (selectedCategory === 'all') return true
    return t.category === selectedCategory
  })

  // Normalize active ID
  const normalizedActiveId =
    activeTemplate === 'modern'
      ? 'rec-1'
      : activeTemplate === 'professional'
      ? 'rec-2'
      : activeTemplate === 'creative'
      ? 'rec-8'
      : activeTemplate

  return (
    <section className={styles.templateRail}>
      {showHeader && (
        <div className={styles.toolbarHeader}>
          <div>
            <h2 className={styles.panelTitle}>
              <LayoutTemplate size={20} color="#E97852" />
              <span>Resume Template Gallery</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#B45309',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Star size={10} fill="#B45309" /> 24 Top Recommended + 24 Atelier
              </span>
            </h2>
            <p className={styles.helperText}>
              Explore our curated Top Recommended layouts and classic Atelier designs.
              Your resume content, section order, and data stay 100% preserved.
            </p>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className={styles.categoryBar}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.categoryPill} ${
              selectedCategory === cat.id ? styles.categoryPillActive : ''
            }`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      <div className={styles.templateGrid}>
        {filteredTemplates.map((template) => {
          const isActive = template.id === normalizedActiveId

          return (
            <motion.div
              key={template.id}
              className={`${styles.templateCard} ${
                isActive ? styles.templateCardActive : ''
              }`}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTemplate(template.id)}
            >
              {/* Mini Thumbnail Preview */}
              <div className={styles.thumbWrapper}>
                <div className={styles.thumbInner}>
                  {template.isRecommended ? (
                    <div
                      className={`r L${template.layout || 1} H${template.heading || 1} ${template.flags || ''}`}
                      style={{
                        '--c': template.accent,
                        '--hb': template.headerBg,
                        '--ht': template.headerText,
                        '--sb': template.sideBg,
                        '--st': template.sideText,
                        '--f': template.font,
                        '--hf': template.font,
                      }}
                    >
                      <header>
                        <div className="av">JR</div>
                        <h1>{SAMPLE_PREVIEW.name}</h1>
                        <div className="role">{SAMPLE_PREVIEW.role}</div>
                        <ul className="ct">
                          <li>{SAMPLE_PREVIEW.email}</li>
                          <li>{SAMPLE_PREVIEW.phone}</li>
                          <li>{SAMPLE_PREVIEW.location}</li>
                        </ul>
                      </header>
                      <main>
                        <h2>Profile</h2>
                        <p>{SAMPLE_PREVIEW.summary}</p>
                        <h2>Experience</h2>
                        {SAMPLE_PREVIEW.jobs.map((j) => (
                          <div key={j.title} className="job">
                            <div className="jh">
                              <span>{j.title}</span>
                              <em>{j.dates}</em>
                            </div>
                            <div className="jc">{j.company}</div>
                            <ul>
                              <li>{j.text}</li>
                            </ul>
                          </div>
                        ))}
                        <h2>Education</h2>
                        {SAMPLE_PREVIEW.education.map((e) => (
                          <div key={e.title} className="job">
                            <div className="jh">
                              <span>{e.title}</span>
                              <em>{e.dates}</em>
                            </div>
                            <div className="jc">{e.company}</div>
                          </div>
                        ))}
                      </main>
                      <aside>
                        <div>
                          <h2>Skills</h2>
                          <ul className="sk">
                            {SAMPLE_PREVIEW.skills.map((s, idx) => (
                              <li key={s}>
                                {s}
                                <i style={{ '--p': `${95 - idx * 5}%` }}></i>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </aside>
                    </div>
                  ) : (
                    <div className={`resume t${template.num}`}>
                      <aside>
                        <h1>{SAMPLE_PREVIEW.name}</h1>
                        <div className="role">{SAMPLE_PREVIEW.role}</div>
                        <h2>Contact</h2>
                        <ul className="contact">
                          <li>{SAMPLE_PREVIEW.email}</li>
                          <li>{SAMPLE_PREVIEW.phone}</li>
                          <li>{SAMPLE_PREVIEW.location}</li>
                        </ul>
                        <h2>Skills</h2>
                        <div>
                          {SAMPLE_PREVIEW.skills.map((s) => (
                            <span key={s} className="tag">
                              {s}
                            </span>
                          ))}
                        </div>
                      </aside>
                      <main>
                        <h2>Profile</h2>
                        <p>{SAMPLE_PREVIEW.summary}</p>
                        <h2>Experience</h2>
                        {SAMPLE_PREVIEW.jobs.map((j) => (
                          <div key={j.title} className="job">
                            <b>
                              {j.title}, {j.company}
                            </b>
                            <small>{j.dates}</small>
                            <p>{j.text}</p>
                          </div>
                        ))}
                        <h2>Education</h2>
                        {SAMPLE_PREVIEW.education.map((e) => (
                          <div key={e.title} className="job">
                            <b>
                              {e.title}, {e.company}
                            </b>
                            <small>{e.dates}</small>
                          </div>
                        ))}
                      </main>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Metadata */}
              <div className={styles.templateMeta}>
                <div className={styles.templateHeaderRow}>
                  <span className={styles.templateTitle}>
                    {template.num}. {template.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {template.isRecommended && (
                      <span className={styles.recommendedBadge}>
                        <Star size={9} fill="#B45309" /> Recommended
                      </span>
                    )}
                    <span className={styles.categoryTag}>{template.category}</span>
                  </div>
                </div>

                <p className={styles.templateDesc}>{template.description}</p>

                <div className={styles.templateBottomRow}>
                  <div className={styles.colorSwatchRow}>
                    <span
                      className={styles.colorDot}
                      style={{ background: template.accent }}
                      title={`Accent: ${template.accent}`}
                    />
                    <span className={styles.fontName}>
                      {template.font.split(',')[0].replace(/['"]/g, '')}
                    </span>
                  </div>

                  {isActive ? (
                    <span className={styles.activeCheckBadge}>
                      <Check size={11} />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#E97852',
                        fontWeight: 700,
                      }}
                    >
                      Use Template &rarr;
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default TemplateSelector
