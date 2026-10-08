'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronRight, FileUp, LoaderCircle, MapPin, ShieldCheck, Sparkles, Target, XCircle } from 'lucide-react'

type Job = {
  id: string
  title: string
  company: string
  url: string
  location: string
  matchScore: number
  applyType: 'easy_apply' | 'external_ats'
}

type Discovery = {
  resumeId: string
  profile: { skills: string[]; targetRole: string; yearsExperience: number; summary: string }
  analysis: { atsScore: number; suggestedRoles: string[]; missingSkills: string[]; careerProfile: string }
  missingFields: string[]
  jobs: Job[]
}

type ApplyResult = { title: string; company: string; status: 'applied' | 'ready_to_submit' | 'failed' | 'skipped'; reason: string }

const serviceUrl = process.env.NEXT_PUBLIC_APPLY_FLOW_URL || 'http://localhost:3000'

export function OneClickApplyDashboard({ email, name }: { email?: string; name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [discovery, setDiscovery] = useState<Discovery | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ApplyResult[] | null>(null)
  const [details, setDetails] = useState({
    fullName: name || '',
    email: email || '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: ''
  })

  async function discover() {
    if (!file) return
    setLoading(true); setError(null); setResults(null)
    try {
      const payload = new FormData()
      payload.append('resume', file)
      Object.entries(details).forEach(([key, value]) => value && payload.append(key, value))
      const response = await fetch(`${serviceUrl}/api/one-click-discovery`, { method: 'POST', body: payload })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'We could not analyze this resume.')
      setDiscovery(body); setSelected(body.jobs.map((job: Job) => job.id))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  async function apply() {
    if (!discovery || !details.email || !details.fullName || !selected.length) return
    setApplying(true); setError(null)
    try {
      const response = await fetch(`${serviceUrl}/api/auto-apply/${discovery.resumeId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: selected, ...details }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'The application run could not start.')
      setResults(body.results)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.') }
    finally { setApplying(false) }
  }

  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-emerald-400/15 bg-[radial-gradient(circle_at_88%_10%,rgba(16,185,129,0.18),transparent_25%),rgba(15,26,22,0.9)] p-6 shadow-soft lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl"><p className="type-label text-emerald-300">One-click application mode</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white lg:text-4xl">Turn your resume into a live, reviewed application queue.</h1><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">We parse your resume, build your profile, rank live supported roles, and prepare applications. You stay in control of every submission.</p></div>
          <div className="flex items-center gap-2 text-xs text-emerald-200"><ShieldCheck size={16} /> Supported ATS only · Review before submit</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.82)] p-6">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><FileUp size={18} /></span><div><h2 className="font-semibold text-white">Start with your current resume</h2><p className="text-xs text-[var(--text-secondary)]">PDF or DOCX, up to 10 MB</p></div></div>
          <button onClick={() => inputRef.current?.click()} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-5 text-left transition hover:border-emerald-400/40"><span><span className="block text-sm font-medium text-white">{file?.name || 'Choose resume'}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{file ? `${Math.ceil(file.size / 1024)} KB ready for analysis` : 'Your document is used only for this application run.'}</span></span><ChevronRight size={18} className="text-emerald-300" /></button>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([
              ['fullName', 'Full name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['location', 'Preferred location'],
              ['linkedin', 'LinkedIn URL'],
              ['github', 'GitHub URL'],
              ['portfolio', 'Portfolio URL']
            ] as const).map(([key, label]) => (
              <label key={key} className="text-xs font-medium text-[var(--text-secondary)]">
                {label}
                <input
                  value={details[key]}
                  onChange={(event) => setDetails({ ...details, [key]: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
                  placeholder={
                    key === 'location'
                      ? 'Remote, Bengaluru…'
                      : key === 'linkedin'
                      ? 'https://linkedin.com/in/username'
                      : key === 'github'
                      ? 'https://github.com/username'
                      : key === 'portfolio'
                      ? 'https://portfolio.com'
                      : `Add ${label.toLowerCase()}`
                  }
                />
              </label>
            ))}
          </div>
          <button disabled={!file || loading} onClick={discover} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-[#062016] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}{loading ? 'Analyzing your resume…' : 'Build my application queue'}</button>
          {error && <p className="mt-4 flex items-center gap-2 text-sm text-rose-300"><XCircle size={16} />{error}</p>}
        </div>
        <aside className="rounded-[28px] border border-white/8 bg-black/20 p-6"><p className="type-label">What happens next</p><ol className="mt-5 space-y-5">{['Extract skills, experience, education and career profile.', 'Find active Greenhouse and Lever jobs, then rank the best matches.', 'Generate answers and prefill applications for your review.', 'Submit only the roles you explicitly approve; email results are tracked.'].map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6 text-[var(--text-secondary)]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-semibold text-white">{index + 1}</span>{item}</li>)}</ol></aside>
      </section>

      <AnimatePresence>{discovery && <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.88)] p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div><p className="type-label">Resume intelligence</p><h2 className="mt-2 text-2xl font-semibold text-white">{discovery.profile.targetRole} profile ready</h2><p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{discovery.analysis.careerProfile}</p></div><div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 px-5 py-3 text-center"><div className="text-2xl font-semibold text-emerald-300">{discovery.analysis.atsScore}</div><div className="text-xs text-[var(--text-secondary)]">ATS readiness</div></div></div>
        <div className="mt-5 flex flex-wrap gap-2">{discovery.profile.skills.slice(0, 10).map((skill) => <span key={skill} className="rounded-full bg-white/6 px-3 py-1.5 text-xs text-white">{skill}</span>)}</div>
        {discovery.missingFields.length > 0 && <p className="mt-5 flex items-center gap-2 text-sm text-amber-200"><MapPin size={15} /> Add {discovery.missingFields.join(', ')} above before submitting applications.</p>}
      </motion.section>}</AnimatePresence>

      <AnimatePresence>{discovery && <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.88)]"><div className="flex flex-col gap-4 border-b border-white/8 p-6 md:flex-row md:items-center md:justify-between"><div><p className="type-label">Live job dashboard</p><h2 className="mt-2 text-2xl font-semibold text-white">{discovery.jobs.length} supported roles ready to review</h2></div><button onClick={apply} disabled={applying || !selected.length || !details.email || !details.fullName} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#062016] disabled:opacity-40">{applying ? <LoaderCircle className="animate-spin" size={17} /> : <Target size={17} />} {applying ? 'Preparing applications…' : `Auto apply to ${selected.length} selected`}</button></div><div className="divide-y divide-white/7">{discovery.jobs.map((job) => <label key={job.id} className="flex cursor-pointer items-center gap-4 px-6 py-5 transition hover:bg-white/[0.025]"><input type="checkbox" checked={selected.includes(job.id)} onChange={() => toggle(job.id)} className="h-4 w-4 accent-emerald-400" /><div className="min-w-0 flex-1"><div className="font-medium text-white">{job.title}</div><div className="mt-1 text-sm text-[var(--text-secondary)]">{job.company} · {job.location}</div></div><div className="text-right"><div className="text-lg font-semibold text-emerald-300">{job.matchScore}%</div><div className="text-xs text-[var(--text-secondary)]">match</div></div></label>)}</div></motion.section>}</AnimatePresence>
      {results && <section className="rounded-[28px] border border-emerald-400/15 bg-emerald-400/5 p-6"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-300" /><div><h2 className="font-semibold text-white">Application run complete</h2><p className="text-sm text-[var(--text-secondary)]">A summary has been sent to {details.email}.</p></div></div><div className="mt-5 space-y-2">{results.map((result) => <div key={`${result.company}-${result.title}`} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 text-sm"><span className="text-white">{result.title} <span className="text-[var(--text-secondary)]">at {result.company}</span></span><span className={result.status === 'failed' ? 'text-rose-300' : 'text-emerald-300'}>{result.status.replaceAll('_', ' ')}</span></div>)}</div></section>}
    </div>
  )
}
