// ─── Mentorship Flywheel ──────────────────────────────────────────────────────
// Replaces the icon-based step flow with an editorial numbered sequence.
// The concept: mentorship compounds — those who receive it eventually give it back.

const STAGES = [
  {
    number: '01',
    headline: "Receive guidance\nthat changes what’s possible.",
    body: "The right mentor opens doors that didn’t exist before — not through connections alone, but through knowledge, honest feedback, and years of context.",
  },
  {
    number: '02',
    headline: 'Build real capability.',
    body: 'Structured sessions, clear goals, and accountability transform potential into performance. Every session moves something forward.',
  },
  {
    number: '03',
    headline: 'Reach the other side.',
    body: 'The opportunities, offers, and outcomes that once felt out of reach become the new baseline. Then the perspective shift happens.',
  },
  {
    number: '04',
    headline: 'Become the mentor.',
    body: 'The people who received mentorship give it back. Every relationship creates the next one. The network deepens with each cycle.',
  },
] as const;

export default function LifecycleSection() {
  return (
    <section className="py-24 px-6 lg:px-10 border-t border-gray-100" aria-labelledby="flywheel-heading">
      <div className="max-w-6xl mx-auto">

        {/* Section heading */}
        <div className="mb-16">
          <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
            The mentorship flywheel
          </p>
          <h2
            id="flywheel-heading"
            className="font-bold text-navy-900 leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            Mentorship<br />compounds.
          </h2>
          <p className="text-gray-500 font-light mt-4 max-w-sm leading-relaxed text-[15px]">
            Those who receive great mentorship eventually become the mentors.
            Every relationship creates the next one.
          </p>
        </div>

        {/* Four stages — 2-column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {STAGES.map((stage) => (
            <div key={stage.number} className="flex gap-6 group">

              {/* Large number as visual anchor */}
              <div
                className="flex-none font-bold text-gray-100 leading-none select-none transition-colors duration-500 group-hover:text-navy-100"
                style={{ fontSize: 'clamp(4rem, 8vw, 5rem)' }}
                aria-hidden="true"
              >
                {stage.number}
              </div>

              {/* Content */}
              <div className="pt-2">
                <h3 className="text-lg font-bold text-navy-900 mb-3 leading-snug whitespace-pre-line">
                  {stage.headline}
                </h3>
                <p className="text-gray-500 text-[15px] font-light leading-relaxed">
                  {stage.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing editorial statement */}
        <div className="mt-16 pt-12 border-t border-gray-100">
          <p
            className="font-light text-gray-400 leading-relaxed max-w-2xl"
            style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)' }}
          >
            The cycle begins with one introduction.
            The impact multiplies.
          </p>
        </div>

      </div>
    </section>
  );
}
