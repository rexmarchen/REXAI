'use client'

export default function Features() {
  const features = [
    {
      icon: '⚡',
      title: 'Outreach Automation',
      desc: 'Find HR emails, write AI cold emails, send in 1 click',
      delay: '0s'
    },
    {
      icon: '🧠',
      title: 'Resume Analyzer',
      desc: 'AI feedback that actually fixes your resume',
      delay: '0.1s'
    },
    {
      icon: '🎯',
      title: 'Job Match Engine',
      desc: 'Stop scrolling. Get matched to jobs that fit you perfectly',
      delay: '0.2s'
    },
    {
      icon: '💼',
      title: 'Micro-Internship Arena',
      desc: 'Earn ₹8k-25k on 2-week gigs that lead to full-time jobs',
      delay: '0.3s'
    },
    {
      icon: '📊',
      title: 'Application Tracker',
      desc: 'Never lose track of where you applied',
      delay: '0.4s'
    },
    {
      icon: '🔥',
      title: '1-Click Domination Mode',
      desc: 'Apply + Email + Network + Follow-up in 60 seconds',
      delay: '0.5s'
    }
  ]

  return (
    <section id="features" className="py-32 px-4 relative overflow-hidden bg-gradient-to-b from-gray-950 to-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent mb-6 tracking-tight">
            Everything you need
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
            Premium hacker tools that get you hired faster than traditional applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/40 hover:bg-white/10 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-4 hover:rotate-1 cursor-pointer opacity-0 animate-[slide-in-bottom_1s_forwards]"
              style={{animationDelay: feature.delay}}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
              
              <div className="text-4xl mb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                {feature.icon}
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-violet-400 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-gray-400 leading-relaxed text-lg">
                {feature.desc}
              </p>

              <div className="mt-8 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-bottom {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}

