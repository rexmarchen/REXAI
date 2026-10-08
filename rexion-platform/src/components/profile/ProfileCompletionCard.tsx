'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react'
import type { ProfileCompletionResult } from '@/types/profile'

interface ProfileCompletionCardProps {
  completion: ProfileCompletionResult
  onCompleteStep: (key: string) => void
}

export function ProfileCompletionCard({ completion, onCompleteStep }: ProfileCompletionCardProps) {
  const percentage = completion.percentage || 0
  const isComplete = percentage >= 100

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="type-label !mb-0 flex items-center gap-1.5 text-emerald-400">
              <Sparkles size={13} />
              Career Identity Readiness
            </span>
            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {completion.completedCount} / {completion.totalCount} Sections
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Profile Completion: <span className="text-emerald-400">{percentage}%</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            {isComplete
              ? 'Your career profile is 100% complete and fully optimized for AI matching and automated applications.'
              : 'Complete key sections to unlock automated application workflows and higher recruiter matching scores.'}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs font-semibold text-white">
            <span className="text-[var(--text-muted)]">Progress</span>
            <span className="text-emerald-400">{percentage}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-black/40 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300'
              } shadow-[0_0_12px_rgba(52,211,153,0.5)]`}
            />
          </div>
        </div>
      </div>

      {/* Checklist grid */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {completion.items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onCompleteStep(item.key)}
            className={`group relative flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-all ${
              item.completed
                ? 'border-emerald-400/20 bg-emerald-400/[0.04] hover:bg-emerald-400/[0.08]'
                : 'border-white/6 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex w-full items-center justify-between">
              {item.completed ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <Circle size={15} className="text-white/30 shrink-0 group-hover:text-emerald-400/80 transition" />
              )}
              <span className="text-[10px] font-medium text-[var(--text-muted)]">+{item.weight}%</span>
            </div>
            <span
              className={`text-xs font-semibold leading-tight ${
                item.completed ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-white'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
