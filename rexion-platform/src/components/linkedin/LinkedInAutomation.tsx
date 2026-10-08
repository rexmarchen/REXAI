'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { NetworkBrandMark } from './NetworkBrandMark'

export interface LinkedInAccountHealth {
  connected: boolean
  id?: string
  userId?: string
  provider?: string
  providerAcctId?: string
  accountName?: string
  headline?: string
  status: 'healthy' | 'warming_up' | 'paused' | 'disconnected'
  usedToday: number
  dailyLimit: number
  dailyCap: number
  warmupDay: number
  warmupTotalDays: number
  lastActionTime?: string
  lastActionAt?: string
  activeCampaignsCount: number
}

export interface LinkedInCampaign {
  id: string
  name: string
  targetRole: string
  targetCompany: string
  status: 'active' | 'paused' | 'complete'
  targetCount: number
  sent: number
  accepted: number
  replied: number
  createdAt: string
}

const INITIAL_HEALTH: LinkedInAccountHealth = {
  connected: false,
  accountName: 'LinkedIn Account',
  headline: 'Full Stack Engineer & Tech Lead',
  status: 'warming_up',
  usedToday: 0,
  dailyLimit: 6,
  dailyCap: 6,
  warmupDay: 1,
  warmupTotalDays: 14,
  lastActionTime: 'Never',
  activeCampaignsCount: 1,
}

const INITIAL_CAMPAIGNS: LinkedInCampaign[] = [
  {
    id: 'lic-1',
    name: 'Google Engineering & Talent Leads',
    targetRole: 'HR & Tech Recruiters',
    targetCompany: 'Google India',
    status: 'active',
    targetCount: 20,
    sent: 8,
    accepted: 5,
    replied: 2,
    createdAt: '2026-08-20',
  },
  {
    id: 'lic-2',
    name: 'Founders & VP Eng — High Growth FinTech',
    targetRole: 'Founders & VP Eng',
    targetCompany: 'Razorpay, Cred, Slice',
    status: 'active',
    targetCount: 15,
    sent: 4,
    accepted: 3,
    replied: 1,
    createdAt: '2026-08-21',
  },
  {
    id: 'lic-3',
    name: 'Quick Commerce Product Leaders',
    targetRole: 'Product Directors',
    targetCompany: 'Zepto, Blinkit',
    status: 'paused',
    targetCount: 12,
    sent: 6,
    accepted: 4,
    replied: 1,
    createdAt: '2026-08-18',
  },
]

