'use client'

import type { OutreachContact } from '@/types/outreach'

const AVATAR_COLORS: Array<{ bg: string; text: string }> = [
  { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  { bg: 'bg-violet-500/20', text: 'text-violet-300' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  { bg: 'bg-rose-500/20', text: 'text-rose-300' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
]

function hashColor(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash + str.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return hash
}

interface ContactAvatarProps {
  contact: Pick<OutreachContact, 'firstName' | 'lastName' | 'avatarUrl'>
  size?: 'sm' | 'md'
}

export function ContactAvatar({ contact, size = 'sm' }: ContactAvatarProps) {
  const initials = `${contact.firstName[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase()
  const color = AVATAR_COLORS[hashColor(contact.firstName + contact.lastName)]!
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'

  if (contact.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={contact.avatarUrl}
        alt={`${contact.firstName} ${contact.lastName}`}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${color.bg} ${color.text}`}
      aria-label={`${contact.firstName} ${contact.lastName}`}
    >
      {initials}
    </span>
  )
}
