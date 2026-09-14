import Script from 'next/script';

/**
 * GA4, loaded once from the root layout.
 *
 * Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set, so local and
 * preview builds send no traffic and the ID never appears as a literal in the
 * codebase.
 *
 * No manual page_view is sent, here or on route change. Enhanced Measurement
 * is enabled on the Mentable Web stream and its "page changes based on browser
 * history events" option already covers App Router client navigation, which
 * uses history.pushState. Sending our own would double every pageview in the
 * property, and a doubled denominator quietly corrupts every funnel rate for
 * the whole pilot.
 */
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
