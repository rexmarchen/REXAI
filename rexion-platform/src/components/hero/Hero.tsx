'use client'

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-black via-black to-gray-900 pt-20 px-4">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10 animate-pulse" />
        <div className="absolute inset-0 opacity-30 pulse-glow">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-violet-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{animationDelay: '4s'}}></div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent),radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent),radial-gradient(circle_at_40%_40%,rgba(6,182,212,0.3),transparent)] animate-pulse" />
      </div>

      <div className="text-center z-10 relative max-w-5xl mx-auto px-4">
        <div className="opacity-0 animate-[fade-in-up_1s_0.3s_both] mb-8">
          <span className="inline-block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent text-xl font-medium px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            Built for India's job seekers
          </span>
        </div>

        <h1 
          className="text-5xl md:text-7xl lg:text-8xl xl:text-[10rem] font-black bg-gradient-to-r from-white via-violet-50 to-cyan-50 bg-clip-text text-transparent mb-8 tracking-[-0.05em] opacity-0 animate-[fade-in-up_1s_0.8s_both] leading-tight"
        >
          Stop Applying.
          <br />
          <span className="text-violet-400 glow">Start Getting</span>
          <br />
          <span className="text-cyan-400 glow">Hired.</span>
        </h1>

        <p 
          className="text-lg md:text-2xl lg:text-3xl text-gray-300 max-w-3xl mx-auto mb-16 leading-relaxed opacity-0 animate-[fade-in-up_1s_1.4s_both]"
        >
          REXION is the AI system that finds jobs, writes personalized cold emails, builds your resume, and applies — <span className="font-semibold text-violet-400">while you sleep</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24 opacity-0 animate-[fade-in-up_1s_2s_both]">
          <button className="group bg-gradient-to-r from-violet-600 via-violet-700 to-purple-700 hover:from-violet-700 hover:to-purple-800 px-12 py-6 text-xl font-bold shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-500 group-hover:scale-[1.02] bg-clip-padding backdrop-blur-xl border border-violet-500/50 hover:border-violet-400/70 rounded-2xl relative overflow-hidden">
            <span className="relative z-10">Start Free</span>
            <svg className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-all duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button className="group border-2 border-white/30 backdrop-blur-xl hover:border-white/60 hover:bg-white/10 px-12 py-6 text-xl font-bold transition-all duration-500 hover:scale-[1.02] rounded-2xl flex items-center">
            <svg className="mr-3 w-7 h-7 text-white/80 group-hover:text-white transition-all" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Watch Demo (2 min)
          </button>
        </div>

        {/* Live Stats */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-stretch opacity-0 animate-[fade-in-up_1s_2.6s_both]">
          <div className="flex-1 max-w-sm p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/20 float glow text-center">
            <div className="text-4xl md:text-5xl font-black text-violet-400 mb-2 glow pulse-glow">2,847</div>
            <div className="text-lg text-gray-400 font-medium">emails sent today</div>
            <div className="text-sm text-gray-500 mt-2">AI-powered outreach</div>
          </div>
          <div className="flex-1 max-w-sm p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 float glow text-center" style={{animationDelay: '200ms'}}>
            <div className="text-4xl md:text-5xl font-black text-cyan-400 mb-2 glow pulse-glow">94%</div>
            <div className="text-lg text-gray-400 font-medium">open rate</div>
            <div className="text-sm text-gray-500 mt-2">Personalized cold emails</div>
          </div>
          <div className="flex-1 max-w-sm p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-white/10 float glow text-center" style={{animationDelay: '400ms'}}>
            <div className="text-4xl md:text-5xl font-black text-white mb-2 glow pulse-glow">312</div>
            <div className="text-lg text-gray-400 font-medium">interviews booked</div>
            <div className="text-sm text-gray-500 mt-2">This week</div>
          </div>
        </div>

        <div className="mt-24 opacity-0 animate-[fade-in-up_1s_3s_both]">
          <div className="text-center">
            <p className="text-gray-500 text-sm md:text-base mb-2">Trusted by 10,000+ Indian job seekers</p>
            <div className="flex flex-wrap gap-6 justify-center items-center text-gray-400">
              <div className="flex items-center gap-2 hover:text-white transition-colors">
                <div className="w-2 h-2 bg-violet-400 rounded-full glow" />
                IIT Bombay | Placed at Google
              </div>
              <div className="flex items-center gap-2 hover:text-white transition-colors">
                <div className="w-2 h-2 bg-cyan-400 rounded-full glow" />
                BITS Pilani | FAANG interviews
              </div>
              <div className="flex items-center gap-2 hover:text-white transition-colors">
                <div className="w-2 h-2 bg-violet-400 rounded-full glow" />
                NIT Trichy | ₹18L offer
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
