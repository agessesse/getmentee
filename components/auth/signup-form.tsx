'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

type Step = 'role' | 'details';

export function SignupForm() {
  const [step, setStep] = useState<Step>('role');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'mentor' | 'mentee' | null>(null);
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
        <h3 className="text-xl font-bold text-navy-900 mb-2">Account created!</h3>
        <p className="text-gray-500 text-sm">Check your email to confirm, then sign in.</p>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-navy-900 mb-3">Join Mentee</h1>
          <p className="text-gray-500">Are you looking for guidance, or offering it?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleRoleSelect('mentee')}
            className="group relative p-7 rounded-2xl border-2 border-gray-200 hover:border-navy-600 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-navy-100 transition-colors">
              <GraduationCap className="w-6 h-6 text-navy-700" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Find a Mentor</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Connect with professionals at top firms who can guide your career.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-navy-600 text-sm font-medium">
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('mentor')}
            className="group relative p-7 rounded-2xl border-2 border-gray-200 hover:border-navy-600 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center mb-5 group-hover:bg-navy-800 transition-colors">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Become a Mentor</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Give back to the next generation. Share your experience and open doors.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-navy-600 text-sm font-medium">
              <span>Apply now</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-navy-600 font-medium hover:underline">
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
          className="text-sm text-gray-400 hover:text-navy-900 transition-colors mb-6 flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4 border border-navy-100">
          {role === 'mentee' ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
          {role === 'mentee' ? 'Looking for a mentor' : 'Becoming a mentor'}
        </div>
        <h2 className="text-2xl font-bold text-navy-900">Create your account</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-navy-900 mb-1.5">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Jordan"
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition bg-white placeholder-gray-400"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-navy-900 mb-1.5">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Taylor"
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition bg-white placeholder-gray-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy-900 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@university.edu"
            disabled={loading}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition bg-white placeholder-gray-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-navy-900 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min. 8 characters"
            disabled={loading}
            minLength={8}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition bg-white placeholder-gray-400"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-navy-800 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
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

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-navy-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
