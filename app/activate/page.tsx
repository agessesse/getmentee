import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import ActivateForm from '@/components/auth/ActivateForm';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { resolveActivation } from '@/lib/activation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Activate your Mentable account',
  // An activation link is personal. Keeping it out of search results costs
  // nothing and is the obvious default for a URL that carries a secret.
  robots: { index: false, follow: false },
};

/*
  The approved applicant's first screen.

  The token is resolved on the server before anything renders, so an expired
  or already-used link never shows a password form that was going to fail.
  Each failure says what actually happened and where to go instead — a dead
  end here is someone we already decided to invite, giving up.
*/

const PROBLEM_COPY: Record<string, { title: string; body: string; cta: 'login' | 'apply' | null }> = {
  not_found: {
    title: 'This link isn’t valid.',
    body: 'It may have been mistyped, or replaced by a newer one we sent you. Check the most recent email from us.',
    cta: null,
  },
  expired: {
    title: 'This link has expired.',
    body: 'Activation links last two weeks. Reply to your approval email and we will send you a fresh one.',
    cta: null,
  },
  used: {
    title: 'This link has already been used.',
    body: 'Your account exists, so there is nothing left to activate. Sign in and you are straight in.',
    cta: 'login',
  },
  already: {
    title: 'You already have an account.',
    body: 'This application has been activated. Sign in with the email you applied with.',
    cta: 'login',
  },
};

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = typeof raw === 'string' ? raw : '';

  const serviceKey = getServiceRoleKey();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let problem: string | null = null;
  let resolved: { email: string; fullName: string; role: 'mentee' | 'mentor' } | null = null;

  if (!serviceKey || !url) {
    problem = 'not_found';
  } else {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const result = await resolveActivation(admin, token);
    if ('problem' in result) problem = result.problem;
    else resolved = { email: result.email, fullName: result.fullName, role: result.role };
  }

  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1 py-16 sm:py-20 px-6 lg:px-10">
        <div className="max-w-md mx-auto">
          {problem ? (
            <div className="bg-white border border-halo-rule rounded-2xl px-6 py-9 sm:px-8">
              <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-4">
                Activation
              </p>
              <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mb-3">
                {PROBLEM_COPY[problem].title}
              </h1>
              <p className="text-[15px] text-halo-heather leading-relaxed mb-7">
                {PROBLEM_COPY[problem].body}
              </p>
              {PROBLEM_COPY[problem].cta === 'login' && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
                >
                  Sign in
                </Link>
              )}
              <p className="text-[14px] text-halo-mist-body leading-relaxed mt-6">
                Not expecting this?{' '}
                <Link href="/apply" className="text-halo-purple-d font-medium hover:text-halo-ink">
                  Apply to join
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-4">
                  Activation
                </p>
                <h1
                  className="font-display text-halo-ink leading-[1.05] tracking-tight mb-4"
                  style={{ fontSize: 'clamp(1.875rem, 5vw, 2.5rem)', textWrap: 'balance' }}
                >
                  {resolved!.fullName ? `Welcome, ${resolved!.fullName.split(/\s+/)[0]}.` : 'Welcome to Mentable.'}
                </h1>
                <p className="text-[16px] text-halo-heather leading-relaxed">
                  Your application was accepted. Choose a password and your account is ready.
                </p>
                {/* Said here because it is the question someone has at this
                    exact moment: do I have to fill all that in again? */}
                <p className="text-[14.5px] text-halo-mist-body leading-relaxed mt-3">
                  Everything you already told us carries over. You will not be asked for it twice.
                </p>
              </header>
              <ActivateForm
                token={token}
                email={resolved!.email}
                role={resolved!.role}
              />
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
