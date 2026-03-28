'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import styles from '@/styles/micro.module.css'

export function PostGigForm() {
  const [form, setForm] = useState({
    companyName: 'REXION Partner',
    title: '',
    description: '',
    skills: '',
    domain: 'Frontend',
    pay: 15000,
    duration: 10,
    location: 'remote',
    spotsTotal: 3,
    isPreHiring: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = async () => {
    setIsSubmitting(true)
    const response = await fetch('/api/micro-gigs/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      }),
    })

    const payload = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(payload.error || 'Gig submission failed.')
      setIsSubmitting(false)
      return
    }

    toast.success('Gig submitted for approval.')
    setSubmitted(true)
    setIsSubmitting(false)
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Post a Micro-Gig</h1>
          <p className={styles.copy}>Create a short sprint with clear scope, compensation, and hiring intent so strong candidates can self-select fast.</p>
        </div>
      </div>

      <div className={styles.heroPanel}>
        {!submitted ? (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Company name</label>
              <input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Title</label>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Description</label>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Skills (comma separated)</label>
              <input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Domain</label>
              <select value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })}>
                <option>Frontend</option>
                <option>Backend</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>Data</option>
              </select>
            </div>
            <div className={styles.inlineMeta}>
              <div className={styles.field}>
                <label>Pay</label>
                <input
                  type="number"
                  value={form.pay}
                  onChange={(event) => setForm({ ...form, pay: Number(event.target.value) })}
                />
              </div>
              <div className={styles.field}>
                <label>Duration</label>
                <select
                  value={form.duration}
                  onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })}
                >
                  <option value={7}>7 days</option>
                  <option value={10}>10 days</option>
                  <option value={14}>14 days</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <select value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
            </div>
            <label className={styles.inlineMeta}>
              <input
                type="checkbox"
                checked={form.isPreHiring}
                onChange={(event) => setForm({ ...form, isPreHiring: event.target.checked })}
              />
              We currently have full-time openings and want pre-hiring signal badges on this gig.
            </label>

            <div className={styles.actionRow}>
              <button className={styles.button} onClick={submit} disabled={isSubmitting || !form.title || !form.description}>
                {isSubmitting ? 'Submitting...' : 'Review & Submit'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.notice}>
            <div className={styles.strong}>Gig submitted</div>
            <div className={styles.muted}>Your micro-gig is now pending approval and will appear in the arena once approved.</div>
          </div>
        )}
      </div>
    </section>
  )
}
