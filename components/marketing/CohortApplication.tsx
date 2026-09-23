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
  rows: number;
  min: number;
}

/*
  Three questions, all required.

  It was seven, six of them optional, which produced the worst of both worlds:
  a wall long enough to put off a thoughtful first year, and a form a careless
  applicant could clear in nine words. Fewer questions that everyone has to
  answer gives more signal and less friction at the same time.

  Each one earns its place by being hard to answer generically:

    working_toward  a goal you do not have cannot be faked into specificity.
    help_with       naming what you are actually unsure about requires knowing
                    what you do not know, which is the whole skill.
    already_done    the single strongest predictor in the set. Effort already
                    spent is a fact about the past, and someone expecting a
                    mentor to do the work has nothing to write here.

  Deliberately NOT asked: "why do you want a mentor", which anyone can answer
  well without revealing anything, and questions about internships, firms or
  achievements, which would select for the head start we exist to reduce.

  The minimums are one considered sentence, not an essay. High enough that
  "idk" fails, low enough that nobody pads.
*/
const QUESTIONS: Question[] = [
  {
    name: 'working_toward',
    label: 'What are you working toward right now?',
    hint: 'A goal, a decision you are stuck on, or something you are trying to understand. It does not have to be a career plan.',
    rows: 4,
    min: 80,
  },
  {
    name: 'help_with',
    label: 'What would you want a mentor\u2019s help thinking through?',
    hint: 'The part you cannot work out on your own is the useful answer here.',
    rows: 4,
    min: 80,
  },
  {
    name: 'already_done',
    label: 'What have you already done on your own to move toward it?',
    hint: 'Reading, classes, clubs, side projects, conversations, applications, anything. Small counts. Being honest that it is early counts too.',
    rows: 4,
    min: 80,
  },
];

const MAX = 1200;

/** Kept in step with the same list in the apply route. */
const YEARS = [
  'First year',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate student',
  'Recent graduate',
  'Other',
] as const;

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

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    /*
      The form carries noValidate so the browser's own bubbles do not fire, and
      validation happens here instead: one specific message naming the field,
      and focus moved to it. A generic "please fill in all fields" would make
      someone hunt for which one.
    */
    const say = (message: string, field: string) => {
      setError(message);
      setState('idle');
      requestAnimationFrame(() => {
        (form.querySelector(`#${field}`) as HTMLElement | null)?.focus();
      });
    };

    if (!String(data.full_name ?? '').trim()) return say('Please add your name.', 'full_name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email ?? '').trim())) {
      return say('Please add an email address we can reply to.', 'email');
    }
    if (!String(data.school ?? '').trim()) return say('Please add where you study.', 'school');
    if (!String(data.year ?? '').trim()) return say('Please choose where you are right now.', 'year');
    for (const q of QUESTIONS) {
      const value = String(data[q.name] ?? '').trim();
      if (!value) return say(`Please answer: ${q.label}`, q.name);
      if (value.length < q.min) {
        return say(
          `Could you say a little more about "${q.label}"? A sentence or two is plenty.`,
          q.name,
        );
      }
    }

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
      setError('That didn’t send. You may be offline. Your answers are still here, so you can try again.');
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
          Thanks, we’ve got it.
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
            School
          </label>
          <input id="school" name="school" required maxLength={160} autoComplete="organization" className={FIELD} />
        </div>
        <div>
          <label htmlFor="year" className="block text-[13px] font-semibold text-halo-ink mb-1.5">
            Where you are
          </label>
          {/*
            A list rather than a text box. Stage is context for deciding what
            kind of mentorship would help, and a free-text field produces forty
            spellings of the same four answers. It asks where someone is, not
            when they graduate: the two come apart for transfers, part-time
            students and anyone taking time out, and guessing one from the other
            would put a wrong fact in our own database.
          */}
          <select id="year" name="year" required defaultValue="" className={FIELD}>
            <option value="" disabled>Choose one</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/*
        Said once, right before the questions, because this is the moment
        someone decides what voice to write in. It is an invitation, not a
        warning: nothing here forbids spellcheck, grammar tools or assistive
        technology, and there is no checkbox to tick. The questions themselves
        do most of the work, since none of them can be answered well without
        knowing something only the applicant knows.
      */}
      <div className="rounded-2xl bg-halo-veil border border-halo-lavender px-5 py-4 sm:px-6 sm:py-5">
        <p className="text-[15px] text-halo-ink leading-relaxed">
          <span className="font-semibold">Write these in your own words.</span> We want to
          get to know you, not a polished version of you that a chatbot wrote. We are not
          judging your writing. We care about how you think, what you actually want, and
          whether you are ready to put the work in.
        </p>
        <p className="text-[14px] text-halo-heather leading-relaxed mt-2">
          Spellcheck and editing your own answers are completely fine. Specific and honest
          beats polished and impressive.
        </p>
      </div>

      <ol className="space-y-7">
        {QUESTIONS.map((q, i) => (
          <li key={q.name}>
            <label htmlFor={q.name} className="block text-[15px] font-semibold text-halo-ink mb-1">
              <span className="text-halo-purple-d tabular-nums mr-2">{String(i + 1).padStart(2, '0')}</span>
              {q.label}
            </label>
            {q.hint && (
              <p id={`${q.name}-hint`} className="text-[13px] text-halo-mist-body mb-2 leading-relaxed">
                {q.hint}
              </p>
            )}
            <textarea
              id={q.name}
              name={q.name}
              rows={q.rows}
              required
              minLength={q.min}
              maxLength={MAX}
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
