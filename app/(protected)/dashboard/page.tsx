'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ClipboardList, Handshake, Calendar, ArrowRight, TrendingUp, MessageSquare, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

interface DashboardData {
  profile: { first_name: string; role: 'mentor' | 'mentee' };
  pendingRequests: number;
  activeMentorships: number;
  totalSessions: number;
  upcomingSessions: Array<{ id: string; scheduled_at: string; session_type: string; partner_name: string }>;
  recentMessages: Array<{ mentorship_id: string; content: string; sender_name: string; created_at: string }>;
  activeGoals: number;
}

function StatCard({ value, label, icon: Icon, href, color = 'navy' }: {
  value: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color?: string;
}) {
  const bg = color === 'green' ? 'bg-green-50' : color === 'amber' ? 'bg-amber-50' : 'bg-navy-50';
  const iconColor = color === 'green' ? 'text-green-600' : color === 'amber' ? 'text-amber-600' : 'text-navy-600';
  return (
    <Link href={href} className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:border-navy-200 hover:shadow-sm transition-all">
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const [profileRes, requestsRes, mentorshipsRes, sessionsRes, goalsRes] = await Promise.all([
        supabase.from('profiles').select('first_name, role').eq('id', uid).single(),
        supabase.from('mentorship_requests').select('id', { count: 'exact', head: true }).or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`).eq('status', 'pending'),
        supabase.from('mentorships').select('id', { count: 'exact', head: true }).or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`).eq('status', 'active'),
        supabase.from('sessions').select('id', { count: 'exact', head: true }).or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`).eq('status', 'completed'),
        supabase.from('mentorship_goals').select('id', { count: 'exact', head: true }).eq('created_by', uid).eq('status', 'active'),
      ]);

      const role = profileRes.data?.role as 'mentor' | 'mentee';

      // Upcoming sessions
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
          const partnerId = s.mentor_id === uid ? s.mentee_id : s.mentor_id;
          const { data: partner } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', partnerId)
            .single();
          return {
            id: s.id,
            scheduled_at: s.scheduled_at,
            session_type: s.session_type,
            partner_name: partner ? `${partner.first_name} ${partner.last_name}` : 'Unknown',
          };
        })
      );

      // Recent messages
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
          const senderMap = new Map(senders?.map((s) => [s.id, `${s.first_name} ${s.last_name}`]) ?? []);
          recentMessages = msgs.map((m) => ({
            mentorship_id: m.mentorship_id,
            content: m.content,
            sender_name: senderMap.get(m.sender_id) ?? 'Unknown',
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, pendingRequests, activeMentorships, totalSessions, upcomingSessions, recentMessages, activeGoals } = data;
  const isMentee = profile.role === 'mentee';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Good morning, {profile.first_name}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isMentee
              ? 'Your mentorship dashboard — goals, sessions, and connections.'
              : 'Your mentoring overview — requests, mentees, and sessions.'}
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

      {/* Stats grid */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-navy-900">Upcoming Sessions</h2>
            <Link href="/schedule" className="text-sm text-navy-600 hover:text-navy-900 font-medium">
              View all
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">No upcoming sessions</p>
              <Link href="/schedule" className="text-sm text-navy-600 font-medium hover:underline">
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
                    <p className="text-sm font-medium text-navy-900">{s.partner_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(s.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.session_type === 'video' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.session_type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-navy-900">Recent Messages</h2>
            <Link href="/messages" className="text-sm text-navy-600 hover:text-navy-900 font-medium">
              View all
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {activeMentorships > 0 ? 'No new messages' : 'No active mentorships yet'}
              </p>
              {isMentee && activeMentorships === 0 && (
                <Link href="/discover" className="text-sm text-navy-600 font-medium hover:underline">
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
                      <p className="text-sm font-medium text-navy-900">{msg.sender_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{msg.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions for new users */}
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
