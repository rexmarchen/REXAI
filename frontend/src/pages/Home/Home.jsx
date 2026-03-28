import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ParticleEarth from '../../components/common/ParticleEarth'
import { useAuth } from '../../context/AuthContext'
import { buildLoginPath } from '../../utils/authSession'
import styles from './Home.module.css'

const heroLines = [
  ['Stop', 'applying.'],
  ['Start', 'getting', 'hired.']
]

const featureCards = [
  {
    title: 'Outreach Automation',
    kicker: 'Signal Engine',
    body: 'Find decision makers, generate role-aware messages, and queue the first wave of outreach from a single control surface.',
    meta: 'Company search • contact shortlist • AI personalization • follow-up cadence',
    large: true
  },
  {
    title: 'Resume Studio',
    kicker: 'Sharper positioning',
    body: 'Reshape your resume around the job family you want instead of sending one generic profile everywhere.',
    meta: 'Builder • analysis • rewrite prompts'
  },
  {
    title: 'AI Job Matching',
    kicker: 'Fit over volume',
    body: 'Prioritize roles by match quality, target function, and hiring signal instead of doomscrolling every listing.',
    meta: 'Role fit • relevance scoring • shortlist'
  },
  {
    title: 'Micro-Internship Arena',
    kicker: 'Proof of work',
    body: 'Turn short paid projects into hiring leverage and show employers what you can ship before the interview round.',
    meta: 'Paid gigs • conversion signals • leaderboard'
  },
  {
    title: 'Application Tracker',
    kicker: 'No silent pipeline',
    body: 'Keep every opportunity visible with status, last touchpoint, next step, and follow-up reminders.',
    meta: 'Status board • reminders • notes'
  },
  {
    title: 'Rexcode + Legacy Tools',
    kicker: 'Existing utility stack',
    body: 'Keep the current intern hunt, resume predictor, builder, and code generation tools available under one cleaner frontend shell.',
    meta: 'Intern Hunt • Resume Predictor • Resume Builder • Rexcode'
  }
]

const signalQuotes = [
  {
    name: 'Arjun Mehta',
    result: '3 interviews in 2 days',
    quote: 'The new flow gave me a daily system instead of a random to-do list.'
  },
  {
    name: 'Sneha Rao',
    result: '₹18k micro-gig to PPO',
    quote: 'I stopped cold-applying everywhere and started showing companies work they could actually buy.'
  },
  {
    name: 'Rohan Singh',
    result: '12 LPA offer',
    quote: 'The premium dashboard finally made the whole search feel deliberate and trackable.'
  }
]

const workflowSteps = [
  {
    step: '01',
    title: 'Choose the lane',
    copy: 'Set the target role, seniority, and company shape you actually want.'
  },
  {
    step: '02',
    title: 'Generate signal',
    copy: 'Match jobs, discover contacts, and prepare position-specific cold outreach.'
  },
  {
    step: '03',
    title: 'Operate from one board',
    copy: 'Track applications, gig opportunities, and follow-ups without tab chaos.'
  },
  {
    step: '04',
    title: 'Improve each cycle',
    copy: 'Use the resume tools and hiring feedback to raise conversion quality over time.'
  }
]

const proofTickerItems = [
  '2,847 cold emails prepared today',
  '94% average open rate on personalized campaigns',
  '312 interviews booked this week',
  '₹50L+ earned through proof-of-work gigs',
  '10,000+ candidates using REXION workflows'
]

const dashboardHighlights = [
  { label: 'Jobs matched today', value: '84', detail: '+18% vs yesterday' },
  { label: 'Outreach queued', value: '26', detail: 'Pro workflow active' },
  { label: 'Micro-gig matches', value: '7', detail: '3 with pre-hiring signal' },
  { label: 'Follow-ups due', value: '4', detail: 'Next run at 8:00 PM' }
]

const toolLinks = [
  {
    route: '/dashboard',
    name: 'Dashboard Shell',
    copy: 'Open the premium workspace with plan-aware navigation and the new module structure.'
  },
  {
    route: '/intern-hunt',
    name: 'Intern Hunt',
    copy: 'Keep browsing internships while the landing and dashboard experience is upgraded.'
  },
  {
    route: '/resume-predictor',
    name: 'Resume Predictor',
    copy: 'Use the existing ATS predictor inside the refreshed global frontend system.'
  },
  {
    route: '/resume',
    name: 'Resume Builder',
    copy: 'Jump into the builder directly from the new premium shell.'
  },
  {
    route: '/rexcode',
    name: 'Rexcode',
    copy: 'Generate project output from the same green-black-white branded experience.'
  }
]

