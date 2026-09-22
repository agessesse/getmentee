'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { trackLandingEvent } from '@/lib/landing-analytics';

/**
 * The founding cohort application.
 *
 * WHAT IT IS TRYING TO SELECT FOR. Not the best résumé. Mentorship already
 * flows toward people who know how to ask for it, and a form that rewards
 * polish would reproduce exactly the problem Mentable exists to reduce. So the
 * questions ask what someone wants to understand, what they have already tried,
 * and what they think respecting a mentor's time looks like — things a first
 * generation student can answer as well as anyone.
 *
 * WHY ONLY ONE QUESTION IS REQUIRED. A seven-essay wall selects for stamina
 * with forms. Name, email and "what are you trying to figure out" are enough
 * to have a real conversation; everything else helps, and says so, without
 * blocking submission.
 *
 * WHERE IT GOES. POST /api/founding-cohort/apply, a server route holding the
 * service-role key. There is deliberately no client-side write path to the
 * applications table.
 */

interface Question {
  name: string;
  label: string;
  hint?: string;
  rows?: number;
  required?: boolean;
}

const QUESTIONS: Question[] = [
  {
    name: 'learning',
    label: 'What are you trying to learn or figure out right now?',
    hint: 'Plain language is fine. "I don’t know what consulting actually is" is a real answer.',
    rows: 4,
    required: true,
  },
  {
    name: 'why_mentor',
    label: 'Why would talking to someone a few steps ahead of you be useful?',
    rows: 3,
  },
  {
    name: 'tried',
    label: 'What have you already done to try to answer this yourself?',
    hint: 'Reading, classes, clubs, asking around, anything. There is no wrong amount.',
    rows: 3,
  },
  {
    name: 'thirty_min',
    label: 'If you had thirty minutes with someone two to ten years ahead of you, what would you want to understand?',
    rows: 3,
  },
  {
    name: 'good_use',
    label: 'What does making good use of someone’s time look like to you?',
    rows: 3,
  },
  {
    name: 'field',
    label: 'Is there a particular field, path, or transition you’re trying to understand?',
    hint: 'Optional. "Not sure yet" is an honest answer and not a bad one.',
    rows: 2,
  },
  {
    name: 'worth_it',
    label: 'What would make this worth it even if it didn’t lead to an internship, a job, or an introduction?',
    rows: 3,
  },
];

const FIELD =
  'w-full px-3.5 py-2.5 bg-white border border-halo-rule rounded-xl text-[15px] text-halo-ink placeholder:text-halo-mist ' +
  'focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent';

export default function CohortApplication() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const onFirstInput = () => {
    if (started.current) return;
    started.current = true;
    trackLandingEvent('cohort_application_started');
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setError(null);
    setState('sending');

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch('/api/founding-cohort/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? 'We couldn’t send that. Please try again in a moment.');
        setState('idle');
        // Move the person to the message rather than leaving them guessing.
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }

      trackLandingEvent('cohort_application_submitted');
      // One confirmation whether or not this email had applied before: the
      // server deliberately does not distinguish the two, so neither can this.
      setState('done');
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch {
      setError('That didn’t send — you may be offline. Your answers are still here, so you can try again.');
      setState('idle');
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  if (state === 'done') {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        className="bg-white border border-halo-rule rounded-2xl px-6 py-8 sm:px-8 sm:py-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <h3 className="font-display text-[1.75rem] leading-tight text-halo-ink mb-3">
          Thanks — we’ve got it.
        </h3>
        <p className="text-[15px] text-halo-heather leading-relaxed max-w-lg mb-2">
          We read every application ourselves, so a reply takes a few days rather than a few
          minutes. We’ll email you either way.
        </p>
        <p className="text-[15px] text-halo-heather leading-relaxed max-w-lg">
          In the meantime, <Link href="/networking" className="text-halo-purple-d font-medium hover:text-halo-ink">Networking 101</Link>{' '}
          is free and open to anyone. It is the thing we would tell you to read first.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} onInput={onFirstInput} noValidate className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="full_name" className="block text-[13px] font-semibold text-halo-ink mb-1.5">
            Your name
          </label>
          <input id="full_name" name="full_name" required autoComplete="name" className={FIELD} />
        </div>
        <div>
          <label htmlFor="email" className="block text-[13px] font-semibold text-halo-ink mb-1.5">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={FIELD} />
        </div>
        <div>
          <label htmlFor="school" className="block text-[13px] font-semibold text-halo-ink mb-1.5">
            School <span className="font-normal text-halo-mist-body">(optional)</span>
          </label>
          <input id="school" name="school" autoComplete="organization" className={FIELD} />
        </div>
        <div>
          <label htmlFor="year" className="block text-[13px] font-semibold text-halo-ink mb-1.5">
            Year <span className="font-normal text-halo-mist-body">(optional)</span>
          </label>
          <input id="year" name="year" placeholder="First year, sophomore, recent grad…" className={FIELD} />
        </div>
      </div>

      <ol className="space-y-7">
        {QUESTIONS.map((q, i) => (
          <li key={q.name}>
            <label htmlFor={q.name} className="block text-[15px] font-semibold text-halo-ink mb-1">
              <span className="text-halo-purple-d tabular-nums mr-2">{String(i + 1).padStart(2, '0')}</span>
              {q.label}
              {!q.required && <span className="font-normal text-halo-mist-body"> (optional)</span>}
            </label>
            {q.hint && (
              <p id={`${q.name}-hint`} className="text-[13px] text-halo-mist-body mb-2 leading-relaxed">
                {q.hint}
              </p>
            )}
            <textarea
              id={q.name}
              name={q.name}
              rows={q.rows ?? 3}
              required={q.required}
              aria-describedby={q.hint ? `${q.name}-hint` : undefined}
              className={`${FIELD} resize-y`}
            />
          </li>
        ))}
      </ol>

      {/* Announced the moment it appears, and focusable so the keyboard lands on it. */}
      <p
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        aria-live="polite"
        className={`text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${error ? '' : 'sr-only'}`}
      >
        {error ?? ''}
      </p>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {state === 'sending' ? 'Sending…' : 'Send my application'}
        </button>
        <p className="text-[13px] text-halo-mist-body">
          We’ll only use this to read your application and reply.
        </p>
      </div>
    </form>
  );
}
