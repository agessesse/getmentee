'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { recordOutcome } from '@/app/(protected)/mentorship/[id]/outcome-actions';
import {
  questionsFor, acknowledgement,
  type Usefulness, type ContinueIntent,
} from '@/lib/mentorship/outcomes';

/**
 * Two questions, once, after the first conversation that actually happened.
 *
 * DESIGNED TO BE DISMISSIBLE, and that is not a weakness. A prompt that
 * cannot be escaped gets answered carelessly to make it go away, which is
 * worse than no answer: a careless "Very useful" is indistinguishable from
 * a real one and quietly poisons the only honest data this product has.
 * "Not now" leaves the row unwritten.
 *
 * The note field appears only AFTER both answers, and only when something
 * went wrong. Asking everyone to write prose drops the completion rate for
 * the two answers that matter, and the people with nothing to add are
 * exactly the people who had a fine time.
 *
 * Nothing here ever shows the other person's answer, because there is no
 * surface that can: the table is service-role only and no loader reads a
 * counterpart's row.
 */
export default function ConversationOutcome({
  mentorshipId,
  sessionId,
  role,
  partnerFirstName,
}: {
  mentorshipId: string;
  sessionId: string;
  role: 'mentee' | 'mentor';
  partnerFirstName: string;
}) {
  const q = questionsFor(role);
  const [usefulness, setUsefulness] = useState<Usefulness | null>(null);
  const [continueIntent, setContinueIntent] = useState<ContinueIntent | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');
  const [saving, start] = useTransition();

  if (dismissed) return null;

  if (done) {
    return (
      <section className="rounded-2xl border border-halo-rule bg-white px-5 py-4">
        <p className="inline-flex items-start gap-2 text-[14px] text-halo-ink leading-relaxed">
          <Check className="h-4 w-4 flex-none mt-0.5 text-halo-brand-text" aria-hidden="true" />
          {done}
        </p>
      </section>
    );
  }

  const ready = usefulness !== null && continueIntent !== null;
  /* Only when something went wrong. See the note above. */
  const wantsNote = ready && (usefulness === 'low' || continueIntent === 'no');

  const submit = () => {
    if (!ready) return;
    start(async () => {
      const r = await recordOutcome(mentorshipId, sessionId, { usefulness, continueIntent, note });
      if (r.ok) setDone(acknowledgement({ usefulness, continueIntent }, role));
      else setError(r.error);
    });
  };

  return (
    <section className="rounded-2xl border border-halo-rule bg-white p-5 sm:p-6">
      <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
        After your conversation
      </p>
      <p className="mt-2 text-[14px] text-halo-heather leading-relaxed max-w-md">
        Two questions about your conversation with {partnerFirstName}. {partnerFirstName} never
        sees your answers.
      </p>

      <div className="mt-5 space-y-5">
        <Question
          prompt={q.usefulness.prompt}
          choices={q.usefulness.choices}
          value={usefulness}
          onChange={setUsefulness}
        />
        <Question
          prompt={q.continueIntent.prompt}
          choices={q.continueIntent.choices}
          value={continueIntent}
          onChange={setContinueIntent}
        />

        {wantsNote && (
          <div>
            <label htmlFor="outcome-note" className="block text-[13.5px] font-medium text-halo-ink mb-1.5">
              Anything you want to say about why? Optional.
            </label>
            <textarea
              id="outcome-note"
              rows={2}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple bg-white placeholder-halo-mist-body resize-none"
              placeholder="Only read by Mentable, and only to make the next match better."
            />
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-[13px] text-red-700">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={submit}
          disabled={!ready || saving}
          className="rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-halo-purple-d disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {saving ? 'Saving…' : 'Send'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[13px] text-halo-heather underline underline-offset-2 transition-colors hover:text-halo-ink"
        >
          Not now
        </button>
      </div>
    </section>
  );
}

function Question<T extends string>({ prompt, choices, value, onChange }: {
  prompt: string;
  choices: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[14.5px] text-halo-ink mb-2.5">{prompt}</legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => {
          const on = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(c.value)}
              className={`rounded-xl border px-4 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                on
                  ? 'border-halo-purple bg-halo-purple text-white'
                  : 'border-halo-rule bg-white text-halo-heather hover:border-halo-purple hover:text-halo-ink'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
