import { Circle, FileText, MessageSquare } from 'lucide-react';

/**
 * The pre-meeting brief, which is the strongest thing on this page.
 *
 * It is real and it is mentor-only. app/(protected)/sessions/[id]/page.tsx
 * renders it behind `isMentor && isScheduled && preBrief`, and assembles it
 * from three queries: the action items still open on the mentorship, the
 * mentee's active goals, and the timestamp and preview of the last message.
 * The student never sees it. Nothing on the mentee page could make this
 * argument, which is why it gets its own centred section here.
 *
 * Centred and narrow, with the three sources named underneath. Every other
 * panel on this page is left aligned inside a two column section, so the change
 * of composition marks this as the payoff rather than one more feature.
 */

const SOURCES = ['Action items still open', 'Their active goals', 'When you last spoke'];

export default function PreMeetingBrief() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-xl border border-halo-rule shadow-sm overflow-hidden text-left">
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-halo-lav-wash border-b border-halo-rule">
          <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.12em]">
            <FileText className="w-3.5 h-3.5 text-halo-mist-strong" aria-hidden="true" />
            Pre-meeting brief: Ethan Robinson
          </p>
          <span className="text-[10px] font-medium text-halo-mist-body">Example</span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <p className="font-ui text-[10px] font-semibold text-halo-heather uppercase tracking-[0.12em] mb-2.5">
              Open action items (2)
            </p>
            <ul className="space-y-2">
              {[
                ['Ship one project end to end and write up what broke', 'Due in 9 days'],
                ['Draft three questions about the PM interview loop', 'Due Thursday'],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Circle className="w-3.5 h-3.5 text-halo-mist-strong flex-none mt-1" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[13px] text-halo-ink leading-snug">{t}</span>
                    <span className="block text-[11px] text-halo-mist-body mt-0.5">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-ui text-[10px] font-semibold text-halo-heather uppercase tracking-[0.12em] mb-2.5">
              Active goals
            </p>
            <ul className="space-y-1.5">
              {['Break into product management', 'Build PM skillset'].map((g) => (
                <li key={g} className="text-[13px] text-halo-ink leading-snug">
                  &middot; {g}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2.5 pt-1 border-t border-halo-rule">
            <MessageSquare className="w-3.5 h-3.5 text-halo-mist-strong flex-none mt-4" aria-hidden="true" />
            <p className="text-[12px] text-halo-mist-body leading-relaxed mt-3.5">
              Last message 5 days ago
            </p>
          </div>
        </div>
      </div>

      {/* What it is built from */}
      <ul className="flex flex-wrap justify-center gap-2 mt-5">
        {SOURCES.map((s) => (
          <li
            key={s}
            className="text-[12px] font-medium text-halo-heather bg-white border border-halo-rule rounded-full px-3 py-1"
          >
            {s}
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-halo-mist-body mt-3 leading-relaxed">
        Assembled from the mentorship itself. Nobody writes it, and the student does not
        see it.
      </p>
    </div>
  );
}
