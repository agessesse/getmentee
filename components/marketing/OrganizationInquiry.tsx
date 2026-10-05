'use client';

import { useRef, useState } from 'react';

/**
 * "Bring Mentable to your community."
 *
 * Six fields, three required. No scheduling widget, no "a specialist will
 * reach out", no sales language: Mentable is two people, and a form that
 * implied otherwise would be the first thing a university administrator saw
 * through. The success state says what actually happens next, which is that
 * a human reads it.
 */

const FIELD =
  'w-full px-3.5 py-2.5 bg-white border border-halo-rule rounded-xl text-[15px] text-halo-ink ' +
  'placeholder:text-halo-mist focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent';

const SIZES = ['Under 50', '50 to 200', '200 to 1,000', 'More than 1,000', 'Not sure yet'];

export default function OrganizationInquiry() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setError(null);
    setState('sending');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/org/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
      if (!res.ok) {
        setError(json.error ?? 'We couldn’t send that. Please try again in a moment.');
        setState('idle');
        if (json.field) requestAnimationFrame(() => document.getElementById(json.field!)?.focus());
        return;
      }
      setState('done');
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch {
      setError('That didn’t send. You may be offline. Your answers are still here.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        className="bg-white border border-halo-rule rounded-2xl px-6 py-9 sm:px-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <h3 className="font-display text-[1.625rem] leading-tight text-halo-ink mb-3">Thanks, we have it.</h3>
        <p className="text-[16px] text-halo-heather leading-relaxed max-w-lg">
          Mentable is two people, and one of us reads every one of these. Expect a reply in
          a few days rather than a few minutes, and it will come from a person who has read
          what you wrote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-halo-rule rounded-2xl px-6 py-7 sm:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="full_name" className="block text-[14px] font-semibold text-halo-ink mb-1.5">Your name</label>
          <input id="full_name" name="full_name" autoComplete="name" className={FIELD} />
        </div>
        <div>
          <label htmlFor="email" className="block text-[14px] font-semibold text-halo-ink mb-1.5">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className={FIELD} />
        </div>
        <div>
          <label htmlFor="organization" className="block text-[14px] font-semibold text-halo-ink mb-1.5">Organization</label>
          <input id="organization" name="organization" autoComplete="organization" className={FIELD} />
        </div>
        <div>
          <label htmlFor="title" className="block text-[14px] font-semibold text-halo-ink mb-1.5">
            Your role <span className="font-normal text-halo-mist-body">(optional)</span>
          </label>
          <input id="title" name="title" autoComplete="organization-title" className={FIELD} />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="community" className="block text-[14px] font-semibold text-halo-ink mb-1.5">
          Who would you be connecting? <span className="font-normal text-halo-mist-body">(optional)</span>
        </label>
        <input id="community" name="community" placeholder="e.g. alumni and current students" className={FIELD} />
      </div>

      <div className="mt-5">
        <label htmlFor="participants" className="block text-[14px] font-semibold text-halo-ink mb-1.5">
          Roughly how many people? <span className="font-normal text-halo-mist-body">(optional)</span>
        </label>
        <select id="participants" name="participants" defaultValue="" className={FIELD}>
          <option value="">Select a range</option>
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="goal" className="block text-[14px] font-semibold text-halo-ink mb-1.5">
          What are you trying to accomplish? <span className="font-normal text-halo-mist-body">(optional)</span>
        </label>
        <textarea id="goal" name="goal" rows={4} className={`${FIELD} resize-y leading-relaxed`} />
      </div>

      {error && (
        <p role="alert" className="mt-5 text-[14.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-7 inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
      >
        {state === 'sending' ? 'Sending…' : 'Start the conversation'}
      </button>
    </form>
  );
}
