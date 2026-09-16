import { Calendar, CheckCircle2, Circle, Target } from 'lucide-react';

/**
 * Everything the product holds about one mentorship, in one view.
 *
 * Composed as a single panel on purpose. The mentee page's section on this
 * band is three stacked cards joined by arrows, because a student is being
 * shown a loop unfolding over time. A mentor is not asking "what is the
 * process", they are asking "when I come back in three weeks, is it all in one
 * place". So the answer is one object with labelled regions, not a sequence.
 *
 * Every region is a real field: the shared goal and its target date from
 * mentorship_goals, the recap a mentor writes after a completed session
 * (sessions.mentor_recap, mentor-only), action items with an owner and a due
 * date, and the next scheduled session with its duration.
 *
 * Ivory panel on the deep band rather than the translucent deep-panel surface,
 * so the record reads as the solid thing and the band reads as the ground.
 */

export default function MentorshipWorkspace() {
  return (
    <div className="bg-halo-ivory rounded-xl overflow-hidden shadow-lg">
      {/* Who */}
      <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-halo-rule">
        <div className="min-w-0">
          <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-1.5">
            Mentee
          </p>
          <p className="text-[16px] font-semibold text-halo-ink leading-snug">Ethan Robinson</p>
          <p className="text-[12px] text-halo-mist-body font-light leading-snug mt-0.5">
            CS Senior at Georgia Tech
          </p>
        </div>
        <span className="text-[10px] font-medium text-halo-mist-body flex-none pt-1">Example</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        {/* Direction */}
        <div className="px-5 sm:px-6 py-5 border-b sm:border-r border-halo-rule">
          <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-2.5">
            <Target className="w-3.5 h-3.5 text-halo-mist-strong" aria-hidden="true" />
            Working toward
          </p>
          <p className="text-[14px] font-medium text-halo-ink leading-snug">
            Break into product management
          </p>
          <p className="text-[11px] text-halo-mist-body mt-1.5">Target: May 2027</p>
        </div>

        {/* When you next speak */}
        <div className="px-5 sm:px-6 py-5 border-b border-halo-rule">
          <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-2.5">
            <Calendar className="w-3.5 h-3.5 text-halo-mist-strong" aria-hidden="true" />
            Next session
          </p>
          <p className="text-[14px] font-medium text-halo-ink leading-snug">Thursday, 45 minutes</p>
          <p className="text-[11px] text-halo-mist-body mt-1.5">Booked into a window you published</p>
        </div>
      </div>

      {/* What you said last time */}
      <div className="px-5 sm:px-6 py-5 border-b border-halo-rule">
        <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-2.5">
          Your recap of session three
        </p>
        <p className="text-[13px] text-halo-heather leading-relaxed">
          Walked through how product decisions actually get made when engineering owns the
          roadmap. He has the technical side. What he is missing is a story about a
          decision he made and why.
        </p>
      </div>

      {/* What is outstanding */}
      <div className="px-5 sm:px-6 py-5">
        <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em] mb-3">
          Open action items
        </p>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-2.5">
            <Circle className="w-4 h-4 text-halo-mist-strong flex-none mt-px" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[13px] text-halo-ink leading-snug">
                Ship one project end to end and write up what broke
              </span>
              <span className="block text-[11px] text-halo-mist-body mt-0.5">
                Ethan &middot; due in 9 days
              </span>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-halo-purple flex-none mt-px" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[13px] text-halo-mist-body leading-snug line-through font-light">
                Send him the two PM job descriptions to compare
              </span>
              <span className="block text-[11px] text-halo-mist-body mt-0.5">You &middot; done</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
