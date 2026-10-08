import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/runtime'

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  }
}
