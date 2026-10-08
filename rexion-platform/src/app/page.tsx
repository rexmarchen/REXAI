'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Cpu,
  Layers,
  Send,
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
  Lock,
  Settings,
  Sliders,
  BellRing,
  Globe,
  Database,
  Terminal,
  MousePointerClick
} from 'lucide-react'
import Link from 'next/link'

interface LogMessage {
  time: string
  type: 'info' | 'success' | 'warn' | 'system' | 'elite'
  message: string
}

export default function RexionLandingPage() {
  // Autopilot Mode States
  const [isOneClickMode, setIsOneClickMode] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  
  // Ticking stats
  const [matchedRoles, setMatchedRoles] = useState(0)
  const [applicationsSent, setApplicationsSent] = useState(0)
  const [callbacksReceived, setCallbacksReceived] = useState(0)

  // Real-time console logs
  const [logs, setLogs] = useState<LogMessage[]>([])
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Staggered log script
  const normalScript = [
    { type: 'info', message: 'EXTRACTING: Parsing resume (PDF)... Found 12 verified engineering skills.' },
    { type: 'info', message: 'STRUCTURING: Building career vectors and key matching dimensions.' },
    { type: 'success', message: 'MATCHING: Querying live listing database... Found 84 matches with score >= 90%.' },
    { type: 'info', message: 'MATCHING: Flagged 12 high-priority roles matching "Senior Frontend Engineer".' },
    { type: 'info', message: 'OUTREACH: Drafting hyper-personalized cover letters and mail threads.' },
    { type: 'success', message: 'OUTREACH: Delivering initial application emails via Resend adapter...' },
    { type: 'system', message: 'SYSTEM: Autopilot batch run complete. Waiting for callback signals.' }
  ]

  const eliteScript = [
    { type: 'elite', message: '1-CLICK MODE: ACTIVE (ELITE SUBSCRIPTION DETECTED)' },
    { type: 'elite', message: '1-CLICK MODE: Bypassing normal verification gates.' },
    { type: 'info', message: 'MATCHING: Scanning 84 fresh tech company databases in parallel...' },
    { type: 'info', message: 'MATCHING: Custom cover letters generated for all 84 targets.' },
    { type: 'success', message: 'OUTREACH: 84 application payloads queued in parallel pipelines.' },
    { type: 'success', message: 'OUTREACH: Successfully delivered 84 applications on autopilot.' },
    { type: 'system', message: 'SYSTEM: 1-Click batch outreach completed. Monitoring callbacks live.' }
  ]

  // Auto-ticking values simulator
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isOneClickMode) {
      // Elite high-speed ticks
      interval = setInterval(() => {
        setMatchedRoles(prev => Math.min(prev + Math.floor(Math.random() * 5) + 3, 1482))
        setApplicationsSent(prev => Math.min(prev + Math.floor(Math.random() * 4) + 2, 482))
        setCallbacksReceived(prev => Math.min(prev + (Math.random() > 0.8 ? 1 : 0), 48))
      }, 500)
    } else {
      // Normal pacing ticks
      interval = setInterval(() => {
        setMatchedRoles(prev => Math.min(prev + (Math.random() > 0.3 ? 1 : 0), 84))
        setApplicationsSent(prev => Math.min(prev + (Math.random() > 0.6 ? 1 : 0), 32))
        setCallbacksReceived(prev => Math.min(prev + (Math.random() > 0.95 ? 1 : 0), 8))
      }, 1500)
    }

    return () => clearInterval(interval)
  }, [isOneClickMode])

  // Log runner simulation
  useEffect(() => {
    setLogs([])
    setActiveStep(0)
    const script = isOneClickMode ? eliteScript : normalScript
    let index = 0

    const runScript = () => {
      if (index < script.length) {
        const item = script[index]
        const now = new Date()
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
        
        setLogs(prev => [...prev, {
          time: timeStr,
          type: item.type as any,
          message: item.message
        }])

        // Move workflow step indicators
        if (index < 2) setActiveStep(0) // Extract/Structure
        else if (index < 4) setActiveStep(1) // Match
        else setActiveStep(2) // Outreach

        index++
        const delay = isOneClickMode ? 800 : 1800
        setTimeout(runScript, delay)
      } else {
        setActiveStep(3) // System Active / Complete
      }
    }

    const firstDelay = setTimeout(runScript, 500)
    return () => {
      clearTimeout(firstDelay)
    }
  }, [isOneClickMode])

  // Scroll to bottom of log terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Handle resetting numbers when toggling modes
  const handleToggleMode = () => {
    setIsOneClickMode(prev => {
      const next = !prev
      if (next) {
        // Boost values
        setMatchedRoles(84)
        setApplicationsSent(32)
        setCallbacksReceived(8)
      } else {
        // Reset to baseline
        setMatchedRoles(0)
        setApplicationsSent(0)
        setCallbacksReceived(0)
      }
      return next
    })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-[#eef1f5] font-sans selection:bg-[#22c992]/20 selection:text-white relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-40 animate-scan"
        style={{
          maskImage: 'radial-gradient(circle at 50% 30%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 30%, transparent 80%)'
        }}
      />

      {/* Top Banner Indicator */}
      <div className="border-b border-[rgba(255,255,255,0.08)] bg-[#0b0f14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#22c992] rounded-full animate-pulse" />
              REXION
            </span>
            <span className="font-mono text-[10px] tracking-wider text-[#838f9c] border border-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded bg-[#10151b] uppercase hidden sm:inline-block">
              SYSTEM v2.4.1
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[#838f9c]">
              <span className={`w-2 h-2 rounded-full ${isOneClickMode ? 'bg-[#4d8dff] animate-breath-blue' : 'bg-[#22c992] animate-breath'}`} />
              STATUS: {isOneClickMode ? '1-CLICK AUTOPILOT ACTIVE' : 'MONITORING PIPELINE'}
            </div>
            <Link 
              href="/login" 
              className="font-mono text-xs tracking-wider text-[#838f9c] hover:text-white transition-colors duration-150 py-1.5 px-3 border border-[rgba(255,255,255,0.08)] rounded hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-[#22c992]"
            >
              LOG IN
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20 relative z-10">
        
        {/* HERO SECTION & SIGNATURE CONTROL PANEL */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Stark Copy & Intro */}
          <motion.div 
            className="lg:col-span-5 flex flex-col justify-center pt-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 font-mono text-xs text-[#22c992] mb-6 uppercase tracking-widest">
              <Activity size={12} className="animate-spin-slow" />
              JOB HUNTING AUTOPILOT
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.05] mb-6 text-balance"
            >
              Stop applying manually. Watch REXION run <span className="text-[#4d8dff]">outreach on autopilot</span>.
            </motion.h1>

            <motion.p 
              variants={itemVariants} 
              className="text-[#838f9c] text-lg mb-8 leading-relaxed text-balance"
            >
              We built REXION because job boards are black holes. Drag in your resume, verify matches against live listings, and let our system execute outreach before other candidates even see the posting.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-[#22c992] hover:bg-[#1eb582] text-[#05070a] font-display font-bold rounded-lg text-center tracking-wide transition-all duration-150 hover:shadow-[0_0_20px_rgba(34,201,146,0.3)] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#05070a] focus:ring-[#22c992]"
              >
                Activate Autopilot
              </Link>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#838f9c] sm:ml-2 mt-2 sm:mt-0">
                <Lock size={12} />
                No credentials needed to verify matches
              </div>
            </motion.div>

            {/* Quick Feature highlights */}
            <motion.div 
              variants={itemVariants} 
              className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.08)] grid grid-cols-2 gap-6"
            >
              <div>
                <h4 className="font-mono text-xs text-[#eef1f5] mb-2 uppercase tracking-wider">01 / ACTIVE EXTRACTION</h4>
                <p className="text-xs text-[#838f9c]">Converts unformatted resumes into structured profile embeddings.</p>
              </div>
              <div>
                <h4 className="font-mono text-xs text-[#eef1f5] mb-2 uppercase tracking-wider">02 / OUTBOX AUTOMATION</h4>
                <p className="text-xs text-[#838f9c]">Queues, drafts, and delivers applications through secure mail servers.</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Signature Instrumented Control Room */}
          <motion.div 
            className="lg:col-span-7 w-full"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Control Panel Shell */}
            <div className="bg-[#0b0f14] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl overflow-hidden relative">
              
              {/* Top Chrome Header Bar */}
              <div className="px-6 py-4 bg-[#10151b] border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22c992]/60" />
                  </div>
                  <span className="font-mono text-xs text-[#838f9c] ml-2">REXION_DASHBOARD_SHELL</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Elite mode badge */}
                  <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-[#ef4444] border border-[#ef4444]/20 px-2 py-0.5 rounded bg-[#ef4444]/5">
                    <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full animate-pulse" />
                    LIVE
                  </div>
                </div>
              </div>

              {/* Console Dashboard Area */}
              <div className="p-6 space-y-6">
                
                {/* Mode Selector and Elite Pill Capsule */}
                <div className="bg-[#10151b] p-4 border border-[rgba(255,255,255,0.08)] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#05070a] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                      <span className="font-mono text-xs text-[#838f9c]">07</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white text-sm">1-Click Mode</span>
                        <span className="font-mono text-[9px] tracking-widest text-[#f59e0b] border border-[#f59e0b]/30 px-1.5 py-0.2 rounded bg-[#f59e0b]/5 font-bold uppercase">
                          ELITE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#838f9c]">Trigger instant outreach to matches without verification wait times.</p>
                    </div>
                  </div>
                  
                  {/* Custom Autopilot Toggle Switch */}
                  <button 
                    onClick={handleToggleMode}
                    aria-label="Toggle 1-Click Mode"
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-250 focus:outline-none focus:ring-1 focus:ring-[#22c992] ${isOneClickMode ? 'bg-[#22c992]' : 'bg-white/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-[#05070a] shadow-md transform transition-transform duration-250 ${isOneClickMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Simulated Real-Time Metric Ticker Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#10151b] p-4 border border-[rgba(255,255,255,0.08)] rounded-lg relative overflow-hidden group">
                    <span className="font-mono text-[10px] text-[#838f9c] uppercase block mb-1">Roles Matched</span>
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-white block tracking-tight">
                      {matchedRoles}
                    </span>
                    <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-[#22c992]/40" />
                  </div>
                  <div className="bg-[#10151b] p-4 border border-[rgba(255,255,255,0.08)] rounded-lg relative overflow-hidden">
                    <span className="font-mono text-[10px] text-[#838f9c] uppercase block mb-1">Outreach Sent</span>
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-white block tracking-tight">
                      {applicationsSent}
                    </span>
                    <div className={`absolute right-3 top-3 w-1.5 h-1.5 rounded-full ${isOneClickMode ? 'bg-[#ef4444] animate-ping' : 'bg-[#4d8dff]/40'}`} />
                  </div>
                  <div className="bg-[#10151b] p-4 border border-[rgba(255,255,255,0.08)] rounded-lg relative overflow-hidden">
                    <span className="font-mono text-[10px] text-[#838f9c] uppercase block mb-1">Callbacks</span>
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-white block tracking-tight">
                      {callbacksReceived}
                    </span>
                    <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-yellow-500/40" />
                  </div>
                </div>

                {/* Pipeline Flow Steps visualization */}
                <div className="grid grid-cols-4 gap-2 relative">
                  <div className="absolute top-[18px] left-[12%] right-[12%] h-[1px] bg-white/5 z-0" />
                  {[
                    { label: 'EXTRACT', icon: Database },
                    { label: 'STRUCTURE', icon: Sliders },
                    { label: 'MATCH', icon: Cpu },
                    { label: 'OUTREACH', icon: Send }
                  ].map((step, idx) => {
                    const StepIcon = step.icon
                    const isPassed = activeStep >= idx
                    const isActive = activeStep === idx
                    return (
                      <div key={idx} className="flex flex-col items-center text-center z-10">
                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? (isOneClickMode ? 'border-[#4d8dff] bg-[#4d8dff]/10 text-[#4d8dff] shadow-[0_0_12px_rgba(77,141,255,0.2)]' : 'border-[#22c992] bg-[#22c992]/10 text-[#22c992] shadow-[0_0_12px_rgba(34,201,146,0.2)]')
                            : isPassed
                            ? 'border-[#22c992] bg-[#22c992]/5 text-[#22c992]'
                            : 'border-white/5 bg-[#10151b] text-white/20'
                        }`}>
                          <StepIcon size={14} className={isActive ? 'animate-pulse' : ''} />
                        </div>
                        <span className={`font-mono text-[9px] tracking-wider mt-2 ${
                          isActive 
                            ? (isOneClickMode ? 'text-[#4d8dff]' : 'text-[#22c992]') 
                            : isPassed 
                            ? 'text-white' 
                            : 'text-white/20'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Instrumentation Log Box */}
                <div className="bg-[#05070a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs relative">
                  <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[9px] text-[#838f9c] tracking-wider">
                    <Terminal size={10} />
                    LIVE LOG STREAM
                  </div>
                  
                  <div className="space-y-2.5 pt-2">
                    <AnimatePresence>
                      {logs.map((log, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-start gap-3 leading-relaxed"
                        >
                          <span className="text-[#838f9c]/60 select-none">[{log.time}]</span>
                          
                          {log.type === 'elite' ? (
                            <span className="text-[#f59e0b] font-semibold bg-[#f59e0b]/10 px-1.5 py-0.2 rounded text-[10px] tracking-tight">
                              ELITE
                            </span>
                          ) : log.type === 'success' ? (
                            <span className="text-[#22c992] font-semibold">✓</span>
                          ) : (
                            <span className="text-[#4d8dff] font-semibold">→</span>
                          )}

                          <span className={
                            log.type === 'elite' 
                              ? 'text-[#f59e0b]' 
                              : log.type === 'success' 
                              ? 'text-[#22c992]' 
                              : log.type === 'system'
                              ? 'text-white font-semibold'
                              : 'text-[#eef1f5]'
                          }>
                            {log.message}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                {/* Mode override alert indicator */}
                {isOneClickMode && (
                  <div className="p-3 bg-red-950/20 border border-[#ef4444]/20 rounded-lg flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-beacon flex-shrink-0" />
                    <span className="font-mono text-[10px] tracking-wide text-red-400">
                      WARNING: 1-Click autopilot is bypass-verifying all matching nodes. Speed is operating at maximum threshold.
                    </span>
                  </div>
                )}

              </div>
            </div>
          </motion.div>

        </div>

        {/* SECTION 2: HOW IT RUNS (WORKFLOW) */}
        <section className="mt-32 lg:mt-48 relative">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono text-xs tracking-widest text-[#838f9c] uppercase block mb-3">
              02 / WORKFLOW PIPELINE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Designed to target roles before search indices update
            </h2>
            <p className="text-[#838f9c]">
              Other products scrap listings every 24 hours. REXION queries directly against job provider adapters to trigger immediate pipelines.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Resume Extraction',
                desc: 'Parse and resolve career assets, project summaries, and toolsets into standardized multi-dimensional matrices.'
              },
              {
                step: '02',
                title: 'Structured Matching',
                desc: 'Compare candidate profile maps against live listings to produce high-integrity compatibility scores.'
              },
              {
                step: '03',
                title: 'Verification Filter',
                desc: 'Confirm constraints: compensation limits, timezone overlaps, stack compatibility, and location policies.'
              },
              {
                step: '04',
                title: 'Autopilot Outreach',
                desc: 'Deliver outbound emails, complete application forms, and notify you as soon as confirmation logs update.'
              }
            ].map((card, idx) => (
              <div 
                key={idx}
                className="bg-[#0b0f14] p-6 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-[#22c992]/40 transition-all duration-200 hover:scale-[1.01] group relative"
              >
                <span className="font-mono text-[#838f9c]/30 text-4xl font-bold block mb-4 group-hover:text-[#22c992]/20 transition-colors">
                  {card.step}
                </span>
                <h3 className="font-display font-bold text-white text-lg mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-[#838f9c] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: PROOF / METRICS */}
        <section className="mt-32 lg:mt-48 py-12 border-y border-[rgba(255,255,255,0.08)] bg-[#0b0f14]/30 relative">
          <div className="grid sm:grid-cols-3 gap-12 text-center">
            
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-[#838f9c] tracking-widest uppercase block">
                Average Match Latency
              </span>
              <span className="font-display text-5xl font-bold text-white block tracking-tight">
                18m
              </span>
              <p className="text-xs text-[#838f9c] max-w-[200px] mx-auto">
                From corporate listing publish to matching pipeline execution.
              </p>
            </div>

            <div className="space-y-2 border-y sm:border-y-0 sm:border-x border-[rgba(255,255,255,0.08)] py-8 sm:py-0">
              <span className="font-mono text-[10px] text-[#838f9c] tracking-widest uppercase block">
                Outreach Speedup
              </span>
              <span className="font-display text-5xl font-bold text-white block tracking-tight text-emerald">
                4.2x
              </span>
              <p className="text-xs text-[#838f9c] max-w-[200px] mx-auto">
                Volume amplification compared to manual form-filling limits.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] text-[#838f9c] tracking-widest uppercase block">
                Verification Latency
              </span>
              <span className="font-display text-5xl font-bold text-white block tracking-tight">
                0.8s
              </span>
              <p className="text-xs text-[#838f9c] max-w-[200px] mx-auto">
                Calculations required to filter and map standard applicant roles.
              </p>
            </div>

          </div>
        </section>

        {/* SECTION 4: SINGLE CTA */}
        <section className="mt-32 lg:mt-48 text-center max-w-3xl mx-auto">
          <div className="bg-[#0b0f14] p-10 lg:p-16 border border-[rgba(255,255,255,0.08)] rounded-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -inset-10 bg-radial-gradient(circle, rgba(34,201,146,0.04), transparent 50%) pointer-events-none" />
            
            <span className="font-mono text-xs tracking-widest text-[#22c992] uppercase block mb-4">
              READY TO LAUNCH
            </span>
            
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6 text-balance">
              Let REXION handle your search while you focus on the callbacks.
            </h2>
            
            <p className="text-[#838f9c] text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Activate your pipeline in seconds. Upload your resume to find and apply to roles on autopilot.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-10 py-4 bg-[#22c992] hover:bg-[#1eb582] text-[#05070a] font-display font-bold rounded-lg text-center tracking-wide transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(34,201,146,0.3)] focus:outline-none focus:ring-2 focus:ring-[#22c992]"
              >
                Create Autopilot Account
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.08)] py-8 mt-32 text-center text-xs text-[#838f9c] font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            © {new Date().getFullYear()} REXION AI. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
            <a href="#" className="hover:text-white transition-colors">TERMS OF USE</a>
            <a href="mailto:support@rexion.ai" className="hover:text-white transition-colors">SUPPORT@REXION.AI</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
