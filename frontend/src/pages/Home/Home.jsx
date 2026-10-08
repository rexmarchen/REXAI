import React, { useState } from 'react'
import OpeningAnimation from './components/OpeningAnimation'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import FeatureSection from './components/FeatureSection'
import CareerPathSection from './components/CareerPathSection'
import SkillGraphPreview from './components/SkillGraphPreview'
import StatsAndTestimonials from './components/StatsAndTestimonials'
import PricingSection from './components/PricingSection'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'
import DemoModal from './components/DemoModal'
import CustomCursor from './components/CustomCursor'

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem('rexion_intro_seen')
    } catch {
      return false
    }
  })

  // Smooth scroll to hash on load if present
  React.useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      }
    }
  }, [])

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('rexion_intro_seen', 'true')
    } catch {}
    setShowIntro(false)
  }

  return (
    <div
      style={{
        backgroundColor: '#090B0A',
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#F7F4EE',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* 0. Cinematic Opening Atmosphere Animation on initial launch */}
      {showIntro && (
        <OpeningAnimation onComplete={handleIntroComplete} />
      )}

      {/* Subtle Custom Cursor for Desktop */}
      <CustomCursor />

      {/* Floating Pill Navigation */}
      <Navbar onOpenDemo={() => setDemoOpen(true)} />

      {/* 1. Hero Section (Warm Cream Palette with Panoramic Alpine Lake Scene & Floating Telemetry) */}
      <HeroSection onOpenDemo={() => setDemoOpen(true)} />

      {/* 2. "WHY REXION / Everything You Need. In One Place." Feature Section (3x2 Grid Warm Cream Palette) */}
      <FeatureSection />

      {/* 3. "EXPLORE CAREER PATHS / Find Your Dream Career Path" Section (Dark Cosmic Mountain Pedestal Carousel) */}
      <CareerPathSection />

      {/* 4. "DON'T JUST LEARN. BUILD PROOF." Skill Graph & Laptop Showcase (Warm Cream Palette) */}
      <SkillGraphPreview />

      {/* 5. "TRUSTED BY 10,000+ STUDENTS" Real Progress & Testimonial Slider (Warm Cream Palette) */}
      <StatsAndTestimonials />

      {/* 6. "TRANSPARENT PRICING · ZERO RISK" Production-Grade Pricing & Stats Section */}
      <PricingSection />

      {/* 7. "YOUR FUTURE STARTS NOW." Final CTA (Panoramic Sunset Mountain with Student & Glowing Nodes) */}
      <FinalCTA onOpenDemo={() => setDemoOpen(true)} />

      {/* 8. Minimalist Sleek 4-Column Footer (Dark) */}
      <Footer />

      {/* Interactive Platform Tour Video Modal */}
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}
