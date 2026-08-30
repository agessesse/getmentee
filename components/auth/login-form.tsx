'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const fillDemo = (type: 'mentor' | 'mentee') => {
    setEmail(type === 'mentor' ? 'mentor@demo.mentee.app' : 'mentee@demo.mentee.app');
    setPassword('Demo1234!');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-navy-900 mb-1.5">Welcome back</h2>
        <p className="text-gray-500 text-sm">Sign in to your Mentee account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="you@example.com"
            disabled={loading}
            autoComplete="email"
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
            placeholder="••••••••"
            disabled={loading}
            autoComplete="current-password"
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
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-navy-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </form>

      {/* Demo credentials */}
      <div className="mt-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Demo accounts</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('mentee')}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-navy-700 font-medium hover:border-navy-300 hover:shadow-sm transition-all text-left"
          >
            <div className="text-xs text-gray-400 mb-0.5">Mentee view</div>
            Jordan Taylor
          </button>
          <button
            type="button"
            onClick={() => fillDemo('mentor')}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-navy-700 font-medium hover:border-navy-300 hover:shadow-sm transition-all text-left"
          >
            <div className="text-xs text-gray-400 mb-0.5">Mentor view</div>
            Alex Rivera
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Password for both: <span className="font-mono font-medium">Demo1234!</span></p>
      </div>
    </div>
  );
}
