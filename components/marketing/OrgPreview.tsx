import Link from 'next/link';
import Rise from '@/components/marketing/Rise';

/**
 * What the organization is actually buying.
 *
 * HONESTY ABOUT WHAT EXISTS. The operator pipeline, relationship health
 * and the four cohort metrics are built and running. The recommendation
 * REVIEW queue shown here is not: an administrator cannot yet approve a
 * batch of suggested pairings. So the panel is labelled Preview, and the
 * label is not decorative — it marks the exact half of this screen that
 * is product direction rather than product.
 *
 * Numbers are illustrative and say so. Mentable has no customers with 124
 * participants and will not imply otherwise.
 */

const STATS = [
  { k: '124', v: 'participants' },
  { k: '48', v: 'recommended' },
  { k: '32', v: 'active' },
  { k: '4', v: 'need attention' },
];

const NAV = ['Overview', 'People', 'Programs', 'Matching', 'Relationships', 'Insights'];

export default function OrgPreview() {
  return (
    <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="org-heading">
      <div className="max-w-5xl mx-auto">
        <Rise kind="statement">
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mb-4">
            For organizations
          </p>
          <h2
            id="org-heading"
            className="font-display text-halo-ink leading-[1.05] mb-3 max-w-xl"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}
          >
            See the relationships hiding inside your community.
          </h2>
          <p className="text-[16px] text-halo-heather leading-relaxed max-w-md mb-9">
            Understand your people, review what Mentable suggests, and see whether the
            relationships actually happen.
          </p>
        </Rise>

        <div className="rounded-2xl border border-halo-rule bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-halo-rule px-4 sm:px-5 py-3">
            <p className="text-[13.5px] font-medium text-halo-ink">Finance Alumni Mentorship</p>
            <span className="font-ui text-[9.5px] font-semibold uppercase tracking-[0.12em] text-halo-mist border border-halo-rule rounded-full px-2 py-0.5">
              Illustrative
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr]">
            {/* Sidebar: horizontal on mobile, not a squashed column. */}
            <nav
              aria-label="Organization sections, illustrative"
              className="flex sm:flex-col gap-1 overflow-x-auto border-b sm:border-b-0 sm:border-r border-halo-rule p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {NAV.map((n, i) => (
                <span
                  key={n}
                  className={`flex-none rounded-lg px-2.5 py-1.5 text-[12.5px] ${
                    i === 3 ? 'bg-halo-veil text-halo-ink font-medium' : 'text-halo-mist-body'
                  }`}
                >
                  {n}
                </span>
              ))}
            </nav>

            <div className="p-4 sm:p-5">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-halo-rule">
                {STATS.map((s) => (
                  <div key={s.v}>
                    <dt className="font-display text-[1.5rem] leading-none text-halo-ink tabular-nums">{s.k}</dt>
                    <dd className="text-[12px] text-halo-mist-body mt-1">{s.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex items-center justify-between gap-3 mt-5 mb-3">
                <p className="font-ui text-[9.5px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body">
                  Recommended relationships
                </p>
                {/*
                  The honest label. Review queues are not built; the
                  pipeline, health and metrics behind them are.
                */}
                <span className="font-ui text-[9.5px] font-semibold uppercase tracking-[0.12em] text-halo-brand-text border border-halo-brand-line/40 rounded-full px-2 py-0.5">
                  Preview
                </span>
              </div>

              <div className="rounded-xl border border-halo-rule p-4">
                <p className="text-[14.5px] font-medium text-halo-ink">
                  Sarah Chen <span className="text-halo-brand-line" aria-hidden="true">↔</span> Michael Ross
                </p>
                <ul className="mt-2.5 space-y-1">
                  {[
                    'Consulting goal ↔ consulting experience',
                    'Shared UNC affiliation',
                    'Compatible availability',
                  ].map((r) => (
                    <li key={r} className="text-[13px] text-halo-heather leading-relaxed">{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[12.5px] text-halo-mist-body leading-relaxed mt-4 max-w-xl">
          Participant numbers are illustrative. The pipeline, relationship health and
          cohort measurement behind this are built; reviewing recommendations in bulk is
          not yet.
        </p>

        <Link
          href="/organizations#talk"
          className="inline-flex items-center gap-2 mt-7 rounded-xl bg-halo-purple px-5 py-3 text-[15px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          Talk to us about a pilot
        </Link>
      </div>
    </section>
  );
}
