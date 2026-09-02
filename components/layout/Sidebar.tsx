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
  Network,
  Users,
  X,
  BarChart2,
  UserPlus,
} from 'lucide-react';
import InviteModal from '@/components/marketing/InviteModal';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  menteeOnly?: boolean;
  mentorOnly?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/discover', label: 'Discover', icon: Search, menteeOnly: true },
      { href: '/mentees', label: 'Mentees', icon: Users, mentorOnly: true },
      { href: '/impact', label: 'My Impact', icon: BarChart2, mentorOnly: true },
    ],
  },
  {
    label: 'Mentorship',
    items: [
      { href: '/requests', label: 'Requests', icon: ClipboardList },
      { href: '/mentorships', label: 'Mentorships', icon: Handshake },
      { href: '/goals', label: 'Goals', icon: Target },
      { href: '/network', label: 'My Network', icon: Network },
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

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

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
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-30 h-full w-60 bg-navy-900 flex flex-col transition-transform duration-200 flex-shrink-0',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-white tracking-tight"
            onClick={onClose}
          >
            Mentee
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-navy-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = filterItems(section.items);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          active
                            ? 'bg-white/10 text-white'
                            : 'text-navy-300 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <Icon className={clsx('h-4 w-4 flex-shrink-0', active ? 'text-white' : 'text-navy-400')} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Invite CTA */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setInviteOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-navy-300 hover:bg-white/5 hover:text-white transition-all"
          >
            <UserPlus className="h-4 w-4 flex-shrink-0 text-navy-400" />
            Invite a mentor
          </button>
        </div>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-navy-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {firstName?.[0] ?? ''}{lastName?.[0] ?? ''}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {firstName} {lastName}
              </p>
              <p className="text-xs text-navy-400 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
