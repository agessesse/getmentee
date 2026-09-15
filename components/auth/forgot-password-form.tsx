'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);
    setLoading(false);

    // Deliberately identical whether or not the address has an account. Saying
    // "no account found" turns this form into a way to test which email
    // addresses are registered on the platform. Only a genuine transport
    // failure surfaces as an error.
    if (error && /network|fetch|timeout/i.test(error)) {
      setError('We could not reach the server. Check your connection and try again.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-5">
          <MailCheck className="w-5 h-5 text-accent" aria-hidden="true" />
        </span>
        <h1 className="font-serif text-navy-900 text-[2rem] leading-tight mb-3">Check your email</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          If an account exists for <span className="font-medium text-navy-900">{email}</span>,
          we&apos;ve sent a link to reset the password. It expires in an hour.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-navy-900 text-[2rem] leading-tight mb-1.5">
          Reset your password
        </h1>
        <p className="text-gray-600 text-sm">
          Enter the address you signed up with and we&apos;ll send you a link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-navy-900 mb-1.5">
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            disabled={loading}
            autoComplete="email"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition bg-white placeholder-gray-500"
          />
        </div>

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
          className="w-full bg-accent text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-accent-hover disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-600">
          Remembered it?{' '}
          <Link
            href="/login"
            className="tap-target inline-block text-navy-700 font-medium hover:underline py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 rounded"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
