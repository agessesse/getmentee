/**
 * Canonical production origin.
 *
 * NEXT_PUBLIC_APP_URL still reads https://getmentee.vercel.app in Vercel
 * Production, which put a retired domain into every canonical URL, Open Graph
 * tag and the sitemap declaration. Production-facing metadata is a fact about
 * the product rather than a per-environment secret, so it is pinned here and
 * the environment variable only overrides it outside production.
 */
export const CANONICAL_ORIGIN = 'https://mentable.co';

export const siteUrl =
  process.env.NODE_ENV === 'production'
    ? CANONICAL_ORIGIN
    : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
