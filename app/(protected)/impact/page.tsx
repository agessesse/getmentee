'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Star, Clock, Target, TrendingUp, Award, ArrowLeft,
  CheckCircle, Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentorStats {
  totalMenteesEver: number;
  activeMentees: number;
  totalSessions: number;
  totalHours: number;
  avgRating: number | null;
  reviewCount: number;
  goalsCompleted: number;
  isFoundingMentor: boolean;
  joinedAt: string;
}

interface TimelineEvent {
  id: string;
  type: 'mentorship_started' | 'session_completed' | 'goal_completed' | 'review_received';
  date: string;
  label: string;
  sub: string;
}

interface Milestone {
  label: string;
  achieved: boolean;
  threshold: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function ImpactStat({
  value,
  label,
  icon: Icon,
  accent = false,
}: {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${accent ? 'bg-navy-900 border-navy-900' : 'bg-white border-gray-100'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accent ? 'bg-white/10' : 'bg-navy-50'}`}>
        <Icon className={`w-4.5 h-4.5 ${accent ? 'text-white' : 'text-navy-600'}`} />
      </div>
      <p className={`text-3xl font-bold mb-1 ${accent ? 'text-white' : 'text-navy-900'}`}>{value}</p>
      <p className={`text-sm ${accent ? 'text-navy-300' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}

// ─── Milestone badge ──────────────────────────────────────────────────────────

function MilestoneBadge({
  label,
  achieved,
  icon: Icon,
}: {
  label: string;
  achieved: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
      achieved
        ? 'bg-green-50 border-green-200'
        : 'bg-gray-50 border-gray-100 opacity-50'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        achieved ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        <Icon className={`w-4 h-4 ${achieved ? 'text-green-600' : 'text-gray-400'}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${achieved ? 'text-green-900' : 'text-gray-500'}`}>{label}</p>
        {achieved && <p className="text-xs text-green-600 mt-0.5">Achieved</p>}
      </div>
      {achieved && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-auto" />}
    </div>
  );
}

// ─── Timeline event ───────────────────────────────────────────────────────────

const EVENT_COLOR: Record<TimelineEvent['type'], string> = {
  mentorship_started: 'bg-navy-100 text-navy-600',
  session_completed:  'bg-blue-100 text-blue-600',
  goal_completed:     'bg-green-100 text-green-600',
  review_received:    'bg-amber-100 text-amber-600',
};

const EVENT_ICON: Record<TimelineEvent['type'], React.ComponentType<{ className?: string }>> = {
  mentorship_started: Users,
  session_completed:  Calendar,
  goal_completed:     Target,
  review_received:    Star,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImpactPage() {
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      // Verify this user is a mentor
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, created_at')
        .eq('id', uid)
        .single();

      if (profile?.role !== 'mentor') { setLoading(false); return; }

      // Mentor profile fields
      const { data: mp } = await supabase
        .from('mentor_profiles')
        .select('rating, review_count, is_founding_mentor')
        .eq('id', uid)
        .single();

      // All mentorships (ever, not just active)
      const { data: allMentorships } = await supabase
        .from('mentorships')
        .select('id, mentee_id, status, started_at')
        .eq('mentor_id', uid);

      const activeMentorships = (allMentorships ?? []).filter((m) => m.status === 'active');

      // Sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, scheduled_at, duration_minutes, status, mentorship_id')
        .eq('mentor_id', uid)
        .eq('status', 'completed');

      const totalHours = Math.round(
        ((sessions ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 60), 0)) / 60
      );

      // Completed goals across all mentorships
      const mentorshipIds = (allMentorships ?? []).map((m) => m.id);
      let goalsCompleted = 0;
      if (mentorshipIds.length > 0) {
        const { count } = await supabase
          .from('mentorship_goals')
          .select('id', { count: 'exact', head: true })
          .in('mentorship_id', mentorshipIds)
          .eq('status', 'completed');
        goalsCompleted = count ?? 0;
      }

      setStats({
        totalMenteesEver: new Set((allMentorships ?? []).map((m) => m.mentee_id)).size,
        activeMentees: activeMentorships.length,
        totalSessions: sessions?.length ?? 0,
        totalHours,
        avgRating: mp?.rating ? Number(mp.rating) : null,
        reviewCount: mp?.review_count ?? 0,
        goalsCompleted,
        isFoundingMentor: mp?.is_founding_mentor ?? false,
        joinedAt: profile.created_at,
      });

      // ── Build timeline ──────────────────────────────────────────────────────
      const events: TimelineEvent[] = [];

      // Mentorships started
      for (const m of allMentorships ?? []) {
        const menteeRes = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', m.mentee_id)
          .single();
        const name = menteeRes.data
          ? `${menteeRes.data.first_name} ${menteeRes.data.last_name}`
          : 'a mentee';
        events.push({
          id: `ms-${m.id}`,
          type: 'mentorship_started',
          date: m.started_at,
          label: `Started mentoring ${name}`,
          sub: m.status === 'active' ? 'Active' : m.status,
        });
      }

      // Sessions completed (last 20)
      for (const s of (sessions ?? []).slice(0, 20)) {
        events.push({
          id: `sess-${s.id}`,
          type: 'session_completed',
          date: s.scheduled_at,
          label: 'Session completed',
          sub: `${s.duration_minutes ?? 60} minutes`,
        });
      }

      // Goals completed
      if (mentorshipIds.length > 0) {
        const { data: completedGoals } = await supabase
          .from('mentorship_goals')
          .select('id, title, completed_at')
          .in('mentorship_id', mentorshipIds)
          .eq('status', 'completed')
          .not('completed_at', 'is', null)
          .limit(15);

        for (const g of completedGoals ?? []) {
          events.push({
            id: `goal-${g.id}`,
            type: 'goal_completed',
            date: g.completed_at!,
            label: `Goal completed: ${g.title}`,
            sub: '',
          });
        }
      }

      // Sort descending
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimeline(events.slice(0, 30));
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

  if (!stats) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400">This page is only available to mentors.</p>
        <Link href="/dashboard" className="text-sm text-navy-600 hover:underline mt-3 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const milestones: Milestone[] = [
    { label: 'First mentee',         achieved: stats.totalMenteesEver >= 1,  threshold: 1,  unit: 'mentee',   icon: Users   },
    { label: '5 mentees mentored',   achieved: stats.totalMenteesEver >= 5,  threshold: 5,  unit: 'mentees',  icon: Users   },
    { label: '10 mentees mentored',  achieved: stats.totalMenteesEver >= 10, threshold: 10, unit: 'mentees',  icon: Users   },
    { label: 'First session',        achieved: stats.totalSessions >= 1,     threshold: 1,  unit: 'session',  icon: Calendar },
    { label: '10 sessions',          achieved: stats.totalSessions >= 10,    threshold: 10, unit: 'sessions', icon: Calendar },
    { label: '25 sessions',          achieved: stats.totalSessions >= 25,    threshold: 25, unit: 'sessions', icon: Calendar },
    { label: '10 hours mentoring',   achieved: stats.totalHours >= 10,       threshold: 10, unit: 'hours',    icon: Clock   },
    { label: '50 hours mentoring',   achieved: stats.totalHours >= 50,       threshold: 50, unit: 'hours',    icon: Clock   },
    { label: 'First goal completed', achieved: stats.goalsCompleted >= 1,    threshold: 1,  unit: 'goal',     icon: Target  },
    { label: '5 goals completed',    achieved: stats.goalsCompleted >= 5,    threshold: 5,  unit: 'goals',    icon: Target  },
  ];

  const achievedCount = milestones.filter((m) => m.achieved).length;

  return (
    <div className="max-w-4xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">My Impact</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Your mentoring history and the difference you&apos;ve made.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {stats.isFoundingMentor && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <Award className="w-3.5 h-3.5" />
                Founding Mentor
              </span>
            )}
            <span className="text-xs text-gray-400">
              Mentoring since {format(new Date(stats.joinedAt), 'MMMM yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-1 lg:col-span-2">
          <ImpactStat
            value={stats.totalMenteesEver}
            label={stats.totalMenteesEver === 1 ? 'Mentee mentored' : 'Mentees mentored'}
            icon={Users}
            accent
          />
        </div>
        <ImpactStat
          value={stats.totalSessions}
          label="Sessions completed"
          icon={Calendar}
        />
        <ImpactStat
          value={`${stats.totalHours}h`}
          label="Hours invested"
          icon={Clock}
        />
        <ImpactStat
          value={stats.goalsCompleted}
          label="Goals completed"
          icon={Target}
        />
        <ImpactStat
          value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
          label={`Avg rating (${stats.reviewCount} reviews)`}
          icon={Star}
        />
        <ImpactStat
          value={stats.activeMentees}
          label="Active mentees"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recognition milestones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-navy-900">Milestones</h2>
            <span className="text-xs text-gray-400">
              {achievedCount}/{milestones.length} achieved
            </span>
          </div>
          <div className="space-y-2">
            {milestones.map((m) => (
              <MilestoneBadge
                key={m.label}
                label={m.label}
                achieved={m.achieved}
                icon={m.icon}
              />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-base font-semibold text-navy-900 mb-4">Timeline</h2>
          {timeline.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-400">
                Your mentoring journey will appear here as you start sessions and reach goals.
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {timeline.map((event, i) => {
                const Icon = EVENT_ICON[event.type];
                const color = EVENT_COLOR[event.type];
                const isLast = i === timeline.length - 1;
                return (
                  <div key={event.id} className="flex gap-4">
                    {/* Stem */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 z-10 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    {/* Content */}
                    <div className="pb-5 min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-900 leading-tight">{event.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                        </p>
                        {event.sub && (
                          <>
                            <span className="text-gray-200">·</span>
                            <p className="text-xs text-gray-400 capitalize">{event.sub}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
