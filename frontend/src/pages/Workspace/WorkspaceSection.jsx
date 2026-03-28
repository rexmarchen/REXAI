import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './WorkspaceSection.module.css'

const NAV_GROUPS = [
  {
    label: 'Core',
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: '01' },
      { id: 'matches', title: 'Job Matches', icon: '02' },
      { id: 'resume', title: 'Resume Studio', icon: '03' },
      { id: 'tracker', title: 'App Tracker', icon: '04' }
    ]
  },
  {
    label: 'Power Tools',
    items: [
      { id: 'outreach', title: 'Outreach', icon: '05', badge: 'Pro' },
      { id: 'gigs', title: 'Micro-Internships', icon: '06', badge: 'Pro' },
      { id: 'domination', title: '1-Click Mode', icon: '07', badge: 'Elite' }
    ]
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', title: 'Profile', icon: '08' },
      { id: 'billing', title: 'Billing', icon: '09' },
      { id: 'settings', title: 'Settings', icon: '10' }
    ]
  }
]

const dashboardStats = [
  { label: 'Jobs matched today', value: '84', detail: '+18% vs yesterday' },
  { label: 'Emails prepared', value: '26', detail: '12 queued for tonight' },
  { label: 'Applications out', value: '14', detail: '4 high-priority targets' },
  { label: 'Interviews booked', value: '3', detail: '1 founder chat pending' }
]

const quickActions = [
  { label: 'Launch Outreach', target: 'outreach' },
  { label: 'Browse Gigs', target: 'gigs' },
  { label: 'Open Resume Builder', route: '/resume' },
  { label: 'Run Predictor', route: '/resume-predictor' }
]

const activityFeed = [
  'Queued outreach for Razorpay hiring manager',
  'Resume score improved after product rewrite',
  'Matched to Zepto landing-page micro-gig',
  'Follow-up scheduled for Frontend Engineer at Cred'
]

const jobMatches = [
  { company: 'Razorpay', role: 'Frontend Engineer', fit: '94%', signal: 'Active hiring + strong stack overlap' },
  { company: 'Zepto', role: 'Product Design Intern', fit: '91%', signal: 'Micro-gig opened by the same team' },
  { company: 'Meesho', role: 'Software Development Intern', fit: '88%', signal: 'Recruiter recently active' },
  { company: 'CRED', role: 'Growth Designer', fit: '84%', signal: 'High domain fit, follow-up still open' }
]

const trackerColumns = [
  { title: 'Applied', cards: ['Frontend Engineer @ Razorpay', 'SDE Intern @ Meesho'] },
  { title: 'Outreach', cards: ['Recruiter contact @ CRED', 'Founder intro @ Zepto'] },
  { title: 'Interview', cards: ['Product round @ Slice', 'Screening @ Groww'] },
  { title: 'Offer', cards: ['PPO follow-up @ previous gig'] }
]

const outreachSteps = [
  'Search target company and hiring signal',
  'Select HR, recruiter, or founder contacts',
  'Generate personalized cold email',
  'Queue send, tracking, and follow-up'
]

const outreachCampaigns = [
  { company: 'Razorpay', contacts: 4, status: 'Sent', opens: 3, replies: 1 },
  { company: 'Zepto', contacts: 3, status: 'Queued', opens: 0, replies: 0 },
  { company: 'Meesho', contacts: 5, status: 'Partial', opens: 2, replies: 0 }
]

const microGigs = [
  { company: 'Zepto', title: 'Build a high-converting landing page', pay: '₹15,000', duration: '10 days', match: '96%' },
  { company: 'Sprinto', title: 'Redesign onboarding dashboard', pay: '₹18,000', duration: '14 days', match: '92%' },
  { company: 'Laminar', title: 'Create recruiter outreach assets', pay: '₹12,000', duration: '7 days', match: '89%' }
]

const billingPlans = [
  { name: 'Free', price: '₹0', note: '5 matches/day, baseline tracker access' },
  { name: 'Pro', price: '₹999', note: 'Outreach + micro-gigs + unlimited analysis' },
  { name: 'Elite', price: '₹2,499', note: 'Full automation, higher limits, onboarding call' }
]

const settingsRows = [
  { label: 'Daily summary email', value: 'Enabled' },
  { label: 'Open tracking', value: 'Enabled for Pro plans' },
  { label: 'Default outreach tone', value: 'Professional' },
  { label: 'Preferred role lane', value: 'Frontend + Product' }
]

