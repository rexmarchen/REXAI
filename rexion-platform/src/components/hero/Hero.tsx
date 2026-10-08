'use client'

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-black to-gray-900 px-4 pt-20">
      <div className="absolute inset-0">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10" />
        <div className="pulse-glow absolute inset-0 opacity-30">
          <div className="animate-blob absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl mix-blend-multiply" />
          <div
            className="animate-blob absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl mix-blend-multiply"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="animate-blob absolute bottom-1/4 left-1/2 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl mix-blend-multiply"
            style={{ animationDelay: '4s' }}
          />
        </div>
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent),radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent),radial-gradient(circle_at_40%_40%,rgba(6,182,212,0.3),transparent)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        <div className="mb-8 opacity-0 animate-[fade-in-up_1s_0.3s_both]">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text px-4 py-2 text-xl font-medium text-transparent backdrop-blur-sm">
            Built for India&apos;s job seekers
          </span>
        </div>

        <h1 className="mb-8 text-5xl font-black leading-tight tracking-[-0.05em] text-transparent opacity-0 animate-[fade-in-up_1s_0.8s_both] bg-gradient-to-r from-white via-violet-50 to-cyan-50 bg-clip-text md:text-7xl lg:text-8xl xl:text-[10rem]">
          Stop Applying.
          <br />
          <span className="glow text-violet-400">Start Getting</span>
          <br />
          <span className="glow text-cyan-400">Hired.</span>
        </h1>

        <p className="mx-auto mb-16 max-w-3xl text-lg leading-relaxed text-gray-300 opacity-0 animate-[fade-in-up_1s_1.4s_both] md:text-2xl lg:text-3xl">
          REXION is the AI system that finds jobs, writes personalized cold emails, builds your resume, and applies while{' '}
          <span className="font-semibold text-violet-400">you sleep</span>.
        </p>

        <div className="mb-24 flex flex-col items-center justify-center gap-6 opacity-0 animate-[fade-in-up_1s_2s_both] sm:flex-row">
          <button className="group relative overflow-hidden rounded-2xl border border-violet-500/50 bg-gradient-to-r from-violet-600 via-violet-700 to-purple-700 bg-clip-padding px-12 py-6 text-xl font-bold shadow-2xl shadow-violet-500/40 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-violet-400/70 hover:from-violet-700 hover:to-purple-800 hover:shadow-violet-500/60">
            <span className="relative z-10">Start Free</span>
            <svg
              className="relative z-10 ml-3 h-6 w-6 transition-all duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>

          <button className="group flex items-center rounded-2xl border-2 border-white/30 px-12 py-6 text-xl font-bold backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-white/60 hover:bg-white/10">
            <svg className="mr-3 h-7 w-7 text-white/80 transition-all group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Watch Demo (2 min)
          </button>
        </div>

        <div className="flex flex-col items-stretch justify-center gap-8 opacity-0 animate-[fade-in-up_1s_2.6s_both] sm:flex-row">
          <div className="float glow max-w-sm flex-1 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-violet-500/20">
            <div className="pulse-glow glow mb-2 text-4xl font-black text-violet-400 md:text-5xl">2,847</div>
            <div className="text-lg font-medium text-gray-400">emails sent today</div>
            <div className="mt-2 text-sm text-gray-500">AI-powered outreach</div>
          </div>
          <div
            className="float glow max-w-sm flex-1 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-cyan-500/20"
            style={{ animationDelay: '200ms' }}
          >
            <div className="pulse-glow glow mb-2 text-4xl font-black text-cyan-400 md:text-5xl">94%</div>
            <div className="text-lg font-medium text-gray-400">open rate</div>
            <div className="mt-2 text-sm text-gray-500">Personalized cold emails</div>
          </div>
          <div
            className="float glow max-w-sm flex-1 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-white/10"
            style={{ animationDelay: '400ms' }}
          >
            <div className="pulse-glow glow mb-2 text-4xl font-black text-white md:text-5xl">312</div>
            <div className="text-lg font-medium text-gray-400">interviews booked</div>
            <div className="mt-2 text-sm text-gray-500">This week</div>
          </div>
        </div>

        <div className="mt-24 opacity-0 animate-[fade-in-up_1s_3s_both]">
          <div className="text-center">
            <p className="mb-2 text-sm text-gray-500 md:text-base">Trusted by 10,000+ Indian job seekers</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400">
              <div className="flex items-center gap-2 transition-colors hover:text-white">
                <div className="glow h-2 w-2 rounded-full bg-violet-400" />
                IIT Bombay | Placed at Google
              </div>
              <div className="flex items-center gap-2 transition-colors hover:text-white">
                <div className="h-2 w-2 rounded-full bg-cyan-400" />
                BITS Pilani | FAANG interviews
              </div>
              <div className="flex items-center gap-2 transition-colors hover:text-white">
                <div className="glow h-2 w-2 rounded-full bg-violet-400" />
                NIT Trichy | Rs 18L offer
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
