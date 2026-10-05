'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { savePrep } from '@/app/(protected)/mentorship/[id]/actions';
import type { PrepFields } from '@/lib/mentorship/workspace-data';

/**
 * The mentor's preparation.
 *
 * MOSTLY READING, NOT WRITING. A mentor is a busy person doing a favour, and
 * the useful thing to hand them is not a form, it is thirty seconds of
 * context: what this person wants help with, what they actually asked, and
 * what has moved since last time. The one input is a private notebook, and
 * it is optional.
 *
 * WHAT IT SHOWS IS WHAT THE MENTEE CHOSE TO SHARE. The three blocks below
 * come from the mentee's own preparation and from commitments both people
 * agreed to. Nothing is surfaced because the viewer happens to be the
 * mentor: there is no private note, no message, and no profile field in
 * here that the mentee did not deliberately put in front of this
 * conversation.
 */
export default function PrepareMentor({
  mentorshipId,
  sessionId,
  menteeFirstName,
  menteePrep,
  initialNotes,
  since,
}: {
  mentorshipId: string;
  sessionId: string;
  menteeFirstName: string;
  menteePrep: PrepFields;
  initialNotes: string | null;
  since: { id: string; label: string }[];
}) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const persist = useCallback(
    (n: string) => {
      setState('saving');
      void savePrep(mentorshipId, sessionId, { notes: n }).then((r) =>
        setState(r.ok ? 'saved' : 'idle'),
      );
    },
    [mentorshipId, sessionId],
  );

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(notes), 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [notes, persist]);

  const nothingShared =
    !menteePrep.focus && !menteePrep.changed && menteePrep.questions.length === 0;

  return (
    <div className="space-y-8">
      {nothingShared ? (
        <div className="rounded-2xl border border-dashed border-halo-rule px-5 py-6">
          <p className="text-[14.5px] text-halo-heather leading-relaxed max-w-md">
            {menteeFirstName} hasn&rsquo;t added anything yet. If they do before you meet,
            it will show up here.
          </p>
        </div>
      ) : (
        <>
          {menteePrep.focus && (
            <Block label={`${menteeFirstName} wants help with`}>
              <p className="text-[16px] text-halo-ink leading-relaxed">{menteePrep.focus}</p>
            </Block>
          )}

          {menteePrep.questions.length > 0 && (
            <Block label={`Questions ${menteeFirstName} added`}>
              <ol className="space-y-2.5">
                {menteePrep.questions.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-ui text-[12.5px] text-halo-mist-body tabular-nums pt-0.5 flex-none">
                      {i + 1}.
                    </span>
                    <span className="text-[15px] text-halo-ink leading-relaxed">{q}</span>
                  </li>
                ))}
              </ol>
            </Block>
          )}

          {menteePrep.changed && (
            <Block label="What has changed">
              <p className="text-[15px] text-halo-heather leading-relaxed">{menteePrep.changed}</p>
            </Block>
          )}
        </>
      )}

      {since.length > 0 && (
        <Block label="Since you last spoke">
          <ul className="space-y-1.5">
            {since.map((s) => (
              <li key={s.id} className="flex items-start gap-2.5 text-[14.5px] text-halo-heather">
                <Check className="h-4 w-4 flex-none text-halo-brand-text mt-0.5" aria-hidden="true" />
                {s.label}
              </li>
            ))}
          </ul>
        </Block>
      )}

      <div>
        <p className="text-[15px] font-medium text-halo-ink">Your notes</p>
        <p className="text-[13px] text-halo-mist-body mt-0.5 mb-2.5">
          Private to you. {menteeFirstName} cannot see this.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Two desks worth mentioning. Ask what they actually enjoyed about the markets conversations."
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-3 text-[15px] text-halo-ink leading-relaxed placeholder:text-halo-mist-strong resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />
        <p aria-live="polite" className="text-[12.5px] text-halo-mist-body h-4 mt-1.5">
          {state === 'saving' ? 'Saving' : state === 'saved' ? 'Saved' : ''}
        </p>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}