const sectionMeta = {
  dashboard: { title: 'Dashboard', subtitle: 'A cleaner control room for the full job search loop.' },
  matches: { title: 'Job Matches', subtitle: 'Prioritized roles ranked by actual fit and hiring signal.' },
  resume: { title: 'Resume Studio', subtitle: 'Positioning, rewrite prompts, and readiness improvements.' },
  tracker: { title: 'Application Tracker', subtitle: 'Every stage, every follow-up, and no silent pipeline.' },
  outreach: { title: 'Outreach Automation', subtitle: 'Company search, contact discovery, personalization, and send review.' },
  gigs: { title: 'Micro-Internship Arena', subtitle: 'Proof-of-work opportunities that can become offers.' },
  domination: { title: '1-Click Domination', subtitle: 'Elite-only mode for parallel job, email, and follow-up operations.' },
  profile: { title: 'Profile', subtitle: 'Candidate summary, focus lane, and execution preferences.' },
  billing: { title: 'Billing', subtitle: 'Plan, usage, and upgrade pathways.' },
  settings: { title: 'Settings', subtitle: 'Workspace defaults for your search cadence.' }
}

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: 'easeOut' }
}

const getPlanName = (user) => {
  const rawPlan = user?.plan || user?.subscription?.plan || 'free'
  return String(rawPlan).toLowerCase()
}

const getFirstName = (user) => {
  const fullName = user?.fullName || user?.name || 'Operator'
  return String(fullName).trim().split(/\s+/)[0]
}

const planClassName = (plan) => {
  if (plan === 'elite') {
    return styles.planBadgeElite
  }

  if (plan === 'pro') {
    return styles.planBadgePro
  }

  return styles.planBadgeFree
}

