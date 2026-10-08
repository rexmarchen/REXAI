import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  TrendingUp,
  Users,
  Award,
  HelpCircle,
  Lock,
  RefreshCw
} from 'lucide-react'

const PRICING_STATS = [
  {
    icon: TrendingUp,
    value: '4.8x',
    label: 'Faster Offer Velocity',
    detail: 'Average 25 days to offer vs 120 days industry benchmark'
  },
  {
    icon: Users,
    value: '10,000+',
    label: 'Candidates Powered',
    detail: 'Active learners and applicants landing roles across top tech'
  },
  {
    icon: Award,
    value: '94%',
    label: 'Interview Conversion',
    detail: 'For candidates utilizing tailored ATS and direct recruiter outreach'
  },
  {
    icon: Sparkles,
    value: '₹14.2L',
    label: 'Avg Starting Package',
    detail: 'Verified average entry package across verified micro-gigs & roles'
  }
]

const TIERS = [
  {
    id: 'free',
    name: 'Starter',
    badge: 'FREE FOREVER',
    badgeColor: '#756E66',
    badgeBg: 'rgba(117, 110, 102, 0.12)',
    desc: 'Essential career exploration tools to discover target roles and identify skill gaps.',
    monthlyPrice: 0,
    annualPrice: 0,
    priceNote: 'No credit card required',
    popular: false,
    ctaText: 'Start for Free',
    ctaVariant: 'secondary',
    features: [
      { text: '5 AI Curated Job Matches / day', highlighted: false },
      { text: '1 Deep ATS Resume Scan / day', highlighted: false },
      { text: 'Verified Internship Explorer (<5h freshness)', highlighted: false },
      { text: '1 Active Career Track lane', highlighted: false },
      { text: 'Baseline App Tracker access', highlighted: false },
      { text: 'Discord Community Support', highlighted: false }
    ]
  },
  {
    id: 'pro',
    name: 'Career Velocity',
    badge: 'MOST POPULAR',
    badgeColor: '#E97852',
    badgeBg: '#FFEDE5',
    desc: 'Outreach automation, direct hiring manager unlocks & verified micro-gigs for active job seekers.',
    monthlyPrice: 999,
    annualPrice: 749,
    priceNote: 'Billed monthly or ₹8,988/yr',
    popular: true,
    ctaText: 'Upgrade to Pro →',
    ctaVariant: 'primary',
    features: [
      { text: 'Unlimited AI Job Matches & Hiring Heat signals', highlighted: true },
      { text: '50 Verified Hiring Manager Direct Emails / mo', highlighted: true },
      { text: 'AI Cold Email Personalization & Outreach Engine', highlighted: true },
      { text: 'LinkedIn Human-Paced Automation (50 invites/wk)', highlighted: true },
      { text: 'Unlimited ATS Scans + Clean PDF / LaTeX Exports', highlighted: true },
      { text: 'Micro-Internship Arena Access (₹12k-₹40k gigs)', highlighted: true },
      { text: 'Real-time Recruiter Open & Read Telemetry', highlighted: false },
      { text: 'Priority Email & Discord Support (6h SLA)', highlighted: false }
    ]
  },
  {
    id: 'elite',
    name: 'Career Domination',
    badge: 'FULL AUTOPILOT',
    badgeColor: '#10B981',
    badgeBg: '#ECFDF5',
    desc: 'End-to-end autonomous apply runner, vector screening solver & 1-on-1 executive career copilot.',
    monthlyPrice: 2499,
    annualPrice: 1874,
    priceNote: 'Billed monthly or ₹22,488/yr',
    popular: false,
    ctaText: 'Unlock Elite Access →',
    ctaVariant: 'elite',
    features: [
      { text: '1-Click Autonomous Apply (150 live runs / mo)', highlighted: true },
      { text: 'Greenhouse, Lever, Ashby & Workday Auto-Submit', highlighted: true },
      { text: 'Screening Question Vector RAG Auto-Solver', highlighted: true },
      { text: 'High-Res Timestamped Screenshot Proof for all applies', highlighted: true },
      { text: 'Unlimited Verified Recruiter & Founder Emails', highlighted: true },
      { text: '100 LinkedIn Invites / wk with Human-Jitter Safety', highlighted: true },
      { text: 'VIP Featured Candidate Bids on Micro-Gigs', highlighted: false },
      { text: '1-on-1 45-min Career Strategist Onboarding Call', highlighted: true },
      { text: '24/7 VIP Discord & WhatsApp Concierge SLA', highlighted: false }
    ]
  }
]

