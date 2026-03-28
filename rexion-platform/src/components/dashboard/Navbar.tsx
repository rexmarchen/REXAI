'use client'

export default function Navbar() {
  return (
    <header className="bg-gray-950/50 backdrop-blur-xl border-b border-white/10 p-6 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text">
            Dashboard
          </h1>
          <nav className="hidden md:flex gap-2 text-sm text-gray-400">
            <a href="/dashboard" className="hover:text-white transition-colors">Overview</a>
            <span>/</span>
            <a href="/dashboard/outreach" className="hover:text-white transition-colors">Outreach</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-xl transition-all glow">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:border-white/30 transition-all">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
              RD
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">R Dixon</p>
              <p className="text-gray-400 text-xs">Pro Member</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}

