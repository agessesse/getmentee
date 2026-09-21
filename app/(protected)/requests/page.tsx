'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ClipboardList, CheckCircle } from 'lucide-react';
import RequestCard from '@/components/requests/RequestCard';
import Spinner from '@/components/ui/Spinner';
import { FORMER_MEMBER } from '@/lib/display-name';

type Status = 'pending' | 'approved' | 'declined';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyRequestsState({ tab, userRole }: { tab: Status; userRole: 'mentor' | 'mentee' }) {
  const config = {
    pending: {
      mentor: {
        title: 'No pending requests',
        body: 'When a mentee reaches out to you, their request will appear here for you to review.',
        cta: null,
      },
      mentee: {
        title: 'No pending requests',
        body: 'Find a mentor and send a request to get started. Mentors typically respond within a few days.',
        cta: { label: 'Browse mentors', href: '/discover' },
      },
    },
    approved: {
      mentor: {
        title: 'No approved requests',
        body: 'Requests you have approved will show here. Approved mentorships move to the Mentorships page.',
        cta: { label: 'View mentorships', href: '/mentorships' },
      },
      mentee: {
        title: 'No approved requests yet',
        body: 'Once a mentor accepts your request, it will appear here and your mentorship begins.',
        cta: { label: 'View mentorships', href: '/mentorships' },
      },
    },
    declined: {
      mentor: {
        title: 'No declined requests',
        body: 'Requests you have declined are recorded here for reference.',
        cta: null,
      },
      mentee: {
        title: 'No declined requests',
        body: 'If a mentor is unable to take you on, their response will appear here.',
        cta: null,
      },
    },
  };

  const { title, body, cta } = config[tab][userRole];

  return (
    <div className="bg-white rounded-2xl border border-halo-rule p-12 flex flex-col items-center text-center">
      <div className="w-11 h-11 bg-halo-veil rounded-xl flex items-center justify-center mb-4">
        <ClipboardList className="w-5 h-5 text-halo-mist" />
      </div>
      <p className="text-sm font-medium text-halo-ink mb-1">{title}</p>
      <p className="text-sm text-halo-mist-body max-w-xs leading-relaxed">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-flex items-center gap-2 bg-halo-purple text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

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
  // Mentee context fields for mentor's pending view
  menteeHeadline?: string | null;
  menteeUniversity?: string | null;
  menteeBio?: string | null;
  menteeExperienceLevel?: string | null;
}

interface CapacityInfo {
  activeMentees: number;
  maxMentees: number;
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
  // The dashboard links straight to one request. Land on it rather than on a
  // list the mentor has to re-scan.
  const focusId = useSearchParams().get('request');
  const focusRef = useRef<HTMLDivElement | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [userId, setUserId] = useState('');
  const [tab, setTab] = useState<Status>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [recentlyApproved, setRecentlyApproved] = useState<{ name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

      await fetchRequests(uid, role, 'pending');

      if (role === 'mentor') {
        const [mpRes, activeRes] = await Promise.all([
          supabase
            .from('mentor_profiles')
            .select('max_mentees')
            .eq('id', uid)
            .single(),
          supabase
            .from('mentorships')
            .select('id', { count: 'exact', head: true })
            .eq('mentor_id', uid)
            .eq('status', 'active'),
        ]);
        setCapacity({
          activeMentees: activeRes.count ?? 0,
          maxMentees: mpRes.data?.max_mentees ?? 3,
        });
      }

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
      .select('id, mentee_id, mentor_id, status, goals, message, created_at')
      .eq(field, uid)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (!data) return;

    const partnerIds = data.map((r) => r[partnerField as 'mentor_id' | 'mentee_id']);
    const { data: partners } = await supabase
      .from('public_profiles')
      .select('id, first_name, last_name, avatar_url, headline, university')
      .in('id', partnerIds);

    const partnerMap = new Map(partners?.map((p) => [p.id, p]) ?? []);

    // For mentor pending tab: also fetch mentee_profiles for context
    let menteeProfileMap = new Map<string, { bio?: string; experience_level?: string }>();
    if (role === 'mentor' && status === 'pending') {
      const menteeIds = data.map((r) => r.mentee_id);
      const { data: menteeProfiles } = await supabase
        .from('mentee_profiles')
        .select('id, bio, experience_level')
        .in('id', menteeIds);
      menteeProfileMap = new Map(
        (menteeProfiles ?? []).map((mp) => [
          mp.id,
          { bio: mp.bio, experience_level: mp.experience_level },
        ])
      );
    }

    setRequests(
      data.map((r) => {
        const pid = r[partnerField as 'mentor_id' | 'mentee_id'];
        const partner = partnerMap.get(pid) ?? {
          id: pid,
          first_name: FORMER_MEMBER,
          last_name: '',
          avatar_url: null,
          headline: null,
          university: null,
        };
        const mp = menteeProfileMap.get(r.mentee_id);
        return {
          ...r,
          status: r.status as Status,
          partner: {
            id: partner.id,
            first_name: partner.first_name,
            last_name: partner.last_name,
            avatar_url: partner.avatar_url,
          },
          menteeHeadline: partner.headline ?? null,
          menteeUniversity: partner.university ?? null,
          menteeBio: mp?.bio ?? null,
          menteeExperienceLevel: mp?.experience_level ?? null,
        };
      })
    );
  }

  async function handleTabChange(newStatus: Status) {
    setTab(newStatus);
    setLoading(true);
    await fetchRequests(userId, userRole, newStatus);
    setLoading(false);
  }

  async function updateRequestStatus(
    requestId: string,
    newStatus: Status,
    // menteeId/mentorId are no longer sent for approvals. The database reads
    // the mentee from the request itself (0018), so it cannot be chosen by the
    // caller — that was the forged-mentorship path.
    _menteeId?: string,
    _mentorId?: string
  ) {
    setActionLoadingId(requestId);
    setActionError(null);
    const supabase = createClient();

    if (newStatus === 'approved') {
      // One transaction: the status flip and the mentorship insert commit or
      // fail together. Previously these were two separate writes, so a failed
      // insert left the request approved with no mentorship and no way to
      // retry, because it was no longer pending.
      const { error: rpcError } = await supabase.rpc(
        'approve_mentorship_request',
        { p_request_id: requestId }
      );

      if (rpcError) {
        setActionError(
          rpcError.message.includes('capacity')
            ? 'You have reached your mentee capacity.'
            : 'Something went wrong. Please try again.'
        );
        setActionLoadingId(null);
        return;
      }

      if (capacity) {
        setCapacity((prev) =>
          prev ? { ...prev, activeMentees: prev.activeMentees + 1 } : prev
        );
      }
      // Show confirmation banner
      const approved = requests.find((r) => r.id === requestId);
      if (approved) {
        setRecentlyApproved({
          name: `${approved.partner.first_name} ${approved.partner.last_name}`,
        });
        setTimeout(() => setRecentlyApproved(null), 6000);
      }
    } else {
      // Declining creates no mentorship, so it stays a plain status update.
      // 0018 restricts this table's UPDATE grant to the status column.
      const { error: updateError } = await supabase
        .from('mentorship_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (updateError) {
        setActionError('Something went wrong. Please try again.');
        setActionLoadingId(null);
        return;
      }
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setActionLoadingId(null);
  }

  async function withdrawRequest(requestId: string) {
    setActionLoadingId(requestId);
    const supabase = createClient();
    await supabase
      .from('mentorship_requests')
      .delete()
      .eq('id', requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setActionLoadingId(null);
  }

  // Bring the linked request into view once the list has rendered. Scrolling
  // is skipped for anyone who has asked the system for less motion.
  useEffect(() => {
    if (!focusId || loading || !focusRef.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    focusRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }, [focusId, loading, requests]);

  const tabs = userRole === 'mentee' ? MENTEE_TABS : MENTOR_TABS;
  const isFull = capacity ? capacity.activeMentees >= capacity.maxMentees : false;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
          {userRole === 'mentor' ? 'Requests' : 'Your requests'}
        </h1>
        <p className="text-halo-mist-body mt-1 text-sm">
          {userRole === 'mentor'
            ? 'Students who have asked to work with you.'
            : 'Mentors you have asked to work with.'}
        </p>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-medium text-red-700">{actionError}</p>
          <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Dismiss</button>
        </div>
      )}

      {/* Post-approval confirmation banner */}
      {recentlyApproved && (
        <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              You&apos;re now mentoring {recentlyApproved.name}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              The mentorship has started.{' '}
              <Link href="/mentorships" className="underline font-medium hover:text-green-800">
                View in Mentorships
              </Link>{' '}
              or{' '}
              <Link href="/messages" className="underline font-medium hover:text-green-800">
                send them a message
              </Link>.
            </p>
          </div>
        </div>
      )}

      {/*
        What the mentor chose, stated as a fact.

        This was a utilisation meter: a bar that filled up, turned amber at 75%
        and red at 100%, beside the words "Capacity", "Nearly full", "Full" and
        "You're at capacity... until a slot opens". It framed students as load
        and the mentor as a resource being used up, which is the one framing
        this product does not want. The number is still useful — the mentor set
        it themselves — so it stays, as a sentence.
      */}
      {capacity && (
        <div className="mb-6 bg-white rounded-2xl border border-halo-rule px-5 py-4">
          <p className="text-sm text-halo-ink leading-relaxed">
            {capacity.activeMentees === 0
              ? `You said you'd work with up to ${capacity.maxMentees} ${capacity.maxMentees === 1 ? 'student' : 'students'} at a time.`
              : isFull
                ? `You're working with ${capacity.activeMentees} ${capacity.activeMentees === 1 ? 'student' : 'students'}, the number you chose. You can take on more, or come back to a request later.`
                : `You're working with ${capacity.activeMentees} of the ${capacity.maxMentees} students you said you'd take on.`}
          </p>
          <Link href="/profile/setup" className="inline-block mt-1.5 text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors">
            Change this →
          </Link>
        </div>
      )}

      {/*
        Tabs, weighted by what someone actually came here to do.

        All three used to sit at equal weight, so a mentor scanning for the one
        request that needs an answer had to read past two archives to find it.
        The live tab now leads; Approved and Declined move right as history,
        still one click away and still holding every record. Nothing is
        deleted, and neither archive is hidden behind a menu.
      */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-halo-rule mb-6">
        <div className="flex">
          {tabs.filter(({ status }) => status === 'pending').map(({ label, status }) => (
            <button
              key={status}
              onClick={() => handleTabChange(status)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                tab === status
                  ? 'border-halo-purple text-halo-purple-d'
                  : 'border-transparent text-halo-mist-body hover:text-halo-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pb-1.5">
          <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body pr-1">
            History
          </span>
          {tabs.filter(({ status }) => status !== 'pending').map(({ label, status }) => (
            <button
              key={status}
              onClick={() => handleTabChange(status)}
              aria-pressed={tab === status}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                tab === status
                  ? 'bg-halo-veil text-halo-purple-d border border-halo-lavender'
                  : 'text-halo-mist-body hover:text-halo-ink border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyRequestsState tab={tab} userRole={userRole} />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              id={`request-${req.id}`}
              ref={req.id === focusId ? focusRef : undefined}
              className={req.id === focusId ? 'rounded-2xl ring-2 ring-halo-purple ring-offset-4 ring-offset-halo-ivory' : undefined}
            >
            <RequestCard
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
              menteeHeadline={req.menteeHeadline}
              menteeUniversity={req.menteeUniversity}
              menteeBio={req.menteeBio}
              menteeExperienceLevel={req.menteeExperienceLevel}
              onApprove={() =>
                updateRequestStatus(
                  req.id,
                  'approved',
                  req.mentee_id,
                  req.mentor_id
                )
              }
              onDecline={() => updateRequestStatus(req.id, 'declined')}
              onCancel={() => withdrawRequest(req.id)}
            />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
