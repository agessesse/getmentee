/**
 * The public destinations, in reading order.
 *
 * Home is in this list because the site had four public pages and the header
 * only ever named three of them, so arriving on Mentee left no visible way
 * back except the wordmark.
 *
 * Organizations sits last, after the two audiences it is not for. A student
 * and a mentor are the primary readers of this site; a programme lead is a
 * smaller, more deliberate visitor who will look for it. Putting it ahead of
 * Mentor would tell the wrong person they are the priority.
 *
 * Sign in and Apply are actions, not destinations, and live separately in the
 * header for that reason.
 */
export const MARKETING_PAGES = [
  { href: '/', label: 'Home' },
  { href: '/mentee', label: 'Mentee' },
  { href: '/mentor', label: 'Mentor' },
  { href: '/organizations', label: 'Organizations' },
  { href: '/about', label: 'About' },
] as const;

/** Routes that participate in the branded marketing wipe. */
export const MARKETING_ROUTES: readonly string[] = MARKETING_PAGES.map((p) => p.href);

export function isMarketingRoute(pathname: string | null | undefined): boolean {
  return !!pathname && MARKETING_ROUTES.includes(pathname);
}
