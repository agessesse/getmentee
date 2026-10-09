import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/admin';
import { loadCohort } from '@/lib/cohort/data';
import { HEALTH_LABEL, healthRank, type HealthStatus } from '@/lib/cohort/health';
import { pct, signed, type Figure } from '@/lib/cohort/metrics';

export const metadata = { title: 'Cohort', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * The operator's view of a cohort.
 *
 * ORDERED BY WHAT YOU DO ABOUT IT, not by what is easiest to chart. The
 * first thing on the page is who needs attention, because that is the only
 * part that changes an outcome. The four metrics come second: they tell you
 * whether the cohort is working, which matters weekly, not hourly.
 *
 * NOT A SAAS DASHBOARD. No charts, no sparklines, no KPI tiles with arrows.
 * Ten students do not need a time series; they need a list of names and a
 * reason to call one of them.
 *
 * EVERY FIGURE CAN BE UNKNOWN. Cohort 001 has not started, so most of this
 * reads "no data yet" today. That is the honest state and it is rendered as
 * such rather than as a confident zero.
 */
export default async function CohortPage({ params }: { params: Promise<{ slug: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) redirect('/login');

  const { slug } = await params;
  const view = await loadCohort(slug);
  if (!view) notFound();

  const { cohort, metrics, pairs, students, mentors } = view;

  // Worst first. This list is meant to be worked through from the top.
  const ranked = [...pairs].sort((a, b) => healthRank(a.health.status) - healthRank(b.health.status));
  const needing = ranked.filter((p) => p.health.status === 'at_risk' || p.health.status === 'needs_attention' || p.health.status === 'not_started');

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
          {[cohort.organizationName, cohort.programName].filter(Boolean).join(' · ') || 'Cohort'}
        </p>
        <h1 className="font-display text-[1.9rem] leading-tight text-halo-ink mt-1">
          {cohort.name}
          {cohort.term && <span className="text-halo-mist-body"> · {cohort.term}</span>}
        </h1>
        <p className="text-[13.5px] text-halo-heather mt-2">
          {students.length} student{students.length === 1 ? '' : 's'} · {mentors.length} mentor
          {mentors.length === 1 ? '' : 's'} · {pairs.length} matched · a conversation every{' '}
          {cohort.cadenceDays} days, {cohort.expectedSessions} expected
        </p>
      </header>

      {view.empty ? (
        /*
          The honest empty state. Cohort 001 genuinely has no participants
          yet, and inventing a populated dashboard would be the exact kind
          of fake statistic this pass forbids.
        */
        <div className="rounded-2xl border border-dashed border-halo-rule px-6 py-8">
          <p className="font-display text-[1.25rem] text-halo-ink">This cohort hasn&rsquo;t started.</p>
          <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2 max-w-md">
            No applications, no participants, no matches yet. Everything on this page fills
            in as the cohort runs: who needs attention first, then whether the four metrics
            are moving.
          </p>
          <Link
            href="/admin/applications"
            className="inline-block mt-5 text-[13.5px] font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
          >
            Review applications
          </Link>
        </div>
      ) : (
        <>
          {/* ── Who needs us right now ────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="font-display text-[1.25rem] text-halo-ink mb-1">Who needs attention</h2>
            <p className="text-[13px] text-halo-mist-body mb-4">
              Worst first. Each row says why.
            </p>
            {needing.length === 0 ? (
              <p className="rounded-2xl border border-halo-rule px-5 py-4 text-[14.5px] text-halo-heather">
                Nothing needs intervention right now.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {needing.map((p) => (
                  <li key={p.mentorshipId} className="rounded-2xl border border-halo-rule p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <Link
                        href={`/admin/mentorships`}
                        className="text-[15px] font-medium text-halo-ink hover:text-halo-brand-text transition-colors"
                      >
                        {p.menteeName} <span className="text-halo-mist-strong">+</span> {p.mentorName}
                      </Link>
                      <HealthTag status={p.health.status} />
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {p.health.reasons.map((r, i) => (
                        <li key={i} className="text-[13.5px] text-halo-heather leading-relaxed">{r}</li>
                      ))}
                    </ul>
                    {p.health.action && (
                      <p className="text-[13.5px] text-halo-ink mt-2 font-medium">{p.health.action}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── The four ─────────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="font-display text-[1.25rem] text-halo-ink mb-4">Is the cohort working?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Metric
                name="Activation"
                question="Did the relationship start?"
                rows={[
                  [metrics.activation.withinWindow.label, pct(metrics.activation.withinWindow), metrics.activation.withinWindow],
                  [metrics.activation.everMet.label, pct(metrics.activation.everMet), metrics.activation.everMet],
                ]}
              />
              <Metric
                name="Engagement"
                question="Did it continue?"
                rows={[
                  [metrics.engagement.againstPlan.label, pct(metrics.engagement.againstPlan), metrics.engagement.againstPlan],
                  [metrics.engagement.onCadence.label, pct(metrics.engagement.onCadence), metrics.engagement.onCadence],
                  [metrics.engagement.scheduledAhead.label, pct(metrics.engagement.scheduledAhead), metrics.engagement.scheduledAhead],
                ]}
              />
              <Metric
                name="Execution"
                question="Did conversations produce action?"
                rows={[
                  [metrics.execution.followThrough.label, pct(metrics.execution.followThrough), metrics.execution.followThrough],
                  [metrics.execution.conversationsWithAction.label, pct(metrics.execution.conversationsWithAction), metrics.execution.conversationsWithAction],
                  [metrics.execution.goalsReached.label, pct(metrics.execution.goalsReached), metrics.execution.goalsReached],
                ]}
              />
              <Metric
                name="Progression"
                question="Did the student's position improve?"
                note="Scores are what students said about themselves. The counts are checkable."
                rows={[
                  [metrics.progression.measured.label, pct(metrics.progression.measured), metrics.progression.measured],
                  [metrics.progression.contactsGained.label, signed(metrics.progression.contactsGained), metrics.progression.contactsGained],
                  [metrics.progression.interviewsGained.label, signed(metrics.progression.interviewsGained), metrics.progression.interviewsGained],
                  [metrics.progression.clarityShift.label, signed(metrics.progression.clarityShift), metrics.progression.clarityShift],
                ]}
              />
            </div>
          </section>

          {/* ── Everyone ─────────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="font-display text-[1.25rem] text-halo-ink mb-4">Every relationship</h2>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-[13.5px] min-w-[520px]">
                <thead>
                  <tr className="text-left border-b border-halo-rule">
                    {['Pair', 'Status', 'Talks', 'Commitments', 'Next'].map((h) => (
                      <th key={h} className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((p) => (
                    <tr key={p.mentorshipId} className="border-b border-halo-rule last:border-0">
                      <td className="py-2.5 pr-4 text-halo-ink">{p.menteeName} + {p.mentorName}</td>
                      <td className="py-2.5 pr-4"><HealthTag status={p.health.status} /></td>
                      <td className="py-2.5 pr-4 tabular-nums text-halo-heather">{p.completedSessions.length}</td>
                      <td className="py-2.5 pr-4 tabular-nums text-halo-heather">{p.commitmentsCompleted}/{p.commitmentsCreated}</td>
                      <td className="py-2.5 text-halo-heather">
                        {p.nextSessionAt
                          ? new Date(p.nextSessionAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Where the mentors came from ──────────────────────────── */}
          <section>
            <h2 className="font-display text-[1.25rem] text-halo-ink mb-1">Where mentors came from</h2>
            <p className="text-[13px] text-halo-mist-body mb-4">
              The founders&rsquo; network is the honest answer today. This is how we see it stop being.
            </p>
            <Sources people={mentors} />
          </section>
        </>
      )}
    </div>
  );
}

function HealthTag({ status }: { status: HealthStatus }) {
  const tone =
    status === 'at_risk' ? 'text-red-700 border-red-200 bg-red-50'
    : status === 'needs_attention' ? 'text-amber-700 border-amber-200 bg-amber-50'
    : status === 'on_track' ? 'text-halo-brand-text border-halo-rule bg-halo-veil'
    : 'text-halo-heather border-halo-rule bg-halo-veil';
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] ${tone}`}>
      {HEALTH_LABEL[status]}
    </span>
  );
}

function Metric({
  name, question, rows, note,
}: {
  name: string; question: string; note?: string;
  rows: [string, string | null, Figure][];
}) {
  return (
    <div className="rounded-2xl border border-halo-rule p-4">
      <p className="font-display text-[1.05rem] text-halo-ink">{name}</p>
      <p className="text-[12.5px] text-halo-mist-body mt-0.5 mb-3">{question}</p>
      <dl className="space-y-2">
        {rows.map(([label, value, fig]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[13px] text-halo-heather leading-snug">{label}</dt>
            <dd className="text-[14px] font-medium text-halo-ink tabular-nums flex-none">
              {/*
                "No data yet" rather than 0%. An empty denominator is not a
                result, and showing one as zero would make a cohort that has
                not started look like a cohort that is failing.
              */}
              {value === null
                ? <span className="text-[12.5px] font-normal text-halo-mist-body">No data yet</span>
                : <>{value}{fig.of && <span className="text-[11.5px] font-normal text-halo-mist-body ml-1.5">{fig.of[0]}/{fig.of[1]}</span>}</>}
            </dd>
          </div>
        ))}
      </dl>
      {note && <p className="text-[11.5px] text-halo-mist-body leading-relaxed mt-3">{note}</p>}
    </div>
  );
}

function Sources({ people }: { people: { acquisitionSource: string | null; referredBy: string | null }[] }) {
  const counts = new Map<string, number>();
  for (const p of people) {
    const k = p.acquisitionSource ?? 'not recorded';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  if (people.length === 0) {
    return <p className="rounded-2xl border border-dashed border-halo-rule px-5 py-4 text-[14px] text-halo-heather">No mentors enrolled yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([source, n]) => (
        <li key={source} className="flex items-baseline justify-between border-b border-halo-rule pb-1.5">
          <span className="text-[13.5px] text-halo-heather">{source.replace(/_/g, ' ')}</span>
          <span className="text-[13.5px] font-medium text-halo-ink tabular-nums">{n}</span>
        </li>
      ))}
    </ul>
  );
}
