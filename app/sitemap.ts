import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

// Only the four public marketing pages. Everything under (protected) requires
// a session, and /people/<slug> was deliberately removed from this file when it
// was found to be serving real people's profiles to crawlers.
const PUBLIC_ROUTES = [
  { path: '', priority: 1 },
  { path: '/mentee', priority: 0.9 },
  { path: '/mentor', priority: 0.9 },
  { path: '/about', priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: 'weekly' as const,
    priority,
  }));
}
