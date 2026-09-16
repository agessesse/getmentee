'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import Wordmark from '@/components/ui/Wordmark';
import RouteArrive from '@/components/layout/RouteArrive';
import SignInTransition from '@/components/auth/SignInTransition';
import { ProfileProvider } from '@/lib/profile-context';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'mentor' | 'mentee';
  avatar_url: string | null;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The sign-in arrival lives here rather than on the dashboard. The dashboard
  // only mounts after the profile check below resolves, which left the loading
  // screen visible for most of a second before the arrival cut in over it.
  // Mounted at the layout, it covers that wait instead of following it.
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('mentee_signin_transition')) {
      sessionStorage.removeItem('mentee_signin_transition');
      setShowSignIn(true);
    }
  }, []);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      // `email` is deliberately NOT selected here. Migration 0018 revokes
      // column-level SELECT on profiles.email so it cannot be read through the
      // API at all — without that, the permissive profiles policy from 0016
      // let any authenticated account read every user's email address.
      // The address is on the session already, which is the correct source.
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profileData) {
        router.replace('/login');
        return;
      }

      setProfile({
        ...(profileData as Omit<Profile, 'email'>),
        email: session.user.email ?? '',
      });

      // Redirect to profile setup if not yet complete (skip if already there)
      if (pathname !== '/profile/setup') {
        const table = profileData.role === 'mentor' ? 'mentor_profiles' : 'mentee_profiles';
        const { data: extProfile } = await supabase
          .from(table)
          .select('profile_complete')
          .eq('id', session.user.id)
          .single();

        if (!extProfile || !extProfile.profile_complete) {
          router.replace('/profile/setup');
          return;
        }
      }

      setLoading(false);
    }

    init();
  }, [router, pathname]);

  return (
    <>
      {showSignIn && <SignInTransition onComplete={() => setShowSignIn(false)} />}
      {loading ? (
        <div className="flex h-screen flex-col items-center justify-center gap-5 bg-halo-ivory font-body">
          <Wordmark size="lg" className="halo-breathe text-halo-ink" />
          <span className="sr-only">Loading</span>
        </div>
      ) : profile ? (
        <ProfileProvider profile={profile}>
          <div className="flex h-screen bg-halo-ivory text-halo-ink font-body overflow-hidden">
            <Sidebar
              role={profile.role}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              firstName={profile.first_name}
              lastName={profile.last_name}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <TopNav
                user={profile}
                onMenuClick={() => setSidebarOpen(true)}
              />
              <main id="main-content" className="flex-1 overflow-y-auto">
                {/*
                  Every arrival replays the homepage hero's entrance: the page is
                  fully visible from the first frame and only settles the last
                  20px into place. No opacity, so nothing is hidden while data
                  loads.
                */}
                <RouteArrive className="p-4 sm:p-6 lg:p-10">
                  {children}
                </RouteArrive>
              </main>
            </div>
          </div>
        </ProfileProvider>
      ) : null}
    </>
  );
}
