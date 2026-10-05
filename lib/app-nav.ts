import {
  Home,
  Handshake,
  Target,
  MessageSquare,
  Users,
  CalendarDays,
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
const STUDENT: AppNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  {
    href: '/mentorships',
    label: 'Mentorship',
    icon: Handshake,
    also: ['/mentorship', '/discover', '/requests', '/sessions', '/schedule', '/mentor'],
  },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
];

/*
  A mentor's second item is the people, not the relationships: they hold
  several at once and think in names. "Conversations" is the word mentors use
  for the thing the database calls a session, and it covers both the one being
  scheduled and the ones already held.
*/
const MENTOR: AppNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  {
    href: '/mentorships',
    label: 'Mentees',
    icon: Users,
    also: ['/mentorship', '/requests', '/mentee', '/impact'],
  },
  {
    href: '/schedule',
    label: 'Conversations',
    icon: CalendarDays,
    also: ['/sessions'],
  },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
];

export function navFor(role: 'mentor' | 'mentee'): AppNavItem[] {
  return role === 'mentor' ? MENTOR : STUDENT;
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
