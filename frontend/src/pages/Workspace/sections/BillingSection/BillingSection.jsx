import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  X,
  Zap,
  Shield,
  ShieldCheck,
  Sparkles,
  Crown,
  ArrowRight,
  Lock,
  Download,
  CreditCard,
  Calendar,
  TrendingUp,
  Bot,
  Send,
  FileText,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  HelpCircle
} from 'lucide-react'
import styles from './BillingSection.module.css'

const INVOICE_HISTORY = [
  {
    id: 'INV-2026-0891',
    date: 'Sep 15, 2026',
    plan: 'Elite Plan (Annual)',
    amount: '₹22,488',
    status: 'Paid',
    method: 'Mastercard •••• 4242'
  },
  {
    id: 'INV-2026-0742',
    date: 'Aug 15, 2026',
    plan: 'Pro Plan (Monthly)',
    amount: '₹999',
    status: 'Paid',
    method: 'UPI (candidate@okaxis)'
  },
  {
    id: 'INV-2026-0610',
    date: 'Jul 15, 2026',
    plan: 'Pro Plan (Monthly)',
    amount: '₹999',
    status: 'Paid',
    method: 'UPI (candidate@okaxis)'
  }
]

const COMPARISON_CATEGORIES = [
  {
    category: 'Job Discovery & AI Matching',
    rows: [
      { name: 'AI Curated Matches', free: '5 / day', pro: 'Unlimited', elite: 'Unlimited + Instant Signal' },
      { name: 'Real-time Signal Alerts (<24h)', free: false, pro: true, elite: true },
      { name: 'Salary & Compensation Estimator', free: 'Basic Range', pro: 'Verified Market Benchmarks', elite: 'Full Tier-1 Breakdown' },
      { name: 'Custom Role Lanes Filter', free: '1 Active Lane', pro: '5 Custom Lanes', elite: 'Unlimited Specialized Lanes' }
    ]
  },
  {
    category: 'Autonomous Apply Automation',
    rows: [
      { name: '1-Click Chromium Autonomous Agent', free: false, pro: false, elite: 'Active (Greenhouse, Lever, Ashby, Workday)' },
      { name: 'Screening Question RAG Auto-Solver', free: false, pro: false, elite: 'Deep Candidate Vector Match' },
      { name: 'Screenshot Submission Proof Archive', free: false, pro: false, elite: 'High-Res Timestamped Proof' },
      { name: 'Automated Applications Per Month', free: '0 (Manual)', pro: '0 (Manual)', elite: '150 Automated Runs / mo' },
      { name: 'Anti-Stale Guarantee (<= 48h freshness)', free: false, pro: 'Standard', elite: 'Guaranteed Live Verified' }
    ]
  },
  {
    category: 'Recruiter Outreach & Networking',
    rows: [
      { name: 'Hiring Manager Verified Emails', free: false, pro: '50 / month', elite: 'Unlimited Unlocks' },
      { name: 'AI Cold Email Personalization Engine', free: false, pro: 'Tailored Tone & Proofs', elite: 'C-Suite Executive Tailored' },
      { name: 'Open & Click Webhook Tracking', free: false, pro: true, elite: true },
      { name: 'Automated Follow-Up Cadence Queue', free: false, pro: '2-Step Follow-Up', elite: 'Multi-Touch Intelligent Cadence' }
    ]
  },
  {
    category: 'LinkedIn Automation Engine',
    rows: [
      { name: 'Automated Connection Requests', free: false, pro: '50 / week (Human Pace)', elite: '100 / week + Priority Queue' },
      { name: 'Human-Jitter & Anti-Ban Safety Rail', free: false, pro: true, elite: true },
      { name: 'Automated InMail & Note Generator', free: false, pro: true, elite: true }
    ]
  },
  {
    category: 'Resume Studio & ATS Intelligence',
    rows: [
      { name: 'ATS Compatibility Scans', free: '1 / day', pro: 'Unlimited', elite: 'Unlimited' },
      { name: 'Keyword Gap Analysis & Injections', free: 'Basic', pro: 'Deep Semantic Match', elite: 'Executive RAG Tailored' },
      { name: 'LaTeX & Clean PDF Exports', free: 'Watermarked', pro: 'Clean Unbranded', elite: 'Executive Formatting Suite' }
    ]
  },
  {
    category: 'Micro-Internship Arena',
    rows: [
      { name: 'Arena Access & Proof-of-Work Bidding', free: 'View Only', pro: 'Full Bidding Access', elite: 'VIP Featured Candidate Bids' },
      { name: 'Direct Escrow Payout Protection', free: false, pro: true, elite: true }
    ]
  },
  {
    category: 'Infrastructure & Support SLA',
    rows: [
      { name: 'Dedicated Cloud Runner Cluster', free: 'Shared Queue', pro: 'Standard Pool', elite: 'Dedicated Isolated Runner Fleet' },
      { name: '1-on-1 Career Strategist Onboarding', free: false, pro: false, elite: 'Included (45-min Deep Dive)' },
      { name: 'Support SLA & Channels', free: 'Community (48h)', pro: 'Email & Discord (6h)', elite: '24/7 VIP Discord & WhatsApp' }
    ]
  }
]

