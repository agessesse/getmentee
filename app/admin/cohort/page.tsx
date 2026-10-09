import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/admin';
import { listCohorts } from '@/lib/cohort/data';

export const metadata = { title: 'Cohorts', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Straight through when there is only one cohort, which there is. */
export default async function CohortIndex() {
  const gate = await requireAdmin();
  if (!gate.ok) redirect('/login');

  const cohorts = await listCohorts();
  if (cohorts.length === 1) redirect(`/admin/cohort/${cohorts[0].slug}`);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mb-5">Cohorts</h1>
      {cohorts.length === 0 ? (
        <p className="text-[15px] text-halo-heather">No cohorts yet.</p>
      ) : (
        <ul className="space-y-2">
          {cohorts.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/cohort/${c.slug}`} className="flex items-baseline justify-between rounded-2xl border border-halo-rule px-4 py-3 hover:bg-halo-veil transition-colors">
                <span className="text-[15px] font-medium text-halo-ink">{c.name}</span>
                <span className="text-[12.5px] text-halo-mist-body">{c.term ?? c.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
