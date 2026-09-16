import { Calendar, Circle, Target } from 'lucide-react';

/**
 * The hero image: what mentoring on Mentable looks like from above.
 *
 * Deliberately NOT the mentee hero card flipped around. That card showed one
 * relationship from the inside, because a student is deciding whether to enter
 * one. A mentor is deciding whether to take something on, so the useful image
 * is the roster: a small number of people, each with a stated direction and a
 * visible next step. The answer to "how much is this going to be" is legible
 * before a word of copy is read.
 *
 * Both students are demo identities that already exist in the application
 * (scripts/seed-demo.ts, @demo.mentee.app). Their names, headlines, schools and
 * goals are copied from those records rather than invented, and no real person
 * appears here: fabricating mentorship activity around a real student's profile
 * would be a lie about a real person, which the "Example" chip would not fix.
 *
 * Static. No state, no effects, no handlers, so the page stays a server
 * component and ships no JavaScript for it.
 */

const ROSTER = [
  {
    name: 'Ethan Robinson',
    who: 'CS Senior at Georgia Tech',
    goal: 'Break into product management',
    next: 'Session 4 · Thursday',
    open: '2 open items',
  },
  {
    name: 'Maya Thompson',
    who: 'MBA Student at Darden',
    goal: 'Transition into consulting',
    next: 'Session 2 · next week',
    open: '1 open item',
  },
];

export default function MenteeLedger() {
  return (
    <div className="bg-white rounded-xl border border-halo-rule shadow-lg overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-halo-veil border-b border-halo-rule">
        <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em]">
          Your mentees
        </p>
        <span className="text-[10px] font-medium text-halo-mist-body">Example</span>
      </div>

      <ul>
        {ROSTER.map((m) => (
          <li key={m.name} className="px-5 py-4 border-b border-halo-rule last:border-b-0">
            <p className="text-[14px] font-semibold text-halo-ink leading-snug">{m.name}</p>
            <p className="text-[11px] text-halo-mist-body font-light leading-snug mt-0.5">{m.who}</p>

            <p className="flex items-start gap-2 text-[12px] text-halo-heather leading-snug mt-3">
              <Target className="w-3.5 h-3.5 text-halo-mist-strong flex-none mt-px" aria-hidden="true" />
              {m.goal}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-halo-heather">
                <Calendar className="w-3 h-3 text-halo-mist-strong" aria-hidden="true" />
                {m.next}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-halo-heather">
                <Circle className="w-3 h-3 text-halo-mist-strong" aria-hidden="true" />
                {m.open}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="px-5 py-3 bg-halo-veil border-t border-halo-rule text-[11px] text-halo-mist-body leading-relaxed">
        Nobody appears here until you approve them.
      </p>
    </div>
  );
}
