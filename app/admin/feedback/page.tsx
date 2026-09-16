import Link from 'next/link';
import { requireAdmin, rows } from '@/lib/supabase/admin';
import { Panel, Empty, Tag } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

interface Fb {
  id: string; user_id: string; role: 'mentor' | 'mentee' | null;
  category: 'confusing' | 'broken' | 'feature_idea' | 'liked' | 'other';
  feedback: string; rating: number | null; current_route: string | null; created_at: string;
}
interface Person { id: string; first_name: string | null; last_name: string | null }

const CATEGORIES = [
  { key: 'broken', label: 'Broken', tone: 'red' as const },
  { key: 'confusing', label: 'Confusing', tone: 'amber' as const },
  { key: 'feature_idea', label: 'Feature idea', tone: 'blue' as const },
  { key: 'liked', label: 'Liked', tone: 'green' as const },
  { key: 'other', label: 'Other', tone: 'neutral' as const },
];

export default async function AdminFeedback({
  searchParams,
}: { searchParams: Promise<{ category?: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return null;
  const { db } = gate;

  const sp = await searchParams;
  const active = CATEGORIES.find((c) => c.key === sp.category)?.key;

  let q = db.from('pilot_feedback')
    .select('id, user_id, role, category, feedback, rating, current_route, created_at')
    .order('created_at', { ascending: false }).limit(200);
  if (active) q = q.eq('category', active);

  const items = await rows<Fb>(q);
  const all = active
    ? await rows<{ category: string }>(db.from('pilot_feedback').select('category').limit(1000))
    : items.map((i) => ({ category: i.category }));

  const counts = new Map<string, number>();
  for (const r of all) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);

  const ids = [...new Set(items.map((i) => i.user_id))];
  const people = new Map(
    (ids.length ? await rows<Person>(db.from('profiles').select('id, first_name, last_name').in('id', ids)) : [])
      .map((p) => [p.id, p])
  );

  // Routes that attract the most complaints point at where the product hurts.
  const routeTrouble = new Map<string, number>();
  for (const i of items) {
    if (i.category !== 'broken' && i.category !== 'confusing') continue;
    const r = i.current_route ?? 'unknown';
    routeTrouble.set(r, (routeTrouble.get(r) ?? 0) + 1);
  }
  const topRoutes = [...routeTrouble.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-display font-normal text-[1.75rem] leading-tight text-halo-ink">Pilot feedback</h1>
        <p className="text-[14px] text-halo-heather mt-1">
          What users submitted, grouped by the category they chose. No inferred sentiment.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link href="/admin/feedback"
          className={`px-3 py-1.5 rounded-md border text-[13px] font-medium ${!active ? 'bg-halo-purple text-white border-halo-purple' : 'bg-white text-halo-heather border-halo-rule hover:border-halo-purple'}`}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={`/admin/feedback?category=${c.key}`}
            className={`px-3 py-1.5 rounded-md border text-[13px] font-medium ${active === c.key ? 'bg-halo-purple text-white border-halo-purple' : 'bg-white text-halo-heather border-halo-rule hover:border-halo-purple'}`}>
            {c.label} {counts.get(c.key) ? <span className="tabular-nums opacity-70">({counts.get(c.key)})</span> : null}
          </Link>
        ))}
      </div>

      {topRoutes.length > 0 && (
        <Panel title="Routes drawing the most broken or confusing reports">
          <ul className="divide-y divide-halo-rule">
            {topRoutes.map(([route, n]) => (
              <li key={route} className="px-4 py-2.5 flex items-center gap-3 text-[14px]">
                <code className="text-[13px] text-halo-ink">{route}</code>
                <span className="ml-auto tabular-nums text-halo-heather">{n}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title={`${items.length} submission${items.length === 1 ? '' : 's'}`}>
        {items.length === 0 ? (
          <Empty>No feedback in this category yet.</Empty>
        ) : (
          <ul className="divide-y divide-halo-rule">
            {items.map((i) => {
              const cat = CATEGORIES.find((c) => c.key === i.category);
              const p = people.get(i.user_id);
              return (
                <li key={i.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Tag tone={cat?.tone ?? 'neutral'}>{cat?.label ?? i.category}</Tag>
                    {i.role && <Tag>{i.role}</Tag>}
                    {i.rating !== null && <Tag>{i.rating}/5</Tag>}
                    {i.current_route && <code className="text-[12px] text-halo-heather">{i.current_route}</code>}
                    <span className="ml-auto text-[13px] text-halo-heather tabular-nums">
                      {new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[15px] text-halo-ink leading-relaxed whitespace-pre-wrap">{i.feedback}</p>
                  {p && (
                    <Link href={`/admin/users/${i.user_id}`} className="inline-block text-[13px] text-halo-heather hover:text-halo-ink mt-2">
                      {p.first_name} {p.last_name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
