import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { loadProfile } from '@/lib/profile/view';
import ProfileBody from '@/components/profile/ProfileBody';

export const metadata: Metadata = { title: 'Profile', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Somebody else's profile.
 *
 * The SAME component as /me, which is the point: one profile system, so a
 * field added for a mentor shows up everywhere it should and the two views
 * cannot drift. The role decides emphasis, not which page renders.
 */
export default async function NetworkProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadProfile(id);
  if (!p) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/network"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors mb-5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Network
      </Link>
      <ProfileBody p={p} />
    </div>
  );
}
