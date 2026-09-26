'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { trackLandingEvent } from '@/lib/landing-analytics';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

/**
 * Demo credentials used to render unconditionally on the public login page,
 * password included. Useful while showing the product to people, but it is a
 * public URL. Set NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true in preview environments
 * only.
 */
const SHOW_DEMO = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
    If a role came along for the ride — an old link, or someone bounced here
    from a role-specific CTA — hand it back to /apply rather than making them
    answer the same question again.
  */
  const roleParam = searchParams.get('role');
  const applyHref =
    roleParam === 'mentor' || roleParam === 'mentee' ? `/apply?role=${roleParam}` : '/apply';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    trackLandingEvent('login_started');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      trackLandingEvent('login_succeeded');
      sessionStorage.setItem('mentee_signin_transition', '1');
      router.push('/dashboard');
    }
  };

  const fillDemo = (type: 'mentor' | 'mentee') => {
    setEmail(type === 'mentor' ? 'mentor@demo.mentee.app' : 'mentee@demo.mentee.app');
    setPassword('Demo1234!');
  };

  const field =
    'w-full px-4 py-3 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition bg-white placeholder-halo-mist-body';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        {/*
          Was an <h2>, so the page had no top-level heading at all. The serif is
          the brand's display face and the landing page is built on it; the auth
          pages were set entirely in the sans, which made them read as a
          different product. One serif element per page is enough to connect them.
        */}
        <h1 className="font-display text-halo-ink text-[2rem] leading-tight mb-1.5">
          Welcome back
        </h1>
        <p className="text-halo-heather text-sm">Sign in to your Mentable account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-halo-ink mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            disabled={loading}
            autoComplete="email"
            className={field}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-halo-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="tap-target text-[13px] text-halo-heather hover:text-halo-ink hover:underline py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
              // The placeholder dots look exactly like a typed password, so they
              // clear the moment the field is focused rather than on the first
              // keystroke.
              className={`${field} pr-12 focus:placeholder:text-transparent`}
            />
            {/*
              Typing a password blind is the single most common cause of a failed
              sign-in, and the failure is indistinguishable from a wrong password.
            */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-halo-mist-body hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded-r-xl"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/*
          role="alert" so a failed sign-in is announced. Without it the only
          signal was the red box appearing, which a screen reader never reaches
          because focus stays on the submit button.
        */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-halo-purple text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-halo-purple-d disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>

        {/*
          Was "Don't have an account? Sign up", pointing at open registration.
          There is no public registration any more: the only way in is an
          application we approved, so offering "Sign up" here promised a door
          that does not exist. Secondary by weight — body text under the
          button, never a second button beside it.
        */}
        <p className="text-center text-sm text-halo-heather">
          New to Mentable?{' '}
          <Link
            href={applyHref}
            className="tap-target inline-block text-halo-purple-d font-medium hover:underline py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            Apply to join
          </Link>
        </p>
      </form>

      {SHOW_DEMO && (
        <div className="mt-8 p-5 bg-halo-veil rounded-xl border border-halo-rule">
          <p className="font-ui text-[10px] font-semibold text-halo-heather uppercase tracking-[0.12em] mb-3">
            Demo accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('mentee')}
              className="px-4 py-3 rounded-xl border border-halo-rule bg-white text-sm text-halo-heather font-medium hover:border-halo-purple hover:shadow-sm transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              <div className="text-xs text-halo-heather mb-0.5">Mentee view</div>
              Jordan Taylor
            </button>
            <button
              type="button"
              onClick={() => fillDemo('mentor')}
              className="px-4 py-3 rounded-xl border border-halo-rule bg-white text-sm text-halo-heather font-medium hover:border-halo-purple hover:shadow-sm transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              <div className="text-xs text-halo-heather mb-0.5">Mentor view</div>
              Alex Rivera
            </button>
          </div>
          <p className="text-xs text-halo-heather mt-3">
            Password for both: <span className="font-mono font-medium">Demo1234!</span>
          </p>
        </div>
      )}
    </div>
  );
}
