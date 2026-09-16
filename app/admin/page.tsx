import { requireAdmin, rows, countOrNull } from '@/lib/supabase/admin';
import { Stat, Panel, Empty, Tag, Th, Td } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

function daysAgoISO(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export default async function AdminOverview() {
  const gate = await requireAdmin();
  if (!gate.ok) return null; // layout has already redirected
  const { db } = gate;

  const since7 = daysAgoISO(7);
  const since30 = daysAgoISO(30);

  const [
    users, mentors, mentees, mentorsComplete, menteesComplete,
    reqPending, reqApproved, reqDeclined,
    mshipActive, mshipCompleted,
    sessScheduled, sessCompleted, sessCancelled,
    messages, reviews, reports, feedback,
    newUsers7, newUsers30, reqs7, sessions7,
  ] = await Promise.all([
    countOrNull(db, 'profiles'),
    countOrNull(db, 'profiles', { eq: { role: 'mentor' } }),
    countOrNull(db, 'profiles', { eq: { role: 'mentee' } }),
    countOrNull(db, 'mentor_profiles', { eq: { profile_complete: 'true' } }),
    countOrNull(db, 'mentee_profiles', { eq: { profile_complete: 'true' } }),
    countOrNull(db, 'mentorship_requests', { eq: { status: 'pending' } }),
    countOrNull(db, 'mentorship_requests', { eq: { status: 'approved' } }),
    countOrNull(db, 'mentorship_requests', { eq: { status: 'declined' } }),
    countOrNull(db, 'mentorships', { eq: { status: 'active' } }),
    countOrNull(db, 'mentorships', { eq: { status: 'completed' } }),
    countOrNull(db, 'sessions', { eq: { status: 'scheduled' } }),
    countOrNull(db, 'sessions', { eq: { status: 'completed' } }),
    countOrNull(db, 'sessions', { eq: { status: 'cancelled' } }),
    countOrNull(db, 'messages'),
    countOrNull(db, 'reviews'),
    countOrNull(db, 'user_reports'),
    countOrNull(db, 'pilot_feedback'),
    countOrNull(db, 'profiles', { since: since7 }),
    countOrNull(db, 'profiles', { since: since30 }),
    countOrNull(db, 'mentorship_requests', { since: since7 }),
    countOrNull(db, 'sessions', { since: since7 }),
  ]);

  // Recent signups, for a sense of who is arriving.
  const recent = await rows<{
    id: string; first_name: string | null; last_name: string | null;
    role: 'mentor' | 'mentee'; university: string | null;
    created_at: string; is_demo: boolean;
  }>(
    db.from('profiles')
      .select('id, first_name, last_name, role, university, created_at, is_demo')
      .order('created_at', { ascending: false })
      .limit(8)
  );

  const n = (v: number | null) => v ?? 0;
  const anyRequestCount = reqPending !== null || reqApproved !== null || reqDeclined !== null;
  const totalRequests = n(reqPending) + n(reqApproved) + n(reqDeclined);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-normal text-[1.75rem] leading-tight text-halo-ink">Overview</h1>
        <p className="text-[14px] text-halo-heather mt-1">
          Live counts from the database. Windows are rolling from today.
        </p>
      </div>

      <section aria-labelledby="people-h">
        <h2 id="people-h" className="text-[12px] font-semibold font-ui uppercase tracking-[0.14em] text-halo-heather mb-2">
          People
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Total users" value={users} sub={users !== null ? `${n(newUsers7)} new in 7d, ${n(newUsers30)} in 30d` : undefined} href="/admin/users" />
          <Stat label="Mentors" value={mentors} sub={mentorsComplete !== null ? `${mentorsComplete} completed profile` : undefined} href="/admin/users?role=mentor" />
          <Stat label="Mentees" value={mentees} sub={menteesComplete !== null ? `${menteesComplete} completed profile` : undefined} href="/admin/users?role=mentee" />
          <Stat label="Reviews submitted" value={reviews} />
        </div>
      </section>

      <section aria-labelledby="funnel-h">
        <h2 id="funnel-h" className="text-[12px] font-semibold font-ui uppercase tracking-[0.14em] text-halo-heather mb-2">
          Mentorship funnel
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Requests pending" value={reqPending} sub={anyRequestCount ? `${totalRequests} total, ${n(reqs7)} in 7d` : undefined} href="/admin/mentorships?tab=requests" />
          <Stat label="Requests approved" value={reqApproved} sub={reqDeclined ? `${reqDeclined} declined` : undefined} />
          <Stat label="Active mentorships" value={mshipActive} sub={mshipCompleted !== null ? `${mshipCompleted} completed` : undefined} href="/admin/mentorships" />
          <Stat label="Messages sent" value={messages} />
        </div>
      </section>

      <section aria-labelledby="sessions-h">
        <h2 id="sessions-h" className="text-[12px] font-semibold font-ui uppercase tracking-[0.14em] text-halo-heather mb-2">
          Sessions and trust
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Sessions scheduled" value={sessScheduled} sub={sessions7 !== null ? `${sessions7} created in 7d` : undefined} />
          <Stat label="Sessions completed" value={sessCompleted} sub={sessCancelled ? `${sessCancelled} cancelled` : undefined} />
          <Stat label="Reports filed" value={reports} sub="Read-only queue" href="/admin/reports" />
          <Stat label="Pilot feedback" value={feedback} href="/admin/feedback" />
        </div>
      </section>

      <Panel title="Recent signups">
        {recent.length === 0 ? (
          <Empty>No users yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-halo-veil border-b border-halo-rule">
                <tr>
                  <Th>Name</Th><Th>Role</Th><Th>Affiliation</Th><Th>Joined</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-halo-rule">
                {recent.map((u) => (
                  <tr key={u.id} className="hover:bg-halo-veil">
                    <Td>
                      <a href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                        {u.first_name} {u.last_name}
                      </a>
                      {u.is_demo && <span className="ml-2"><Tag>Demo</Tag></span>}
                    </Td>
                    <Td><Tag tone={u.role === 'mentor' ? 'blue' : 'neutral'}>{u.role}</Tag></Td>
                    <Td className="text-halo-heather">{u.university || 'Not set'}</Td>
                    <Td className="text-halo-heather tabular-nums">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
