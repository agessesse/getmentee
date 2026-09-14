import Link from 'next/link';
import { requireAdmin, rows, rowsOrError } from '@/lib/supabase/admin';
import { Panel, Empty, Tag, Th, Td } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

interface Report {
  id: string; reporter_id: string; reported_id: string;
  reason: string; details: string | null; context: string | null; created_at: string;
}
interface Person { id: string; first_name: string | null; last_name: string | null }

const TONE: Record<string, 'red' | 'amber' | 'neutral'> = {
  harassment: 'red', safety_concern: 'red', impersonation: 'red',
  inappropriate_behavior: 'amber', spam: 'amber', other: 'neutral',
};

export default async function AdminReports() {
  const gate = await requireAdmin();
  if (!gate.ok) return null;
  const { db } = gate;

  const result = await rowsOrError<Report>(
    db.from('user_reports')
      .select('id, reporter_id, reported_id, reason, details, context, created_at')
      .order('created_at', { ascending: false }).limit(200)
  );
  const reports = result.ok ? result.data : [];

  const ids = [...new Set(reports.flatMap((r) => [r.reporter_id, r.reported_id]))];
  const people = new Map(
    (ids.length ? await rows<Person>(db.from('profiles').select('id, first_name, last_name').in('id', ids)) : [])
      .map((p) => [p.id, p])
  );
  const nm = (id: string) => {
    const p = people.get(id);
    return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unknown' : 'Unknown';
  };

  // Repeat subjects are the signal worth surfacing first.
  const tally = new Map<string, number>();
  for (const r of reports) tally.set(r.reported_id, (tally.get(r.reported_id) ?? 0) + 1);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold text-navy-900">Reports</h1>
        <p className="text-[14px] text-gray-600 mt-1">
          {result.ok ? `${reports.length} filed.` : 'Count unavailable.'} This queue is read-only.
        </p>
      </div>

      {!result.ok ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-[13px] font-semibold text-red-900">Reports cannot be read</p>
          <p className="text-[14px] text-red-900 mt-1 leading-relaxed">
            The <code className="text-[13px]">user_reports</code> table did not
            answer this query, so the count below is not a real zero. Migration{' '}
            <code className="text-[13px]">0011_reports_blocks.sql</code> declares
            this table; if it has not been applied to this project, reporting and
            blocking are non-functional for users too. Apply the pending
            migrations and reload.
          </p>
          <p className="text-[13px] text-red-800 mt-2 font-mono">{result.message}</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-[13px] font-semibold text-amber-900">Schema gap: no resolution status</p>
          <p className="text-[14px] text-amber-900 mt-1 leading-relaxed">
            <code className="text-[13px]">user_reports</code> stores reporter,
            subject, reason, details, context and timestamp. There is no status,
            assignee, or resolution column, so there is nowhere to record that a
            report was actioned. Triaging here would lose that state on reload,
            so nothing is written. Closing the gap needs a migration adding{' '}
            <code className="text-[13px]">status</code>,{' '}
            <code className="text-[13px]">resolved_by</code> and{' '}
            <code className="text-[13px]">resolved_at</code>, plus an admin-only
            UPDATE policy.
          </p>
        </div>
      )}

      <Panel title="Queue">
        {reports.length === 0 ? (
          <Empty>{result.ok ? 'No reports filed.' : 'Cannot read the reports table, see above.'}</Empty>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr><Th>Reported user</Th><Th>Reason</Th><Th>Context</Th><Th>Details</Th><Th>Reporter</Th><Th>Filed</Th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 align-top">
                      <Td>
                        <Link href={`/admin/users/${r.reported_id}`} className="font-medium hover:underline">{nm(r.reported_id)}</Link>
                        {(tally.get(r.reported_id) ?? 0) > 1 && (
                          <span className="ml-2"><Tag tone="red">{tally.get(r.reported_id)} reports</Tag></span>
                        )}
                      </Td>
                      <Td><Tag tone={TONE[r.reason] ?? 'neutral'}>{r.reason.replace(/_/g, ' ')}</Tag></Td>
                      <Td className="text-gray-700">{r.context || 'Not set'}</Td>
                      <Td className="text-gray-700 max-w-[280px]">{r.details || 'None given'}</Td>
                      <Td><Link href={`/admin/users/${r.reporter_id}`} className="hover:underline">{nm(r.reporter_id)}</Link></Td>
                      <Td className="text-gray-700 tabular-nums whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="md:hidden divide-y divide-gray-100">
              {reports.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/users/${r.reported_id}`} className="font-medium text-[15px] hover:underline">{nm(r.reported_id)}</Link>
                    <Tag tone={TONE[r.reason] ?? 'neutral'}>{r.reason.replace(/_/g, ' ')}</Tag>
                  </div>
                  <p className="text-[14px] text-gray-700 mt-1.5">{r.details || 'No details given'}</p>
                  <p className="text-[13px] text-gray-600 mt-1.5">
                    Reported by {nm(r.reporter_id)} on{' '}
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}
