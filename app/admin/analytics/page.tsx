import { requireAdmin, rows } from '@/lib/supabase/admin';
import { Panel, Empty, Th, Td } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

interface Ev { event_name: string; user_id: string; created_at: string }

/**
 * pilot_events carries user_id, so distinct-user counts per stage are real.
 * What it does NOT support is an ordered cohort funnel: there is no guarantee
 * a user who reached a later stage passed through an earlier one within the
 * same visit. Each row below is therefore "distinct users who have ever fired
 * this event", and the percentage is against the widest stage, not a
 * step-to-step conversion. The labelling on screen says so.
 */
const FUNNEL = [
  { key: 'discover_page_viewed', label: 'Viewed discover' },
  { key: 'mentor_profile_viewed', label: 'Viewed a mentor' },
  { key: 'mentorship_requested', label: 'Sent a request' },
  { key: 'message_sent', label: 'Sent a message' },
  { key: 'session_scheduled', label: 'Scheduled a session' },
  { key: 'session_completed', label: 'Completed a session' },
  { key: 'review_submitted', label: 'Submitted a review' },
];

export default async function AdminAnalytics() {
  const gate = await requireAdmin();
  if (!gate.ok) return null;
  const { db } = gate;

  const events = await rows<Ev>(
    db.from('pilot_events').select('event_name, user_id, created_at')
      .order('created_at', { ascending: false }).limit(5000)
  );

  const byName = new Map<string, { total: number; users: Set<string> }>();
  for (const e of events) {
    const rec = byName.get(e.event_name) ?? { total: 0, users: new Set<string>() };
    rec.total += 1; rec.users.add(e.user_id);
    byName.set(e.event_name, rec);
  }

  const widest = Math.max(1, ...FUNNEL.map((f) => byName.get(f.key)?.users.size ?? 0));

  const day = 86_400_000;
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(Date.now() - (13 - i) * day); start.setHours(0, 0, 0, 0);
    const end = start.getTime() + day;
    return {
      label: start.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      n: events.filter((e) => {
        const t = Date.parse(e.created_at);
        return t >= start.getTime() && t < end;
      }).length,
    };
  });
  const peak = Math.max(1, ...last14.map((d) => d.n));

  const other = [...byName.entries()]
    .filter(([k]) => !FUNNEL.some((f) => f.key === k))
    .sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-display font-normal text-[1.75rem] leading-tight text-halo-ink">Analytics</h1>
        <p className="text-[14px] text-halo-heather mt-1">
          {events.length === 5000 ? 'Most recent 5,000 events.' : `${events.length} events recorded.`}
        </p>
      </div>

      <div className="bg-halo-bone border border-halo-rule rounded-lg p-4">
        <p className="text-[14px] text-halo-ink leading-relaxed">
          <span className="font-semibold">How to read this.</span> Each stage counts
          distinct users who have ever fired that event, not a time-ordered
          cohort. A user can appear in a later stage without appearing in an
          earlier one, so treat the percentages as reach per stage rather than
          step-to-step conversion. Landing-page events only record for visitors
          who are already signed in, because{' '}
          <code className="text-[13px]">pilot_events.user_id</code> is NOT NULL.
        </p>
      </div>

      <Panel title="Stage reach">
        {events.length === 0 ? (
          <Empty>No events recorded yet.</Empty>
        ) : (
          <ul className="divide-y divide-halo-rule">
            {FUNNEL.map((f) => {
              const rec = byName.get(f.key);
              const u = rec?.users.size ?? 0;
              const pct = Math.round((u / widest) * 100);
              return (
                <li key={f.key} className="px-4 py-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[14px] font-medium text-halo-ink">{f.label}</span>
                    <span className="ml-auto text-[14px] tabular-nums text-halo-ink">
                      {u} user{u === 1 ? '' : 's'}
                    </span>
                    <span className="text-[13px] tabular-nums text-halo-heather w-12 text-right">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-halo-bone rounded-full overflow-hidden">
                    <div className="h-full bg-halo-purple-d rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[12px] text-halo-heather mt-1 tabular-nums">
                    {rec?.total ?? 0} total event{(rec?.total ?? 0) === 1 ? '' : 's'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Events per day, last 14 days">
        {events.length === 0 ? (
          <Empty>No events recorded yet.</Empty>
        ) : (
          <div className="p-4">
            <div className="flex items-end gap-1 h-28" role="img"
                 aria-label={`Daily event counts: ${last14.map((d) => `${d.label}: ${d.n}`).join(', ')}`}>
              {last14.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full bg-halo-purple-d rounded-t" style={{ height: `${Math.round((d.n / peak) * 100)}%` }} />
                  <span className="text-[10px] text-halo-heather tabular-nums truncate w-full text-center">{d.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-halo-heather mt-2 tabular-nums">Peak {peak} in a day.</p>
          </div>
        )}
      </Panel>

      <Panel title="All other events">
        {other.length === 0 ? (
          <Empty>No other events recorded.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead className="bg-halo-veil border-b border-halo-rule">
                <tr><Th>Event</Th><Th>Total</Th><Th>Distinct users</Th></tr>
              </thead>
              <tbody className="divide-y divide-halo-rule">
                {other.map(([k, v]) => (
                  <tr key={k}>
                    <Td><code className="text-[13px]">{k}</code></Td>
                    <Td className="tabular-nums">{v.total}</Td>
                    <Td className="tabular-nums">{v.users.size}</Td>
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
