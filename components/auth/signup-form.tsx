'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

type Step = 'role' | 'details';

export function SignupForm() {
  // Every call to action on the landing page used to point at a bare /signup,
  // so someone who clicked "Become a mentor" arrived here and was asked the
  // question they had just answered. The links now carry ?role=, and this
  // honours it by opening straight on the details step.
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const presetRole = roleParam === 'mentor' || roleParam === 'mentee' ? roleParam : null;

  const [step, setStep] = useState<Step>(presetRole ? 'details' : 'role');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'mentor' | 'mentee' | null>(presetRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (r: 'mentor' | 'mentee') => {
    setRole(r);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError('');
    setLoading(true);

    const { error } = await signUp(email, password, firstName, lastName, role);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-halo-ink text-[2rem] leading-tight mb-2">Account created!</h1>
        <p className="text-halo-heather text-sm">Check your email to confirm, then sign in.</p>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-display text-halo-ink text-[2.4rem] leading-tight mb-3">Join Mentable</h1>
          <p className="text-halo-heather">Are you looking for guidance, or offering it?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleRoleSelect('mentee')}
            className="group relative p-7 rounded-xl border-2 border-halo-rule hover:border-halo-purple hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-halo-lav-wash rounded-xl flex items-center justify-center mb-5 group-hover:bg-halo-lav-wash transition-colors">
              <GraduationCap className="w-6 h-6 text-halo-heather" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-halo-ink mb-2">Find a Mentor</h2>
            <p className="text-sm text-halo-heather leading-relaxed">
              Connect with professionals at top firms who can guide your career.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 bg-halo-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl group-hover:bg-halo-purple-d transition-colors">
              Get started
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </span>
          </button>

          <button
            onClick={() => handleRoleSelect('mentor')}
            className="group relative p-7 rounded-xl border-2 border-halo-rule hover:border-halo-purple hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-halo-lav-wash rounded-xl flex items-center justify-center mb-5 group-hover:bg-halo-lav-wash transition-colors">
              <Briefcase className="w-6 h-6 text-halo-heather" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-halo-ink mb-2">Become a Mentor</h2>
            <p className="text-sm text-halo-heather leading-relaxed">
              Give back to the next generation. Share your experience and open doors.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 bg-halo-purple text-white text-sm font-semibold px-4 py-2.5 rounded-xl group-hover:bg-halo-purple-d transition-colors">
              Apply now
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </span>
          </button>
        </div>

        <p className="text-center text-sm text-halo-heather mt-8">
          Already have an account?{' '}
          <Link
            href="/login"
            className="tap-target inline-block text-halo-heather font-medium hover:underline py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <button
          onClick={() => setStep('role')}
          className="text-sm text-halo-heather hover:text-halo-ink transition-colors mb-6 flex items-center gap-1 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
        >
          ← Back
        </button>
        <div className="inline-flex items-center gap-2 bg-halo-lav-wash text-halo-heather text-xs font-medium px-3 py-1.5 rounded-full mb-4 border border-halo-rule">
          {role === 'mentee' ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
          {role === 'mentee' ? 'Looking for a mentor' : 'Becoming a mentor'}
        </div>
        <h1 className="font-display text-halo-ink text-[2rem] leading-tight">Create your account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-halo-ink mb-1.5">
              First name
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Jordan"
              disabled={loading}
              className="w-full px-4 py-3 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition bg-white placeholder-halo-mist-body"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-halo-ink mb-1.5">
              Last name
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Taylor"
              disabled={loading}
              className="w-full px-4 py-3 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition bg-white placeholder-halo-mist-body"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-halo-ink mb-1.5">
            Email address
          </label>
          <input
            id="email"
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            /*
              Role-aware, because the field is not validated. There is no .edu
              check anywhere: not on this form, not in a server action, not in a
              Supabase constraint, not in middleware. Any working address signs
              up, and mentors use this same form. A fixed "you@university.edu"
              therefore told a professional they needed a university address to
              become a mentor, which is not true.

              Mentable is university-first, so the student example stays a
              university one. It is an example, not a rule.
            */
            placeholder={role === 'mentor' ? 'you@work.com' : 'you@university.edu'}
            disabled={loading}
            className="w-full px-4 py-3 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition bg-white placeholder-halo-mist-body"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-halo-ink mb-1.5">
            Password
          </label>
          <input
            id="password"
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min. 8 characters"
            disabled={loading}
            minLength={8}
            className="w-full px-4 py-3 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition bg-white placeholder-halo-mist-body"
          />
        </div>

        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
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
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-halo-heather">
          Already have an account?{' '}
          <Link
            href="/login"
            className="tap-target inline-block text-halo-heather font-medium hover:underline py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
