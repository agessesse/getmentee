'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  type Field, type Question, type Role,
  basicsFor, questionsFor, choicesFor, allFieldsFor, validate, isRole,
} from '@/lib/apply/schema';
import { trackLandingEvent } from '@/lib/landing-analytics';

/**
 * The application, as one journey rather than one wall.
 *
 * WHAT THIS REPLACES. A single mentee-only form at /founding-cohort, reached
 * from a nav item labelled "Apply", while every mentor CTA on the site pointed
 * at /signup?role=mentor — an account in a product with no students in it yet.
 * A professional who clicked "Become a founding mentor" was asked to create a
 * password, not to apply. There is now one application with two paths.
 *
 * WHY ROLE COMES FIRST. Asking for a name before knowing which experience
 * someone needs means either showing fields that do not apply or rewriting
 * them underneath the person mid-form. The first question is therefore the
 * only question that changes everything after it.
 *
 * STEPS, AND WHY NOT ONE PAGE. The mentor path asks seven short fields and
 * four written answers. Presented at once that is a wall, and a wall is what
 * a busy professional closes. Split into four short screens with the end in
 * sight, it reads as a form someone finishes. Nothing is hidden to seem
 * shorter than it is: the progress rail names every step up front.
 *
 * STATE. All answers live in one object for the life of the page, so a failed
 * validation, a step back, or a browser Back never loses typed text. Steps and
 * role are both mirrored into the URL, so Back walks the journey, refresh
 * lands where you were, and /apply?role=mentor skips the selector.
 */

const FIELD_BASE =
  'w-full px-3.5 py-2.5 bg-white border border-halo-rule rounded-xl text-[15px] text-halo-ink ' +
  'placeholder:text-halo-mist transition-shadow focus:outline-none focus:ring-2 ' +
  'focus:ring-halo-purple focus:border-transparent';
const EYEBROW = 'font-ui text-[11px] font-semibold uppercase tracking-[0.14em]';

interface Step {
  id: string;
  /** Shown in the progress rail. Short enough to fit four across a phone. */
  short: string;
  title: string;
  lead: string;
  fields: (Field | Question)[];
}

/* The journey, per role. Grouped by what the step is asking about rather than
   by field type, so each screen has one idea. */
function stepsFor(role: Role): Step[] {
  const basics = basicsFor(role);
  const qs = questionsFor(role);
  const choices = choicesFor(role);

  if (role === 'mentor') {
    return [
      { id: 'about', short: 'You', title: 'About you',
        lead: 'Enough for us to know who we are talking to, and to see your background without asking you to retype it.',
        fields: basics },
      { id: 'offer', short: 'Offer', title: 'What you can help with',
        lead: 'The useful version is specific. It is what decides whether a student’s request is a good match for you.',
        fields: [qs[0], qs[1]] },
      { id: 'expect', short: 'Expectations', title: 'How you would want it to work',
        lead: 'Setting this out now is what stops mentorship turning into a second job later.',
        fields: [qs[2], qs[3], ...choices] },
    ];
  }
  return [
    { id: 'about', short: 'You', title: 'About you',
      lead: 'The basics. Where you study and what stage you are at help us understand what kind of mentorship would actually help.',
      fields: basics },
    { id: 'goal', short: 'Goal', title: 'What you are working toward',
      lead: 'There are no right answers here. We are trying to understand what you want and why now.',
      fields: [qs[0], qs[1], qs[2]] },
    { id: 'effort', short: 'Effort', title: 'What you have already done',
      lead: 'This matters more than anything else you will write. Specific and honest beats polished and impressive.',
      fields: [qs[3], qs[4]] },
  ];
}

const ROLE_CARDS: { role: Role; title: string; body: string; points: string[] }[] = [
  {
    role: 'mentee',
    title: 'I want to find a mentor',
    body: 'You are a student or recent graduate trying to work something out, and you would like to talk to someone who has already done it.',
    points: ['Five short questions', 'No résumé, no GPA, no network needed'],
  },
  {
    role: 'mentor',
    title: 'I want to become a mentor',
    body: 'You are further along, and you are willing to answer the questions you once had to work out the hard way.',
    points: ['Four short questions', 'You choose who you take on, and you can say no'],
  },
];

