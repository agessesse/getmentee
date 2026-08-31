'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, ClipboardList, Handshake, Calendar, ArrowRight,
  TrendingUp, MessageSquare, Target, Star, Award, Users, Clock,
  BarChart2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  profile: { first_name: string; role: 'mentor' | 'mentee' };
  pendingRequests: number;
  activeMentorships: number;
  totalSessions: number;
  upcomingSessions: Array<{
    id: string;
    scheduled_at: string;
    session_type: string;
    partner_name: string;
  }>;
  recentMessages: Array<{
    mentorship_id: string;
    content: string;
    sender_name: string;
    created_at: string;
  }>;
  activeGoals: number;
  // mentor-only
  mentorExtra?: {
    totalMenteesEver: number;
    avgRating: number | null;
    reviewCount: number;
    totalHours: number;
    maxMentees: number;
    isFoundingMentor: boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(firstName: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${firstName}`;
}

// ─── Shared stat card ─────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon: Icon,
  href,
  color = 'navy',
}: {
  value: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color?: string;
}) {
  const bg =
    color === 'green' ? 'bg-green-50'
    : color === 'amber' ? 'bg-amber-50'
    : 'bg-navy-50';
  const iconColor =
    color === 'green' ? 'text-green-600'
    : color === 'amber' ? 'text-amber-600'
    : 'text-navy-600';
  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:border-navy-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-navy-600 group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-3xl font-bold text-navy-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </Link>
  );
}

// ─── Capacity bar (mentor-only) ───────────────────────────────────────────────

function CapacityBar({
  active,
  max,
}: {
  active: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min((active / max) * 100, 100) : 0;
  const isFull = active >= max;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-navy-900">Mentee Capacity</p>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isFull
              ? 'bg-red-50 text-red-600'
              : pct >= 75
              ? 'bg-amber-50 text-amber-600'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {isFull ? 'Full' : pct >= 75 ? 'Nearly full' : 'Open'}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isFull ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-green-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {active} of {max} mentee {max === 1 ? 'slot' : 'slots'} filled
      </p>
      {isFull && (
        <p className="text-xs text-red-500 mt-1">
          New requests will remain pending until a slot opens.{' '}
          <Link href="/profile/setup" className="underline hover:text-red-700">
            Adjust capacity →
          </Link>
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const [profileRes, requestsRes, mentorshipsRes, sessionsRes, goalsRes] =
        await Promise.all([
          supabase.from('profiles').select('first_name, role').eq('id', uid).single(),
          supabase
            .from('mentorship_requests')
            .select('id', { count: 'exact', head: true })
            .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
            .eq('status', 'pending'),
          supabase
            .from('mentorships')
            .select('id', { count: 'exact', head: true })
            .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
            .eq('status', 'active'),
          supabase
            .from('sessions')
            .select('id', { count: 'exact', head: true })
            .or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`)
            .eq('status', 'completed'),
          supabase
            .from('mentorship_goals')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', uid)
            .eq('status', 'active'),
        ]);

      const role = profileRes.data?.role as 'mentor' | 'mentee';

      // ── Upcoming sessions ─────────────────────────────────────────────────
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('id, scheduled_at, session_type, mentor_id, mentee_id')
        .or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(3);

      const upcomingSessions = await Promise.all(
        (sessionsData || []).map(async (s) => {
          const partnerId =
            s.mentor_id === uid ? s.mentee_id : s.mentor_id;
          const { data: partner } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', partnerId)
            .single();
          return {
            id: s.id,
            scheduled_at: s.scheduled_at,
            session_type: s.session_type,
            partner_name: partner
              ? `${partner.first_name} ${partner.last_name}`
              : 'Unknown',
          };
        })
      );

      // ── Recent messages ───────────────────────────────────────────────────
      const { data: activeMentorshipIds } = await supabase
        .from('mentorships')
        .select('id')
        .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
        .eq('status', 'active');

      const msIds = (activeMentorshipIds ?? []).map((m) => m.id);
      let recentMessages: DashboardData['recentMessages'] = [];

      if (msIds.length > 0) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('mentorship_id, content, sender_id, created_at')
          .in('mentorship_id', msIds)
          .neq('sender_id', uid)
          .order('created_at', { ascending: false })
          .limit(3);

        if (msgs && msgs.length > 0) {
          const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
          const { data: senders } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', senderIds);
          const senderMap = new Map(
            senders?.map((s) => [s.id, `${s.first_name} ${s.last_name}`]) ?? []
          );
          recentMessages = msgs.map((m) => ({
            mentorship_id: m.mentorship_id,
            content: m.content,
            sender_name: senderMap.get(m.sender_id) ?? 'Unknown',
            created_at: m.created_at,
          }));
        }
      }

      // ── Mentor-specific extras ────────────────────────────────────────────
      let mentorExtra: DashboardData['mentorExtra'] | undefined;

      if (role === 'mentor') {
        const [mpRes, allMentorshipsRes, allSessionsRes] = await Promise.all([
          supabase
            .from('mentor_profiles')
            .select('rating, review_count, max_mentees, is_founding_mentor')
            .eq('id', uid)
            .single(),
          supabase
            .from('mentorships')
            .select('mentee_id')
            .eq('mentor_id', uid),
          supabase
            .from('sessions')
            .select('duration_minutes')
            .eq('mentor_id', uid)
            .eq('status', 'completed'),
        ]);

        const uniqueMentees = new Set(
          (allMentorshipsRes.data ?? []).map((m) => m.mentee_id)
        ).size;

        const totalHours = Math.round(
          (allSessionsRes.data ?? []).reduce(
            (sum, s) => sum + (s.duration_minutes ?? 60),
            0
          ) / 60
        );

        mentorExtra = {
          totalMenteesEver: uniqueMentees,
          avgRating: mpRes.data?.rating
            ? Number(mpRes.data.rating)
            : null,
          reviewCount: mpRes.data?.review_count ?? 0,
          totalHours,
          maxMentees: mpRes.data?.max_mentees ?? 3,
          isFoundingMentor: mpRes.data?.is_founding_mentor ?? false,
        };
      }

      setData({
        profile: { first_name: profileRes.data?.first_name ?? '', role },
        pendingRequests: requestsRes.count ?? 0,
        activeMentorships: mentorshipsRes.count ?? 0,
        totalSessions: sessionsRes.count ?? 0,
        upcomingSessions,
        recentMessages,
        activeGoals: goalsRes.count ?? 0,
        mentorExtra,
      });
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const {
    profile,
    pendingRequests,
    activeMentorships,
    totalSessions,
    upcomingSessions,
    recentMessages,
    activeGoals,
    mentorExtra,
  } = data;

  const isMentee = profile.role === 'mentee';

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Welcome header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-navy-900">
              {greeting(profile.first_name)}
            </h1>
            {mentorExtra?.isFoundingMentor && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Award className="w-3 h-3" />
                Founding Mentor
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            {isMentee
              ? 'Your mentorship dashboard — goals, sessions, and connections.'
              : 'Your mentoring overview — requests, mentees, and impact.'}
          </p>
        </div>

        {isMentee && (
          <Link
            href="/discover"
            className="hidden sm:inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-navy-800 transition-colors"
          >
            <Search className="w-4 h-4" />
            Find mentors
          </Link>
        )}
        {!isMentee && pendingRequests > 0 && (
          <Link
            href="/requests"
            className="hidden sm:inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-navy-800 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            {pendingRequests} pending {pendingRequests === 1 ? 'request' : 'requests'}
          </Link>
        )}
      </div>

      {/* ── Mentor impact strip ──────────────────────────────────────────── */}
      {!isMentee && mentorExtra && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-navy-900 rounded-2xl p-4 col-span-1">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{mentorExtra.totalMenteesEver}</p>
            <p className="text-xs text-navy-300 mt-0.5">
              {mentorExtra.totalMenteesEver === 1 ? 'Mentee' : 'Mentees'} mentored
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="w-7 h-7 bg-navy-50 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-3.5 h-3.5 text-navy-600" />
            </div>
            <p className="text-2xl font-bold text-navy-900">{mentorExtra.totalHours}h</p>
            <p className="text-xs text-gray-500 mt-0.5">Hours invested</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
              <Star className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-navy-900">
              {mentorExtra.avgRating ? mentorExtra.avgRating.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Avg rating ({mentorExtra.reviewCount})
            </p>
          </div>
          <Link
            href="/impact"
            className="group bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between hover:border-navy-200 hover:shadow-sm transition-all"
          >
            <div className="w-7 h-7 bg-navy-50 rounded-lg flex items-center justify-center mb-3">
              <BarChart2 className="w-3.5 h-3.5 text-navy-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Full impact</p>
              <p className="text-xs text-navy-500 group-hover:text-navy-700 transition-colors">
                View timeline →
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* ── Capacity bar (mentor) ────────────────────────────────────────── */}
      {!isMentee && mentorExtra && (
        <CapacityBar
          active={activeMentorships}
          max={mentorExtra.maxMentees}
        />
      )}

      {/* ── Shared stat grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={pendingRequests}
          label="Pending Requests"
          icon={ClipboardList}
          href="/requests"
        />
        <StatCard
          value={activeMentorships}
          label="Active Mentorships"
          icon={Handshake}
          href={isMentee ? '/mentorships' : '/mentees'}
          color="green"
        />
        <StatCard
          value={totalSessions}
          label="Sessions Completed"
          icon={TrendingUp}
          href="/schedule"
          color="amber"
        />
        <StatCard
          value={activeGoals}
          label="Active Goals"
          icon={Target}
          href="/goals"
        />
      </div>

      {/* ── Upcoming sessions + recent messages ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-navy-900">
              Upcoming Sessions
            </h2>
            <Link
              href="/schedule"
              className="text-sm text-navy-600 hover:text-navy-900 font-medium"
            >
              View all
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">No upcoming sessions</p>
              <Link
                href="/schedule"
                className="text-sm text-navy-600 font-medium hover:underline"
              >
                Schedule a session →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:opacity-80 transition-opacity"
                >
                  <div>
                    <p className="text-sm font-medium text-navy-900">
                      {s.partner_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(s.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        s.session_type === 'video'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {s.session_type}
                    </span>
                    {!isMentee && (
                      <span className="text-xs text-navy-500 font-medium">
                        Brief →
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-navy-900">
              Recent Messages
            </h2>
            <Link
              href="/messages"
              className="text-sm text-navy-600 hover:text-navy-900 font-medium"
            >
              View all
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {activeMentorships > 0
                  ? 'No new messages'
                  : 'No active mentorships yet'}
              </p>
              {isMentee && activeMentorships === 0 && (
                <Link
                  href="/discover"
                  className="text-sm text-navy-600 font-medium hover:underline"
                >
                  Find a mentor →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg, i) => (
                <Link
                  key={i}
                  href={`/messages?mentorshipId=${msg.mentorship_id}`}
                  className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-navy-700">
                      {msg.sender_name[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-navy-900">
                        {msg.sender_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {msg.content}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CTA for new users ────────────────────────────────────────────── */}
      {activeMentorships === 0 && (
        <div className="bg-navy-900 rounded-2xl p-6 text-white">
          <h2 className="text-base font-semibold mb-1">
            {isMentee ? 'Find your first mentor' : 'Start accepting mentees'}
          </h2>
          <p className="text-navy-300 text-sm mb-5 font-light">
            {isMentee
              ? 'Browse 500+ mentors at top firms — all verified professionals ready to help.'
              : 'Your profile is live. Complete your availability and start accepting requests.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {isMentee ? (
              <>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 bg-white text-navy-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Browse mentors
                </Link>
                <Link
                  href="/profile/setup"
                  className="inline-flex items-center gap-2 border border-navy-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
                >
                  Complete profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/requests"
                  className="inline-flex items-center gap-2 bg-white text-navy-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  View requests
                </Link>
                <Link
                  href="/schedule"
                  className="inline-flex items-center gap-2 border border-navy-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
                >
                  Set availability
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
