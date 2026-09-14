import Script from 'next/script';
import GaLocationRedactor from './GaLocationRedactor';

/**
 * GA4, loaded once from the root layout.
 *
 * Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set, so local and
 * preview builds send no traffic and the ID never appears as a literal.
 *
 * No manual page_view is sent, here or on route change. Enhanced Measurement
 * is enabled on the Mentable Web stream and its "page changes based on browser
 * history events" option already covers App Router client navigation, which
 * uses history.pushState. Sending our own would double every pageview, and a
 * doubled denominator quietly corrupts every funnel rate for the whole pilot.
 *
 * page_location is redacted before the first hit. /mentor/<id> puts a Supabase
 * UUID in the URL, and GA's automatic page_view and scroll events carry the
 * full location in `dl`, so without this the mentor's database id would be
 * recorded on every profile view. gtag('set') installs a default that applies
 * to automatically-collected events too, which is the only hook that reaches
 * them. GaLocationRedactor keeps it current across client navigation.
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
window.__mentableRedact = function (href) {
  try {
    var u = new URL(href);
    u.pathname = u.pathname.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id'
    );
    u.search = '';
    return u.toString();
  } catch (e) { return href; }
};
gtag('js', new Date());
gtag('set', { page_location: window.__mentableRedact(window.location.href) });
gtag('config', '${id}');`}
      </Script>
      <GaLocationRedactor />
    </>
  );
}
