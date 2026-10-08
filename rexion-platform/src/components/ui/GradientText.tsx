'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function GradientText({
  children,
  from = 'var(--accent-green)',
  to = 'var(--accent-blue)',
  animate = true,
  className,
}: {
  children: React.ReactNode
  from?: string
  to?: string
  animate?: boolean
  className?: string
}) {
  return (
    <motion.span
      className={cn('bg-clip-text text-transparent', className)}
      style={{
        backgroundImage: `linear-gradient(120deg, ${from}, ${to}, ${from})`,
        backgroundSize: '200% 200%',
      }}
      animate={animate ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : undefined}
      transition={
        animate
          ? {
              duration: 6,
              ease: 'linear',
              repeat: Infinity,
            }
          : undefined
      }
    >
      {children}
    </motion.span>
  )
}
