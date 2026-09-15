/**
 * The cold message, and the same ask made with context.
 *
 * Both panels are set side by side rather than stacked into a before/after
 * headline, because the difference is legible in the shape of the two blocks
 * before a word of either is read: one is a sentence, the other is answers to
 * questions somebody asked.
 *
 * The two field labels are the real ones from the request form
 * (components/mentor/RequestModal.tsx). Both are optional in the product, and
 * the note under the panel says so rather than implying a gate that is not
 * there.
 *
 * The right panel is not a form. It renders the answers as read-only text, so
 * nothing on a marketing page looks like an input a student could type into and
 * lose.
 */

const FIELDS = [
  {
    label: 'Why do you want to work with this mentor?',
    answer:
      'You spent three decades in institutional fixed income and led investment grade sales and trading. That is the desk I am trying to understand before I commit to aiming at it.',
  },
  {
    label: 'What are your goals?',
    answer:
      'Understand how a rates desk is structured, and be able to hold a real conversation about it by spring.',
  },
];

export default function RequestContrast() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
      {/* The usual */}
      <div className="rounded-xl border border-halo-rule bg-halo-bone/50 p-5 sm:p-6">
        <p className="font-ui text-[10px] font-semibold text-halo-mist-body uppercase tracking-[0.18em] mb-4">
          The usual
        </p>
        <p className="text-[17px] sm:text-[18px] text-halo-heather font-light leading-relaxed">
          &ldquo;Hi! Would you be open to a quick chat? I would love to pick your brain.&rdquo;
        </p>
        <p className="text-[13px] text-halo-mist-body leading-relaxed mt-5 pt-5 border-t border-halo-rule">
          There is nothing in it to say yes to. The mentor cannot tell what you want,
          whether they are the right person, or what thirty minutes would be for.
        </p>
      </div>

      {/* On Mentable */}
      <div className="rounded-xl border border-halo-purple/40 bg-white p-5 sm:p-6 shadow-sm">
        <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em] mb-4">
          A request on Mentable
        </p>
        <dl className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.label}>
              <dt className="text-[12px] font-semibold text-halo-heather mb-1.5">{f.label}</dt>
              <dd className="text-[13px] text-halo-heather leading-relaxed bg-halo-veil border border-halo-rule rounded-xl px-3.5 py-2.5">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-[13px] text-halo-mist-body leading-relaxed mt-5 pt-5 border-t border-halo-rule">
          Both questions are optional, and both are the whole difference. The mentor is
          deciding with them.
        </p>
      </div>
    </div>
  );
}
