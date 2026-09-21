'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Handshake,
  MessageSquare,
  Calendar,
  User,
  Target,
  X,
  BarChart2,
  UserPlus,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import InviteModal from '@/components/marketing/InviteModal';
import Wordmark from '@/components/ui/Wordmark';

interface NavItem {
  href: string;
  label: string;
  /** Used instead of `label` for mentors, where the plain word differs. */
  mentorLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  menteeOnly?: boolean;
  mentorOnly?: boolean;
  /** Other paths that belong to this destination, for the active state. */
  also?: string[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/*
  Labels are written for someone who has never used a product like this. Two
  rules: say what the thing is in the words the person would use, and stay
  short enough to scan. "Discover" tested as a verb with no object, so mentees
  now see "Find a mentor"; "Mentorships" is a word almost nobody says out loud,
  so each side sees the people it means. Nothing is renamed for novelty:
  Requests, Goals, Messages and Schedule already say what they are.

  The two guides used to be two entries. They are now one, Learn, which opens a
  page carrying both in full. /networking and /guide still exist and still keep
  the nav item lit, so an old link or a deep link from a lesson doesn't lose
  its place in the sidebar.
*/
const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
      { href: '/discover', label: 'Find a mentor', icon: Search, menteeOnly: true },
      { href: '/impact', label: 'Your mentoring', icon: BarChart2, mentorOnly: true },
      { href: '/opportunities', label: 'Opportunity Fund', icon: Lightbulb, menteeOnly: true },
    ],
  },
  {
    label: 'Mentorship',
    items: [
      { href: '/requests', label: 'Requests', icon: ClipboardList },
      { href: '/mentorships', label: 'My mentors', mentorLabel: 'My mentees', icon: Handshake },
      { href: '/goals', label: 'Goals', icon: Target },
      { href: '/learn', label: 'Learn', icon: BookOpen, also: ['/networking', '/guide'] },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      { href: '/schedule', label: 'Schedule', icon: Calendar },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile/setup', label: 'My Profile', icon: User },
    ],
  },
];

interface SidebarProps {
  role: 'mentor' | 'mentee';
  open: boolean;
  onClose: () => void;
  firstName?: string;
  lastName?: string;
}

export default function Sidebar({ role, open, onClose, firstName, lastName }: SidebarProps) {
  const pathname = usePathname();
  const [inviteOpen, setInviteOpen] = useState(false);

  const isActive = (item: NavItem) =>
    [item.href, ...(item.also ?? [])].some(
      (href) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
    );

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (item.menteeOnly && role !== 'mentee') return false;
      if (item.mentorOnly && role !== 'mentor') return false;
      return true;
    });

  return (
    <>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-halo-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/*
        Sidebar panel. It sits on the homepage's ivory ground with a hairline
        rule rather than on a dark slab, so signing in reads as stepping further
        into the same site and not as arriving in a different product. The
        active item borrows the public header's signal: darker text plus a
        purple rule, here vertical because the list is.
      */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-30 h-full w-60 bg-halo-ivory border-r border-halo-rule flex flex-col transition-transform duration-300 ease-[cubic-bezier(.65,0,.35,1)] flex-shrink-0',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo. Same height as the top bar so the two rules meet in one line. */}
        <div className="flex items-center justify-between px-5 h-16 flex-none border-b border-halo-rule">
          <Link
            href="/dashboard"
            className="text-halo-ink rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            onClick={onClose}
          >
            <Wordmark size="md" />
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-halo-heather hover:text-halo-ink transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav sections */}
        <nav aria-label="App" className="flex-1 px-3 pt-6 pb-2 space-y-7 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = filterItems(section.items);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="px-3 mb-2 font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const { href, icon: Icon } = item;
                    const label = role === 'mentor' ? item.mentorLabel ?? item.label : item.label;
                    const active = isActive(item);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'group relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple',
                          active
                            ? 'bg-halo-veil text-halo-ink'
                            : 'text-halo-heather hover:bg-halo-veil/60 hover:text-halo-ink'
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={clsx(
                            'absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-halo-purple origin-center transition-transform duration-300 ease-[cubic-bezier(.65,0,.35,1)]',
                            active ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'
                          )}
                        />
                        <Icon
                          className={clsx(
                            'h-4 w-4 flex-shrink-0 transition-colors',
                            active ? 'text-halo-purple-d' : 'text-halo-mist-strong group-hover:text-halo-purple-d'
                          )}
                        />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Invite CTA — mentees only. The homepage's outline tier. */}
        {role === 'mentee' && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setInviteOpen(true)}
              className="group w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-halo-purple text-sm font-semibold text-halo-purple-d hover:bg-halo-purple hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2 focus-visible:ring-offset-halo-ivory"
            >
              <UserPlus className="h-4 w-4 flex-shrink-0" />
              Invite a mentor
            </button>
          </div>
        )}

        {/* User footer */}
        <div className="px-3 py-4 border-t border-halo-rule">
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="w-8 h-8 rounded-full bg-halo-deep flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-halo-ivory">
                {firstName?.[0] ?? ''}{lastName?.[0] ?? ''}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-halo-ink truncate">
                {firstName} {lastName}
              </p>
              <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
