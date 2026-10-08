'use client'

import { useEffect, useState } from 'react'
import { Mail, CheckCircle2, TrendingUp, AlertTriangle, RefreshCw, Layers } from 'lucide-react'

interface Stats {
  totalSent: number
  openRate: number
  replyRate: number
  bounceRate: number
}

interface CampaignStat {
  id: string
  name: string
  status: 'draft' | 'sending' | 'complete' | 'failed'
  sent: number
  opened: number
  replied: number
  bounced: number
  failed: number
  skipped: number
  total: number
  createdAt: string
}

export default function AppTracker() {
  const [stats, setStats] = useState<Stats>({ totalSent: 0, openRate: 0, replyRate: 0, bounceRate: 0 })
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const res = await fetch('/api/outreach/stats')
      if (!res.ok) {
        throw new Error('Failed to load tracking stats.')
      }

      const data = await res.json()
      setStats(data.aggregate || { totalSent: 0, openRate: 0, replyRate: 0, bounceRate: 0 })
      setCampaigns(data.campaigns || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading stats.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch and auto-refresh every 15 seconds
  useEffect(() => {
    fetchStats()

    const interval = setInterval(() => {
      fetchStats(true)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="text-sm text-slate-400">Loading campaign stats...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Campaign Performance
          </h2>
          <p className="text-xs text-slate-400">Auto-refreshing every 15 seconds</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-emerald-500/10 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Mail size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{stats.totalSent}</div>
            <div className="text-xs text-slate-400">Emails Sent</div>
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{stats.openRate}%</div>
            <div className="text-xs text-slate-400">Open Rate</div>
          </div>
        </div>

        {/* Reply Rate */}
        <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{stats.replyRate}%</div>
            <div className="text-xs text-slate-400">Reply Rate</div>
          </div>
        </div>

        {/* Bounce Rate */}
        <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{stats.bounceRate}%</div>
            <div className="text-xs text-slate-400">Bounce Rate</div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-[#111c18]/90 border border-emerald-500/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-emerald-500/10 bg-[#0b1210]/95 flex items-center gap-2">
          <Layers size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Outreach Campaigns</h3>
        </div>

        <div className="overflow-x-auto">
          {campaigns.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              No outreach campaigns built yet.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#0b1210]/70 border-b border-emerald-500/10 text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Sent</th>
                  <th className="px-6 py-4 text-center">Opened</th>
                  <th className="px-6 py-4 text-center">Replied</th>
                  <th className="px-6 py-4 text-center">Bounced</th>
                  <th className="px-6 py-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/5 text-slate-200">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-500/[0.01] transition">
                    <td className="px-6 py-4 font-semibold text-slate-100">{c.name}</td>
                    <td className="px-6 py-4">
                      {c.status === 'complete' ? (
                        <span className="inline-flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-md text-xs font-medium">
                          Complete
                        </span>
                      ) : c.status === 'sending' ? (
                        <span className="inline-flex items-center bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-md text-xs font-medium animate-pulse">
                          Sending
                        </span>
                      ) : c.status === 'failed' ? (
                        <span className="inline-flex items-center bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-md text-xs font-medium">
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md text-xs font-medium">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-300">{c.sent}</td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-400">{c.opened}</td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-400">{c.replied}</td>
                    <td className="px-6 py-4 text-center font-medium text-red-400">{c.bounced}</td>
                    <td className="px-6 py-4 text-right text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
