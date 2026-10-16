import {
  Home,
  Handshake,
  MessageSquare,
  Users,
  CircleUser,
} from 'lucide-react';

/**
 * The primary navigation, which is four destinations and is meant to stay
 * four.
 *
 * WHAT WAS HERE BEFORE. Eleven items in four labelled groups: Home, Find a
 * mentor, Your mentoring, Opportunity Fund, Requests, My mentors, Goals,
 * Learn, Messages, Schedule, My Profile. Group headings are what an
 * information architecture grows instead of a decision; by the time a sidebar
 * needs subheadings to stay legible it is no longer navigation, it is a
 * sitemap. If this list ever needs eleven entries again, something upstream
 * has gone wrong and the answer is not a fifth group.
 *
 * THE RULE FOR WHAT QUALIFIES. A primary destination is somewhere a person
 * goes repeatedly, on purpose, without being sent. Everything else is reached
 * from where it is relevant:
 *
 *   Find a mentor   from the empty state of Mentorship, which is the only
 *                   moment it is the right thing to do
 *   Requests        from Mentorship and from the notification that announced
 *                   them
 *   Learn           contextually, beside the thing being learned
 *   Your mentoring  from the mentor's Home
 *   Profile         from the account menu, where every product keeps it
 *   Opportunity Fund removed: unfunded, unused, already gone from the homepage
 *
 * These are the same four on desktop and on mobile. A phone is not a reduced
 * version of the product for a student who only ever opens it on a phone.
 */

export interface AppNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Paths that belong to this destination, for the active state. */
  also?: string[];
}

/*
  /mentorship (singular) is listed before it exists. The relationship
  workspace is the next pass; naming it here means the nav lights correctly
  the moment it ships rather than needing a second edit then.
*/
/*
  FIVE DESTINATIONS, AND THE SAME FIVE FOR BOTH ROLES.

  Home        what needs me today
  Network     people I could learn from, or help
  Relationships  the actual work, per person
  Messages    talking to them
  Me          who I am here

  WHAT CHANGED AND WHY. The previous four differed by role: a student saw
  Goals and a mentor saw Conversations, so the two halves of the same
  product had different shapes and nothing in the navigation suggested
  Mentable was a network at all. Goals are not a destination -- they belong
  to a relationship, and they are on its page. Conversations are not a
  destination either, for the same reason.

  What was missing was identity and discovery. A product where you cannot
  see your own profile or find another person is a programme portal, not a
  network, and no amount of polish elsewhere fixes that.

  Role now changes EMPHASIS INSIDE a destination rather than the set of
  destinations. A mentor's Relationships lists mentees; a student's lists
  mentors. Same page, same word, one product.
*/
const PRIMARY: AppNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  {
    href: '/network',
    label: 'Discover',
    icon: Users,
    also: ['/discover', '/mentor', '/mentee'],
  },
  {
    href: '/mentorships',
    label: 'Relationships',
    icon: Handshake,
    also: ['/mentorship', '/requests', '/sessions', '/schedule', '/goals'],
  },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/me', label: 'Me', icon: CircleUser, also: ['/profile'] },
];

/*
  Takes the role so call sites do not change and so a future destination can
  legitimately differ, but today both roles get the same five. That is the
  point: one product, not two.
*/
export function navFor(_role: 'mentor' | 'mentee'): AppNavItem[] {
  return PRIMARY;
}

/**
 * Whether an item owns the current path.
 *
 * /dashboard matches exactly: it is the root of the signed-in app and a
 * prefix test would light it for everything.
 */
export function isNavItemActive(item: AppNavItem, pathname: string): boolean {
  return [item.href, ...(item.also ?? [])].some((href) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/'),
  );
}
