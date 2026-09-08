'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Handshake } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MentorshipCard from '@/components/mentorships/MentorshipCard';
import Spinner from '@/components/ui/Spinner';

interface Mentorship {
  id: string;
  mentee_id: string;
  mentor_id: string;
  sessions_count: number;
  started_at: string;
  status: 'active' | 'completed' | 'cancelled';
  partner: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export default function MentorshipsPage() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single();

      const role = profile?.role as 'mentor' | 'mentee';
      setUserRole(role);

      const { data } = await supabase
        .from('mentorships')
        .select('id, mentee_id, mentor_id, sessions_count, started_at, status')
        .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
        .order('started_at', { ascending: false });

      if (!data) { setLoading(false); return; }

      const partnerIds = data.map((m) => m.mentor_id === uid ? m.mentee_id : m.mentor_id);
      const { data: partners } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', partnerIds);

      const partnerMap = new Map(partners?.map((p) => [p.id, p]) ?? []);

      setMentorships(
        data.map((m) => {
          const partnerId = m.mentor_id === uid ? m.mentee_id : m.mentor_id;
          return {
            ...m,
            status: m.status as 'active' | 'completed' | 'cancelled',
            partner: partnerMap.get(partnerId) ?? { id: partnerId, first_name: 'Unknown', last_name: '', avatar_url: null },
          };
        })
      );
      setLoading(false);
    }
    load();
  }, []);

  const active = mentorships.filter((m) => m.status === 'active');
  const past = mentorships.filter((m) => m.status !== 'active');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          {userRole === 'mentor' ? 'My Mentees' : 'My Mentorships'}
        </h1>
        <p className="text-gray-500 mt-1">
          {userRole === 'mentor'
            ? 'Track and connect with your active mentees.'
            : 'Your active and past mentorship relationships.'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : mentorships.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center text-center">
          <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
            <Handshake className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-navy-900 mb-1">No mentorships yet</p>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            {userRole === 'mentee'
              ? 'Once a mentor accepts your request, your mentorship appears here.'
              : 'Mentorships appear here after you approve a request from the Requests page.'}
          </p>
          {userRole === 'mentee' && (
            <Link
              href="/discover"
              className="mt-6 inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
            >
              Find a mentor
            </Link>
          )}
          {userRole === 'mentor' && (
            <Link
              href="/requests"
              className="mt-6 inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
            >
              Review requests
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-navy-900 mb-4">
                Active ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    partnerFirstName={m.partner.first_name}
                    partnerLastName={m.partner.last_name}
                    partnerAvatarUrl={m.partner.avatar_url}
                    sessionsCount={m.sessions_count}
                    startedAt={m.started_at}
                    status={m.status}
                    mentorshipId={m.id}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-navy-900 mb-4">Past</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    partnerFirstName={m.partner.first_name}
                    partnerLastName={m.partner.last_name}
                    partnerAvatarUrl={m.partner.avatar_url}
                    sessionsCount={m.sessions_count}
                    startedAt={m.started_at}
                    status={m.status}
                    mentorshipId={m.id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
