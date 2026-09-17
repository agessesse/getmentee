'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SessionCard from '@/components/schedule/SessionCard';
import BookingModal from '@/components/schedule/BookingModal';
import AvailabilityPlanner from '@/components/schedule/AvailabilityPlanner';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { FORMER_MEMBER } from '@/lib/display-name';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  partnerName: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabType = 'upcoming' | 'past' | 'availability';

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const preselectedMentorshipId = searchParams.get('mentorshipId');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [selectedMentorshipId] = useState<string | null>(preselectedMentorshipId);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  // ?tab=availability opens the planner directly, e.g. from the mentor dashboard.
  const [tab, setTab] = useState<TabType>(searchParams.get('tab') === 'availability' ? 'availability' : 'upcoming');
  // The availability planner keeps a draft until saved. Leaving the tab would
  // throw that draft away silently, so it reports whether there is one.
  const [availabilityDirty, setAvailabilityDirty] = useState(false);

  // loadSessions accepts the active tab explicitly to avoid stale closure
  const loadSessions = useCallback(async (activeTab: 'upcoming' | 'past', uid: string) => {
    const supabase = createClient();

    const { data: allSessions } = await supabase
      .from('sessions')
      .select('id, mentorship_id, mentor_id, mentee_id, scheduled_at, duration_minutes, session_type, notes, video_link, status')
      .or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`)
      .order('scheduled_at', { ascending: activeTab === 'upcoming' });

    const rawSessions = allSessions ?? [];
    const partnerIds = rawSessions.map((s) => s.mentor_id === uid ? s.mentee_id : s.mentor_id);
    const uniqueIds = [...new Set(partnerIds)];

    let partners: Array<{ id: string; first_name: string; last_name: string; avatar_url: string | null }> = [];
    if (uniqueIds.length > 0) {
      const { data } = await supabase
        .from('public_profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', uniqueIds);
      partners = data ?? [];
    }

    const partnerMap = new Map(partners.map((p) => [p.id, p]));

    const enriched = rawSessions.map((s) => {
      const partnerId = s.mentor_id === uid ? s.mentee_id : s.mentor_id;
      const partner = partnerMap.get(partnerId) ?? { first_name: FORMER_MEMBER, last_name: '', avatar_url: null };
      return {
        ...s,
        session_type: s.session_type as 'video' | 'async',
        status: s.status as Session['status'],
        partner,
      };
    });

    const now = new Date();
    const filtered = activeTab === 'upcoming'
      ? enriched.filter((s) => new Date(s.scheduled_at) >= now && s.status !== 'cancelled' && s.status !== 'completed')
      : enriched.filter((s) => new Date(s.scheduled_at) < now || s.status === 'completed' || s.status === 'cancelled');

    setSessions(filtered);
  }, []);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single();
      const role = profile?.role as 'mentor' | 'mentee';
      setUserRole(role);

      // Fetch active mentorships for the booking selector
      const { data: rawMentorships } = await supabase
        .from('mentorships')
        .select('id, mentor_id, mentee_id')
        .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
        .eq('status', 'active');

      if (rawMentorships && rawMentorships.length > 0) {
        const partnerIds = rawMentorships.map((m) => m.mentor_id === uid ? m.mentee_id : m.mentor_id);
        const { data: mentorshipPartners } = await supabase
          .from('public_profiles')
          .select('id, first_name, last_name')
          .in('id', partnerIds);

        const mpMap = new Map(mentorshipPartners?.map((p) => [p.id, p]) ?? []);
        const enrichedMentorships: Mentorship[] = rawMentorships.map((m) => {
          const partnerId = m.mentor_id === uid ? m.mentee_id : m.mentor_id;
          const partner = mpMap.get(partnerId);
          return {
            id: m.id,
            mentor_id: m.mentor_id,
            mentee_id: m.mentee_id,
            partnerName: partner ? `${partner.first_name} ${partner.last_name}` : 'Your mentor',
          };
        });
        setMentorships(enrichedMentorships);
      }

      await loadSessions('upcoming', uid);
      setLoading(false);
    }
    loadData();
  }, [loadSessions]);

  const handleTabChange = async (newTab: TabType) => {
    if (
      tab === 'availability' && newTab !== 'availability' && availabilityDirty &&
      !window.confirm('You have unsaved availability changes. Leave without saving?')
    ) return;
    setTab(newTab);
    if (newTab === 'availability') return; // availability editor manages its own loading
    setLoading(true);
    await loadSessions(newTab as 'upcoming' | 'past', userId);
    setLoading(false);
  };

  const canBook = userRole === 'mentee' && mentorships.length > 0;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    ...(userRole === 'mentor' ? [{ key: 'availability' as TabType, label: 'Availability' }] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">Schedule</h1>
          <p className="text-halo-mist-body mt-1 text-sm">
            {userRole === 'mentor'
              ? 'Manage sessions and set your weekly availability.'
              : 'Manage your upcoming and past sessions.'}
          </p>
        </div>

        {/* Book session button — mentor selection happens inside the modal */}
        {userRole === 'mentee' && mentorships.length > 0 && (
          <Button onClick={() => setBookingOpen(true)}>
            <Plus className="h-4 w-4" /> Book Session
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-halo-rule mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2 ${
              tab === key ? 'border-halo-purple text-halo-purple-d' : 'border-transparent text-halo-mist-body hover:text-halo-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Availability tab */}
      {tab === 'availability' && userId && userRole === 'mentor' && (
        <AvailabilityPlanner userId={userId} onDirtyChange={setAvailabilityDirty} />
      )}

      {/* Sessions tabs */}
      {tab !== 'availability' && (
        <>
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 text-halo-mist-body">
              <p className="text-base font-medium text-halo-ink mb-1">No {tab} sessions</p>
              {tab === 'upcoming' && canBook && (
                <>
                  <p className="text-sm text-halo-mist-body mb-4">
                    {mentorships.length === 1
                      ? `Ready to meet with ${mentorships[0].partnerName}? Book your first session.`
                      : 'Schedule time with one of your mentors.'}
                  </p>
                  <Button onClick={() => setBookingOpen(true)}>
                    <Plus className="h-4 w-4" /> Book a session
                  </Button>
                </>
              )}
              {tab === 'upcoming' && userRole === 'mentor' && (
                <p className="text-sm text-halo-mist-body mt-1">
                  No upcoming sessions. Mentees can book sessions once you&apos;re connected.
                </p>
              )}
              {tab === 'past' && (
                <p className="text-sm text-halo-mist-body mt-1">Sessions you&apos;ve completed will appear here.</p>
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
        </>
      )}

      {bookingOpen && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          mentorships={mentorships}
          preselectedMentorshipId={selectedMentorshipId ?? undefined}
          userRole={userRole}
          onBooked={() => {
            setBookingOpen(false);
            handleTabChange('upcoming');
          }}
        />
      )}
    </div>
  );
}
