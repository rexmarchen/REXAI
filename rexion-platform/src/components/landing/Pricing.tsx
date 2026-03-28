'use client'

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      popular: false,
      features: [
        '5 job matches/day',
        'Resume analyzer (3 uses)',
        'Basic email composer'
      ]
    },
    {
      name: 'Pro',
      price: '₹999',
      popular: true,
      features: [
        'Unlimited job matching',
        'Outreach Automation (50 emails/day)',
        'AI cold email generator',
        'Resume builder + analyzer',
        'Micro-Internship access',
        'Application tracker',
        'Follow-up automation'
      ]
    },
    {
      name: 'Elite',
      price: '₹2499',
      popular: false,
      features: [
        'Everything in Pro',
        '200 emails/day',
        'Priority micro-gig matching',
        '1-Click Domination Mode',
        'Dedicated support'
      ]
    }
  ]

  return (
    <section id="pricing" className="py-32 px-4 relative overflow-hidden bg-gradient-to-b from-gray-950 to-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent mb-6 tracking-tight">
            Simple pricing
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
            Choose the plan that works for you. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative group p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/30 hover:border-violet-500/50 overflow-hidden ${
                plan.popular ? 'ring-4 ring-violet-500/30 shadow-2xl shadow-violet-500/50 scale-105 translate-y-[-20px]' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-2xl">
                  Most Popular
                </div>
              )}

              <h3 className="text-3xl font-black text-white mb-6">{plan.name}</h3>
              <div className="text-6xl font-black text-violet-400 mb-8">{plan.price}</div>
              <p className="text-gray-400 mb-12 opacity-0 group-hover:opacity-100 transition-opacity">per month</p>

              <ul className="space-y-4 mb-12">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 hover:text-white transition-colors group-hover:translate-x-2">
                    <div className="w-2 h-2 bg-violet-400 rounded-full mt-2 flex-shrink-0 glow" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-6 px-8 rounded-2xl font-bold text-lg transition-all duration-500 hover:scale-105 shadow-xl ${
                plan.popular 
                  ? 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white border-2 border-violet-400 shadow-violet-500/50 hover:shadow-violet-500/70 glow' 
                  : 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50'
              }`}>
                {plan.popular ? 'Go Pro Now' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

