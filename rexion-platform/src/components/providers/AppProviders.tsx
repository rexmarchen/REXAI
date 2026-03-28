'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          richColors
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#0f1511',
              color: '#f5f7f5',
              border: '1px solid rgba(196,255,221,0.16)',
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  )
}
