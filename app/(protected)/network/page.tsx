import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadNetwork } from '@/lib/profile/network';
import { loadDiscover } from '@/lib/matching/discover';
import NetworkList from '@/components/profile/NetworkList';
import DiscoverList from '@/components/profile/DiscoverList';

export const metadata: Metadata = { title: 'Discover', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Discover: who you should know, and why.
 *
 * TWO SURFACES, IN ORDER OF HOW USEFUL THEY ARE. Recommendations come
 * first, because the product's whole claim is that Mentable can tell you
 * who is worth your time rather than handing you a directory and wishing
 * you luck. The full list sits underneath for the times you want to look
 * for yourself.
 *
 * Both show only people who genuinely exist. Every mentor row in
 * production today is a seeded fixture, and recommending one would mean a
 * person reads a careful explanation of why they should meet somebody
 * imaginary.
 */
export default async function DiscoverPage() {
  const [discover, net] = await Promise.all([loadDiscover(), loadNetwork()]);
  if (!net || !discover) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-7">
        <h1 className="font-display text-[1.9rem] leading-tight text-halo-ink">Discover</h1>
        <p className="text-[14.5px] text-halo-heather leading-relaxed mt-1.5 max-w-md">
          People you should know, and why.
        </p>
      </header>

      <DiscoverList view={discover} />

      {net.people.length > 0 && (
        <section className="mt-12 pt-8 border-t border-halo-rule">
          <h2 className="font-display text-[1.25rem] text-halo-ink mb-1">Everyone on Mentable</h2>
          <p className="text-[13.5px] text-halo-heather mb-5">
            {net.people.length} {net.people.length === 1 ? 'person' : 'people'}, if you would rather look yourself.
          </p>
          <NetworkList people={net.people} viewerRole={net.viewerRole} />
        </section>
      )}
    </div>
  );
}
