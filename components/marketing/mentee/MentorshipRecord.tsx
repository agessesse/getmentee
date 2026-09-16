import Image from 'next/image';
import { Calendar, CheckCircle2, Circle, Target } from 'lucide-react';

/**
 * The hero's thesis image: what a mentorship on Mentable actually consists of.
 *
 * A student arriving on this page has almost certainly seen a directory before,
 * so the fastest way to say "this is not that" is to show the objects the
 * product keeps — a shared goal, a scheduled session, open action items —
 * rather than a grid of faces.
 *
 * Static by design. There is no state, no effect and no event handler here, so
 * the page stays a server component and ships no JavaScript for it. The same
 * loop is shown again, in motion, further down the page in CarryOver.
 *
 * Hidden below lg, matching HeroPair on the landing page. The mobile hero is
 * the headline, the sentence and the two buttons; this idea returns at full
 * width in the sections below, so nothing is lost on a phone.
 *
 * The mentor is Christopher Floyd, whose title, employer and areas are the
 * verified fields already in data/mentors.ts. The goal, session and action
 * items are illustrative, which is what the "Example" label says.
 */

const ACTION_ITEMS = [
  { done: true,  text: 'Read how a rates desk is structured' },
  { done: false, text: 'Write down three questions before Thursday' },
];

export default function MentorshipRecord() {
  return (
    <div className="bg-white rounded-xl border border-halo-rule shadow-lg overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-halo-veil border-b border-halo-rule">
        <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em]">
          Your mentorship
        </p>
        <span className="text-[10px] font-medium text-halo-mist-body">Example</span>
      </div>

      <div className="p-5 space-y-3.5">
        {/* Who */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-none bg-halo-bone">
            <Image
              src="/people/christopher-floyd.jpg"
              alt=""
              fill
              className="object-cover"
              style={{ objectPosition: '50% 5%' }}
              sizes="48px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-halo-ink truncate">Christopher Floyd, CFA</p>
            <p className="text-[11px] text-halo-mist-body font-light truncate">
              Head of Institutional Sales &middot; Bondway.ai
            </p>
          </div>
        </div>

        {/* What you agreed to work on */}
        <div className="rounded-xl border border-halo-rule p-3.5">
          <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-2">
            <Target className="w-3.5 h-3.5 text-halo-mist-strong" aria-hidden="true" />
            Shared goal
          </p>
          <p className="text-[13px] font-medium text-halo-ink leading-snug">
            Understand how a fixed-income desk is actually run
          </p>
          <p className="text-[11px] text-halo-mist-body mt-1">Target: June 2027</p>
        </div>

        {/* When you next speak */}
        <div className="rounded-xl bg-halo-deep p-3.5">
          <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-lavender uppercase tracking-[0.12em] mb-2">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            Next session
          </p>
          <p className="text-[13px] font-medium text-white leading-snug">Thursday &middot; 45 minutes</p>
        </div>

        {/* What each of you owes the other */}
        <div className="rounded-xl border border-halo-rule p-3.5">
          <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-2.5">
            Action items
          </p>
          <ul className="space-y-2">
            {ACTION_ITEMS.map((item) => (
              <li key={item.text} className="flex items-start gap-2.5">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-halo-purple flex-none mt-px" aria-hidden="true" />
                ) : (
                  <Circle className="w-4 h-4 text-halo-mist-strong flex-none mt-px" aria-hidden="true" />
                )}
                <span
                  className={`text-[12px] leading-snug ${
                    item.done ? 'text-halo-mist-body line-through font-light' : 'text-halo-heather'
                  }`}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