const GUARANTEES = [
  { icon: ShieldCheck, title: '7-Day Money-Back Guarantee', desc: 'No questions asked if you are not landing interviews.' },
  { icon: Lock, title: 'Bank-Grade 256-Bit SSL', desc: 'Your personal data and tokens are strictly encrypted.' },
  { icon: RefreshCw, title: 'Cancel or Switch Anytime', desc: 'Manage your plan in 1 click directly from your dashboard.' },
  { icon: Zap, title: 'Instant Workspace Access', desc: 'Automation tools and database unlocked immediately on checkout.' }
]

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const navigate = useNavigate()

  const isAnnual = billingCycle === 'annual'

  const handleCta = (tierId) => {
    if (tierId === 'free') {
      navigate('/dashboard')
    } else {
      navigate('/dashboard')
      // If user is already on dashboard, they can easily switch to billing
    }
  }

  return (
    <section
      id="pricing"
      style={{
        position: 'relative',
        backgroundColor: '#FAF6F0',
        color: '#161616',
        padding: '100px 24px 90px',
        borderTop: '1px solid #ECE3D7',
        borderBottom: '1px solid #ECE3D7',
        scrollMarginTop: '80px',
        overflow: 'hidden'
      }}
    >
      {/* Ambient warm gradient backgrounds */}
      <div
        style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(233, 120, 82, 0.12) 0%, rgba(250, 246, 240, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 52px' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: '#FFEDE5',
              border: '1px solid rgba(233, 120, 82, 0.3)',
              color: '#E97852',
              fontSize: '0.74rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}
          >
            <Crown size={13} />
            <span>TRANSPARENT PRICING · ZERO RISK</span>
          </div>

          <h2
            style={{
              fontFamily: "'Instrument Serif', 'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#161616',
              letterSpacing: '-0.02em',
              marginBottom: '16px'
            }}
          >
            Invest in Your Career Velocity
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: '#6A635B',
              margin: '0 auto 28px'
            }}
          >
            From discovering verified roles to 1-click autonomous application runs.
            Fair pricing that pays for itself with your very first interview offer.
          </p>

          {/* ── Billing Cycle Toggle ── */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECE3D7',
              borderRadius: '999px',
              padding: '4px',
              boxShadow: '0 4px 14px rgba(40, 30, 20, 0.04)'
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: !isAnnual ? '#161616' : 'transparent',
                color: !isAnnual ? '#FFFFFF' : '#6A635B',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              Monthly Billing
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: isAnnual ? '#161616' : 'transparent',
                color: isAnnual ? '#FFFFFF' : '#6A635B',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <span>Annual Billing</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: '#ECFDF5',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}
              >
                SAVE 25%
              </span>
            </button>
          </div>
        </motion.div>

        {/* ── Production Pricing Stats Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '48px'
          }}
        >
          {PRICING_STATS.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '20px',
                  padding: '20px 22px',
                  boxShadow: '0 4px 16px rgba(40, 30, 20, 0.03)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(40, 30, 20, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(40, 30, 20, 0.03)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#FFEDE5',
                    color: '#E97852',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={19} />
                </div>
                <div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '1.55rem',
                      fontWeight: 800,
                      color: '#161616',
                      lineHeight: 1.15,
                      marginBottom: '2px'
                    }}
                  >
                    {stat.value}
                  </strong>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#161616',
                      marginBottom: '4px'
                    }}
                  >
                    {stat.label}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.74rem',
                      color: '#756E66',
                      lineHeight: 1.45
                    }}
                  >
                    {stat.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* ── 3 Pricing Tier Cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
            marginBottom: '60px'
          }}
        >
          {TIERS.map((tier, idx) => {
            const currentPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice
            const isPro = tier.id === 'pro'
            const isElite = tier.id === 'elite'

            return (
              <motion.article
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'relative',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '26px',
                  border: isPro
                    ? '2px solid #E97852'
                    : '1px solid #ECE3D7',
                  padding: '36px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isPro
                    ? '0 16px 40px rgba(233, 120, 82, 0.14), 0 2px 10px rgba(40, 30, 20, 0.04)'
                    : '0 6px 24px rgba(40, 30, 20, 0.04)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = isPro
                    ? '0 24px 50px rgba(233, 120, 82, 0.2), 0 4px 14px rgba(40, 30, 20, 0.06)'
                    : '0 14px 36px rgba(40, 30, 20, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = isPro
                    ? '0 16px 40px rgba(233, 120, 82, 0.14), 0 2px 10px rgba(40, 30, 20, 0.04)'
                    : '0 6px 24px rgba(40, 30, 20, 0.04)'
                }}
              >
                {/* Popular Pill Tag */}
                {isPro && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #E97852 0%, #D96D48 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.70rem',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      padding: '4px 16px',
                      borderRadius: '999px',
                      boxShadow: '0 4px 12px rgba(233, 120, 82, 0.35)',
                      textTransform: 'uppercase'
                    }}
                  >
                    ★ MOST POPULAR
                  </div>
                )}

                {/* Top Section */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: '#161616',
                        margin: 0
                      }}
                    >
                      {tier.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: tier.badgeColor,
                        backgroundColor: tier.badgeBg,
                        padding: '3px 10px',
                        borderRadius: '999px'
                      }}
                    >
                      {tier.badge}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      color: '#6A635B',
                      minHeight: '44px',
                      margin: '0 0 20px 0'
                    }}
                  >
                    {tier.desc}
                  </p>

                  {/* Price display */}
                  <div
                    style={{
                      padding: '16px 0',
                      borderTop: '1px solid #F3ECE2',
                      borderBottom: '1px solid #F3ECE2',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '2.8rem',
                          fontWeight: 800,
                          color: '#161616',
                          lineHeight: 1,
                          letterSpacing: '-0.02em'
                        }}
                      >
                        ₹{currentPrice.toLocaleString('en-IN')}
                      </span>
                      {currentPrice > 0 && (
                        <span style={{ fontSize: '0.9rem', color: '#756E66', fontWeight: 500 }}>
                          / month
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        color: '#8C847A',
                        marginTop: '6px'
                      }}
                    >
                      {isAnnual && currentPrice > 0
                        ? `Billed annually (save 25%)`
                        : tier.priceNote}
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#756E66'
                      }}
                    >
                      Included in {tier.name}:
                    </span>
                    {tier.features.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '0.84rem',
                          color: feat.highlighted ? '#161616' : '#4A453E',
                          fontWeight: feat.highlighted ? 600 : 400,
                          lineHeight: 1.45
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: feat.highlighted ? '#ECFDF5' : '#F5F2EB',
                            color: feat.highlighted ? '#10B981' : '#756E66',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          <Check size={12} strokeWidth={2.8} />
                        </div>
                        <span>{feat.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => handleCta(tier.id)}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '999px',
                    fontSize: '0.90rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: isPro
                      ? 'none'
                      : isElite
                      ? '1.5px solid #161616'
                      : '1px solid #ECE3D7',
                    background: isPro
                      ? 'linear-gradient(135deg, #E97852 0%, #D96D48 100%)'
                      : isElite
                      ? '#161616'
                      : '#FFFFFF',
                    color: isPro || isElite ? '#FFFFFF' : '#161616',
                    boxShadow: isPro
                      ? '0 6px 18px rgba(233, 120, 82, 0.35)'
                      : isElite
                      ? '0 4px 14px rgba(22, 22, 22, 0.15)'
                      : '0 2px 8px rgba(40, 30, 20, 0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    if (isPro) {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(233, 120, 82, 0.45)'
                    } else if (isElite) {
                      e.currentTarget.style.backgroundColor = '#262626'
                    } else {
                      e.currentTarget.style.backgroundColor = '#F5ECE0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    if (isPro) {
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(233, 120, 82, 0.35)'
                    } else if (isElite) {
                      e.currentTarget.style.backgroundColor = '#161616'
                    } else {
                      e.currentTarget.style.backgroundColor = '#FFFFFF'
                    }
                  }}
                >
                  <span>{tier.ctaText}</span>
                </button>
              </motion.article>
            )
          })}
        </div>

        {/* ── Enterprise Trust & Guarantee Badges ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #ECE3D7',
            borderRadius: '24px',
            padding: '28px 32px',
            boxShadow: '0 4px 20px rgba(40, 30, 20, 0.04)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px'
          }}
        >
          {GUARANTEES.map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#FFEDE5',
                    color: '#E97852',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#161616',
                      marginBottom: '2px'
                    }}
                  >
                    {item.title}
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.74rem',
                      color: '#756E66',
                      lineHeight: 1.45
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
