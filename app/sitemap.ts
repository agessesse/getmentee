import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';



// /people/<slug> used to be listed here, all eighteen of them, twelve being
// students. Those pages require authentication, so submitting them to search
// engines asked crawlers to index profiles that no signed-out human can read.
// The public surface is the marketing page; nothing else belongs in a sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
  ];
}
