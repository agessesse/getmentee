import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import CtaButton from '@/components/marketing/CtaButton';

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
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1 flex items-center px-6 lg:px-10 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto w-full">
          <p className="font-ui text-[11px] font-semibold text-halo-heather uppercase tracking-[0.22em] mb-5">
            Error 404
          </p>
          <h1
            className="font-display text-halo-ink leading-[1.05] mb-5 max-w-2xl"
            style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)' }}
          >
            That page isn&apos;t here.
          </h1>
          <p className="text-lg text-halo-heather font-light leading-relaxed max-w-md mb-10">
            The link may be out of date, or the address may have a typo in it.
            Everything else is still where you left it.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <CtaButton href="/">
  Back to Mentable
</CtaButton>
            <CtaButton href="/signup?role=mentee" variant="secondary">
  Find your mentor
</CtaButton>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
