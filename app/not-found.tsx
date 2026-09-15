import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

/**
 * Without this file Next serves its built-in 404: the string
 * "404 | This page could not be found" on a blank page, with no wordmark, no
 * navigation, and — measured — zero focusable elements. Any mistyped URL, stale
 * link or removed profile put a visitor somewhere with literally nothing to
 * click.
 */
export const metadata = {
  title: 'Page not found - Mentable',
  // A 404 has no business in an index.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1 flex items-center px-6 lg:px-10 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto w-full">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-[0.22em] mb-5">
            Error 404
          </p>
          <h1
            className="font-serif text-navy-900 leading-[1.05] mb-5 max-w-2xl"
            style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)' }}
          >
            That page isn&apos;t here.
          </h1>
          <p className="text-lg text-gray-600 font-light leading-relaxed max-w-md mb-10">
            The link may be out of date, or the address may have a typo in it.
            Everything else is still where you left it.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 bg-accent text-white px-8 py-4 text-[15px] font-semibold hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all rounded-xl shadow-sm hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Back to Mentable
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
            <Link
              href="/signup?role=mentee"
              className="group tap-target inline-flex items-center gap-2 text-navy-700 font-medium hover:text-navy-900 transition-colors py-4 text-[15px] border-b border-gray-200 hover:border-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
            >
              Find your mentor
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
