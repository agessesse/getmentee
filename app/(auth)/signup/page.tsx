import { redirect } from 'next/navigation';

/**
 * /signup — kept as a redirect, no longer a registration form.
 *
 * WHY IT IS NOT DELETED. Mentable has exactly two public entry concepts now:
 * Apply, for people who are not members, and Sign in, for people who are.
 * Open registration was a third, and it quietly made approval meaningless:
 * anyone could create an account without ever applying, and the account had
 * no connection to the application the same person may have already filled
 * in. Accounts are now created only by /activate, from an approved
 * application.
 *
 * But the URL has been handed out. InviteModal generated mentor invitations
 * pointing at mentable.co/signup, and those messages are already in people's
 * inboxes; the old public CTAs pointed here too. Deleting the route would
 * turn every one of them into a 404 for exactly the people we were trying to
 * reach. So the route survives as a redirect and the form is gone.
 *
 * Role intent survives the hop, so someone invited as a mentor still lands on
 * the mentor application rather than the role selector.
 */
export default async function SignupRedirect({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.role) ? params.role[0] : params.role;
  const role = raw === 'mentor' || raw === 'mentee' ? raw : null;
  redirect(role ? `/apply?role=${role}` : '/apply');
}
