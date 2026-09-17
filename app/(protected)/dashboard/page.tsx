'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/lib/profile-context';
import {
  Search, ClipboardList, Handshake, Calendar, ArrowRight,
  TrendingUp, MessageSquare, Target, Lightbulb,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { FORMER_MEMBER, displayName } from '@/lib/display-name';
import MentorDashboard from '@/components/dashboard/MentorDashboard';
import MenteeCoachingCard from '@/components/dashboard/MenteeCoachingCard';

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
    : 'bg-halo-veil';
  const iconColor =
    color === 'green' ? 'text-green-600'
    : color === 'amber' ? 'text-amber-600'
    : 'text-halo-purple-d';
  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl border border-halo-rule p-5 hover:border-halo-lavender hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <ArrowRight className="w-4 h-4 text-halo-mist group-hover:text-halo-purple-d group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="font-display font-medium text-3xl tabular-nums text-halo-ink mb-1">{value}</p>
      <p className="text-sm text-halo-mist-body">{label}</p>
    </Link>
  );
}

// ─── First-run guide (shown only when account has zero activity) ──────────────

function FirstRunGuide() {
  const steps = [
        {
          href: '/discover',
          label: 'Find a mentor',
          detail: 'Browse professionals at top firms who have chosen to invest in someone else\'s future.',
          primary: true,
        },
        {
          href: '/profile/setup',
          label: 'Complete your profile',
          detail: 'Help mentors understand your goals so they can decide whether they\'re a good fit for you.',
          primary: false,
        },
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {steps.map((step) => (
        <Link
          key={step.href}
          href={step.href}
          className={`group flex flex-col gap-3 rounded-2xl border p-5 transition-all hover:shadow-sm ${
            step.primary
              ? 'bg-halo-deep border-halo-deep hover:-translate-y-0.5 hover:shadow-lg'
              : 'bg-white border-halo-rule hover:border-halo-purple hover:-translate-y-0.5'
          }`}
        >
          <p className={`text-base font-semibold leading-snug ${step.primary ? 'text-white' : 'text-halo-ink'}`}>
            {step.label}
          </p>
          <p className={`text-sm font-light leading-relaxed flex-1 ${step.primary ? 'text-halo-lavender' : 'text-halo-mist-body'}`}>
            {step.detail}
          </p>
          <span className={`text-sm font-medium ${step.primary ? 'text-halo-lavender group-hover:text-white' : 'text-halo-purple-d group-hover:text-halo-ink'} transition-colors`}>
            {step.primary ? 'Get started →' : 'Go →'}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Mentors and mentees get different dashboards. The role is already on the
 * profile context, populated by the protected layout before this page mounts,
 * so the split costs nothing and neither side ever renders the other's data.
 * The mentor side lives in components/dashboard/MentorDashboard.tsx.
 */
export default function DashboardPage() {
  const contextProfile = useProfile();
  return contextProfile?.role === 'mentor' ? <MentorDashboard /> : <MenteeDashboard />;
}

function MenteeDashboard() {
  // Profile from context is available immediately (populated by layout before
  // this page mounts) — use it for the greeting so it renders without waiting
  // for the stats fetch to complete.
  const contextProfile = useProfile();

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
            .from('public_profiles')
            .select('first_name, last_name')
            .eq('id', partnerId)
            .single();
          return {
            id: s.id,
            scheduled_at: s.scheduled_at,
            session_type: s.session_type,
            partner_name: displayName(partner),
          };
        })
      );

      // ── Recent messages — one per mentorship thread ───────────────────────
      const { data: activeMentorshipIds } = await supabase
        .from('mentorships')
        .select('id')
        .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
        .eq('status', 'active')
        .limit(3);

      const msIds = (activeMentorshipIds ?? []).map((m) => m.id);
      let recentMessages: DashboardData['recentMessages'] = [];

      if (msIds.length > 0) {
        // Fetch the most recent message from each mentorship in parallel.
        // This gives one item per conversation thread so different contacts
        // each appear as a distinct row rather than one person filling all 3 slots.
        const perThread = await Promise.all(
          msIds.map((id) =>
            supabase
              .from('messages')
              .select('mentorship_id, content, sender_id, created_at')
              .eq('mentorship_id', id)
              .neq('sender_id', uid)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
              .then(({ data }) => data)
          )
        );

        const validMsgs = perThread.filter(
          (m): m is NonNullable<typeof m> => m !== null
        );

        if (validMsgs.length > 0) {
          const senderIds = [...new Set(validMsgs.map((m) => m.sender_id))];
          const { data: senders } = await supabase
            .from('public_profiles')
            .select('id, first_name, last_name')
            .in('id', senderIds);
          const senderMap = new Map(
            senders?.map((s) => [s.id, `${s.first_name} ${s.last_name}`]) ?? []
          );
          recentMessages = validMsgs.map((m) => ({
            mentorship_id: m.mentorship_id,
            content: m.content,
            sender_name: senderMap.get(m.sender_id) ?? FORMER_MEMBER,
            created_at: m.created_at,
          }));
        }
      }

      setData({
        profile: { first_name: profileRes.data?.first_name ?? '', role },
        pendingRequests: requestsRes.count ?? 0,
        activeMentorships: mentorshipsRes.count ?? 0,
        totalSessions: sessionsRes.count ?? 0,
        upcomingSessions,
        recentMessages,
        activeGoals: goalsRes.count ?? 0,
      });
      setLoading(false);
    }

    load();
  }, []);

  // Derive display values: prefer loaded data, fall back to context for
  // the greeting header so it renders on the first paint with no delay.
  const firstName = data?.profile.first_name ?? contextProfile?.first_name ?? '';

  // While stats are loading, show the header immediately and skeleton cards.
  if (loading) {
    return (
      <>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
                {greeting(firstName)}
              </h1>
              <p className="text-halo-mist-body mt-1 text-sm">
                Goals, sessions, and connections.
              </p>
            </div>
          </div>
          {/* Skeleton stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-halo-rule p-5 animate-pulse">
                <div className="w-9 h-9 bg-halo-bone rounded-xl mb-4" />
                <div className="h-8 w-12 bg-halo-bone rounded mb-2" />
                <div className="h-3 w-24 bg-halo-bone rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-halo-rule p-6 animate-pulse">
              <div className="h-4 w-32 bg-halo-bone rounded mb-5" />
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-halo-veil rounded-xl" />)}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-halo-rule p-6 animate-pulse">
              <div className="h-4 w-32 bg-halo-bone rounded mb-5" />
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-halo-veil rounded-xl" />)}
              </div>
            </div>
          </div>
        </div>
      </>
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
  } = data;
  const isNewUser =
    pendingRequests === 0 &&
    activeMentorships === 0 &&
    totalSessions === 0 &&
    activeGoals === 0;

  // Derive "what matters today" — first match wins
  const todayStr = new Date().toDateString();
  const sessionToday = upcomingSessions.find(
    (s) => new Date(s.scheduled_at).toDateString() === todayStr
  );
  const priorityCard = (() => {
    if (sessionToday) {
      return {
        label: `Session today with ${sessionToday.partner_name}`,
        sub: new Date(sessionToday.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        href: `/sessions/${sessionToday.id}`,
        icon: Calendar,
        color: 'blue',
      };
    }
    if (activeMentorships === 0 && !isNewUser) {
      return {
        label: 'No active mentorship yet',
        sub: 'Browse mentors and send a request to get started',
        href: '/discover',
        icon: Search,
        color: 'navy',
      };
    }
    return null;
  })();

  return (
    <>
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Welcome header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
              {greeting(profile.first_name)}
            </h1>
          </div>
          <p className="text-halo-mist-body mt-1 text-sm">
            Goals, sessions, and connections.
          </p>
        </div>

        <Link
          href="/discover"
          className="hidden sm:inline-flex items-center gap-2 bg-halo-purple text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-halo-purple-d transition-colors"
        >
          <Search className="w-4 h-4" />
          Find mentors
        </Link>
      </div>

      {/* ── Today's priority card ────────────────────────────────────────── */}
      {priorityCard && (() => {
        const Icon = priorityCard.icon;
        const bgMap: Record<string, string> = { blue: 'bg-halo-veil border-halo-lavender', amber: 'bg-amber-50 border-amber-100', navy: 'bg-halo-veil border-halo-lavender' };
        const iconMap: Record<string, string> = { blue: 'text-halo-purple-d bg-halo-lavender/50', amber: 'text-amber-600 bg-amber-100', navy: 'text-halo-purple-d bg-halo-lavender/50' };
        const textMap: Record<string, string> = { blue: 'text-halo-purple-d', amber: 'text-amber-800', navy: 'text-halo-ink' };
        return (
          <Link
            href={priorityCard.href}
            className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 hover:shadow-sm transition-all ${bgMap[priorityCard.color]}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconMap[priorityCard.color]}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${textMap[priorityCard.color]}`}>{priorityCard.label}</p>
              <p className="text-xs text-halo-mist-body mt-0.5">{priorityCard.sub}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-halo-mist-body group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        );
      })()}

      {/* ── Coaching: prepare, capture, close the loop ──────────────────────── */}
      {activeMentorships > 0 && <MenteeCoachingCard />}

      {/* ── Stat grid or first-run guide ─────────────────────────────────── */}
      {isNewUser ? (
        <FirstRunGuide />
      ) : (
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
            href="/mentorships"
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
      )}

      {/* ── Upcoming sessions + recent messages ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl border border-halo-rule p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
              Upcoming Sessions
            </h2>
            <Link
              href="/schedule"
              className="text-sm text-halo-purple-d hover:text-halo-ink font-medium"
            >
              View all
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-halo-veil rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5 text-halo-mist-body" />
              </div>
              <p className="text-sm text-halo-mist-body mb-3">No upcoming sessions</p>
              <Link
                href="/schedule"
                className="text-sm text-halo-purple-d font-medium hover:underline"
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
                  className="flex items-center justify-between py-3 border-b border-halo-veil last:border-0 hover:opacity-80 transition-opacity"
                >
                  <div>
                    <p className="text-sm font-medium text-halo-ink">
                      {s.partner_name}
                    </p>
                    <p className="text-xs text-halo-mist-body mt-0.5">
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
                          ? 'bg-halo-veil text-halo-purple-d'
                          : 'bg-halo-bone text-halo-heather'
                      }`}
                    >
                      {s.session_type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-halo-rule p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
              Recent Messages
            </h2>
            <Link
              href="/messages"
              className="text-sm text-halo-purple-d hover:text-halo-ink font-medium"
            >
              View all
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-halo-veil rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-5 h-5 text-halo-mist-body" />
              </div>
              <p className="text-sm text-halo-mist-body mb-3">
                {activeMentorships > 0
                  ? 'No new messages'
                  : 'No active mentorships yet'}
              </p>
              {activeMentorships === 0 && (
                <Link
                  href="/discover"
                  className="text-sm text-halo-purple-d font-medium hover:underline"
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
                  className="flex items-start gap-3 py-3 border-b border-halo-veil last:border-0 hover:opacity-80 transition-opacity"
                >
                  <Avatar name={msg.sender_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-halo-ink">
                        {msg.sender_name}
                      </p>
                      <p className="text-xs text-halo-mist-body">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-halo-mist-body mt-0.5 truncate">
                      {msg.content}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Opportunity Fund entry point ──────────────────────────────────── */}
      {(
        <Link
          href="/opportunities"
          className="group flex items-start gap-4 bg-white rounded-2xl border border-halo-rule p-5 hover:border-halo-lavender hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-halo-ink">Opportunity Fund</p>
              <span className="text-[11px] font-semibold font-ui uppercase tracking-[0.14em] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                Pilot
              </span>
            </div>
            <p className="text-xs text-halo-mist-body mt-0.5 leading-relaxed">
              Professional-development funding for students with demonstrated financial need. Attire, travel, networking, and more.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-halo-mist group-hover:text-halo-purple-d transition-colors flex-shrink-0 mt-3" />
        </Link>
      )}

      {/* ── CTA for new users ────────────────────────────────────────────── */}
      {activeMentorships === 0 && (
        <div
          className="relative overflow-hidden bg-halo-deep rounded-2xl p-6 sm:p-8 text-white"
          style={{ backgroundImage: 'radial-gradient(ellipse 70% 90% at 85% 0%, rgba(120,90,247,0.55) 0%, transparent 65%)' }}
        >
          <h2 className="font-display text-[1.75rem] leading-tight mb-2">
            Find your first mentor
          </h2>
          <p className="text-halo-lavender text-sm mb-5 font-light">
            Browse mentors at leading firms. Professionals ready to help you build your path.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-halo-ivory text-halo-purple-d px-5 py-3 rounded-xl text-sm font-semibold shadow-sm hover:bg-halo-lavender hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-halo-deep"
            >
              <Search className="w-4 h-4" />
              Browse mentors
            </Link>
            <Link
              href="/profile/setup"
              className="inline-flex items-center gap-2 border border-halo-lavender text-halo-ivory px-5 py-3 rounded-xl text-sm font-semibold hover:bg-halo-ivory hover:text-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-halo-deep"
            >
              Complete profile
            </Link>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
