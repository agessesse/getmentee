import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { resolveInvite, acceptInvite, type InviteProblem } from '@/lib/org/invitations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your Mentable invitation',
  // Carries a secret in the URL; keep it out of search results.
  robots: { index: false, follow: false },
};

/*
  Accepting a programme invitation.

  Three states, resolved on the server before anything renders:

    not signed in   show what they have been invited to, then send them to
                    sign in and come straight back. The invitation is not
                    consumed, so the link still works when they return.
    signed in       join the cohort and say so.
    bad token       say which kind of bad, because "invalid" when a link has
                    simply been used already sends someone hunting for a
                    problem that does not exist.

  Joining happens on load rather than behind a confirm button. The person
  already consented by following a link addressed to them, and a second
  confirmation would only add a place to fall out.
*/

const PROBLEM: Record<InviteProblem, { title: string; body: string }> = {
  not_found: {
    title: 'This invitation isn’t valid.',
    body: 'It may have been mistyped, or replaced by a newer one. Check the most recent message from whoever invited you.',
  },
  expired: {
    title: 'This invitation has expired.',
    body: 'Invitations last two weeks. Ask the program lead to send you a new one.',
  },
  used: {
    title: 'This invitation has already been used.',
    body: 'You are already part of the program. Sign in and it will be on your dashboard.',
  },
  revoked: {
    title: 'This invitation was withdrawn.',
    body: 'Get in touch with whoever invited you if you think that is a mistake.',
  },
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = typeof raw === 'string' ? raw : '';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();

  let problem: InviteProblem | null = null;
  let invite: Awaited<ReturnType<typeof resolveInvite>> | null = null;
  let joined = false;
  let signedIn = false;

  if (!url || !key) {
    problem = 'not_found';
  } else {
    const db = createServiceClient(url, key, { auth: { persistSession: false } });
    invite = await resolveInvite(db, token);
    if ('problem' in invite) {
      problem = invite.problem;
    } else {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      signedIn = Boolean(user);
      if (user) {
        const res = await acceptInvite(db, token, invite, user.id);
        joined = res.ok;
      }
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />
      <main id="main-content" className="flex-1 py-16 sm:py-20 px-6 lg:px-10">
        <div className="max-w-md mx-auto">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );

  if (problem) {
    const copy = PROBLEM[problem];
    return shell(
      <div className="bg-white border border-halo-rule rounded-2xl px-6 py-9 sm:px-8">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-4">
          Invitation
        </p>
        <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mb-3">{copy.title}</h1>
        <p className="text-[15px] text-halo-heather leading-relaxed mb-7">{copy.body}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </div>,
    );
  }

  const inv = invite as Exclude<typeof invite, { problem: InviteProblem } | null>;
  const roleWord = inv.role === 'program_admin' ? 'help run' : `join as a ${inv.role}`;

  return shell(
    <div className="bg-white border border-halo-rule rounded-2xl px-6 py-9 sm:px-8">
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-4">
        {inv.organizationName || 'Mentable'}
      </p>
      <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mb-3">
        {joined ? `You're in.` : `You've been invited to ${roleWord}.`}
      </h1>
      <p className="text-[16px] text-halo-heather leading-relaxed mb-2">
        {inv.programName}
        {inv.cohortName ? ` · ${inv.cohortName}` : ''}
      </p>

      {joined ? (
        <>
          <p className="text-[15px] text-halo-heather leading-relaxed mb-7">
            You are part of this program. Your dashboard is where the relationship lives:
            conversations, goals, and what you each said you would do next.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Go to your dashboard
          </Link>
        </>
      ) : (
        <>
          <p className="text-[15px] text-halo-heather leading-relaxed mb-2">
            Invitation sent to <span className="text-halo-ink font-medium">{inv.email}</span>.
          </p>
          <p className="text-[15px] text-halo-mist-body leading-relaxed mb-7">
            {signedIn
              ? 'We could not add you just now. Try the link again in a moment.'
              : 'Sign in and open this link again to join. Nothing is used up until you do.'}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
          <p className="text-[13.5px] text-halo-mist-body leading-relaxed mt-5">
            New to Mentable?{' '}
            <Link href="/apply" className="text-halo-purple-d font-medium hover:text-halo-ink underline underline-offset-2">
              Apply to join
            </Link>
            .
          </p>
        </>
      )}
    </div>,
  );
}
