import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.deenbridge.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/login',
          '/signup',
          '/profile',
          '/my-learning',
          '/attendance',
          '/sessions/*/join',
          '/courses/*/sessions/*/join',
          '/courses/*/recordings',
          '/courses/*/attendance',
          '/reports',
          '/library/bookmarks',
          '/dashboard/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/login',
          '/signup',
          '/profile',
          '/my-learning',
          '/attendance',
          '/sessions/*/join',
          '/courses/*/sessions/*/join',
          '/courses/*/recordings',
          '/courses/*/attendance',
          '/reports',
          '/library/bookmarks',
          '/dashboard/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