const WorkspaceSection = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const firstName = getFirstName(user)
  const plan = getPlanName(user)
  const meta = sectionMeta[activeSection] || sectionMeta.dashboard

  const handleQuickAction = (action) => {
    if (action.route) {
      navigate(action.route)
      return
    }

    setActiveSection(action.target)
  }

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const renderUpgradeGate = (requiredPlan, copy) => (
    <div className={styles.upgradeGate}>
      <span className={styles.gateBadge}>{requiredPlan.toUpperCase()} feature</span>
      <h3>Upgrade to unlock this workflow.</h3>
      <p>{copy}</p>
      <button type="button" className={styles.upgradeButton} onClick={() => setActiveSection('billing')}>
        Review Plans
      </button>
    </div>
  )

  const renderDashboard = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <div className={styles.statsGrid}>
        {dashboardStats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.detail}</span>
          </article>
        ))}
      </div>

      <div className={styles.quickActions}>
        {quickActions.map((action) => (
          <button key={action.label} type="button" className={styles.quickActionButton} onClick={() => handleQuickAction(action)}>
            {action.label}
          </button>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Recent activity</p>
              <h3>Momentum across the search</h3>
            </div>
          </div>
          <div className={styles.activityList}>
            {activityFeed.map((item) => (
              <div key={item} className={styles.activityItem}>
                <span className={styles.activityDot} />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sideStack}>
          <article className={`${styles.panel} ${styles.signalPanel}`}>
            <span className={styles.panelEyebrow}>Micro-gig signal</span>
            <h3>You have 3 new gig matches.</h3>
            <p>Two companies also have active full-time openings. That is the highest-leverage follow-up lane today.</p>
            <button type="button" className={styles.inlineButton} onClick={() => setActiveSection('gigs')}>
              Review Matches
            </button>
          </article>

          <article className={styles.panel}>
            <span className={styles.panelEyebrow}>Daily focus</span>
            <ul className={styles.simpleList}>
              <li>Finish the Razorpay follow-up draft</li>
              <li>Shortlist 2 micro-gigs with pre-hiring signal</li>
              <li>Re-run resume positioning for product roles</li>
            </ul>
          </article>
        </section>
      </div>
    </motion.div>
  )

  const renderMatches = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <div className={styles.listPanel}>
        {jobMatches.map((match) => (
          <article key={`${match.company}-${match.role}`} className={styles.listRow}>
            <div>
              <strong>{match.role}</strong>
              <p>{match.company}</p>
            </div>
            <span className={styles.scorePill}>{match.fit}</span>
            <p className={styles.rowNote}>{match.signal}</p>
          </article>
        ))}
      </div>
    </motion.div>
  )

  const renderResume = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          <span className={styles.panelEyebrow}>Readiness score</span>
          <div className={styles.scoreHero}>
            <strong>91</strong>
            <p>The resume story is now clearer for frontend, product, and design-adjacent roles.</p>
          </div>
          <ul className={styles.simpleList}>
            <li>Headline now targets the right role family</li>
            <li>Project bullets show outcome, stack, and scope</li>
            <li>Experience reads more like shipped work than task list</li>
          </ul>
          <button type="button" className={styles.inlineButton} onClick={() => navigate('/resume')}>
            Open Resume Builder
          </button>
        </section>

        <section className={styles.panel}>
          <span className={styles.panelEyebrow}>Recommended next moves</span>
          <div className={styles.cardStack}>
            <article className={styles.miniCard}>
              <strong>Re-run ATS predictor</strong>
              <p>Check whether the new structure lifts parser confidence.</p>
            </article>
            <article className={styles.miniCard}>
              <strong>Create a product-focused variant</strong>
              <p>Keep one sharper version for PM and growth-facing roles.</p>
            </article>
          </div>
          <button type="button" className={styles.inlineButtonSecondary} onClick={() => navigate('/resume-predictor')}>
            Run Predictor
          </button>
        </section>
      </div>
    </motion.div>
  )

  const renderTracker = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <div className={styles.pipelineGrid}>
        {trackerColumns.map((column) => (
          <section key={column.title} className={styles.pipelineColumn}>
            <div className={styles.pipelineHeader}>
              <h3>{column.title}</h3>
              <span>{column.cards.length}</span>
            </div>
            <div className={styles.pipelineCards}>
              {column.cards.map((card) => (
                <article key={card} className={styles.pipelineCard}>
                  {card}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </motion.div>
  )

  const renderOutreach = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      {plan === 'free' ? (
        renderUpgradeGate('pro', 'Outreach now has a dedicated frontend flow: search companies, shortlist contacts, generate copy, then queue sends.')
      ) : (
        <>
          <div className={styles.stepper}>
            {outreachSteps.map((step, index) => (
              <div key={step} className={styles.stepItem}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
          <div className={styles.tablePanel}>
            {outreachCampaigns.map((campaign) => (
              <article key={campaign.company} className={styles.tableRow}>
                <strong>{campaign.company}</strong>
                <span>{campaign.contacts} contacts</span>
                <span>{campaign.status}</span>
                <span>{campaign.opens} opens</span>
                <span>{campaign.replies} replies</span>
              </article>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )

  const renderGigs = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <div className={styles.listPanel}>
        {microGigs.map((gig) => (
          <article key={`${gig.company}-${gig.title}`} className={styles.gigCard}>
            <div>
              <span className={styles.panelEyebrow}>{gig.company}</span>
              <h3>{gig.title}</h3>
            </div>
            <div className={styles.gigMeta}>
              <span>{gig.pay}</span>
              <span>{gig.duration}</span>
              <span className={styles.scorePill}>{gig.match}</span>
            </div>
          </article>
        ))}
      </div>
      {plan === 'free' && renderUpgradeGate('pro', 'Browsing is open to everyone, but applying and priority matching sit behind the Pro plan.')}
    </motion.div>
  )

  const renderDomination = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      {plan !== 'elite' ? (
        renderUpgradeGate('elite', 'Elite mode combines job applications, outreach, follow-ups, and connection tasks in one execution rail.')
      ) : (
        <section className={styles.panel}>
          <span className={styles.panelEyebrow}>Elite workflow</span>
          <h3>Domination mode is armed.</h3>
          <ul className={styles.simpleList}>
            <li>Auto-apply shortlist ready</li>
            <li>Cold email queue synced with follow-ups</li>
            <li>LinkedIn outreach cadence scheduled</li>
          </ul>
        </section>
      )}
    </motion.div>
  )

  const renderProfile = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          <span className={styles.panelEyebrow}>Candidate profile</span>
          <div className={styles.profileCard}>
            <div className={styles.userAvatar}>{firstName.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user?.fullName || user?.name || 'REXION User'}</strong>
              <p>{user?.email || 'Ready to personalize this workspace'}</p>
              <span className={`${styles.planBadge} ${planClassName(plan)}`}>{plan.toUpperCase()}</span>
            </div>
          </div>
        </section>
        <section className={styles.panel}>
          <span className={styles.panelEyebrow}>Preferences</span>
          <ul className={styles.simpleList}>
            <li>Primary lane: frontend, product, design systems</li>
            <li>Preferred companies: fast-moving startups and product teams</li>
            <li>Search cadence: nightly outreach, morning follow-up review</li>
          </ul>
        </section>
      </div>
    </motion.div>
  )

  const renderBilling = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <div className={styles.pricingGrid}>
        {billingPlans.map((item) => (
          <article key={item.name} className={`${styles.billingCard} ${plan === item.name.toLowerCase() ? styles.billingCardActive : ''}`}>
            <strong>{item.name}</strong>
            <h3>{item.price}</h3>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
      <section className={styles.panel}>
        <span className={styles.panelEyebrow}>Usage summary</span>
        <ul className={styles.simpleList}>
          <li>26 outreach drafts prepared this week</li>
          <li>7 micro-gig matches surfaced</li>
          <li>84 job matches processed today</li>
        </ul>
      </section>
    </motion.div>
  )

  const renderSettings = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <section className={styles.panel}>
        <span className={styles.panelEyebrow}>Workspace defaults</span>
        <div className={styles.settingsList}>
          {settingsRows.map((item) => (
            <article key={item.label} className={styles.settingRow}>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </article>
          ))}
        </div>
      </section>
    </motion.div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'matches':
        return renderMatches()
      case 'resume':
        return renderResume()
      case 'tracker':
        return renderTracker()
      case 'outreach':
        return renderOutreach()
      case 'gigs':
        return renderGigs()
      case 'domination':
        return renderDomination()
      case 'profile':
        return renderProfile()
      case 'billing':
        return renderBilling()
      case 'settings':
        return renderSettings()
      case 'dashboard':
      default:
        return renderDashboard()
    }
  }

  return (
    <div className={`${styles.workspaceShell} ${collapsed ? styles.workspaceShellCollapsed : ''}`}>
      <motion.aside layout className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark}>Rx</div>
            {!collapsed && (
              <div className={styles.brandTextWrap}>
                <strong>REXION</strong>
                <span>Premium job OS</span>
              </div>
            )}
          </div>
          <button type="button" className={styles.collapseButton} onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        <div className={styles.navGroups}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              {!collapsed && <p className={styles.navGroupLabel}>{group.label}</p>}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
                  onClick={() => setActiveSection(item.id)}
                  title={collapsed ? item.title : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!collapsed && <span className={styles.navTitle}>{item.title}</span>}
                  {!collapsed && item.badge && (
                    <span className={`${styles.navBadge} ${item.badge === 'Elite' ? styles.navBadgeElite : styles.navBadgePro}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{firstName.slice(0, 1).toUpperCase()}</div>
            {!collapsed && (
              <div className={styles.userMeta}>
                <strong>{firstName}</strong>
                <span className={`${styles.planBadge} ${planClassName(plan)}`}>{plan.toUpperCase()}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button type="button" className={styles.upgradeButton} onClick={() => setActiveSection('billing')}>
              {plan === 'free' ? 'Upgrade to Pro' : 'Manage Plan'}
            </button>
          )}
        </div>
      </motion.aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.breadcrumb}>Dashboard / {meta.title}</p>
            <h1>{meta.title}</h1>
            <p className={styles.subtitle}>{meta.subtitle}</p>
          </div>
          <div className={styles.topbarActions}>
            <button type="button" className={styles.topbarButtonSecondary} onClick={() => navigate('/')}>
              Landing
            </button>
            <button type="button" className={styles.topbarButtonPrimary} onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.welcomeRow}>
            <span className={styles.welcomePill}>Good morning, {firstName}. Let&apos;s get you hired.</span>
          </div>
          {renderActiveSection()}
        </div>
      </main>

      <nav className={styles.mobileDock}>
        {['dashboard', 'matches', 'outreach', 'gigs', 'billing'].map((itemId) => {
          const item = NAV_GROUPS.flatMap((group) => group.items).find((entry) => entry.id === itemId)

          if (!item) {
            return null
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.mobileDockItem} ${activeSection === item.id ? styles.mobileDockItemActive : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span>{item.icon}</span>
              <small>{item.title}</small>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default WorkspaceSection
