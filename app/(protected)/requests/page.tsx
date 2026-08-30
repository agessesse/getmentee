'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RequestCard from '@/components/requests/RequestCard';
import Spinner from '@/components/ui/Spinner';

type Status = 'pending' | 'approved' | 'declined';

interface Request {
  id: string;
  mentee_id: string;
  mentor_id: string;
  status: Status;
  goals: string | null;
  message: string | null;
  created_at: string;
  partner: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

const MENTEE_TABS: { label: string; status: Status }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'Declined', status: 'declined' },
];

const MENTOR_TABS: { label: string; status: Status }[] = [
  { label: 'New Requests', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'Declined', status: 'declined' },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [userId, setUserId] = useState('');
  const [tab, setTab] = useState<Status>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single();

      const role = profile?.role as 'mentor' | 'mentee';
      setUserRole(role);

      await fetchRequests(uid, role, tab);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRequests(uid: string, role: 'mentor' | 'mentee', status: Status) {
    const supabase = createClient();
    const field = role === 'mentee' ? 'mentee_id' : 'mentor_id';
    const partnerField = role === 'mentee' ? 'mentor_id' : 'mentee_id';

    const { data } = await supabase
      .from('mentorship_requests')
      .select(`id, mentee_id, mentor_id, status, goals, message, created_at`)
      .eq(field, uid)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (!data) return;

    const partnerIds = data.map((r) => r[partnerField]);
    const { data: partners } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', partnerIds);

    const partnerMap = new Map(partners?.map((p) => [p.id, p]) ?? []);

    setRequests(
      data.map((r) => ({
        ...r,
        status: r.status as Status,
        partner: partnerMap.get(r[partnerField]) ?? { id: r[partnerField], first_name: 'Unknown', last_name: '', avatar_url: null },
      }))
    );
  }

  async function handleTabChange(newStatus: Status) {
    setTab(newStatus);
    setLoading(true);
    await fetchRequests(userId, userRole, newStatus);
    setLoading(false);
  }

  async function updateRequestStatus(requestId: string, newStatus: Status, menteeId?: string, mentorId?: string) {
    setActionLoadingId(requestId);
    const supabase = createClient();

    const { error } = await supabase
      .from('mentorship_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error && newStatus === 'approved' && menteeId && mentorId) {
      await supabase.from('mentorships').insert({
        request_id: requestId,
        mentee_id: menteeId,
        mentor_id: mentorId,
      });
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setActionLoadingId(null);
  }

  const tabs = userRole === 'mentee' ? MENTEE_TABS : MENTOR_TABS;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          {userRole === 'mentor' ? 'Mentorship Requests' : 'My Requests'}
        </h1>
        <p className="text-gray-500 mt-1">
          {userRole === 'mentor'
            ? 'Review and manage incoming mentorship requests.'
            : 'Track the status of your mentorship requests.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(({ label, status }) => (
          <button
            key={status}
            onClick={() => handleTabChange(status)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === status
                ? 'border-navy-600 text-navy-600'
                : 'border-transparent text-gray-500 hover:text-navy-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No {tab} requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              partnerFirstName={req.partner.first_name}
              partnerLastName={req.partner.last_name}
              partnerAvatarUrl={req.partner.avatar_url}
              partnerId={req.partner.id}
              status={req.status}
              goals={req.goals}
              message={req.message}
              createdAt={req.created_at}
              userRole={userRole}
              actionLoading={actionLoadingId === req.id}
              onApprove={() =>
                updateRequestStatus(req.id, 'approved', req.mentee_id, req.mentor_id)
              }
              onDecline={() => updateRequestStatus(req.id, 'declined')}
              onCancel={() => updateRequestStatus(req.id, 'declined')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
