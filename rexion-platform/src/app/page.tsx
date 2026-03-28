import { Footer } from '@/components/landing/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { Navbar } from '@/components/landing/Navbar'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { SocialProof } from '@/components/landing/SocialProof'
import styles from '@/styles/landing.module.css'

export default function HomePage() {
  return (
    <main className={`${styles.page} subtle-grid`}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <SocialProof />
      <Footer />
    </main>
  )
}
