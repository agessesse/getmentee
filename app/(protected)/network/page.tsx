import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadNetwork } from '@/lib/profile/network';
import NetworkList from '@/components/profile/NetworkList';

export const metadata: Metadata = { title: 'Network', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * People.
 *
 * The surface that turns Mentable from a programme portal into a network:
 * somewhere you can see who else is here and decide, yourself, whether a
 * conversation is worth having. It shows only people who genuinely exist.
 */
export default async function NetworkPage() {
  const net = await loadNetwork();
  if (!net) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-[1.9rem] leading-tight text-halo-ink">Network</h1>
        <p className="text-[14.5px] text-halo-heather leading-relaxed mt-1.5 max-w-md">
          {net.viewerRole === 'mentee'
            ? 'People who have been where you are going.'
            : 'The other people mentoring on Mentable.'}
        </p>
      </header>
      <NetworkList people={net.people} viewerRole={net.viewerRole} />
    </div>
  );
}
