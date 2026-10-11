import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadProfile } from '@/lib/profile/view';
import ProfileBody from '@/components/profile/ProfileBody';

export const metadata: Metadata = { title: 'Me', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Your own profile.
 *
 * WHY THIS DID NOT EXIST AND HAD TO. Before this pass the only profile
 * surface was /profile/setup, a 691-line edit form. You could change your
 * profile and never see it. That is the difference between a programme
 * portal and a network: on a network you have an identity you can look at,
 * and so does everyone else.
 */
export default async function MePage() {
  const me = await loadProfile();
  if (!me) notFound();
  return <ProfileBody p={me} />;
}