export default function BillingSection({ plan = 'free', onPlanChange, user }) {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const [currency, setCurrency] = useState('INR') // 'INR' | 'USD'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [toastMessage, setToastMessage] = useState(null)
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false)
  const [isMatrixOpen, setIsMatrixOpen] = useState(true)

  const currentPlan = (plan || 'free').toLowerCase()

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleOpenUpgrade = (targetTier) => {
    setSelectedPlanForUpgrade(targetTier)
    setShowUpgradeModal(true)
  }

  const handleConfirmUpgrade = () => {
    if (!selectedPlanForUpgrade) return
    setIsProcessingUpgrade(true)

    setTimeout(() => {
      setIsProcessingUpgrade(false)
      setShowUpgradeModal(false)
      const newPlan = selectedPlanForUpgrade.toLowerCase()
      if (onPlanChange) {
        onPlanChange(newPlan)
      }
      showToast(`🎉 Successfully upgraded to ${selectedPlanForUpgrade.toUpperCase()} plan! Workspace features unlocked.`)
    }, 1200)
  }

  const handleDownloadInvoice = (inv) => {
    showToast(`📄 Downloading receipt ${inv.id} for ${inv.amount}...`)
    // Simulated receipt download
    const blob = new Blob([
      `REXION CAREER OS - RECEIPT\nInvoice: ${inv.id}\nDate: ${inv.date}\nPlan: ${inv.plan}\nAmount: ${inv.amount}\nPayment: ${inv.method}\nStatus: ${inv.status}\n\nThank you for choosing Rexion AI!`
    ], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${inv.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Pricing calculations
  const isAnnual = billingCycle === 'annual'
  const isUSD = currency === 'USD'

  const proPriceMonthly = isUSD ? '$14' : '₹999'
  const proPriceAnnual = isUSD ? '$10' : '₹749'
  const proPriceDisplay = isAnnual ? proPriceAnnual : proPriceMonthly

  const elitePriceMonthly = isUSD ? '$34' : '₹2,499'
  const elitePriceAnnual = isUSD ? '$26' : '₹1,874'
  const elitePriceDisplay = isAnnual ? elitePriceAnnual : elitePriceMonthly

  return (
    <div className={styles.billingContainer}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className={styles.toastNotification}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <CheckCircle2 size={18} color="#34d399" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. ACTIVE PLAN HERO OVERVIEW BANNER */}
      <section className={styles.heroBanner}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div
              className={`${styles.tierIconBox} ${
                currentPlan === 'elite'
                  ? styles.tierIconBoxElite
                  : currentPlan === 'pro'
                  ? styles.tierIconBoxPro
                  : ''
              }`}
            >
              {currentPlan === 'elite' ? (
                <Crown size={28} />
              ) : currentPlan === 'pro' ? (
                <Sparkles size={28} />
              ) : (
                <Zap size={28} />
              )}
            </div>
            <div className={styles.tierMeta}>
              <div className={styles.tierEyebrow}>
                <span>Current Membership</span>
                <span className={styles.statusPill}>
                  <span className={styles.statusDot} />
                  Active
                </span>
              </div>
              <h2 className={styles.tierTitle}>
                {currentPlan === 'elite'
                  ? 'Elite Domination Plan'
                  : currentPlan === 'pro'
                  ? 'Pro Job Hunter Plan'
                  : 'Free Starter Scout'}
              </h2>
              <p className={styles.tierDescription}>
                {currentPlan === 'elite'
                  ? 'Full autonomous 1-click apply, screening RAG, and verified recruiter discovery.'
                  : currentPlan === 'pro'
                  ? 'Active outreach automation, LinkedIn human-jitter cadence, and unlimited matches.'
                  : 'Baseline job matching and personal application tracking. Upgrade to activate AI agents.'}
              </p>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.billingDetails}>
              <span className={styles.renewalText}>
                {currentPlan === 'free' ? 'No renewal fee' : 'Renews on Oct 29, 2026'}
              </span>
              <span className={styles.paymentMethodTag}>
                <CreditCard size={14} />
                {currentPlan === 'free' ? 'Free tier' : 'Mastercard ending •••• 4242'}
              </span>
            </div>

            <div className={styles.heroActions}>
              {currentPlan === 'free' ? (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => handleOpenUpgrade('Pro')}
                >
                  <Sparkles size={16} />
                  Upgrade to Pro
                </button>
              ) : currentPlan === 'pro' ? (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => handleOpenUpgrade('Elite')}
                >
                  <Crown size={16} />
                  Upgrade to Elite
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => showToast('Membership settings are fully managed. Contact support for customized enterprise allocations.')}
                >
                  <ShieldCheck size={16} />
                  Elite VIP Member
                </button>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* 3. PRICING CONTROLS: BILLING CYCLE & CURRENCY TOGGLES */}
      <div className={styles.pricingControls}>
        <div className={styles.cycleToggleGroup}>
          <button
            type="button"
            className={`${styles.cycleButton} ${!isAnnual ? styles.cycleButtonActive : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`${styles.cycleButton} ${isAnnual ? styles.cycleButtonActive : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual Billing
            <span className={styles.savingsTag}>Save 25% + 2 Mo Free</span>
          </button>
        </div>

        <div className={styles.currencyToggle}>
          <button
            type="button"
            className={`${styles.currencyBtn} ${!isUSD ? styles.currencyBtnActive : ''}`}
            onClick={() => setCurrency('INR')}
          >
            INR (₹)
          </button>
          <button
            type="button"
            className={`${styles.currencyBtn} ${isUSD ? styles.currencyBtnActive : ''}`}
            onClick={() => setCurrency('USD')}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* 4. THREE MAIN SUBSCRIPTION TIER CARDS */}
      <div className={styles.tiersGrid}>
        {/* Tier 1: Free */}
        <article
          className={`${styles.tierCard} ${
            currentPlan === 'free' ? styles.tierCardActivePlan : ''
          }`}
        >
          <div className={styles.cardHead}>
            <div className={styles.cardTierName}>
              <span>Free</span>
              {currentPlan === 'free' && (
                <span className={styles.currentPlanBadge}>Current Plan</span>
              )}
            </div>
            <p className={styles.cardTierTagline}>
              For exploratory candidates tracking personal applications and baseline fits.
            </p>
            <div className={styles.priceWrapper}>
              <span className={styles.priceSymbol}>{isUSD ? '$' : '₹'}</span>
              <span className={styles.priceAmount}>0</span>
              <span className={styles.priceCadence}>/ forever</span>
            </div>
            <p className={styles.priceBilledNote}>No credit card required</p>
          </div>

          <div className={styles.cardDivider} />

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>5 AI Curated Matches per day</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Basic ATS Resume Score & Keyword Parser</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Personal Application Tracker (up to 20 roles)</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Public tech job feeds & salary estimates</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Standard Community Support</span>
            </li>
            <li className={`${styles.featureItem} ${styles.featureItemLocked}`}>
              <Lock size={15} className={styles.lockIcon} />
              <span>No Automated AI Application Agents</span>
            </li>
            <li className={`${styles.featureItem} ${styles.featureItemLocked}`}>
              <Lock size={15} className={styles.lockIcon} />
              <span>No Recruiter Direct Email Discovery</span>
            </li>
            <li className={`${styles.featureItem} ${styles.featureItemLocked}`}>
              <Lock size={15} className={styles.lockIcon} />
              <span>No LinkedIn Human-Jitter Automation</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span><strong>Free Micro-Internships</strong> Access</span>
            </li>
          </ul>

          <div className={styles.cardAction}>
            {currentPlan === 'free' ? (
              <button type="button" className={`${styles.cardBtn} ${styles.cardBtnCurrent}`} disabled>
                Active Plan
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.cardBtn} ${styles.cardBtnFree}`}
                onClick={() => {
                  if (onPlanChange) onPlanChange('free')
                  showToast('Downgraded to Free Starter plan.')
                }}
              >
                Downgrade to Free
              </button>
            )}
          </div>
        </article>

        {/* Tier 2: Pro */}
        <article
          className={`${styles.tierCard} ${styles.tierCardPro} ${
            currentPlan === 'pro' ? styles.tierCardActivePlan : ''
          }`}
        >
          <div className={styles.badgePopular}>Most Popular for Job Seekers</div>
          <div className={styles.cardHead}>
            <div className={styles.cardTierName}>
              <span>Pro</span>
              {currentPlan === 'pro' && (
                <span className={styles.currentPlanBadge}>Current Plan</span>
              )}
            </div>
            <p className={styles.cardTierTagline}>
              For active job hunters targeting 3x more recruiter replies and velocity.
            </p>
            <div className={styles.priceWrapper}>
              <span className={styles.priceAmount}>{proPriceDisplay}</span>
              <span className={styles.priceCadence}>/ month</span>
            </div>
            <p className={styles.priceBilledNote}>
              {isAnnual
                ? isUSD
                  ? 'Billed $120 / year'
                  : 'Billed ₹8,988 / year'
                : 'Billed monthly, cancel anytime'}
            </p>
          </div>

          <div className={styles.cardDivider} />

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <strong>Unlimited Real-Time AI Job Matches</strong>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span><strong>50 Verified Outreach Drafts / mo</strong> (CEO/CTO/Recruiter)</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span><strong>LinkedIn Automation</strong> (Human cadence & anti-ban jitter)</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span><strong>Micro-Internship Arena</strong>: Direct proof-of-work project bidding</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span><strong>Deep Resume Studio</strong>: Unlimited ATS scans & LaTeX rewrites</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Email Open & Reply Webhook Notifications</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Recruiter Hiring Signal Radar</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIcon} />
              <span>Priority Email & Discord Support (6h SLA)</span>
            </li>
            <li className={`${styles.featureItem} ${styles.featureItemLocked}`}>
              <Lock size={15} className={styles.lockIcon} />
              <span>No 1-Click Autonomous Chromium Apply Agent</span>
            </li>
          </ul>

          <div className={styles.cardAction}>
            {currentPlan === 'pro' ? (
              <button type="button" className={`${styles.cardBtn} ${styles.cardBtnCurrent}`} disabled>
                Active Plan
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.cardBtn} ${styles.cardBtnPro}`}
                onClick={() => handleOpenUpgrade('Pro')}
              >
                Upgrade to Pro
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </article>

        {/* Tier 3: Elite */}
        <article
          className={`${styles.tierCard} ${styles.tierCardElite} ${
            currentPlan === 'elite' ? styles.tierCardActivePlan : ''
          }`}
        >
          <div className={styles.badgeEliteFlagship}>Flagship Career Automation</div>
          <div className={styles.cardHead}>
            <div className={styles.cardTierName}>
              <span style={{ color: '#facc15' }}>Elite</span>
              {currentPlan === 'elite' && (
                <span className={styles.currentPlanBadge} style={{ borderColor: 'rgba(234, 179, 8, 0.4)', color: '#facc15' }}>
                  Current Plan
                </span>
              )}
            </div>
            <p className={styles.cardTierTagline}>
              Hands-off career autopilot. Headless browser applies while you sleep.
            </p>
            <div className={styles.priceWrapper}>
              <span className={styles.priceAmount}>{elitePriceDisplay}</span>
              <span className={styles.priceCadence}>/ month</span>
            </div>
            <p className={styles.priceBilledNote}>
              {isAnnual
                ? isUSD
                  ? 'Billed $312 / year'
                  : 'Billed ₹22,488 / year'
                : 'Billed monthly, cancel anytime'}
            </p>
          </div>

          <div className={styles.cardDivider} />

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <strong>Everything in Pro with Zero Limits</strong>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <strong>1-Click Autonomous Chromium Apply Agent</strong> (Greenhouse/Lever/Ashby)
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <span><strong>Screening Question RAG Engine</strong>: Contextual answers tailored to you</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <span><strong>Screenshot Proof Archive</strong>: Verified visual proof of every apply</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <span><strong>Unlimited Verified Executive Contacts</strong></span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <span><strong>Anti-Stale Guarantee</strong>: Surfaced within 48h of company posting</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <span><strong>Dedicated Cloud Chromium Runner Fleet</strong> with IP rotation</span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <span><strong>1-on-1 Career Strategist Onboarding Call</strong></span>
            </li>
            <li className={styles.featureItem}>
              <Check size={16} className={styles.checkIconGold} />
              <span><strong>24/7 VIP Discord & WhatsApp</strong> Direct Escalation Channel</span>
            </li>
          </ul>

          <div className={styles.cardAction}>
            {currentPlan === 'elite' ? (
              <button type="button" className={`${styles.cardBtn} ${styles.cardBtnCurrent}`} disabled>
                Active Plan
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.cardBtn} ${styles.cardBtnElite}`}
                onClick={() => handleOpenUpgrade('Elite')}
              >
                <Crown size={16} />
                Upgrade to Elite
              </button>
            )}
          </div>
        </article>
      </div>

      {/* 5. SIDE-BY-SIDE FEATURE COMPARISON MATRIX TABLE */}
      <section className={styles.matrixSection}>
        <div
          className={styles.sectionHeader}
          style={{ cursor: 'pointer' }}
          onClick={() => setIsMatrixOpen(!isMatrixOpen)}
        >
          <div>
            <h3 className={styles.sectionTitle}>
              <Layers size={18} color="#60a5fa" />
              Complete Feature Comparison Matrix
            </h3>
            <p className={styles.sectionSubtitle}>
              Detailed breakdown of allowances, toolkits, and infrastructure across all three tiers.
            </p>
          </div>
          <button type="button" className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem' }}>
            {isMatrixOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {isMatrixOpen ? 'Collapse' : 'Expand Matrix'}
          </button>
        </div>

        {isMatrixOpen && (
          <div className={styles.matrixTableWrapper}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Capability / Feature</th>
                  <th>Free Plan</th>
                  <th className={styles.colHeaderPro}>Pro Plan</th>
                  <th className={styles.colHeaderElite}>Elite Domination</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_CATEGORIES.map((cat, idx) => (
                  <React.Fragment key={idx}>
                    <tr className={styles.matrixCategoryRow}>
                      <td colSpan={4}>{cat.category}</td>
                    </tr>
                    {cat.rows.map((row, rIdx) => (
                      <tr key={rIdx} className={styles.matrixRow}>
                        <td className={styles.matrixFeatureName}>{row.name}</td>
                        <td>
                          {typeof row.free === 'boolean' ? (
                            row.free ? (
                              <span className={styles.cellCheck}><Check size={15} /> Yes</span>
                            ) : (
                              <span className={styles.cellCross}><X size={15} /> No</span>
                            )
                          ) : (
                            row.free
                          )}
                        </td>
                        <td>
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? (
                              <span className={styles.cellCheck}><Check size={15} /> Yes</span>
                            ) : (
                              <span className={styles.cellCross}><X size={15} /> No</span>
                            )
                          ) : (
                            <strong>{row.pro}</strong>
                          )}
                        </td>
                        <td>
                          {typeof row.elite === 'boolean' ? (
                            row.elite ? (
                              <span className={styles.cellCheckGold}><Check size={15} /> Yes</span>
                            ) : (
                              <span className={styles.cellCross}><X size={15} /> No</span>
                            )
                          ) : (
                            <strong style={{ color: '#facc15' }}>{row.elite}</strong>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. INVOICES & BILLING HISTORY TABLE */}
      <section className={styles.invoicesSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>
              <FileText size={18} color="#60a5fa" />
              Invoices & Payment History
            </h3>
            <p className={styles.sectionSubtitle}>
              Download official receipts and tax invoices for personal accounting or employer reimbursement.
            </p>
          </div>
        </div>

        <div className={styles.invoicesTableWrapper}>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Billing Date</th>
                <th>Plan Tier</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {INVOICE_HISTORY.map((inv) => (
                <tr key={inv.id}>
                  <td className={styles.invoiceId}>{inv.id}</td>
                  <td>{inv.date}</td>
                  <td>{inv.plan}</td>
                  <td><strong>{inv.amount}</strong></td>
                  <td>{inv.method}</td>
                  <td>
                    <span className={styles.invoicePaidPill}>
                      <CheckCircle2 size={12} />
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.downloadBtn}
                      onClick={() => handleDownloadInvoice(inv)}
                      title="Download Invoice PDF"
                    >
                      <Download size={14} />
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. TRUST & PAYMENT METHODS BANNER */}
      <section className={styles.trustBanner}>
        <div className={styles.trustItems}>
          <div className={styles.trustItem}>
            <Shield size={18} />
            <span>256-Bit Bank-Grade Encryption</span>
          </div>
          <div className={styles.trustItem}>
            <ShieldCheck size={18} />
            <span>7-Day Money-Back Guarantee</span>
          </div>
          <div className={styles.trustItem}>
            <Clock size={18} />
            <span>Instant Access & Cancel Anytime</span>
          </div>
        </div>

        <div className={styles.paymentLogos}>
          <span>Accepted:</span>
          <span className={styles.paymentTag}>UPI (GPay / PhonePe)</span>
          <span className={styles.paymentTag}>Visa</span>
          <span className={styles.paymentTag}>Mastercard</span>
          <span className={styles.paymentTag}>RuPay</span>
          <span className={styles.paymentTag}>Netbanking</span>
        </div>
      </section>

      {/* 8. UPGRADE CHECKOUT MODAL */}
      <AnimatePresence>
        {showUpgradeModal && selectedPlanForUpgrade && (
          <div className={styles.modalOverlay} onClick={() => setShowUpgradeModal(false)}>
            <motion.div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowUpgradeModal(false)}
              >
                <X size={16} />
              </button>

              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Upgrade to {selectedPlanForUpgrade} Plan
                </h3>
                <p className={styles.modalSubtitle}>
                  Unlock autonomous agents, verified contacts, and rapid career acceleration.
                </p>
              </div>

              <div className={styles.orderSummaryBox}>
                <div className={styles.summaryRow}>
                  <span>Plan Selected</span>
                  <strong>{selectedPlanForUpgrade} Tier</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Billing Cadence</span>
                  <span>{isAnnual ? 'Annual (25% Savings)' : 'Monthly'}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Base Price</span>
                  <span>
                    {selectedPlanForUpgrade === 'Elite'
                      ? isAnnual
                        ? isUSD ? '$26 / mo' : '₹1,874 / mo'
                        : isUSD ? '$34 / mo' : '₹2,499 / mo'
                      : isAnnual
                      ? isUSD ? '$10 / mo' : '₹749 / mo'
                      : isUSD ? '$14 / mo' : '₹999 / mo'}
                  </span>
                </div>
                <div className={styles.summaryTotalRow}>
                  <span>Due Today</span>
                  <span style={{ color: '#60a5fa' }}>
                    {selectedPlanForUpgrade === 'Elite'
                      ? isAnnual
                        ? isUSD ? '$312' : '₹22,488'
                        : isUSD ? '$34' : '₹2,499'
                      : isAnnual
                      ? isUSD ? '$120' : '₹8,988'
                      : isUSD ? '$14' : '₹999'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>
                  Select Payment Method:
                </span>
                <div className={styles.paymentMethodsGrid}>
                  <button
                    type="button"
                    className={`${styles.payMethodBtn} ${paymentMethod === 'upi' ? styles.payMethodBtnActive : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <Zap size={18} />
                    <span>UPI / QR</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.payMethodBtn} ${paymentMethod === 'card' ? styles.payMethodBtnActive : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={18} />
                    <span>Card / Debit</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.payMethodBtn} ${paymentMethod === 'netbanking' ? styles.payMethodBtnActive : ''}`}
                    onClick={() => setPaymentMethod('netbanking')}
                  >
                    <Shield size={18} />
                    <span>Netbanking</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={styles.btnPrimary}
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={handleConfirmUpgrade}
                disabled={isProcessingUpgrade}
              >
                {isProcessingUpgrade ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Activating {selectedPlanForUpgrade} Plan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm & Activate {selectedPlanForUpgrade}</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
