import { notFound } from 'next/navigation';
import { myCohortContext } from '@/app/(protected)/cohort/actions';
import CommitmentForm from '@/components/cohort/CommitmentForm';

export const metadata = { title: 'Your commitment', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Where an interested mentor becomes a committed one.
 *
 * Those are not the same thing, and before this pass the product could not
 * tell them apart: a mentor who said "sounds great" and a mentor who had
 * agreed to a student for a semester occupied the same row. That is the
 * distinction Pete's second question turns on, and it is the one that
 * decides whether a match is safe to make.
 *
 * The terms come from the COHORT, not from this file, and a snapshot of
 * them is stored against the person who accepted. Editing the cohort later
 * cannot rewrite what somebody agreed to.
 */
export default async function CommitPage() {
  const ctx = await myCohortContext();
  if (!ctx || ctx.role !== 'mentor') notFound();

  const where = [ctx.organizationName, ctx.programName, ctx.term].filter(Boolean).join(' · ');
  const committed = ['committed', 'matched', 'active', 'completed'].includes(ctx.state);

  return (
    <div className="max-w-xl mx-auto">
      <header className="mb-8">
        {where && (
          <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
            {where}
          </p>
        )}
        <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mt-1">
          {committed ? 'You’re in.' : 'What you’d be taking on'}
        </h1>
      </header>

      <CommitmentForm
        cohortName={ctx.cohortName}
        cadenceDays={ctx.cadenceDays}
        expectedSessions={ctx.expectedSessions}
        alreadyCommitted={committed}
      />
    </div>
  );
}
