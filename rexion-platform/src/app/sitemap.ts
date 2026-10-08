import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/runtime'

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl()
  const now = new Date()

  return [
    {
      url: appUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${appUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${appUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
