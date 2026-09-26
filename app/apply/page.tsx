import type { Metadata } from 'next';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import { redirect } from 'next/navigation';
import ApplyJourney from '@/components/apply/ApplyJourney';
import { isRole } from '@/lib/apply/schema';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Apply to Mentable',
  description:
    'Apply to find a mentor, or to become one. Mentable is early: a small first group of students and the mentors who agree to work with them.',
  alternates: { canonical: '/apply' },
  openGraph: {
    title: 'Apply to Mentable',
    description:
      'Find a mentor, or become one. A short application, read by the two people building Mentable.',
    type: 'website',
    siteName: 'Mentable',
  },
};

/*
  One application, two paths.

  The role arrives in the URL so a CTA never makes someone answer a question
  the link already answered: "Become a founding mentor" lands on
  /apply?role=mentor and starts at the first real question. A bare /apply shows
  the selector, which is what the nav item should do.

  Server component so the role is resolved before first paint — no selector
  flashing in front of someone who already chose.
*/
export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.role) ? params.role[0] : params.role;
  const initialRole = isRole(raw) ? raw : null;

  /*
    Someone who is already a member does not need an application.

    This is the duplicate the funnel could realistically produce: a member who
    cannot find Sign in, lands here, and fills the whole thing in again under
    the same email. The route now answers from real auth state instead of
    showing the form to everyone. A signed-in visitor is sent to the product,
    because for them /apply is simply the wrong page and there is nothing to
    decide.
  */
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1 py-10 sm:py-12 lg:py-14 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto">
          <header className="mb-6">
            <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-3">
              Apply
            </p>
            <h1
              className="font-display text-halo-ink leading-[1.05] tracking-tight"
              style={{ fontSize: 'clamp(1.875rem, 4vw, 2.5rem)', textWrap: 'balance' }}
            >
              Join the first group.
            </h1>
          </header>

          <ApplyJourney initialRole={initialRole} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
