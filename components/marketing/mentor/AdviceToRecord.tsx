import { ArrowDown, Circle } from 'lucide-react';

/**
 * A sentence a mentor says out loud, and the row it becomes.
 *
 * Neither a wheel nor a ladder. The home page already has the flywheel and the
 * mentee page already has context accumulating over time, so a third cyclical
 * device would just be the same idea drawn a third way. This is a single
 * transformation: spoken advice on top, the record it turns into underneath.
 * Two objects, one arrow, and the reader is done in four seconds.
 *
 * Real: either party can create an action item, assign it to themselves or to
 * the other person, and give it a due date; either party can tick it off. The
 * copy beside this is careful not to promise chasing or reminders, because the
 * product does not do that.
 */

export default function AdviceToRecord() {
  return (
    <div className="max-w-xl">
      {/* What you actually said */}
      <div className="rounded-xl border border-halo-rule bg-white p-5 sm:p-6">
        <p className="font-ui text-[10px] font-semibold text-halo-mist-body uppercase tracking-[0.18em] mb-3">
          What you said
        </p>
        <p className="text-[17px] sm:text-[18px] text-halo-ink font-light leading-relaxed">
          &ldquo;Before you apply anywhere, ship one thing end to end and write up what
          broke. That write up is the story you are missing.&rdquo;
        </p>
      </div>

      <div className="flex items-center gap-2.5 pl-5 py-3" aria-hidden="true">
        <span className="w-px h-7 bg-halo-rule" />
        <ArrowDown className="w-3.5 h-3.5 text-halo-mist-strong -ml-[7px]" />
        <span className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em]">
          Becomes
        </span>
      </div>

      {/* What it becomes */}
      <div className="rounded-xl border border-halo-purple/40 bg-white p-5 sm:p-6 shadow-sm">
        <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em] mb-3">
          An action item on the mentorship
        </p>
        <div className="flex items-start gap-2.5">
          <Circle className="w-4 h-4 text-halo-mist-strong flex-none mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[14px] text-halo-ink leading-snug">
              Ship one project end to end and write up what broke
            </p>
            <p className="text-[11px] text-halo-mist-body mt-1">
              Assigned to Ethan &middot; due in 9 days &middot; added by you
            </p>
          </div>
        </div>
        <p className="text-[13px] text-halo-mist-body leading-relaxed mt-4 pt-4 border-t border-halo-rule">
          You both see it. Next time you speak, it is either ticked or it is not, and that
          is a more useful thing to open on than trying to remember what you suggested.
        </p>
      </div>
    </div>
  );
}
