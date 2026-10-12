import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/admin';
import { loadPipeline } from '@/lib/cohort/pipeline';
import PipelineBoard from '@/components/admin/PipelineBoard';

export const metadata = { title: 'Pipeline', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Assembling the cohort, as opposed to running it.
 *
 * /admin/cohort/[slug] answers "is this working" once relationships exist.
 * This answers the question before that one: who applied, who is in, and
 * who should they be paired with. Two surfaces because they are two jobs
 * done at different times by the same person.
 */
export default async function PipelinePage() {
  const gate = await requireAdmin();
  if (!gate.ok) redirect('/login');

  const view = await loadPipeline();
  if (!view) redirect('/admin');

  return (
    <div className="max-w-4xl">
      <header className="mb-7">
        <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
          {view.cohort?.name ?? 'Cohort'}{view.cohort?.term ? ` · ${view.cohort.term}` : ''}
        </p>
        <h1 className="font-display text-[1.9rem] leading-tight text-halo-ink mt-1">
          Building the cohort
        </h1>
        <p className="text-[14px] text-halo-heather mt-1.5">
          Read applications, select ten of each, pair them by hand.{' '}
          <Link href={`/admin/cohort/${view.cohort?.slug ?? 'cohort-001'}`} className="text-halo-brand-text underline underline-offset-2 hover:text-halo-ink">
            See how the cohort is doing
          </Link>
        </p>
      </header>

      <PipelineBoard
        people={view.people}
        funnels={view.funnels}
        cohortId={view.cohort?.id ?? null}
        cohortName={view.cohort?.name ?? 'This cohort'}
      />
    </div>
  );
}
