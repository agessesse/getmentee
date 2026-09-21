import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// There was no robots.txt at all, so every authenticated app route was
// crawlable — including the five that used to return 200 to anonymous
// visitors before the middleware fix.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/people/'],
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/discover',
          '/goals',
          '/impact',
          '/learn',
          '/mentor/',
          '/mentorships',
          '/messages',
          '/opportunities',
          '/profile',
          '/requests',
          '/schedule',
          '/sessions/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
