import { ArrowDown, Calendar, CheckCircle2, Circle, FileText } from 'lucide-react';

/**
 * The loop that starts once a mentor says yes.
 *
 * This is the page's actual argument, so it gets the deep band. A networking
 * product ends at the introduction; here the introduction is where the record
 * starts. The three blocks are one mechanism, not three features: a session
 * leaves action items, and the next session opens with the ones still open.
 *
 * All three are real. Sessions carry notes and a duration, action items carry
 * an owner and a due date and either party can create one, and the brief that
 * opens a session is assembled from the open action items, the shared goals and
 * the last message on the mentorship.
 *
 * The carried item is deliberately the same string in block two and block
 * three. That repetition is the whole point, and a reader who notices it has
 * understood the section without reading the copy beside it.
 */

const CARRIED = 'Write down three questions on desk structure';

export default function CarryOver() {
  return (
    <div className="max-w-md">
      {/* 1 — the conversation */}
      <div className="rounded-xl bg-halo-deep-panel border border-halo-deep-rule p-4">
        <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-lavender uppercase tracking-[0.18em] mb-2.5">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          Session one &middot; 45 minutes
        </p>
        <p className="text-[13px] text-white leading-relaxed">
          You talk. Afterwards the notes are saved on the mentorship, not in a document
          one of you will lose.
        </p>
      </div>

      <Connector label="Ends with" />

      {/* 2 — what each of you owes */}
      <div className="rounded-xl bg-halo-deep-panel border border-halo-deep-rule p-4">
        <p className="font-ui text-[10px] font-semibold text-halo-lavender uppercase tracking-[0.18em] mb-3">
          Action items
        </p>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-2.5">
            <Circle className="w-4 h-4 text-halo-lavender flex-none mt-px" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[13px] text-white leading-snug">{CARRIED}</span>
              <span className="block text-[11px] text-halo-lavender mt-0.5">You &middot; due Thursday</span>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-halo-lavender flex-none mt-px" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[13px] text-halo-lavender leading-snug line-through font-light">
                Send over the desk primer
              </span>
              <span className="block text-[11px] text-halo-lavender mt-0.5">Christopher &middot; done</span>
            </span>
          </li>
        </ul>
      </div>

      <Connector label="Carried forward into" />

      {/* 3 — and the loop closes */}
      <div className="rounded-xl bg-halo-ivory p-4">
        <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em] mb-3">
          <FileText className="w-3.5 h-3.5 text-halo-mist-strong" aria-hidden="true" />
          Session two &middot; opens with your brief
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <Circle className="w-4 h-4 text-halo-mist-strong flex-none mt-px" aria-hidden="true" />
            <span className="text-[13px] text-halo-ink leading-snug">{CARRIED}</span>
          </li>
          <li className="text-[12px] text-halo-mist-body leading-relaxed pl-[26px]">
            Plus the goal you two agreed on, and where you left the conversation.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 pl-4 py-2.5" aria-hidden="true">
      <span className="w-px h-6 bg-halo-deep-rule" />
      <ArrowDown className="w-3.5 h-3.5 text-halo-lavender -ml-[7px]" />
      <span className="font-ui text-[10px] font-semibold text-halo-lavender uppercase tracking-[0.18em]">
        {label}
      </span>
    </div>
  );
}
