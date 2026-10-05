import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveParticipantContext, themeStyle } from '@/lib/theme/resolve';
import AppShell from '@/components/app/AppShell';
import { PATH_HEADER } from '@/lib/path-header';

/**
 * The authenticated shell.
 *
 * NOW A SERVER COMPONENT, and that is the change this pass turns on.
 *
 * It used to be a client component that, on every single navigation, mounted,
 * showed a full-screen loading wordmark, called getSession(), fetched the
 * profile, fetched the role profile, and only then rendered the page. Two
 * round trips and a flash of an empty screen between every click.
 *
 * Resolving it on the server fixes that, and it is also the only way tenant
 * theming can work at all. An institution's colours are read with the service
 * role from tables the browser has no grant on, and they have to be in the
 * first byte of HTML. Resolved in the client, every themed participant would
 * watch the application load in Mentable purple and then repaint navy.
 *
 * WHAT IS CHECKED, AND IN WHAT ORDER
 *
 *   1. getUser(), not getSession(). getSession() reads the cookie and
 *      believes it; getUser() verifies it against the auth server. On the
 *      server, where the answer gates a service-role read below, that
 *      difference is the whole point.
 *   2. The profile row must exist.
 *   3. The profile-setup gate, skipped on the setup page itself.
 *   4. Institutional context, derived only from the caller's own membership.
 *
 * Middleware already refuses anonymous requests to every path in this group,
 * so step 1 is defence in depth rather than the only lock.
 */

// Per-request: the session, the profile and the tenant are all caller-specific
// and must never be cached at the edge and served to somebody else.
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  /*
    `email` is deliberately NOT selected. Migration 0018 revokes column-level
    SELECT on profiles.email so it cannot be read through the API at all;
    without that, the permissive profiles policy from 0016 let any
    authenticated account read every user's address. The session already
    carries it, which is the correct source.
  */
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!profileData) redirect('/login');

  const role = profileData.role as 'mentor' | 'mentee';

  /*
    The setup gate.

    An empty pathname means the header did not arrive, which should not
    happen because middleware matches every route in this group. If it ever
    does, skip the gate rather than guess: redirecting on an unknown path
    would send the setup page to itself forever. This gate is presentation,
    not access control, so failing open costs nothing.
  */
  const pathname = (await headers()).get(PATH_HEADER) ?? '';
  if (pathname && pathname !== '/profile/setup') {
    // maybeSingle, not single: a brand-new member has no role-profile row
    // yet, and single() answers 406 for no rows.
    const { data: ext } = await supabase
      .from(role === 'mentor' ? 'mentor_profiles' : 'mentee_profiles')
      .select('profile_complete')
      .eq('id', user.id)
      .maybeSingle();

    if (!ext?.profile_complete) redirect('/profile/setup');
  }

  /*
    Institutional context, or null.

    Null is the ordinary case and stays the ordinary case: all ten current
    mentorships have cohort_id NULL and every one is a valid individual
    relationship. Those people get the Mentable default, unthemed, exactly as
    before. Nothing about this resolution reads a URL, a parameter or a
    header, so a tenant identity cannot be asked for, only belonged to.
  */
  const tenant = await resolveParticipantContext(user.id);

  return (
    <AppShell
      profile={{ ...profileData, role, email: user.email ?? '' }}
      tenant={tenant}
      themeVars={themeStyle(tenant)}
    >
      {children}
    </AppShell>
  );
}
