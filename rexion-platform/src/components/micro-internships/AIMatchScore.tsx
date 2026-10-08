'use client'

import React from 'react'

export function AIMatchScore({ score }: { score: number }) {
  const scoreColor =
    score >= 85
      ? 'from-emerald-500 to-teal-400 text-emerald-400 border-emerald-500/30'
      : score >= 70
      ? 'from-amber-500 to-yellow-400 text-amber-400 border-amber-500/30'
      : 'from-zinc-500 to-zinc-400 text-zinc-400 border-zinc-500/30'

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border bg-black/40 px-3 py-1 text-xs font-semibold backdrop-blur-md ${scoreColor}`}>
      <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
      <span>AI Match Score: {score}%</span>
    </div>
  )
}
