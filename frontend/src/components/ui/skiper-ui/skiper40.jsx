import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import styles from './skiper40.module.css'

/**
 * Arrow icon rendered for links with transition states
 */
const ArrowSvg = ({ className }) => (
  <svg
    className={cn(styles.arrowIcon, className)}
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Base link component supporting React Router Link and native <a>
 */
const BaseLink = ({ href, to, children, className, target, rel, ...props }) => {
  const dest = to || href || '#'
  const isExternal =
    dest.startsWith('http://') ||
    dest.startsWith('https://') ||
    dest.startsWith('mailto:') ||
    dest.startsWith('tel:')

  if (isExternal) {
    return (
      <a
        href={dest}
        target={target || (dest.startsWith('http') ? '_blank' : undefined)}
        rel={rel || (dest.startsWith('http') ? 'noopener noreferrer' : undefined)}
        className={cn(styles.linkBase, className)}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <RouterLink to={dest} className={cn(styles.linkBase, className)} {...props}>
      {children}
    </RouterLink>
  )
}

/**
 * Link000: Underline expanding from left to right on hover
 */
export const Link000 = ({ children, href, to, className, ...props }) => {
  return (
    <BaseLink href={href} to={to} className={cn(styles.link000, className)} {...props}>
      {children}
    </BaseLink>
  )
}

/**
 * Link001: Underline expanding from left to right + diagonal arrow
 */
export const Link001 = ({ children, href, to, className, ...props }) => {
  return (
    <BaseLink href={href} to={to} className={cn(styles.link001, className)} {...props}>
      <span>{children}</span>
      <ArrowSvg />
    </BaseLink>
  )
}

/**
 * Link002: Underline right to left + diagonal arrow
 */
export const Link002 = ({ children, href, to, className, ...props }) => {
  return (
    <BaseLink href={href} to={to} className={cn(styles.link002, className)} {...props}>
      <span>{children}</span>
      <ArrowSvg />
    </BaseLink>
  )
}

/**
 * Link003: Underline expanding outward from center + diagonal arrow
 */
export const Link003 = ({ children, href, to, className, ...props }) => {
  return (
    <BaseLink href={href} to={to} className={cn(styles.link003, className)} {...props}>
      <span>{children}</span>
      <ArrowSvg />
    </BaseLink>
  )
}

/**
 * Link004: Inverted vertical block overlay on hover + 45° arrow
 */
export const Link004 = ({ children, href, to, className, ...props }) => {
  return (
    <BaseLink href={href} to={to} className={cn(styles.link004, className)} {...props}>
      <span>{children}</span>
      <ArrowSvg />
    </BaseLink>
  )
}

/**
 * Link005: Inverted horizontal slide block on hover + rotating arrow
 */
export const Link005 = ({ children, href, to, className, ...props }) => {
  return (
    <BaseLink href={href} to={to} className={cn(styles.link005, className)} {...props}>
      <span>{children}</span>
      <ArrowSvg />
    </BaseLink>
  )
}

/**
 * Skiper40 Showcase Component
 */
export const Skiper40 = () => {
  return (
    <section className={styles.demoContainer}>
      <Link000 href="#">Link000 — Minimal Underline</Link000>
      <Link001 href="#">Link001 — Left-to-Right + Arrow</Link001>
      <Link002 href="#">Link002 — Right-to-Left + Arrow</Link002>
      <Link003 href="#">Link003 — Center-Expand + Arrow</Link003>
      <Link004 href="#">Link004 — Inverted Vertical Highlight</Link004>
      <Link005 href="#">Link005 — Inverted Slide Block</Link005>
    </section>
  )
}

export default Skiper40
