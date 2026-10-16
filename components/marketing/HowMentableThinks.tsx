import Rise from '@/components/marketing/Rise';

/**
 * The differentiator, shown rather than claimed.
 *
 * Anyone can say "we match people". The thing worth showing is the step
 * in between: two profiles, the specific overlaps, and the sentence that
 * comes out. A visitor who reads this understands that Mentable's output
 * is an argument, not a score.
 *
 * The explanation at the bottom is the real engine's phrasing, matching
 * what the hero demo produces and what Discover produces. Three surfaces,
 * one voice, because it is literally one function.
 */

const SARAH = {
  name: 'Sarah',
  role: 'Student · Class of 2027',
  rows: [
    { k: 'Goal', v: '“Break into consulting after graduation.”' },
    { k: 'Interested in', v: 'Management Consulting · Healthcare' },
    { k: 'University', v: 'UNC Chapel Hill' },
  ],
};

const MICHAEL = {
  name: 'Michael',
  role: 'Alumnus · Deloitte',
  rows: [
    { k: 'Experience', v: 'Healthcare strategy · 7 years' },
    { k: 'Can help with', v: 'Consulting recruiting · Case interviews' },
    { k: 'University', v: 'UNC Chapel Hill' },
  ],
};

/* The three overlaps the engine actually found between these two. */
const OVERLAPS = [
  { label: 'Goal ↔ experience', value: 'Consulting' },
  { label: 'Need ↔ knowledge', value: 'Recruiting guidance' },
  { label: 'Shared context', value: 'UNC Chapel Hill' },
];

export default function HowMentableThinks() {
  return (
    <section
      className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule"
      aria-labelledby="thinks-heading"
    >
      <div className="max-w-5xl mx-auto">
        <Rise kind="statement">
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mb-4">
            How Mentable thinks
          </p>
          <h2
            id="thinks-heading"
            className="font-display text-halo-ink leading-[1.05] mb-3 max-w-xl"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}
          >
            More than matching fields.
          </h2>
          <p className="text-[16px] text-halo-heather leading-relaxed max-w-md mb-10">
            Mentable reads what people actually wrote, then says why two of them
            should meet.
          </p>
        </Rise>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-5 lg:gap-6 items-start">
          <ProfileCard person={SARAH} />

          {/* The overlaps, between the two on desktop and under on mobile. */}
          <div className="lg:pt-10">
            <ul className="space-y-2.5 lg:w-48">
              {OVERLAPS.map((o) => (
                <li key={o.label} className="rounded-xl border border-halo-rule bg-white px-3.5 py-2.5">
                  <p className="font-ui text-[9.5px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body">
                    {o.label}
                  </p>
                  <p className="text-[13.5px] font-medium text-halo-brand-text mt-0.5">{o.value}</p>
                </li>
              ))}
            </ul>
          </div>

          <ProfileCard person={MICHAEL} />
        </div>

        <Rise kind="heading" delay={0.1}>
          <div className="mt-6 rounded-2xl border border-halo-rule bg-white p-5 sm:p-6 max-w-3xl">
            <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mb-2.5">
              Why Sarah should meet Michael
            </p>
            <p className="text-[16px] sm:text-[17px] text-halo-ink leading-relaxed">
              Michael works in Management Consulting and Healthcare, which is what Sarah
              said she wants to understand. They both went to UNC Chapel Hill.
            </p>
            <p className="text-[13.5px] text-halo-heather leading-relaxed mt-3">
              Mentable doesn&rsquo;t just recommend a person. It explains why — and the
              explanation is built only from things both people said about themselves.
            </p>
          </div>
        </Rise>
      </div>
    </section>
  );
}

function ProfileCard({ person }: { person: typeof SARAH }) {
  return (
    <div className="rounded-2xl border border-halo-rule bg-white p-5">
      <p className="font-display text-[1.15rem] text-halo-ink leading-tight">{person.name}</p>
      <p className="text-[12.5px] text-halo-mist-body mt-0.5 mb-4">{person.role}</p>
      <dl className="space-y-3">
        {person.rows.map((r) => (
          <div key={r.k}>
            <dt className="font-ui text-[9.5px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body">
              {r.k}
            </dt>
            <dd className="text-[14px] text-halo-ink leading-snug mt-0.5">{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
