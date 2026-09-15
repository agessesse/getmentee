import type { Metadata } from 'next';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Mentable for mentors: mentor with structure',
  description: 'A structured way to give your time, without the open-ended inbox.',
};

/**
 * Route shell only. The page body is deliberately empty: this commit exists to
 * make the route resolve and the navigation reachable. Content arrives in a
 * later commit, built from the components already on the home page.
 */
export default function MentorPage() {
  return (
    <div className="min-h-screen bg-halo-ivory flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="mentor-heading">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.2em] mb-5">
              For mentors
            </p>
            <h1
              id="mentor-heading"
              className="font-serif text-halo-ink leading-[1.06] max-w-3xl"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              A structured way to give your time, without the open-ended inbox.
            </h1>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
