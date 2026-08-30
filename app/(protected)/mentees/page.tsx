'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MenteeEntry {
  mentorshipId: string;
  menteeId: string;
  menteeName: string;
  menteeAvatarUrl: string | null;
  menteeHeadline: string | null;
  menteeUniversity: string | null;
  sessionsCount: number;
  startedAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export default function MenteesPage() {
  const [mentees, setMentees] = useState<MenteeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const { data: msList } = await supabase
        .from('mentorships')
        .select('id, mentee_id, sessions_count, started_at, status')
        .eq('mentor_id', uid)
        .order('started_at', { ascending: false });

      if (!msList || msList.length === 0) { setLoading(false); return; }

      const menteeIds = msList.map((m) => m.mentee_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, headline, university')
        .in('id', menteeIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      setMentees(msList.map((m) => {
        const p = profileMap.get(m.mentee_id);
        return {
          mentorshipId: m.id,
          menteeId: m.mentee_id,
          menteeName: p ? `${p.first_name} ${p.last_name}` : 'Unknown',
          menteeAvatarUrl: p?.avatar_url ?? null,
          menteeHeadline: p?.headline ?? null,
          menteeUniversity: p?.university ?? null,
          sessionsCount: m.sessions_count,
          startedAt: m.started_at,
          status: m.status as 'active' | 'completed' | 'cancelled',
        };
      }));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  const active = mentees.filter((m) => m.status === 'active');
  const past = mentees.filter((m) => m.status !== 'active');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Mentees</h1>
        <p className="text-gray-500 mt-1 text-sm">Students and professionals you are currently guiding.</p>
      </div>

      {mentees.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-base font-medium text-navy-900 mb-2">No mentees yet</p>
          <p className="text-sm text-gray-400 mb-6">Approve incoming requests to start mentoring.</p>
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
          >
            View requests
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Active ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((m) => (
                  <div key={m.mentorshipId} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-navy-200 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar src={m.menteeAvatarUrl} name={m.menteeName} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy-900">{m.menteeName}</p>
                        {m.menteeHeadline && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{m.menteeHeadline}</p>
                        )}
                        {m.menteeUniversity && (
                          <p className="text-xs text-gray-400 mt-0.5">{m.menteeUniversity}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      <span>{m.sessionsCount} session{m.sessionsCount !== 1 ? 's' : ''}</span>
                      <span>Since {formatDistanceToNow(new Date(m.startedAt), { addSuffix: true })}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/messages?mentorshipId=${m.mentorshipId}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-navy-300 hover:text-navy-900 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </Link>
                      <Link
                        href="/schedule"
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-navy-300 hover:text-navy-900 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Schedule
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Past ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((m) => (
                  <div key={m.mentorshipId} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-70">
                    <div className="flex items-center gap-3">
                      <Avatar src={m.menteeAvatarUrl} name={m.menteeName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-navy-900">{m.menteeName}</p>
                        <p className="text-xs text-gray-400">{m.sessionsCount} sessions · {m.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
