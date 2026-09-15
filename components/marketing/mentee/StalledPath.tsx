/**
 * How mentorship usually goes when the student has to assemble it themselves.
 *
 * The sequence is the argument: every individual step is reasonable, and the
 * thing still ends in silence. So the steps are rendered as one connected path
 * that visibly loses definition rather than as five cards of equal weight,
 * which would read as five separate complaints.
 *
 * Decay is carried by the dots and the connectors, not by dimming the text.
 * halo-mist is 2.83:1 and is banned as text at any size, so the palest label
 * here is mist-body.
 *
 * Static markup. The path reads the same on a phone, where it turns vertical,
 * and there is nothing to hover, tap or scrub to understand it.
 */

const STEPS = [
  {
    label: 'Find a name',
    note: 'From a panel, a class list, or a friend of a friend.',
    dot: 'bg-halo-purple',
    text: 'text-halo-ink',
    line: 'bg-halo-rule',
  },
  {
    label: 'Send a cold message',
    note: 'Rewrite it four times. Send it. Wait.',
    dot: 'bg-halo-purple',
    text: 'text-halo-ink',
    line: 'bg-halo-rule',
  },
  {
    label: 'Get one coffee chat',
    note: 'Thirty good minutes, and no plan for minute thirty-one.',
    dot: 'bg-halo-mist-strong',
    text: 'text-halo-heather',
    line: 'bg-halo-rule',
  },
  {
    label: 'Say you will follow up',
    note: 'You mean it. So do they.',
    dot: 'bg-halo-mist-strong',
    text: 'text-halo-heather',
    line: 'bg-halo-bone',
  },
  {
    label: 'It goes quiet',
    note: 'Not because anyone lost interest.',
    dot: 'bg-transparent border border-halo-mist-strong',
    text: 'text-halo-mist-body',
    line: '',
  },
];

export default function StalledPath() {
  return (
    <ol className="grid gap-y-7 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-0">
      {STEPS.map((step, i) => {
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.label} className="relative flex gap-4 lg:block">
            {/* Rail. Vertical on phones, horizontal once the steps sit in a row. */}
            <div className="relative flex-none w-2.5 lg:w-full lg:h-2.5 lg:mb-4">
              {!isLast && (
                <>
                  <span
                    aria-hidden="true"
                    className={`absolute left-1/2 -translate-x-1/2 top-4 -bottom-7 w-px lg:hidden ${step.line}`}
                  />
                  <span
                    aria-hidden="true"
                    className={`hidden lg:block absolute top-1/2 -translate-y-1/2 left-4 -right-5 h-px ${step.line}`}
                  />
                </>
              )}
              <span
                aria-hidden="true"
                className={`block w-2.5 h-2.5 rounded-full relative ${step.dot}`}
              />
            </div>

            <div className="min-w-0 lg:pr-2">
              <p className={`text-[15px] font-semibold leading-snug ${step.text}`}>{step.label}</p>
              <p className="text-[13px] text-halo-mist-body font-light leading-relaxed mt-1.5">
                {step.note}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
