import Rise from '@/components/marketing/Rise';

/**
 * From introduction to progress.
 *
 * FOUR WORDS AND FOUR SENTENCES, and nothing underneath them. The temptation
 * with a steps section is to explain each step in a paragraph, at which
 * point the reader is doing homework rather than understanding a product.
 * Each step here is one verb and one line; if a line needs a second
 * sentence, the step is wrong.
 *
 * The numbering is real: this IS a sequence, and the fourth step loops back
 * to the second, which is the entire argument for why Mentable is not an
 * introduction service. Numbering something that is not a sequence is
 * decoration, so it earns its place here and nowhere else on the page.
 */
const STEPS = [
  { n: '01', k: 'Match', v: 'Meet someone who has been there.' },
  { n: '02', k: 'Meet', v: 'Come in knowing what the conversation is for.' },
  { n: '03', k: 'Act', v: 'Leave with clear next steps.' },
  { n: '04', k: 'Repeat', v: 'Keep the relationship moving.' },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule"
      aria-labelledby="hiw-heading"
    >
      <div className="max-w-6xl mx-auto">
        <Rise kind="statement">
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mb-4">
            How it works
          </p>
          <h2
            id="hiw-heading"
            className="font-display text-halo-ink leading-[1.05] mb-10 max-w-xl"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}
          >
            From introduction to progress.
          </h2>
        </Rise>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 border-t border-halo-rule pt-8">
          {STEPS.map((s) => (
            <li key={s.k}>
              <p className="font-display text-[1.5rem] leading-none text-halo-brand-line tabular-nums">
                {s.n}
              </p>
              <p className="font-display text-[1.3rem] leading-tight text-halo-ink mt-3">{s.k}</p>
              <p className="text-[14.5px] text-halo-heather leading-relaxed mt-1.5 max-w-[22ch]">
                {s.v}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