/*
  What Mentable is, for someone who arrived from a message rather than from the
  homepage — which, during outreach, is most people. It sits on the first
  screen of either path and then gets out of the way: repeating it above every
  step pushed the actual questions below the fold on a phone.
*/
function Preamble() {
  return (
    <div className="mb-9">
      <p className="text-[17px] text-halo-heather leading-relaxed max-w-xl">
        Mentable pairs students with people a few steps ahead of them, and gives the
        relationship somewhere to live afterwards: shared goals, preparation before a
        conversation, and a record of what you each said you would do.
      </p>
      <p className="text-[15px] text-halo-mist-body leading-relaxed max-w-xl mt-3">
        We are early and starting small, so we read every application ourselves.
      </p>
      {/*
        The wrong-door case, answered before someone fills in an application
        they do not need. A returning member who cannot find Sign in will
        apply again, and a second application from an existing member is the
        one duplicate this funnel can actually produce. Deliberately quiet:
        one line of body text, not a second button competing with Start.
      */}
      <p className="text-[14.5px] text-halo-mist-body leading-relaxed mt-4">
        Already have a Mentable account?{' '}
        <Link href="/login" className="text-halo-purple-d font-medium hover:text-halo-ink underline underline-offset-2">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}

export default function ApplyJourney({ initialRole }: { initialRole: Role | null }) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<{ field: string; message: string } | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  // Set while a popstate is being applied, so the effect that writes history
  // does not immediately push the entry it just came from back on.
  const fromPop = useRef(false);

  const steps = useMemo(() => (role ? stepsFor(role) : []), [role]);
  const onReview = role !== null && step === steps.length;
  const total = steps.length + 1; // the review screen is a step to the reader

  /*
    A step in the URL is only meaningful while the answers are in memory.

    Answers are deliberately not persisted anywhere, so a refresh on
    ?step=2 would drop someone into "what have you already done" with the
    first two screens silently blank. On a cold load the step is therefore
    dropped and the journey restarts, which is the only coherent state. Back
    and Forward within the session still walk the steps, because those never
    remount.
  */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!sp.has('step')) return;
    sp.delete('step');
    const q = sp.toString();
    window.history.replaceState({ role: initialRole, step: 0 }, '', `/apply${q ? `?${q}` : ''}`);
    // Mount only: this is about how the page was entered, not later moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── URL, so Back / refresh / a pasted link all behave ─────────────────── */
  useEffect(() => {
    if (fromPop.current) { fromPop.current = false; return; }
    const url = role ? `/apply?role=${role}${step > 0 ? `&step=${step}` : ''}` : '/apply';
    if (url === window.location.pathname + window.location.search) return;
    // Choosing a role or moving a step is a place you can come back to.
    window.history.pushState({ role, step }, '', url);
  }, [role, step]);

  /*
    The URL is the source of truth on Back, not history.state.

    The entry the journey starts on was pushed by Next's router, so its state
    belongs to Next and carries no role or step of ours. Reading it meant
    Back from step two landed on the role selector with the answers still in
    memory but invisible. Parsing the query string instead works for every
    entry — ours, Next's, and a link someone pasted — and is the same code
    path as a cold load.
  */
  useEffect(() => {
    const onPop = () => {
      fromPop.current = true;
      const sp = new URLSearchParams(window.location.search);
      const r = sp.get('role');
      const nextRole = isRole(r) ? r : null;
      const raw = Number(sp.get('step') ?? 0);
      const max = nextRole ? stepsFor(nextRole).length : 0;
      setRole(nextRole);
      setStep(Number.isInteger(raw) && raw > 0 ? Math.min(raw, max) : 0);
      setProblem(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* Moving between steps has to announce itself to a screen reader and put the
     eye at the top of the new screen, not halfway down the previous one. */
  useEffect(() => {
    if (state === 'done') return;
    headingRef.current?.focus();
    if (role) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, role, state]);

  const set = useCallback((name: string, value: string) => {
    if (!started.current) {
      started.current = true;
      // Kept alongside the new name so the existing series does not break.
      trackLandingEvent('cohort_application_started');
      trackLandingEvent('apply_started', { role: role ?? 'unknown' });
    }
    setAnswers((a) => ({ ...a, [name]: value }));
    setProblem((p) => (p?.field === name ? null : p));
  }, [role]);

  const focusField = (name: string) =>
    requestAnimationFrame(() => document.getElementById(name)?.focus());


  function next() {
    if (!role) return;
    const names = new Set(steps[step].fields.map((f) => f.name));
    const partial = Object.fromEntries(
      allFieldsFor(role).map((f) => [f.name, names.has(f.name) ? (answers[f.name] ?? '') : 'x'.repeat(400)]),
    );
    const p = validate(role, partial);
    if (p && names.has(p.field)) { setProblem(p); focusField(p.field); return; }
    setProblem(null);
    // Fired on the step just finished, which is what makes the drop-off
    // between steps readable. The value is a position, never an answer.
    trackLandingEvent('application_step_completed', { role, step: step + 1 });
    setStep((s) => s + 1);
  }

  async function submit() {
    if (!role || state === 'sending') return;
    const p = validate(role, answers);
    if (p) {
      // Send the person back to the step that owns the problem rather than
      // failing on a review screen that cannot be corrected in place.
      const owner = steps.findIndex((s) => s.fields.some((f) => f.name === p.field));
      setProblem(p);
      if (owner >= 0) setStep(owner);
      focusField(p.field);
      return;
    }
    setFormError(null);
    setState('sending');
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...answers }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
      if (!res.ok) {
        setState('idle');
        setFormError(json.error ?? 'We couldn’t send that. Please try again in a moment.');
        return;
      }
      trackLandingEvent('cohort_application_submitted');
      trackLandingEvent('application_submitted', { role });
      setState('done');
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch {
      setState('idle');
      setFormError('That didn’t send. You may be offline. Your answers are still here, so you can try again.');
    }
  }

  /* ── Confirmation ───────────────────────────────────────────────────────── */
  if (state === 'done') {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        className="bg-white border border-halo-rule rounded-2xl px-6 py-9 sm:px-10 sm:py-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-halo-veil border border-halo-lavender mb-5">
          <Check className="w-5 h-5 text-halo-purple-d" aria-hidden="true" />
        </span>
        <h2 className="font-display text-[1.875rem] leading-tight text-halo-ink mb-3">
          Your application is in.
        </h2>
        <p className="text-[16px] text-halo-heather leading-relaxed max-w-lg mb-5">
          We read every application ourselves, so this takes a few days rather than a few
          minutes. We will email you either way, at the address you gave us.
        </p>
        {/* Said plainly. An application that goes quiet is the thing people
            actually fear, and "we'll be in touch" is what they have heard
            before it happened. */}
        <p className="text-[15px] text-halo-mist-body leading-relaxed max-w-lg mb-8">
          Applying does not mean you have been accepted, and it does not match you with
          anyone yet. Mentable is early and the first group is deliberately small, so we
          are taking people on slowly.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-halo-rule bg-white text-halo-ink text-[15px] font-medium px-5 py-2.5 rounded-xl hover:border-halo-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            Back to Mentable
          </Link>
          {role === 'mentee' && (
            <Link
              href="/networking"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-halo-purple-d px-1 py-2.5 hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded-lg"
            >
              Read Networking 101
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ── Role selection ─────────────────────────────────────────────────────── */
  if (!role) {
    return (
      <div>
        <Preamble />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-halo-ink leading-tight mb-2 focus:outline-none"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          How would you like to take part?
        </h2>
        <p className="text-[16px] text-halo-heather leading-relaxed max-w-lg mb-8">
          The application is different for each, so this is the only thing we need first.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ROLE_CARDS.map((c) => (
            <button
              key={c.role}
              type="button"
              onClick={() => {
                trackLandingEvent('role_selected', { role: c.role });
                setRole(c.role);
                setStep(0);
              }}
              className="group text-left bg-white border border-halo-rule rounded-2xl p-6 sm:p-7 transition-all hover:border-halo-purple hover:shadow-[0_6px_24px_-12px_rgba(120,90,247,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              <h3 className="font-display text-[1.375rem] leading-snug text-halo-ink mb-2.5">
                {c.title}
              </h3>
              <p className="text-[15px] text-halo-heather leading-relaxed mb-5">{c.body}</p>
              <ul className="space-y-1.5 mb-6">
                {c.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-[14px] text-halo-mist-body leading-snug">
                    <Check className="w-3.5 h-3.5 text-halo-purple-d flex-none mt-[3px]" aria-hidden="true" />
                    {pt}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-halo-purple-d group-hover:gap-2.5 transition-all">
                Start
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const current = onReview ? null : steps[step];

  /* ── The journey ────────────────────────────────────────────────────────── */
  return (
    <div>
      {step === 0 && <Preamble />}

      {/* Progress. Names every step up front, so nothing feels open-ended. */}
      <nav aria-label="Application progress" className="mb-9">
        <ol className="flex items-stretch gap-1.5">
          {[...steps.map((s) => s.short), 'Review'].map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex-1 min-w-0">
                <span
                  className={`block h-[3px] rounded-full transition-colors ${
                    done || active ? 'bg-halo-purple' : 'bg-halo-rule'
                  }`}
                />
                <span
                  className={`${EYEBROW} block mt-2 truncate ${
                    active ? 'text-halo-purple-d' : 'text-halo-mist-body'
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {total}
        </p>
      </nav>

      {onReview ? (
        <ReviewStep
          role={role}
          answers={answers}
          onEdit={(name) => {
            const owner = steps.findIndex((s) => s.fields.some((f) => f.name === name));
            if (owner >= 0) { setStep(owner); focusField(name); }
          }}
          headingRef={headingRef}
        />
      ) : (
        <>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-halo-ink leading-tight mb-2 focus:outline-none"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            {current!.title}
          </h2>
          <p className="text-[16px] text-halo-heather leading-relaxed max-w-lg mb-8">
            {current!.lead}
          </p>

          <div className="space-y-6">
            {current!.fields.map((f) => (
              <FieldControl
                key={f.name}
                field={f}
                value={answers[f.name] ?? ''}
                onChange={(v) => set(f.name, v)}
                invalid={problem?.field === f.name}
                message={problem?.field === f.name ? problem.message : null}
              />
            ))}
          </div>
        </>
      )}

      {formError && (
        <p role="alert" className="mt-7 text-[15px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {formError}
        </p>
      )}

      {/* Actions. Back is always available and never destroys typed answers. */}
      <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-halo-rule">
        <button
          type="button"
          onClick={() => {
            setProblem(null);
            if (step === 0) { setRole(null); return; }
            setStep((s) => s - 1);
          }}
          className="inline-flex items-center gap-1.5 text-[15px] font-medium text-halo-heather hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded-lg px-1 py-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {step === 0 ? 'Change role' : 'Back'}
        </button>

        {onReview ? (
          <button
            type="button"
            onClick={submit}
            disabled={state === 'sending'}
            className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            {state === 'sending' ? 'Sending…' : 'Submit application'}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Reassurance where the decision is made, not buried at the top. */}
      {onReview && (
        <p className="text-[13.5px] text-halo-mist-body leading-relaxed mt-5 max-w-lg">
          Submitting does not create an account and does not match you with anyone. We read
          it, and we email you either way.
        </p>
      )}
    </div>
  );
}

/* ── One control, whatever kind of field it is ─────────────────────────────── */
function FieldControl({
  field, value, onChange, invalid, message,
}: {
  field: Field | Question;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  message: string | null;
}) {
  const q = 'rows' in field ? (field as Question) : null;
  const describedBy = [field.hint ? `${field.name}-hint` : null, message ? `${field.name}-err` : null]
    .filter(Boolean).join(' ') || undefined;
  const ring = invalid ? ' border-red-400 ring-1 ring-red-300' : '';

  return (
    <div>
      <label htmlFor={field.name} className="block text-[14px] font-semibold text-halo-ink mb-1.5">
        {field.label}
      </label>
      {field.hint && (
        <p id={`${field.name}-hint`} className="text-[13.5px] text-halo-mist-body leading-relaxed mb-2">
          {field.hint}
        </p>
      )}

      {field.options ? (
        /* A fixed list, rendered as real buttons rather than a select, so the
           choices are readable without opening anything. Radio semantics are
           kept for assistive tech. */
        <div role="radiogroup" aria-labelledby={`${field.name}-label`} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <span id={`${field.name}-label`} className="sr-only">{field.label}</span>
          {field.options.map((opt, i) => {
            const on = value === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={on}
                id={i === 0 ? field.name : undefined}
                onClick={() => onChange(opt)}
                className={`text-left text-[14.5px] leading-snug px-4 py-3 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-1 ${
                  on
                    ? 'bg-halo-veil border-halo-purple text-halo-ink font-medium'
                    : 'bg-white border-halo-rule text-halo-heather hover:border-halo-lavender'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : q ? (
        <>
          <textarea
            id={field.name}
            name={field.name}
            rows={q.rows}
            maxLength={q.max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`${FIELD_BASE} resize-y leading-relaxed${ring}`}
          />
          {/* Only once there is something to count. A counter on an empty box
              reads as a length requirement, which is the opposite of what the
              minimums are for. */}
          {value.length > 0 && (
            <p className="text-[12px] text-halo-mist-body mt-1.5 tabular-nums">
              {value.length < q.min
                ? `A little more — about ${q.min - value.length} more characters.`
                : `${value.length} / ${q.max}`}
            </p>
          )}
        </>
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type === 'email' ? 'email' : 'text'}
          inputMode={field.type === 'email' ? 'email' : undefined}
          autoComplete={
            field.name === 'full_name' ? 'name' : field.name === 'email' ? 'email'
            : field.name === 'organization' ? 'organization' : field.name === 'title' ? 'organization-title'
            : 'off'
          }
          maxLength={field.max}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`${FIELD_BASE}${ring}`}
        />
      )}

      {message && (
        <p id={`${field.name}-err`} role="alert" className="text-[13.5px] text-red-700 mt-2">
          {message}
        </p>
      )}
    </div>
  );
}

/* ── Review ────────────────────────────────────────────────────────────────── */
function ReviewStep({
  role, answers, onEdit, headingRef,
}: {
  role: Role;
  answers: Record<string, string>;
  onEdit: (name: string) => void;
  headingRef: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-halo-ink leading-tight mb-2 focus:outline-none"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
      >
        Read it back
      </h2>
      <p className="text-[16px] text-halo-heather leading-relaxed max-w-lg mb-8">
        Everything you have written, in one place. Change anything that does not sound like
        you before sending it.
      </p>

      <dl className="border-t border-halo-rule">
        {allFieldsFor(role).map((f) => (
          <div key={f.name} className="border-b border-halo-rule py-4 grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] gap-x-6 gap-y-1.5">
            <dt className="text-[13.5px] font-semibold text-halo-mist-body leading-snug">{f.label}</dt>
            <dd className="text-[15px] text-halo-ink leading-relaxed whitespace-pre-line min-w-0">
              {answers[f.name]?.trim() || <span className="text-halo-mist">Not answered</span>}
              <button
                type="button"
                onClick={() => onEdit(f.name)}
                className="ml-2 align-baseline text-[13px] font-medium text-halo-purple-d hover:text-halo-ink underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded-sm"
              >
                Edit
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
