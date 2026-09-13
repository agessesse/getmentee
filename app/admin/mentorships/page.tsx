import Link from 'next/link';
import { requireAdmin, rows } from '@/lib/supabase/admin';
import { Panel, Empty, Tag, Th, Td, Stat } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

interface Mship {
  id: string; mentor_id: string; mentee_id: string; status: string;
  started_at: string; sessions_count: number;
}
interface Req {
  id: string; mentor_id: string; mentee_id: string; status: string;
  created_at: string; goals: string | null;
}
interface Sess { id: string; mentorship_id: string; status: string; scheduled_at: string }
interface Person { id: string; first_name: string | null; last_name: string | null }

const DAY = 86_400_000;
const name = (m: Map<string, Person>, id: string) => {
  const p = m.get(id);
  return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unknown' : 'Unknown';
};

export default async function AdminMentorships({
  searchParams,
}: { searchParams: Promise<{ tab?: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return null;
  const { db } = gate;
  const tab = (await searchParams).tab === 'requests' ? 'requests' : 'active';

  const [mships, reqs] = await Promise.all([
    rows<Mship>(db.from('mentorships')
      .select('id, mentor_id, mentee_id, status, started_at, sessions_count')
      .order('started_at', { ascending: false }).limit(200)),
    rows<Req>(db.from('mentorship_requests')
      .select('id, mentor_id, mentee_id, status, created_at, goals')
      .order('created_at', { ascending: false }).limit(200)),
  ]);

  const ids = [...new Set([...mships.flatMap((m) => [m.mentor_id, m.mentee_id]),
                           ...reqs.flatMap((r) => [r.mentor_id, r.mentee_id])])];
  const people = new Map(
    (ids.length
      ? await rows<Person>(db.from('profiles').select('id, first_name, last_name').in('id', ids))
      : []).map((p) => [p.id, p])
  );

  const mshipIds = mships.map((m) => m.id);
  const sessions = mshipIds.length
    ? await rows<Sess>(db.from('sessions').select('id, mentorship_id, status, scheduled_at').in('mentorship_id', mshipIds))
    : [];
  const byMship = new Map<string, Sess[]>();
  for (const s of sessions) {
    const list = byMship.get(s.mentorship_id) ?? [];
    list.push(s); byMship.set(s.mentorship_id, list);
  }

  const now = Date.now();

  /**
   * "Stalled" is defined only from fields that exist, and each rule is stated
   * on screen so the number is auditable rather than a black box.
   */
  const stalledNoSession = mships.filter(
    (m) => m.status === 'active' && (byMship.get(m.id)?.length ?? 0) === 0 && now - Date.parse(m.started_at) > 14 * DAY
  );
  const stalledNoUpcoming = mships.filter((m) => {
    if (m.status !== 'active') return false;
    const list = byMship.get(m.id) ?? [];
    if (list.length === 0) return false;
    return !list.some((s) => s.status === 'scheduled' && Date.parse(s.scheduled_at) > now);
  });
  const stalePending = reqs.filter(
    (r) => r.status === 'pending' && now - Date.parse(r.created_at) > 7 * DAY
  );

  const activeList = mships.filter((m) => m.status === 'active');
  const rowsToShow = tab === 'requests' ? reqs : activeList;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold text-navy-900">Mentorship operations</h1>
        <p className="text-[14px] text-gray-600 mt-1">
          Requested, accepted, active, completed. Most recent 200 of each.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Pending requests" value={reqs.filter((r) => r.status === 'pending').length} />
        <Stat label="Active mentorships" value={activeList.length} />
        <Stat label="Active, no session booked" value={stalledNoSession.length} sub="Started over 14 days ago" />
        <Stat label="Active, nothing upcoming" value={stalledNoUpcoming.length} sub="Met before, none scheduled" />
      </div>

      {stalePending.length > 0 && (
        <Panel title={`Requests pending over 7 days (${stalePending.length})`}>
          <ul className="divide-y divide-gray-100">
            {stalePending.slice(0, 10).map((r) => (
              <li key={r.id} className="px-4 py-2.5 text-[14px] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{name(people, r.mentee_id)}</span>
                <span className="text-gray-600">asked</span>
                <span className="font-medium">{name(people, r.mentor_id)}</span>
                <span className="ml-auto text-[13px] text-gray-700 tabular-nums">
                  {Math.floor((now - Date.parse(r.created_at)) / DAY)} days ago
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="flex gap-1" role="tablist" aria-label="Mentorship views">
        {(['active', 'requests'] as const).map((t) => (
          <Link key={t} href={`/admin/mentorships${t === 'requests' ? '?tab=requests' : ''}`}
            role="tab" aria-selected={tab === t}
            className={`px-3 py-2 text-[13px] font-medium rounded-md border ${
              tab === t ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-700 border-gray-300 hover:border-navy-300'}`}>
            {t === 'active' ? 'Active mentorships' : 'All requests'}
          </Link>
        ))}
      </div>

      <Panel title={tab === 'requests' ? `Requests (${reqs.length})` : `Active (${activeList.length})`}>
        {rowsToShow.length === 0 ? (
          <Empty>Nothing here yet.</Empty>
        ) : tab === 'requests' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr><Th>Mentee</Th><Th>Mentor</Th><Th>Status</Th><Th>Goal</Th><Th>Requested</Th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reqs.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td><Link href={`/admin/users/${r.mentee_id}`} className="hover:underline">{name(people, r.mentee_id)}</Link></Td>
                    <Td><Link href={`/admin/users/${r.mentor_id}`} className="hover:underline">{name(people, r.mentor_id)}</Link></Td>
                    <Td><Tag tone={r.status === 'pending' ? 'amber' : r.status === 'approved' ? 'green' : 'neutral'}>{r.status}</Tag></Td>
                    <Td className="text-gray-700 max-w-[280px] truncate">{r.goals || 'Not set'}</Td>
                    <Td className="text-gray-700 tabular-nums whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr><Th>Mentee</Th><Th>Mentor</Th><Th>Sessions</Th><Th>Next session</Th><Th>Started</Th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeList.map((m) => {
                  const list = byMship.get(m.id) ?? [];
                  const upcoming = list
                    .filter((s) => s.status === 'scheduled' && Date.parse(s.scheduled_at) > now)
                    .sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at))[0];
                  const done = list.filter((s) => s.status === 'completed').length;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <Td><Link href={`/admin/users/${m.mentee_id}`} className="hover:underline">{name(people, m.mentee_id)}</Link></Td>
                      <Td><Link href={`/admin/users/${m.mentor_id}`} className="hover:underline">{name(people, m.mentor_id)}</Link></Td>
                      <Td className="tabular-nums">{done} done, {list.length} total</Td>
                      <Td>
                        {upcoming
                          ? <span className="text-gray-700 tabular-nums">{new Date(upcoming.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          : <Tag tone="amber">None scheduled</Tag>}
                      </Td>
                      <Td className="text-gray-700 tabular-nums whitespace-nowrap">
                        {new Date(m.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
