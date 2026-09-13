import { requireAdmin, rows } from '@/lib/supabase/admin';
import { Stat, Panel, Empty, Tag, Th, Td } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

type DB = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>['db'];

/** Exact row count with no rows transferred. */
async function count(
  db: DB,
  table: string,
  opts: { eq?: Record<string, string>; since?: string } = {}
): Promise<number> {
  let q = db.from(table).select('*', { count: 'exact', head: true });
  for (const [col, val] of Object.entries(opts.eq ?? {})) q = q.eq(col, val);
  if (opts.since) q = q.gte('created_at', opts.since);
  const { count: c, error } = await q;
  return error ? 0 : (c ?? 0);
}

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
    count(db, 'profiles'),
    count(db, 'profiles', { eq: { role: 'mentor' } }),
    count(db, 'profiles', { eq: { role: 'mentee' } }),
    count(db, 'mentor_profiles', { eq: { profile_complete: 'true' } }),
    count(db, 'mentee_profiles', { eq: { profile_complete: 'true' } }),
    count(db, 'mentorship_requests', { eq: { status: 'pending' } }),
    count(db, 'mentorship_requests', { eq: { status: 'approved' } }),
    count(db, 'mentorship_requests', { eq: { status: 'declined' } }),
    count(db, 'mentorships', { eq: { status: 'active' } }),
    count(db, 'mentorships', { eq: { status: 'completed' } }),
    count(db, 'sessions', { eq: { status: 'scheduled' } }),
    count(db, 'sessions', { eq: { status: 'completed' } }),
    count(db, 'sessions', { eq: { status: 'cancelled' } }),
    count(db, 'messages'),
    count(db, 'reviews'),
    count(db, 'user_reports'),
    count(db, 'pilot_feedback'),
    count(db, 'profiles', { since: since7 }),
    count(db, 'profiles', { since: since30 }),
    count(db, 'mentorship_requests', { since: since7 }),
    count(db, 'sessions', { since: since7 }),
  ]);

  // Recent signups, for a sense of who is arriving.
  const recent = await rows<{
    id: string; first_name: string | null; last_name: string | null;
    role: 'mentor' | 'mentee'; university: string | null; company: string | null;
    created_at: string; is_demo: boolean;
  }>(
    db.from('profiles')
      .select('id, first_name, last_name, role, university, company, created_at, is_demo')
      .order('created_at', { ascending: false })
      .limit(8)
  );

  const totalRequests = reqPending + reqApproved + reqDeclined;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-navy-900">Overview</h1>
        <p className="text-[14px] text-gray-600 mt-1">
          Live counts from the database. Windows are rolling from today.
        </p>
      </div>

      <section aria-labelledby="people-h">
        <h2 id="people-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
          People
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Total users" value={users} sub={`${newUsers7} new in 7d, ${newUsers30} in 30d`} href="/admin/users" />
          <Stat label="Mentors" value={mentors} sub={`${mentorsComplete} completed profile`} href="/admin/users?role=mentor" />
          <Stat label="Mentees" value={mentees} sub={`${menteesComplete} completed profile`} href="/admin/users?role=mentee" />
          <Stat label="Reviews submitted" value={reviews} />
        </div>
      </section>

      <section aria-labelledby="funnel-h">
        <h2 id="funnel-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
          Mentorship funnel
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Requests pending" value={reqPending} sub={`${totalRequests} total, ${reqs7} in 7d`} href="/admin/mentorships?tab=requests" />
          <Stat label="Requests approved" value={reqApproved} sub={reqDeclined > 0 ? `${reqDeclined} declined` : undefined} />
          <Stat label="Active mentorships" value={mshipActive} sub={`${mshipCompleted} completed`} href="/admin/mentorships" />
          <Stat label="Messages sent" value={messages} />
        </div>
      </section>

      <section aria-labelledby="sessions-h">
        <h2 id="sessions-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
          Sessions and trust
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Sessions scheduled" value={sessScheduled} sub={`${sessions7} created in 7d`} />
          <Stat label="Sessions completed" value={sessCompleted} sub={sessCancelled > 0 ? `${sessCancelled} cancelled` : undefined} />
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <Th>Name</Th><Th>Role</Th><Th>Affiliation</Th><Th>Joined</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <Td>
                      <a href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                        {u.first_name} {u.last_name}
                      </a>
                      {u.is_demo && <span className="ml-2"><Tag>Demo</Tag></span>}
                    </Td>
                    <Td><Tag tone={u.role === 'mentor' ? 'blue' : 'neutral'}>{u.role}</Tag></Td>
                    <Td className="text-gray-700">{u.university || u.company || 'Not set'}</Td>
                    <Td className="text-gray-700 tabular-nums">
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
