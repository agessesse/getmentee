'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SessionCard from '@/components/schedule/SessionCard';
import BookingModal from '@/components/schedule/BookingModal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface Session {
  id: string;
  mentorship_id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  session_type: 'video' | 'async';
  notes: string | null;
  video_link: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  partner: { first_name: string; last_name: string; avatar_url: string | null };
}

interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
}

export default function SchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const uid = session.user.id;

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single();
    const role = profile?.role as 'mentor' | 'mentee';
    setUserRole(role);

    const [sessionsRes, mentorshipsRes] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, mentorship_id, mentor_id, mentee_id, scheduled_at, duration_minutes, session_type, notes, video_link, status')
        .or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`)
        .order('scheduled_at', { ascending: tab === 'upcoming' }),
      supabase
        .from('mentorships')
        .select('id, mentor_id, mentee_id')
        .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
        .eq('status', 'active'),
    ]);

    setMentorships(mentorshipsRes.data ?? []);

    const allSessions = sessionsRes.data ?? [];
    const partnerIds = allSessions.map((s) => s.mentor_id === uid ? s.mentee_id : s.mentor_id);
    const uniqueIds = [...new Set(partnerIds)];
    const { data: partners } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', uniqueIds);
    const partnerMap = new Map(partners?.map((p) => [p.id, p]) ?? []);

    const enriched = allSessions.map((s) => {
      const partnerId = s.mentor_id === uid ? s.mentee_id : s.mentor_id;
      const partner = partnerMap.get(partnerId) ?? { first_name: 'Unknown', last_name: '', avatar_url: null };
      return { ...s, session_type: s.session_type as 'video' | 'async', status: s.status as Session['status'], partner };
    });

    const upcoming = enriched.filter((s) => new Date(s.scheduled_at) >= new Date() && s.status !== 'cancelled');
    const past = enriched.filter((s) => new Date(s.scheduled_at) < new Date() || s.status === 'completed');

    setSessions(tab === 'upcoming' ? upcoming : past);
    setLoading(false);
  }

  const activeMentorship = mentorships[0];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Schedule</h1>
          <p className="text-gray-500 mt-1">Manage your upcoming and past sessions.</p>
        </div>
        {userRole === 'mentee' && activeMentorship && (
          <Button onClick={() => setBookingOpen(true)}>
            <Plus className="h-4 w-4" /> Book Session
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setLoading(true); loadData(); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${
              tab === t ? 'border-navy-600 text-navy-600' : 'border-transparent text-gray-500 hover:text-navy-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No {tab} sessions</p>
          {tab === 'upcoming' && userRole === 'mentee' && activeMentorship && (
            <Button className="mt-4" onClick={() => setBookingOpen(true)}>
              <Plus className="h-4 w-4" /> Book your first session
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              id={s.id}
              partnerFirstName={s.partner.first_name}
              partnerLastName={s.partner.last_name}
              partnerAvatarUrl={s.partner.avatar_url}
              scheduledAt={s.scheduled_at}
              durationMinutes={s.duration_minutes}
              sessionType={s.session_type}
              notes={s.notes}
              videoLink={s.video_link}
              status={s.status}
            />
          ))}
        </div>
      )}

      {bookingOpen && activeMentorship && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          mentorshipId={activeMentorship.id}
          mentorId={activeMentorship.mentor_id}
          menteeId={activeMentorship.mentee_id}
          onBooked={() => { setLoading(true); loadData(); }}
        />
      )}
    </div>
  );
}
