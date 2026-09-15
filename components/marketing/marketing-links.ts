/**
 * The public marketing pages, in nav order.
 *
 * Shared by LandingNav (the home page) and SiteHeader (every other public
 * page) so the two cannot drift. Home is reachable from the wordmark, which is
 * why it is not repeated as a text link.
 *
 * Deliberately separate from LandingNav's LINKS, which are in-page anchors to
 * Home's sections. Those two lists answer different questions: "which page"
 * and "where on this page".
 */
export const MARKETING_PAGES = [
  { href: '/mentee', label: 'Mentee' },
  { href: '/mentor', label: 'Mentor' },
  { href: '/about', label: 'About' },
] as const;
