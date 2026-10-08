'use client'

import React from 'react'

export interface LeaderboardEntry {
  rank: number
  name: string
  points: number
  completedGigs: number
  avatarUrl?: string
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[rgba(15,26,22,0.8)] shadow-soft">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-white/8 bg-black/40 text-[var(--text-secondary)] uppercase font-semibold">
          <tr>
            <th className="px-6 py-4">Rank</th>
            <th className="px-6 py-4">Developer</th>
            <th className="px-6 py-4">Sprints Completed</th>
            <th className="px-6 py-4 text-right">Reputation Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/6 text-white">
          {entries.map((entry) => (
            <tr key={entry.rank} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-bold text-emerald-400">#{entry.rank}</td>
              <td className="px-6 py-4 font-semibold">{entry.name}</td>
              <td className="px-6 py-4 text-[var(--text-secondary)]">{entry.completedGigs} Sprints</td>
              <td className="px-6 py-4 text-right font-mono text-emerald-400">{entry.points.toLocaleString()} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
