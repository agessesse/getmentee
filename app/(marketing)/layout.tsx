import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import RouteTransition from '@/components/marketing/RouteTransition';

/**
 * Shell for the four public marketing pages.
 *
 * Deliberately separate from (protected): the marketing site can afford a
 * cinematic beat between pages, the product cannot. Nothing here mounts inside
 * the authenticated app.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 overflow-x-clip">
      <RouteTransition />
      <MarketingNav />
      {/* The nav watches this to know when the hero has scrolled away. */}
      <div id="nav-sentinel" className="absolute top-0 h-20 w-px" aria-hidden="true" />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
