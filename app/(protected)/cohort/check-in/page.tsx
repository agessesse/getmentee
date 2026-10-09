import { notFound } from 'next/navigation';
import { myCohortContext } from '@/app/(protected)/cohort/actions';
import CheckInForm from '@/components/cohort/CheckInForm';

export const metadata = { title: 'Check in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * The baseline, and later the endline.
 *
 * WHY THIS ROUTE EXISTS AT ALL. Pete's hardest question is whether Mentable
 * contributed to a student's progress or simply selected students who were
 * going to do well anyway. Nothing in the product could answer that,
 * because nothing recorded where anyone started. This does.
 *
 * It is deliberately NOT part of onboarding or the workspace: it is asked
 * once before the first conversation and once at the end, and burying it in
 * a flow people skim would produce answers nobody means.
 */
export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const sp = await searchParams;
  const phase = sp.phase === 'endline' ? 'endline' : 'baseline';

  const ctx = await myCohortContext();
  // Not in a cohort: this page has nothing to ask about. 404 rather than an
  // explanation, because an individual mentorship is not a lesser state.
  if (!ctx) notFound();

  const already = ctx.submitted.has(phase);
  const where = [ctx.organizationName, ctx.programName, ctx.term].filter(Boolean).join(' · ');

  return (
    <div className="max-w-xl mx-auto">
      <header className="mb-8">
        {where && (
          <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
            {where}
          </p>
        )}
        <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mt-1">
          {phase === 'baseline' ? 'Before you start' : 'Looking back'}
        </h1>
        <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2">
          {phase === 'baseline'
            ? 'Six quick questions before your first conversation. We ask the same ones at the end, which is the only way to see what actually changed.'
            : 'The same questions as the start, plus a few about what happened.'}
        </p>
      </header>

      {already ? (
        <div className="rounded-2xl border border-halo-rule p-6">
          <p className="font-display text-[1.2rem] text-halo-ink">Already done.</p>
          <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2">
            You answered this one. {phase === 'baseline' ? 'We will ask again at the end of the semester.' : 'Nothing else needed.'}
          </p>
        </div>
      ) : (
        <CheckInForm phase={phase} role={ctx.role} />
      )}
    </div>
  );
}
