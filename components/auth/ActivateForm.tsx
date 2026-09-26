'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackLandingEvent } from '@/lib/landing-analytics';

/**
 * Set a password, get an account, land somewhere useful.
 *
 * The email is displayed but not editable: it came off the activation token,
 * and letting someone change it here would be letting them activate under an
 * address we never approved. Showing it still matters — it is how a person
 * confirms the link reached the right inbox.
 *
 * After the account exists the form signs in immediately rather than sending
 * the new member to /login to type the password they just chose. Two screens
 * for one decision is where people fall out.
 */

const MIN = 8;
const FIELD =
  'w-full px-3.5 py-2.5 bg-white border border-halo-rule rounded-xl text-[15px] text-halo-ink ' +
  'placeholder:text-halo-mist focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent';

export default function ActivateForm({
  token, email, role,
}: {
  token: string;
  email: string;
  role: 'mentee' | 'mentor';
}) {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'working' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const announced = useRef(false);
  const { signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    trackLandingEvent('account_activation_started', { role });
  }, [role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'working') return;
    setError(null);

    if (password.length < MIN) {
      setError(`Please choose a password of at least ${MIN} characters.`);
      requestAnimationFrame(() => document.getElementById('password')?.focus());
      return;
    }

    setState('working');
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState('idle');
        setError(json.error ?? 'We couldn’t finish that. Please try again in a moment.');
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }

      trackLandingEvent('account_activated', { role });

      /*
        Sign in with the credentials just created. If this fails the account
        still exists, so the fallback is /login rather than an error: the
        person is a member either way and must not be told otherwise.
      */
      const { error: signInError } = await signIn(email, password);
      setState('done');
      router.push(signInError ? '/login' : '/dashboard');
    } catch {
      setState('idle');
      setError('That didn’t send. You may be offline. Your password is still here, so you can try again.');
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-halo-rule rounded-2xl px-6 py-7 sm:px-8">
      <div className="mb-5">
        <span className="block text-[14px] font-semibold text-halo-ink mb-1.5">Your email</span>
        <p className="px-3.5 py-2.5 bg-halo-veil border border-halo-rule rounded-xl text-[15px] text-halo-heather break-all">
          {email}
        </p>
        <p className="text-[13px] text-halo-mist-body mt-1.5">
          The address you applied with. Your account is created under this address.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-[14px] font-semibold text-halo-ink mb-1.5">
          Choose a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          aria-describedby="password-hint"
          aria-invalid={error ? true : undefined}
          className={FIELD}
        />
        <p id="password-hint" className="text-[13px] text-halo-mist-body mt-1.5">
          At least {MIN} characters.
        </p>
      </div>

      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="text-[14.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 focus:outline-none"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state !== 'idle'}
        className="w-full inline-flex items-center justify-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
      >
        {state === 'idle' ? 'Activate my account' : state === 'working' ? 'Setting up…' : 'Taking you in…'}
      </button>

      <p className="text-[13.5px] text-halo-mist-body leading-relaxed mt-5">
        Already activated?{' '}
        <Link href="/login" className="text-halo-purple-d font-medium hover:text-halo-ink">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}