const pricingTiers = [
  {
    plan: 'Free',
    monthly: '₹0',
    annual: '₹0',
    description: 'For getting signal discipline in place.',
    features: ['5 job matches per day', 'Resume analysis checkpoints', 'Basic tracker and workspace access'],
    cta: '/register'
  },
  {
    plan: 'Pro',
    monthly: '₹999',
    annual: '₹799',
    description: 'For active candidates running outreach every week.',
    features: ['Outreach automation', 'Unlimited resume analysis', 'Micro-internship access', 'Unlimited tracker + follow-ups'],
    cta: '/register',
    featured: true
  },
  {
    plan: 'Elite',
    monthly: '₹2,499',
    annual: '₹1,999',
    description: 'For full system execution and high-volume search.',
    features: ['All Pro features', '1-click domination workflows', 'Higher send limits', 'Priority support and onboarding'],
    cta: '/register'
  }
]

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [annualBilling, setAnnualBilling] = useState(true)

  const getFeaturePath = (path) => (isAuthenticated ? path : buildLoginPath(path))

  const displayTiers = useMemo(
    () =>
      pricingTiers.map((tier) => ({
        ...tier,
        price: annualBilling ? tier.annual : tier.monthly
      })),
    [annualBilling]
  )

  return (
    <div className={styles.page}>
      <ParticleEarth variant="orbit" />
      <div className={styles.backdrop} aria-hidden="true" />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div
            className={styles.heroCopy}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className={styles.heroBadge} variants={sectionVariants}>
              The AI job hacking system, rebuilt for a premium frontend.
            </motion.div>

            <div className={styles.headlineWrap}>
              {heroLines.map((line, lineIndex) => (
                <div key={line.join('-')} className={styles.heroHeadlineLine}>
                  {line.map((word, wordIndex) => {
                    const isAccent =
                      (lineIndex === 1 && wordIndex === line.length - 1) ||
                      (lineIndex === 0 && wordIndex === line.length - 1)

                    return (
                      <motion.span
                        key={`${word}-${lineIndex}-${wordIndex}`}
                        className={isAccent ? styles.accentWord : ''}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: lineIndex * 0.16 + wordIndex * 0.08, duration: 0.36 }}
                      >
                        {word}
                      </motion.span>
                    )
                  })}
                </div>
              ))}
            </div>

            <motion.p className={styles.heroText} variants={sectionVariants}>
              REXION now reads like one product: outreach automation, job matching, micro-internships,
              billing, and legacy tools living inside a calmer black-and-emerald operating system.
            </motion.p>

            <motion.div className={styles.heroActions} variants={sectionVariants}>
              <Link to="/register" className={styles.primaryButton}>
                Start Free
              </Link>
              <Link to={getFeaturePath('/dashboard')} className={styles.secondaryButton}>
                Open Dashboard
              </Link>
            </motion.div>

            <motion.div className={styles.statRow} variants={staggerContainer}>
              {dashboardHighlights.slice(0, 3).map((item) => (
                <motion.article key={item.label} className={styles.statCard} variants={sectionVariants}>
                  <p className={styles.statLabel}>{item.label}</p>
                  <h3 className={styles.statValue}>{item.value}</h3>
                  <p className={styles.statDetail}>{item.detail}</p>
                </motion.article>
              ))}
            </motion.div>
          </motion.div>

          <motion.aside
            className={styles.heroPanel}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
          >
            <div className={styles.panelFrame}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.panelEyebrow}>Control Room</p>
                  <h2 className={styles.panelTitle}>Hiring velocity board</h2>
                </div>
                <span className={styles.panelStatus}>Live</span>
              </div>

              <div className={styles.panelMetrics}>
                {dashboardHighlights.map((item) => (
                  <div key={item.label} className={styles.metricCard}>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <span>{item.detail}</span>
                  </div>
                ))}
              </div>

              <div className={styles.panelFlow}>
                <div className={styles.flowItem}>
                  <span className={styles.flowNumber}>01</span>
                  <div>
                    <strong>Search target companies</strong>
                    <p>Filter for active hiring, founder-led, and fast-moving teams.</p>
                  </div>
                </div>
                <div className={styles.flowItem}>
                  <span className={styles.flowNumber}>02</span>
                  <div>
                    <strong>Queue outreach</strong>
                    <p>Personalized drafts generated for recruiters, hiring managers, and founders.</p>
                  </div>
                </div>
                <div className={styles.flowItem}>
                  <span className={styles.flowNumber}>03</span>
                  <div>
                    <strong>Track proof-of-work</strong>
                    <p>Surface micro-gigs that convert into interviews and offers.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      <motion.section
        id="platform"
        className={styles.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Platform</span>
          <h2 className={styles.sectionTitle}>Everything you need to make the search feel deliberate.</h2>
          <p className={styles.sectionCopy}>
            The new frontend leans into a premium dashboard experience instead of the older neon prototype aesthetic.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {featureCards.map((card) => (
            <article
              key={card.title}
              className={`${styles.featureCard} ${card.large ? styles.featureCardLarge : ''}`}
            >
              <span className={styles.featureKicker}>{card.kicker}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <span className={styles.featureMeta}>{card.meta}</span>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className={`${styles.section} ${styles.workflowSection}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>How It Works</span>
          <h2 className={styles.sectionTitle}>A cleaner loop from opportunity discovery to follow-up.</h2>
        </div>
        <div className={styles.workflowGrid}>
          {workflowSteps.map((step) => (
            <article key={step.step} className={styles.workflowCard}>
              <span className={styles.workflowNumber}>{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <section id="proof" className={styles.tickerSection}>
        <div className={styles.tickerTrack}>
          <div className={styles.tickerInner}>
            {[...proofTickerItems, ...proofTickerItems].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <motion.section
        className={styles.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Proof</span>
          <h2 className={styles.sectionTitle}>Users should feel motion, clarity, and pressure in the right places.</h2>
        </div>

        <div className={styles.quoteGrid}>
          {signalQuotes.map((quote) => (
            <article key={quote.name} className={styles.quoteCard}>
              <div className={styles.quoteTop}>
                <strong>{quote.name}</strong>
                <span>{quote.result}</span>
              </div>
              <p>{quote.quote}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="pricing"
        className={`${styles.section} ${styles.pricingSection}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Pricing</span>
          <h2 className={styles.sectionTitle}>Simple pricing, premium framing.</h2>
          <p className={styles.sectionCopy}>
            The frontend now supports the same Free, Pro, and Elite narrative the platform is built around.
          </p>
        </div>

        <div className={styles.billingToggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${!annualBilling ? styles.toggleButtonActive : ''}`}
            onClick={() => setAnnualBilling(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${annualBilling ? styles.toggleButtonActive : ''}`}
            onClick={() => setAnnualBilling(true)}
          >
            Annual
          </button>
        </div>

        <div className={styles.pricingGrid}>
          {displayTiers.map((tier) => (
            <article
              key={tier.plan}
              className={`${styles.pricingCard} ${tier.featured ? styles.pricingCardFeatured : ''}`}
            >
              {tier.featured && <span className={styles.pricingBadge}>Most popular</span>}
              <p className={styles.pricingPlan}>{tier.plan}</p>
              <h3 className={styles.pricingPrice}>
                {tier.price}
                <span>/month</span>
              </h3>
              <p className={styles.pricingDescription}>{tier.description}</p>
              <ul className={styles.pricingList}>
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link to={tier.cta} className={styles.pricingButton}>
                {tier.plan === 'Free' ? 'Get Started' : `Choose ${tier.plan}`}
              </Link>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className={`${styles.section} ${styles.toolsSection}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Routes</span>
          <h2 className={styles.sectionTitle}>Existing tools stay online inside the refreshed shell.</h2>
        </div>

        <div className={styles.toolGrid}>
          {toolLinks.map((tool) => (
            <Link key={tool.route} to={getFeaturePath(tool.route)} className={styles.toolCard}>
              <span className={styles.toolRoute}>{tool.route}</span>
              <h3>{tool.name}</h3>
              <p>{tool.copy}</p>
            </Link>
          ))}
        </div>
      </motion.section>

      <motion.section
        className={`${styles.section} ${styles.finalCta}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        <div className={styles.finalCtaPanel}>
          <span className={styles.sectionEyebrow}>Next Move</span>
          <h2>Open the dashboard and review the new operating model.</h2>
          <p>
            The landing page now sets the tone, but the actual frontend upgrade continues inside the new dashboard shell.
          </p>
          <div className={styles.heroActions}>
            <Link to={getFeaturePath('/dashboard')} className={styles.primaryButton}>
              Launch Dashboard
            </Link>
            <Link to="/login" className={styles.secondaryButton}>
              Log In
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default Home