export function LinkedInAutomation() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [health, setHealth] = useState<LinkedInAccountHealth>(INITIAL_HEALTH)
  const [campaigns, setCampaigns] = useState<LinkedInCampaign[]>(INITIAL_CAMPAIGNS)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 1. Check status on load and handle Unipile redirect parameters (?connected=1 / ?error=1)
  useEffect(() => {
    const connectedParam = searchParams?.get('connected')
    const errorParam = searchParams?.get('error')

    if (connectedParam === '1') {
      setToastMessage({
        type: 'success',
        text: '🎉 LinkedIn account successfully connected via Unipile! Account is in safe warmup mode (6 daily cap).',
      })
    } else if (errorParam === '1') {
      setToastMessage({
        type: 'error',
        text: '❌ LinkedIn connection was cancelled or encountered an error. Please try again.',
      })
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/linkedin/status')
        if (res.ok) {
          const data = await res.json()
          if (data.account) {
            setHealth({
              ...INITIAL_HEALTH,
              ...data.account,
              connected: data.connected ?? true,
              dailyCap: data.account.dailyCap || 6,
              dailyLimit: data.account.dailyCap || 6,
            })
          } else if (data.connected === false) {
            setHealth((prev) => ({ ...prev, connected: false }))
          }
        }
      } catch (err: any) {
        console.warn('Status fetch error:', err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [searchParams])

  // 2. Handle hosted auth connection via Unipile
  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch('/api/linkedin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (data.url) {
        // Redirect the user to Unipile hosted auth flow
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to obtain Unipile authorization link')
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: `Error initiating connection: ${err.message}`,
      })
      setConnecting(false)
    }
  }

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus: LinkedInCampaign['status'] = c.status === 'active' ? 'paused' : 'active'
          return { ...c, status: nextStatus }
        }
        return c
      })
    )
  }

  const budgetRatio = health.usedToday / (health.dailyCap || health.dailyLimit || 6)
  const isApproachingLimit = budgetRatio >= 0.85

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 text-slate-100 antialiased">
      <style jsx global>{`
        @keyframes networkDraw {
          from {
            stroke-dashoffset: 60;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              : 'bg-red-950/40 border-red-500/40 text-red-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{toastMessage.type === 'success' ? '🛡️' : '⚠️'}</span>
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0B0F17] border border-slate-800/80 p-6 md:p-10 shadow-2xl">
        {/* Subtle Watermark Mark in background */}
        <div className="absolute right-4 -bottom-10 md:right-10 md:-bottom-8 opacity-[0.06] pointer-events-none select-none">
          <NetworkBrandMark size={260} animate={false} />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0A66C2]/15 border border-[#0A66C2]/30 text-[#0A66C2] shadow-inner">
              <NetworkBrandMark size={28} animate={true} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0A66C2] px-2.5 py-0.5 rounded-full bg-[#0A66C2]/10 border border-[#0A66C2]/20">
              Unipile Hosted Auth · Safe Outreach
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            LinkedIn outreach, paced safely.
          </h1>

          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Send targeted, highly personalized connection requests and follow-ups with randomized human pacing to protect
            your account reputation.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!health.connected ? (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] active:bg-[#003366] text-white text-sm font-medium transition-all shadow-lg shadow-[#0A66C2]/20 hover:shadow-[#0A66C2]/35 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/50 disabled:opacity-60"
              >
                <NetworkBrandMark size={16} animate={false} />
                {connecting ? 'Redirecting to Unipile...' : 'Connect LinkedIn Account'}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                LinkedIn Account Connected ({health.providerAcctId ? `ID: ${health.providerAcctId.slice(0, 8)}...` : 'Active'})
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700/60 transition-colors focus:outline-none"
            >
              {showHowItWorks ? 'Hide details' : 'How this works'}
            </button>
          </div>
        </div>

        {/* Expandable "How this works" drawer */}
        {showHowItWorks && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1.5">
              <span className="text-xs font-semibold text-[#0A66C2]">1. Hosted Authorization</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect securely via Unipile's official hosted flow. Your credentials stay encrypted and isolated.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1.5">
              <span className="text-xs font-semibold text-emerald-400">2. Adaptive Daily Cap</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                New accounts start in a gentle warmup track capped at 6 actions/day to preserve pristine sender reputation.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1.5">
              <span className="text-xs font-semibold text-sky-400">3. Human Jitter Pacing</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Actions are scheduled with non-uniform triangular jitter between 15–45 min intervals during working hours.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 2. ACCOUNT HEALTH CENTERPIECE PANEL */}
      <section className="rounded-2xl bg-[#0B0F17] border border-slate-800/80 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Account Telemetry</span>
            <h2 className="text-lg font-semibold text-white">Account Health & Safety Shield</h2>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                health.status === 'healthy' || health.status === 'warming_up'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  health.status === 'healthy' || health.status === 'warming_up' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              {health.status === 'warming_up'
                ? 'Warming Up (Safe)'
                : health.status === 'healthy'
                ? 'Healthy & Protected'
                : 'Outreach Paused'}
            </div>
          </div>
        </div>

        {/* 4 Telemetry Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0F141E] border border-slate-800/60 space-y-1">
            <span className="text-xs text-slate-400">Connection Status</span>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${health.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {health.connected ? 'Connected via Unipile' : 'Pending Authorization'}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {health.connected ? `Provider: ${health.provider || 'unipile'}` : 'Connect account to begin'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0F141E] border border-slate-800/60 space-y-1">
            <span className="text-xs text-slate-400">Daily Safe Action Budget</span>
            <div className="text-lg font-bold text-white">
              {health.usedToday} <span className="text-xs font-normal text-slate-400">/ {health.dailyCap || health.dailyLimit || 6} used</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${isApproachingLimit ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, budgetRatio * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F141E] border border-slate-800/60 space-y-1">
            <span className="text-xs text-slate-400">Warmup Protocol</span>
            <div className="text-sm font-semibold text-white">
              Day {health.warmupDay} <span className="text-xs text-slate-400">of {health.warmupTotalDays}</span>
            </div>
            <span className="text-[11px] text-emerald-400 block">Safe 6 actions/day ceiling</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0F141E] border border-slate-800/60 space-y-1">
            <span className="text-xs text-slate-400">Last Action Dispatched</span>
            <div className="text-sm font-semibold text-white">
              {health.lastActionAt ? new Date(health.lastActionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : health.lastActionTime || 'Just now'}
            </div>
            <span className="text-[11px] text-sky-400 block">Randomized Jitter: 15–45m</span>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE CAMPAIGNS & SEQUENCE TRACKS */}
      <section className="rounded-2xl bg-[#0B0F17] border border-slate-800/80 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Outreach Sequences</span>
            <h2 className="text-lg font-semibold text-white">Active Sequence Tracks</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            + Create Sequence Track
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Track Name</th>
                <th className="py-3 px-4">Targeting</th>
                <th className="py-3 px-4">Daily Cap</th>
                <th className="py-3 px-4">Sent</th>
                <th className="py-3 px-4">Accepted</th>
                <th className="py-3 px-4">Replied</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white">{c.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-300">{c.targetRole}</span>
                    <span className="text-[11px] text-slate-500 block">{c.targetCompany}</span>
                  </td>
                  <td className="py-3.5 px-4">{health.dailyCap || 6}/day</td>
                  <td className="py-3.5 px-4 font-mono">{c.sent}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400">{c.accepted}</td>
                  <td className="py-3.5 px-4 font-mono text-sky-400">{c.replied}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        c.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleCampaignStatus(c.id)}
                      className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                    >
                      {c.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
