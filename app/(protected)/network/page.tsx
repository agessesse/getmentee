'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { MessageSquare, Calendar, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type RelationStatus = 'pending' | 'active' | 'completed' | 'declined';

interface Connection {
  id: string;
  mentorshipId: string | null;
  requestId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  partnerHeadline: string | null;
  partnerCompany: string | null;
  status: RelationStatus;
  startedAt: string | null;
  sessionsCount: number;
  lastActivity: string;
}

const STATUS_LABELS: Record<RelationStatus, string> = {
  pending: 'Requested',
  active: 'Active',
  completed: 'Completed',
  declined: 'Declined',
};

const STATUS_STYLES: Record<RelationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  active: 'bg-green-50 text-green-700',
  completed: 'bg-navy-50 text-navy-700',
  declined: 'bg-red-50 text-red-600',
};

export default function NetworkPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single();
      const role = profile?.role as 'mentor' | 'mentee';
      setUserRole(role);

      const myField = role === 'mentee' ? 'mentee_id' : 'mentor_id';
      const partnerField = role === 'mentee' ? 'mentor_id' : 'mentee_id';

      // Fetch all requests (approved ones become mentorships)
      const { data: requests } = await supabase
        .from('mentorship_requests')
        .select('id, mentee_id, mentor_id, status, created_at, updated_at')
        .eq(myField, uid)
        .order('created_at', { ascending: false });

      if (!requests) { setLoading(false); return; }

      // Fetch active mentorships
      const { data: mentorships } = await supabase
        .from('mentorships')
        .select('id, mentee_id, mentor_id, status, started_at, sessions_count')
        .eq(myField, uid);

      const mentorshipByRequest = new Map<string, typeof mentorships extends null ? never : NonNullable<typeof mentorships>[0]>();
      for (const ms of mentorships ?? []) {
        // match by partner
        mentorshipByRequest.set(`${ms.mentee_id}-${ms.mentor_id}`, ms);
      }

      const partnerIds = requests.map((r) => r[partnerField]);
      const { data: partners } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, headline')
        .in('id', partnerIds);

      const { data: mentorProfilesData } = await supabase
        .from('mentor_profiles')
        .select('id, company')
        .in('id', partnerIds);

      const partnerMap = new Map(partners?.map((p) => [p.id, p]) ?? []);
      const companyMap = new Map(mentorProfilesData?.map((m) => [m.id, m.company]) ?? []);

      const conns: Connection[] = requests.map((req) => {
        const partnerId = req[partnerField];
        const partner = partnerMap.get(partnerId);
        const msKey = role === 'mentee'
          ? `${req.mentee_id}-${req.mentor_id}`
          : `${req.mentee_id}-${req.mentor_id}`;
        const ms = mentorshipByRequest.get(msKey);

        let status: RelationStatus = req.status === 'pending' ? 'pending' : req.status === 'declined' ? 'declined' : 'active';
        if (ms && ms.status !== 'active') status = ms.status as RelationStatus;

        return {
          id: req.id,
          mentorshipId: ms?.id ?? null,
          requestId: req.id,
          partnerId,
          partnerName: partner ? `${partner.first_name} ${partner.last_name}` : 'Unknown',
          partnerAvatarUrl: partner?.avatar_url ?? null,
          partnerHeadline: partner?.headline ?? null,
          partnerCompany: companyMap.get(partnerId) ?? null,
          status,
          startedAt: ms?.started_at ?? null,
          sessionsCount: ms?.sessions_count ?? 0,
          lastActivity: ms?.started_at ?? req.updated_at ?? req.created_at,
        };
      });

      setConnections(conns);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  const active = connections.filter((c) => c.status === 'active');
  const pending = connections.filter((c) => c.status === 'pending');
  const past = connections.filter((c) => c.status === 'completed' || c.status === 'declined');

  const renderGroup = (title: string, items: Connection[]) => {
    if (items.length === 0) return null;
    return (
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {title} ({items.length})
        </h2>
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-navy-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar src={c.partnerAvatarUrl} name={c.partnerName} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/mentor/${c.partnerId}`}
                        className="text-sm font-semibold text-navy-900 hover:text-navy-600"
                      >
                        {c.partnerName}
                      </Link>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </div>
                    {c.partnerHeadline && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{c.partnerHeadline}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {c.status === 'active' && (
                        <span>{c.sessionsCount} session{c.sessionsCount !== 1 ? 's' : ''}</span>
                      )}
                      <span>
                        {c.status === 'pending' ? 'Requested ' : 'Since '}
                        {formatDistanceToNow(new Date(c.lastActivity), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {c.status === 'active' && c.mentorshipId && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/messages?mentorshipId=${c.mentorshipId}`}
                      className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-navy-900 hover:border-navy-300 transition-all"
                      title="Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/schedule"
                      className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-navy-900 hover:border-navy-300 transition-all"
                      title="Schedule"
                    >
                      <Calendar className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/mentorships`}
                      className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-navy-900 hover:border-navy-300 transition-all"
                      title="View mentorship"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Network</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {userRole === 'mentee'
            ? 'All your mentor connections and relationships.'
            : 'All your mentee connections and relationships.'}
        </p>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <p className="text-lg font-medium text-navy-900 mb-2">No connections yet</p>
          <p className="text-sm text-gray-400 mb-6">
            {userRole === 'mentee'
              ? 'Browse mentors and send your first request.'
              : 'Complete your profile to start receiving requests.'}
          </p>
          {userRole === 'mentee' && (
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
            >
              Browse mentors
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <>
          {renderGroup('Active', active)}
          {renderGroup('Pending', pending)}
          {renderGroup('Past', past)}
        </>
      )}
    </div>
  );
}
