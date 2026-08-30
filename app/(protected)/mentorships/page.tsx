'use client';

import { useEffect, useState } from 'react';
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
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No mentorships yet</p>
          <p className="text-sm mt-1">
            {userRole === 'mentee'
              ? 'Browse mentors and send a request to get started.'
              : 'Approve requests to begin mentoring.'}
          </p>
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
