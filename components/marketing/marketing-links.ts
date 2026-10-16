/**
 * The public destinations.
 *
 * WHAT CHANGED AND WHY. The navigation used to read Home · Mentee · Mentor
 * · Organizations · About, which encoded the old positioning in the
 * information architecture itself: a visitor had to pick whether they were
 * a mentor or a mentee before Mentable had said what it was. That framing
 * is the thing the company is moving away from, and it is not fixable with
 * copy while the nav still asks the question.
 *
 * The organization is the buyer, so it gets a named destination. Sign in
 * and Apply are actions and live separately in the header.
 *
 * /mentee and /mentor still exist and still work -- people have the links
 * -- they are simply no longer how the company introduces itself.
 */
export const MARKETING_PAGES = [
  { href: '/', label: 'Home' },
  { href: '/organizations', label: 'For organizations' },
  { href: '/about', label: 'About' },
] as const;

/*
  Still routable, still linked from the pages that need them, just not in
  the primary navigation. Kept here so the branded page wipe treats them as
  marketing routes.
*/
export const SECONDARY_MARKETING_ROUTES = ['/mentee', '/mentor'] as const;

/** Routes that participate in the branded marketing wipe. */
export const MARKETING_ROUTES: readonly string[] = [
  ...MARKETING_PAGES.map((p) => p.href),
  ...SECONDARY_MARKETING_ROUTES,
];

export function isMarketingRoute(pathname: string | null | undefined): boolean {
  return !!pathname && MARKETING_ROUTES.includes(pathname);
}
