'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import Spinner from '@/components/ui/Spinner';

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profileData) {
        router.replace('/login');
        return;
      }

      setProfile(profileData as Profile);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
