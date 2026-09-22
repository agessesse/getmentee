import type { MetadataRoute } from 'next';
import { SOURCED_MENTORS, SOURCED_NEAR_PEERS } from '@/data/people';
import { originForMetadata } from '@/lib/site';

const siteUrl = originForMetadata();

// Derived from the same source that drives generateStaticParams, so the
// sitemap cannot drift from what is actually prerendered.
export default function sitemap(): MetadataRoute.Sitemap {
  const people = [...SOURCED_MENTORS, ...SOURCED_NEAR_PEERS].map((p) => ({
    url: `${siteUrl}/people/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // The public pages worth indexing. /founding-cohort is the current ask, so
  // it ranks just under the homepage; the legal pages are listed because they
  // are linked from every footer and should not look orphaned to a crawler.
  const pages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/founding-cohort`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/mentor`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/mentee`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/accessibility`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [...pages, ...people];
}
