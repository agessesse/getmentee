'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { savePrep } from '@/app/(protected)/mentorship/[id]/actions';
import type { PrepFields } from '@/lib/mentorship/workspace-data';

/**
 * The mentee's preparation.
 *
 * NOT A FORM. There is no submit button and no required field, because this
 * is not data collection, it is someone thinking before a conversation. It
 * saves itself about a second after you stop typing, and says so quietly.
 * A giant "Submit preparation" at the bottom would make a person feel they
 * were filing something with the university.
 *
 * The questions are a real list rather than a textarea, because the mentor's
 * side renders them numbered, and because three separate boxes make you
 * write three separate questions. One box makes you write a paragraph.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: suggest questions. The brief rules out
 * AI this pass, and it is right to. A generated question is one the mentee
 * did not think of, which is the entire value of the exercise.
 */
export default function PrepareMentee({
  mentorshipId,
  sessionId,
  initial,
  mentorFirstName,
  lastCommitments,
}: {
  mentorshipId: string;
  sessionId: string;
  initial: PrepFields;
  mentorFirstName: string;
  lastCommitments: { id: string; title: string; done: boolean }[];
}) {
  const [focus, setFocus] = useState(initial.focus ?? '');
  const [changed, setChanged] = useState(initial.changed ?? '');
  const [questions, setQuestions] = useState<string[]>(
    initial.questions.length ? initial.questions : [''],
  );
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const persist = useCallback(
    (f: string, c: string, q: string[]) => {
      setState('saving');
      void savePrep(mentorshipId, sessionId, {
        focus: f,
        changed: c,
        questions: q.filter((x) => x.trim() !== ''),
      }).then((r) => setState(r.ok ? 'saved' : 'idle'));
    },
    [mentorshipId, sessionId],
  );

  // Debounced autosave. Skipped on mount so simply opening the page does not
  // write an empty prep over something already there.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(focus, changed, questions), 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [focus, changed, questions, persist]);

  const setQ = (i: number, v: string) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? v : q)));

  return (
    <div className="space-y-8">
      <Field
        label="What do you want help with?"
        hint="One sentence. This is the first thing your mentor will see."
      >
        <textarea
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          rows={2}
          placeholder="Choosing between investment banking and markets."
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-3 text-[15px] text-halo-ink leading-relaxed placeholder:text-halo-mist-strong resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />
      </Field>

      <Field
        label="What has changed since you last spoke?"
        hint="Progress, setbacks, anything that moved."
      >
        <textarea
          value={changed}
          onChange={(e) => setChanged(e.target.value)}
          rows={3}
          placeholder="I spoke to two people on the markets desk and it shifted how I'm thinking."
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-3 text-[15px] text-halo-ink leading-relaxed placeholder:text-halo-mist-strong resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />
      </Field>

      <Field
        label={`What do you want to ask ${mentorFirstName}?`}
        hint="Specific questions get specific answers."
      >
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-ui text-[12px] text-halo-mist-body pt-3.5 w-4 flex-none tabular-nums">
                {i + 1}.
              </span>
              <input
                value={q}
                onChange={(e) => setQ(i, e.target.value)}
                placeholder={i === 0 ? 'How did you decide which side of Markets suited you?' : 'Add another question'}
                className="flex-1 rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink placeholder:text-halo-mist-strong focus:outline-none focus:ring-2 focus:ring-halo-purple"
              />
              {questions.length > 1 && (
                <button
                  onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                  aria-label={`Remove question ${i + 1}`}
                  className="mt-2.5 p-1 text-halo-mist-strong hover:text-halo-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {questions.length < 8 && (
          <button
            onClick={() => setQuestions((qs) => [...qs, ''])}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-halo-brand-text hover:text-halo-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add a question
          </button>
        )}
      </Field>

      {/*
        Read-only, and pulled from what was actually agreed. The brief asks
        "what did you commit to last time?" and the honest answer is already
        in the database, so this is a reminder rather than a question.
      */}
      {lastCommitments.length > 0 && (
        <Field label="What you committed to last time" hint={null}>
          <ul className="space-y-1.5">
            {lastCommitments.map((c) => (
              <li key={c.id} className="flex items-start gap-2.5 text-[14px]">
                <Check
                  className={`h-4 w-4 flex-none mt-0.5 ${c.done ? 'text-halo-brand-text' : 'text-halo-mist'}`}
                  aria-hidden="true"
                />
                <span className={c.done ? 'text-halo-mist-body line-through decoration-halo-rule' : 'text-halo-ink'}>
                  {c.title}
                </span>
              </li>
            ))}
          </ul>
        </Field>
      )}

      <p aria-live="polite" className="text-[12.5px] text-halo-mist-body h-4">
        {state === 'saving' ? 'Saving' : state === 'saved' ? 'Saved' : ''}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[15px] font-medium text-halo-ink">{label}</p>
      {hint && <p className="text-[13px] text-halo-mist-body mt-0.5 mb-2.5">{hint}</p>}
      {!hint && <div className="mb-2.5" />}
      {children}
    </div>
  );
}
