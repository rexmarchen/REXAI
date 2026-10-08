import type { Metadata } from 'next'
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google'
import { AppProviders } from '@/components/providers/AppProviders'
import { getAppUrl } from '@/lib/runtime'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

const appUrl = getAppUrl()

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'REXION AI',
    template: '%s | REXION AI',
  },
  description: 'Premium AI job-hacking platform for outreach, matching, and micro-internship conversion.',
  applicationName: 'REXION AI',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'REXION AI',
    description: 'Premium AI job-hacking platform for outreach, matching, and micro-internship conversion.',
    url: appUrl,
    siteName: 'REXION AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REXION AI',
    description: 'Premium AI job-hacking platform for outreach, matching, and micro-internship conversion.',
  },
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

