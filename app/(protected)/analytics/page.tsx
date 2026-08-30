'use client';

import { useEffect, useState } from 'react';
import { Users, Award, Star, Clock, Calendar, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatCard from '@/components/analytics/StatCard';
import GoalProgressBar from '@/components/analytics/GoalProgressBar';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface MenteeStats {
  sessionsCompleted: number;
  goals: string[];
  totalMinutes: number;
}

interface MentorStats {
  menteesCount: number;
  sessionsCount: number;
  avgRating: number;
  reviewCount: number;
}

export default function AnalyticsPage() {
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [menteeStats, setMenteeStats] = useState<MenteeStats | null>(null);
  const [mentorStats, setMentorStats] = useState<MentorStats | null>(null);
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

      if (role === 'mentee') {
        const [sessionsRes, profileRes] = await Promise.all([
          supabase
            .from('sessions')
            .select('duration_minutes')
            .eq('mentee_id', uid)
            .eq('status', 'completed'),
          supabase
            .from('mentee_profiles')
            .select('goals')
            .eq('id', uid)
            .single(),
        ]);

        const totalMinutes = (sessionsRes.data ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

        setMenteeStats({
          sessionsCompleted: sessionsRes.data?.length ?? 0,
          goals: profileRes.data?.goals ?? [],
          totalMinutes,
        });
      } else {
        const [mentorProfileRes, menteesRes, sessionsRes] = await Promise.all([
          supabase
            .from('mentor_profiles')
            .select('rating, review_count')
            .eq('id', uid)
            .single(),
          supabase
            .from('mentorships')
            .select('id', { count: 'exact', head: true })
            .eq('mentor_id', uid),
          supabase
            .from('sessions')
            .select('id', { count: 'exact', head: true })
            .eq('mentor_id', uid)
            .eq('status', 'completed'),
        ]);

        setMentorStats({
          menteesCount: menteesRes.count ?? 0,
          sessionsCount: sessionsRes.count ?? 0,
          avgRating: mentorProfileRes.data?.rating ?? 0,
          reviewCount: mentorProfileRes.data?.review_count ?? 0,
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Progress Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {userRole === 'mentor'
            ? 'Your mentoring impact at a glance.'
            : 'Track your mentorship journey.'}
        </p>
      </div>

      {userRole === 'mentee' && menteeStats && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Calendar}
              value={menteeStats.sessionsCompleted}
              label="Sessions Completed"
            />
            <StatCard
              icon={Clock}
              value={`${Math.round(menteeStats.totalMinutes / 60)}h`}
              label="Time Invested"
              sub={`${menteeStats.totalMinutes} minutes total`}
            />
          </div>

          {menteeStats.goals.length > 0 && (
            <Card>
              <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-navy-600" /> Goals
              </h2>
              <div className="space-y-4">
                {menteeStats.goals.map((goal, i) => (
                  <GoalProgressBar
                    key={i}
                    goal={goal}
                    progress={Math.min(menteeStats.sessionsCompleted, i + 1)}
                    total={3}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Progress reflects sessions completed toward each goal.
              </p>
            </Card>
          )}
        </>
      )}

      {userRole === 'mentor' && mentorStats && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Users}
            value={mentorStats.menteesCount}
            label="Mentees Helped"
          />
          <StatCard
            icon={Calendar}
            value={mentorStats.sessionsCount}
            label="Sessions Conducted"
          />
          <StatCard
            icon={Star}
            value={mentorStats.avgRating > 0 ? mentorStats.avgRating.toFixed(1) : '—'}
            label="Average Rating"
            sub={`${mentorStats.reviewCount} review${mentorStats.reviewCount !== 1 ? 's' : ''}`}
          />
          <StatCard
            icon={Award}
            value={mentorStats.reviewCount}
            label="Reviews Received"
          />
        </div>
      )}
    </div>
  );
}
