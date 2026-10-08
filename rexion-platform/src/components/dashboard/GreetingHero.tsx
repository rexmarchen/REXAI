'use client'

import { motion } from 'framer-motion'
import { AnimatedText } from '@/components/ui/AnimatedText'
import { GradientText } from '@/components/ui/GradientText'
import { fadeUp, staggerContainer } from '@/lib/animations'

export function GreetingHero({ firstName }: { firstName: string }) {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(74,158,255,0.14),transparent_24%),linear-gradient(135deg,rgba(15,26,22,0.96),rgba(8,12,12,0.96))] p-6 shadow-soft lg:p-10"
    >
      <motion.p variants={fadeUp} className="type-label">
        Command Center
      </motion.p>
      <motion.div variants={fadeUp} className="mt-4 max-w-4xl">
        <div className="text-[32px] font-light tracking-[-0.04em] text-white md:text-[40px]">
          <AnimatedText text={`Good morning, ${firstName}.`} type="words" />
        </div>
        <div className="mt-2 font-display text-[42px] font-semibold tracking-[-0.05em] text-white md:text-[56px]">
          <GradientText>Your career OS is running.</GradientText>
        </div>
      </motion.div>
      <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
        REXION is ranking jobs, preparing outreach, tracking momentum, and surfacing the proof signals that move you from application volume to real interview velocity.
      </motion.p>
    </motion.section>
  )
}
