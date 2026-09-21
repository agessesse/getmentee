'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Handshake } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MentorshipCard from '@/components/mentorships/MentorshipCard';
import Spinner from '@/components/ui/Spinner';
import { FORMER_MEMBER } from '@/lib/display-name';

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
  nextSessionAt: string | null;
  activeGoalCount: number;
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

      const mentorshipIds = data.map((m) => m.id);
      const partnerIds = data.map((m) => m.mentor_id === uid ? m.mentee_id : m.mentor_id);

      // Fetch partners, next sessions, and goal counts in parallel
      const [partnersRes, sessionsRes, goalsRes] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', partnerIds),
        supabase
          .from('sessions')
          .select('mentorship_id, scheduled_at')
          .in('mentorship_id', mentorshipIds)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true }),
        supabase
          .from('mentorship_goals')
          .select('mentorship_id')
          .in('mentorship_id', mentorshipIds)
          .eq('status', 'active'),
      ]);

      const partnerMap = new Map(partnersRes.data?.map((p) => [p.id, p]) ?? []);

      // First upcoming session per mentorship
      const nextSessionMap = new Map<string, string>();
      for (const s of sessionsRes.data ?? []) {
        if (!nextSessionMap.has(s.mentorship_id)) {
          nextSessionMap.set(s.mentorship_id, s.scheduled_at);
        }
      }

      // Active goal counts per mentorship
      const goalCountMap = new Map<string, number>();
      for (const g of goalsRes.data ?? []) {
        goalCountMap.set(g.mentorship_id, (goalCountMap.get(g.mentorship_id) ?? 0) + 1);
      }

      setMentorships(
        data.map((m) => {
          const partnerId = m.mentor_id === uid ? m.mentee_id : m.mentor_id;
          return {
            ...m,
            status: m.status as 'active' | 'completed' | 'cancelled',
            partner: partnerMap.get(partnerId) ?? { id: partnerId, first_name: FORMER_MEMBER, last_name: '', avatar_url: null },
            nextSessionAt: nextSessionMap.get(m.id) ?? null,
            activeGoalCount: goalCountMap.get(m.id) ?? 0,
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
        <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
          {userRole === 'mentor' ? 'My mentees' : 'My mentors'}
        </h1>
        <p className="text-halo-mist-body mt-1 text-sm">
          {userRole === 'mentor'
            ? 'Everyone you are working with, and everyone you have worked with.'
            : 'Everyone you are working with, and everyone you have worked with.'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : mentorships.length === 0 ? (
        <div className="bg-white rounded-2xl border border-halo-rule p-12 flex flex-col items-center text-center">
          <div className="w-11 h-11 bg-halo-veil rounded-xl flex items-center justify-center mb-4">
            <Handshake className="w-5 h-5 text-halo-mist" />
          </div>
          <p className="text-sm font-medium text-halo-ink mb-1">No mentorships yet</p>
          <p className="text-sm text-halo-mist-body max-w-xs leading-relaxed">
            {userRole === 'mentee'
              ? 'Once a mentor accepts your request, your mentorship appears here.'
              : 'Mentorships appear here after you approve a request from the Requests page.'}
          </p>
          {userRole === 'mentee' && (
            <Link
              href="/discover"
              className="mt-6 inline-flex items-center gap-2 bg-halo-purple text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Find a mentor
            </Link>
          )}
          {userRole === 'mentor' && (
            <Link
              href="/requests"
              className="mt-6 inline-flex items-center gap-2 bg-halo-purple text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Review requests
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section aria-labelledby="active-mentorships">
              <h2 id="active-mentorships" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink mb-4">
                Active ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    partnerFirstName={m.partner.first_name}
                    partnerLastName={m.partner.last_name}
                    partnerAvatarUrl={m.partner.avatar_url}
                    partnerId={m.partner.id}
                    userRole={userRole}
                    sessionsCount={m.sessions_count}
                    startedAt={m.started_at}
                    status={m.status}
                    mentorshipId={m.id}
                    nextSessionAt={m.nextSessionAt}
                    activeGoalCount={m.activeGoalCount}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink mb-4">Past</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map((m) => (
                  <MentorshipCard
                    key={m.id}
                    partnerFirstName={m.partner.first_name}
                    partnerLastName={m.partner.last_name}
                    partnerAvatarUrl={m.partner.avatar_url}
                    partnerId={m.partner.id}
                    userRole={userRole}
                    sessionsCount={m.sessions_count}
                    startedAt={m.started_at}
                    status={m.status}
                    mentorshipId={m.id}
                    nextSessionAt={m.nextSessionAt}
                    activeGoalCount={m.activeGoalCount}
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
