'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ChevronDown, Clock, Plus as PlusIcon, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SessionCard from '@/components/schedule/SessionCard';
import BookingModal from '@/components/schedule/BookingModal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

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

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Availability editor (mentor view) ───────────────────────────────────────

function AvailabilityEditor({ userId }: { userId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('availability_slots')
        .select('id, day_of_week, start_time, end_time')
        .eq('mentor_id', userId)
        .order('day_of_week')
        .order('start_time');
      setSlots((data ?? []) as AvailabilitySlot[]);
      setLoading(false);
    }
    load();
  }, [userId]);

  const addSlot = async () => {
    if (addingDay === null) return;
    if (newStart >= newEnd) {
      setError('End time must be after start time.');
      return;
    }
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('availability_slots')
      .insert({ mentor_id: userId, day_of_week: addingDay, start_time: newStart, end_time: newEnd })
      .select('id, day_of_week, start_time, end_time')
      .single();
    if (err) {
      setError(err.message);
    } else if (data) {
      setSlots((prev) =>
        [...prev, data as AvailabilitySlot].sort(
          (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
        )
      );
      setAddingDay(null);
      setNewStart('09:00');
      setNewEnd('17:00');
    }
    setSaving(false);
  };

  const removeSlot = async (id: string) => {
    const supabase = createClient();
    await supabase.from('availability_slots').delete().eq('id', id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')}${ampm}`;
  };

  const slotsByDay = DAYS.map((_, i) => slots.filter((s) => s.day_of_week === i));

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-navy-900">Weekly Availability</h2>
        <p className="text-sm text-gray-500 mt-1">
          Set recurring windows when you&apos;re generally available for sessions. Mentees will see these when booking.
        </p>
      </div>

      <div className="space-y-3">
        {DAYS.map((day, dayIndex) => {
          const daySlots = slotsByDay[dayIndex];
          const isAdding = addingDay === dayIndex;
          return (
            <div key={day} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-navy-900">{day}</span>
                {!isAdding && (
                  <button
                    onClick={() => setAddingDay(dayIndex)}
                    className="flex items-center gap-1 text-xs text-navy-600 hover:text-navy-900 transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add window
                  </button>
                )}
              </div>

              {daySlots.length === 0 && !isAdding && (
                <p className="text-xs text-gray-400">No availability set</p>
              )}

              {daySlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-navy-400" />
                    <span className="text-sm text-gray-700">
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSlot(slot.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {isAdding && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">From</label>
                      <input
                        type="time"
                        value={newStart}
                        onChange={(e) => setNewStart(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">To</label>
                      <input
                        type="time"
                        value={newEnd}
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
                      />
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={addSlot}
                      disabled={saving}
                      className="flex-1 py-1.5 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-navy-800 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving…' : 'Save window'}
                    </button>
                    <button
                      onClick={() => { setAddingDay(null); setError(''); }}
                      className="px-4 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        These are recurring weekly windows — they don&apos;t block specific dates or sync with external calendars.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabType = 'upcoming' | 'past' | 'availability';

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const preselectedMentorshipId = searchParams.get('mentorshipId');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [selectedMentorshipId, setSelectedMentorshipId] = useState<string | null>(preselectedMentorshipId);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [tab, setTab] = useState<TabType>('upcoming');

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
      const partner = partnerMap.get(partnerId) ?? { first_name: 'Unknown', last_name: '', avatar_url: null };
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
        setSelectedMentorshipId((prev) => prev ?? enrichedMentorships[0]?.id ?? null);
      }

      await loadSessions('upcoming', uid);
      setLoading(false);
    }
    loadData();
  }, [loadSessions]);

  const handleTabChange = async (newTab: TabType) => {
    setTab(newTab);
    if (newTab === 'availability') return; // availability editor manages its own loading
    setLoading(true);
    await loadSessions(newTab as 'upcoming' | 'past', userId);
    setLoading(false);
  };

  const selectedMentorship = mentorships.find((m) => m.id === selectedMentorshipId);
  const canBook = userRole === 'mentee' && mentorships.length > 0 && selectedMentorship != null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    ...(userRole === 'mentor' ? [{ key: 'availability' as TabType, label: 'Availability' }] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Schedule</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {userRole === 'mentor'
              ? 'Manage sessions and set your weekly availability.'
              : 'Manage your upcoming and past sessions.'}
          </p>
        </div>

        {/* Book session controls — mentees only */}
        {userRole === 'mentee' && mentorships.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {mentorships.length > 1 && (
              <div className="relative">
                <select
                  value={selectedMentorshipId ?? ''}
                  onChange={(e) => setSelectedMentorshipId(e.target.value)}
                  aria-label="Select mentorship"
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500 cursor-pointer"
                >
                  {mentorships.map((m) => (
                    <option key={m.id} value={m.id}>
                      With {m.partnerName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
            )}
            <Button onClick={() => setBookingOpen(true)} disabled={!selectedMentorship}>
              <Plus className="h-4 w-4" /> Book Session
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
              tab === key ? 'border-navy-600 text-navy-600' : 'border-transparent text-gray-500 hover:text-navy-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Availability tab */}
      {tab === 'availability' && userId && (
        <AvailabilityEditor userId={userId} />
      )}

      {/* Sessions tabs */}
      {tab !== 'availability' && (
        <>
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-base font-medium text-navy-900 mb-1">No {tab} sessions</p>
              {tab === 'upcoming' && canBook && (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    {mentorships.length === 1
                      ? `Ready to meet with ${selectedMentorship?.partnerName}? Book your first session.`
                      : 'Schedule time with one of your mentors.'}
                  </p>
                  <Button onClick={() => setBookingOpen(true)}>
                    <Plus className="h-4 w-4" /> Book a session
                  </Button>
                </>
              )}
              {tab === 'upcoming' && userRole === 'mentor' && (
                <p className="text-sm text-gray-400 mt-1">
                  No upcoming sessions. Mentees can book sessions once you&apos;re connected.
                </p>
              )}
              {tab === 'past' && (
                <p className="text-sm text-gray-400 mt-1">Sessions you&apos;ve completed will appear here.</p>
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

      {bookingOpen && selectedMentorship && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          mentorshipId={selectedMentorship.id}
          mentorId={selectedMentorship.mentor_id}
          menteeId={selectedMentorship.mentee_id}
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
