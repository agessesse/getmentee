import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';



// There was no robots.txt at all, so every authenticated app route was
// crawlable — including the five that used to return 200 to anonymous
// visitors before the middleware fix.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin',
          '/api/',
          '/analytics',
          '/dashboard',
          '/discover',
          '/goals',
          '/impact',
          '/mentees',
          '/mentor/',
          '/mentorships',
          '/messages',
          '/network',
          '/opportunities',
          '/profile',
          '/requests',
          '/schedule',
          '/sessions/',
          '/people/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
