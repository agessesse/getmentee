import type { Metadata } from 'next';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'About Mentable: why we exist',
  description: 'Mentorship should not depend on luck.',
};

/**
 * Route shell only. The page body is deliberately empty: this commit exists to
 * make the route resolve and the navigation reachable. Content arrives in a
 * later commit, built from the components already on the home page.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-halo-ivory flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="about-heading">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.2em] mb-5">
              About Mentable
            </p>
            <h1
              id="about-heading"
              className="font-serif text-halo-ink leading-[1.06] max-w-3xl"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              Mentorship should not depend on luck.
            </h1>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
