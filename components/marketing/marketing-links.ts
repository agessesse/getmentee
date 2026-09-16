/**
 * The public destinations, in reading order.
 *
 * Home is in this list now. It was not before, which is part of why the
 * navigation felt unstable: the site had four public pages and the header only
 * ever named three of them, so arriving on Mentee left no visible way back
 * except the wordmark.
 *
 * Four is the whole list. Sign in and Get started are actions, not
 * destinations, and they live separately in the header for that reason.
 */
export const MARKETING_PAGES = [
  { href: '/', label: 'Home' },
  { href: '/mentee', label: 'Mentee' },
  { href: '/mentor', label: 'Mentor' },
  { href: '/about', label: 'About' },
] as const;

/** Routes that participate in the branded marketing wipe. */
export const MARKETING_ROUTES: readonly string[] = MARKETING_PAGES.map((p) => p.href);

export function isMarketingRoute(pathname: string | null | undefined): boolean {
  return !!pathname && MARKETING_ROUTES.includes(pathname);
}
