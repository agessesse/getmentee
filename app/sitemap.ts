import type { MetadataRoute } from 'next';
import { SOURCED_MENTORS, SOURCED_NEAR_PEERS } from '@/data/people';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Derived from the same source that drives generateStaticParams, so the
// sitemap cannot drift from what is actually prerendered.
export default function sitemap(): MetadataRoute.Sitemap {
  const people = [...SOURCED_MENTORS, ...SOURCED_NEAR_PEERS].map((p) => ({
    url: `${siteUrl}/people/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    ...people,
  ];
}
