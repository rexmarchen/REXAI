'use client'

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: 'Rs 0',
      popular: false,
      features: ['5 job matches/day', 'Resume analyzer (3 uses)', 'Basic email composer'],
    },
    {
      name: 'Pro',
      price: 'Rs 999',
      popular: true,
      features: [
        'Unlimited job matching',
        'Outreach Automation (50 emails/day)',
        'AI cold email generator',
        'Resume builder + analyzer',
        'Micro-Internship access',
        'Application tracker',
        'Follow-up automation',
      ],
    },
    {
      name: 'Elite',
      price: 'Rs 2499',
      popular: false,
      features: [
        'Everything in Pro',
        '200 emails/day',
        'Priority micro-gig matching',
        '1-Click Domination Mode',
        'Dedicated support',
      ],
    },
  ]

  return (
    <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-gray-950 to-black px-4 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-24 text-center">
          <h2 className="mb-6 bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-5xl font-black tracking-tight text-transparent md:text-6xl lg:text-7xl">
            Simple pricing
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400 md:text-2xl">
            Choose the plan that works for you. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl transition-all duration-700 hover:scale-105 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/30 ${
                plan.popular ? 'translate-y-[-20px] scale-105 ring-4 ring-violet-500/30 shadow-2xl shadow-violet-500/50' : ''
              }`}
            >
              {plan.popular ? (
                <div className="absolute left-1/2 top-[-20px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2 text-sm font-bold text-white shadow-2xl">
                  Most Popular
                </div>
              ) : null}

              <h3 className="mb-6 text-3xl font-black text-white">{plan.name}</h3>
              <div className="mb-8 text-6xl font-black text-violet-400">{plan.price}</div>
              <p className="mb-12 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">per month</p>

              <ul className="mb-12 space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="group-hover:translate-x-2 flex items-start gap-3 text-gray-300 transition-all transition-colors hover:text-white"
                  >
                    <div className="glow mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-violet-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full rounded-2xl px-8 py-6 text-lg font-bold shadow-xl transition-all duration-500 hover:scale-105 ${
                  plan.popular
                    ? 'glow border-2 border-violet-400 bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-violet-500/50 hover:from-violet-700 hover:to-purple-800 hover:shadow-violet-500/70'
                    : 'border-2 border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/20'
                }`}
              >
                {plan.popular ? 'Go Pro Now' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
