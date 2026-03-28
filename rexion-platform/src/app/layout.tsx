import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { AppProviders } from '@/components/providers/AppProviders'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'REXION AI',
  description: 'Premium AI job-hacking platform for outreach, matching, and micro-internship conversion.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

