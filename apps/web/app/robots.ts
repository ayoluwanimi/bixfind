import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/provider', '/customer', '/chat'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
