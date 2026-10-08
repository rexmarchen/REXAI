'use client'

interface SubjectInputProps {
  value: string
  onChange: (value: string) => void
}

export function SubjectInput({ value, onChange }: SubjectInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
        Subject
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Quick introduction to {{companyName}}"
        className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-[var(--text-dim)] outline-none transition focus:border-[var(--blue)]/50 focus:bg-white/[0.07]"
        aria-label="Email subject"
      />
    </div>
  )
}
