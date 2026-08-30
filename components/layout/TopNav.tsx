'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu, ChevronDown, Check, ClipboardList, MessageSquare, Calendar, Target } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface TopNavProps {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

const NOTIF_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  request_received: ClipboardList,
  request_accepted: ClipboardList,
  request_declined: ClipboardList,
  new_message: MessageSquare,
  session_scheduled: Calendar,
  session_reminder: Calendar,
  goal_completed: Target,
  action_item_due: Target,
  review_received: Target,
};

export default function TopNav({ user, onMenuClick }: TopNavProps) {
  const [userDropdown, setUserDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  }, [user.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifDropdown(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markOneRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const fullName = `${user.first_name} ${user.last_name}`;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-navy-900 transition-colors p-1"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifDropdown((v) => !v);
              setUserDropdown(false);
            }}
            className="relative p-2 text-gray-400 hover:text-navy-900 transition-colors rounded-lg hover:bg-gray-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {notifDropdown && (
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-navy-900">
                  Notifications {unreadCount > 0 && <span className="text-xs text-gray-400 font-normal">({unreadCount} new)</span>}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-navy-600 hover:text-navy-900 font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = NOTIF_ICONS[notif.type] ?? Bell;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => markOneRead(notif.id)}
                        className={`w-full flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left ${!notif.is_read ? 'bg-navy-50/40' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-navy-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${!notif.is_read ? 'font-semibold text-navy-900' : 'font-medium text-gray-700'}`}>
                            {notif.title}
                          </p>
                          {notif.body && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.body}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-navy-600 rounded-full mt-2 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setUserDropdown((v) => !v);
              setNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Avatar src={user.avatar_url} name={fullName} size="sm" />
            <span className="hidden md:block text-sm font-medium text-navy-900 max-w-[120px] truncate">
              {user.first_name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {userDropdown && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-navy-900">{fullName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>
              <Link
                href="/profile/setup"
                onClick={() => setUserDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </Link>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
