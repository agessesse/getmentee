/**
 * The arc, start to finish, in the product's own nouns.
 *
 * Every step here maps to something that exists: Discover ranks mentors and
 * attaches the reason each one surfaced, a request carries two written answers,
 * acceptance creates a mentorship row, goals carry a target date, sessions
 * carry notes, action items carry an owner. Nothing on this list is aspiration.
 *
 * One line per step on purpose. Three of these steps get a section of their own
 * further down the page, and a full paragraph here would spend the argument
 * before those sections arrive.
 *
 * The numbering is real sequence, not decoration: 04 cannot happen before 03.
 * The connecting rule is the <li> left border, so it stops on its own at the
 * last item instead of needing a hand-placed line.
 */

const STEPS = [
  { label: 'Discover',    line: 'See mentors ranked against your profile, each with the reason they are there.' },
  { label: 'Request',     line: 'Say what you want to work on, and why you chose this person.' },
  { label: 'They accept', line: 'The request becomes a mentorship, with a shared space instead of an email thread.' },
  { label: 'Goals',       line: 'Write down what you are working toward, and put a date on it.' },
  { label: 'Sessions',    line: 'Schedule the conversation. Notes from it stay with the mentorship.' },
  { label: 'Action items',line: 'Leave with something to do. It comes back at the start of the next session.' },
];

export default function MenteeJourney() {
  return (
    <ol className="relative max-w-3xl">
      {STEPS.map((step, i) => (
        <li
          key={step.label}
          className="relative border-l border-halo-rule last:border-l-transparent pl-10 sm:pl-12 pb-8 last:pb-0"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 -translate-x-1/2 w-7 h-7 rounded-full bg-halo-ivory border border-halo-rule flex items-center justify-center"
          >
            <span className="text-[11px] font-semibold tabular-nums text-halo-purple-d">
              {String(i + 1).padStart(2, '0')}
            </span>
          </span>

          <h3 className="font-display text-halo-ink text-[22px] sm:text-[24px] leading-none mb-2">
            {step.label}
          </h3>
          <p className="text-halo-heather text-[15px] leading-relaxed max-w-xl">{step.line}</p>
        </li>
      ))}
    </ol>
  );
}
