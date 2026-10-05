'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AuthHeader from '@/components/auth/AuthHeader';

/**
 * Setting a new password, which is the half of recovery that was missing.
 *
 * HOW SOMEBODY ARRIVES HERE. Supabase's recovery link goes to its own
 * /auth/v1/verify endpoint, which validates the token and then redirects to
 * whatever redirectTo was given. It hands the session over in one of two
 * shapes depending on the flow:
 *
 *   PKCE      ?code=<uuid>        exchanged for a session here
 *   implicit  #access_token=...&type=recovery   set directly here
 *
 * Both are handled, plus the case where the browser client has already
 * consumed the URL on its own (detectSessionInUrl is on by default, and it
 * is a race whether it or this component gets there first). That is why the
 * check below asks "do I have a session?" rather than trusting any single
 * parameter: all three routes converge on the same question.
 *
 * A link that is expired, already used, or opened on a device that never
 * requested it fails here rather than silently rendering a form that cannot
 * save, and it says which so the person knows to request another.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function establish() {
      const url = new URL(window.location.href);

      // Supabase redirects errors back onto the URL rather than failing the
      // request, so an expired link arrives here looking almost normal.
      const urlError =
        url.searchParams.get('error_description') ??
        new URLSearchParams(url.hash.replace(/^#/, '')).get('error_description');
      if (urlError) {
        if (!cancelled) setPhase('invalid');
        return;
      }

      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled && error) { setPhase('invalid'); return; }
      } else {
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!cancelled && error) { setPhase('invalid'); return; }
        }
      }

      // Whichever route got us here, the test is the same.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setPhase(session ? 'ready' : 'invalid');

      // Don't leave a usable token sitting in the address bar or in history.
      if (session) window.history.replaceState({}, '', '/reset-password');
    }

    void establish();
    return () => { cancelled = true; };
  }, [supabase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) { setError(updateError.message); return; }
    setPhase('done');
  };

  if (phase === 'checking') {
    return (
      <Shell>
        <p className="text-[15px] text-halo-heather">Checking your link.</p>
      </Shell>
    );
  }

  if (phase === 'invalid') {
    return (
      <Shell title="That link has expired.">
        <p className="text-[15px] text-halo-heather leading-relaxed">
          Recovery links work once and only for a short time. Request a new one and it
          will arrive in a moment.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex rounded-xl bg-halo-purple px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          Send a new link
        </Link>
      </Shell>
    );
  }

  if (phase === 'done') {
    return (
      <Shell title="Password updated.">
        <p className="text-[15px] text-halo-heather leading-relaxed">
          You&rsquo;re signed in with your new password.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 inline-flex rounded-xl bg-halo-purple px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          Continue
        </button>
      </Shell>
    );
  }

  return (
    <Shell title="Set a new password.">
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-[13.5px] font-medium text-halo-ink mb-1.5">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[15px] text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-purple"
          />
          <p className="text-[12.5px] text-halo-mist-body mt-1">At least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-[13.5px] font-medium text-halo-ink mb-1.5">
            Confirm it
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[15px] text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-purple"
          />
        </div>

        {error && <p role="alert" className="text-[13.5px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-halo-purple px-5 py-2.5 text-[15px] font-semibold text-white disabled:opacity-50 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {saving ? 'Saving' : 'Save password'}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col">
      <AuthHeader />
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {title && (
            <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mb-2">{title}</h1>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
