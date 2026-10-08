'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type AnimatedTextMode = 'words' | 'chars' | 'fade'

export function AnimatedText({
  text,
  type = 'words',
  delay = 0,
  className,
}: {
  text: string
  type?: AnimatedTextMode
  delay?: number
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion || type === 'fade') {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay }}
      >
        {text}
      </motion.span>
    )
  }

  const parts = type === 'chars' ? text.split('') : text.split(' ')

  return (
    <span className={cn('inline-block', className)}>
      {parts.map((part, index) => (
        <motion.span
          key={`${part}-${index}`}
          className="inline-block"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + index * 0.04,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {part}
          {type === 'words' ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}
