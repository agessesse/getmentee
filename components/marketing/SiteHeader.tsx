import Link from 'next/link';
import Wordmark from '@/components/ui/Wordmark';

/**
 * Header for public pages that are not the landing page.
 *
 * LandingNav is not reusable here: its links are in-page anchors
 * (#mentor-carousel-heading and friends) which resolve to nothing anywhere
 * else, so a visitor would get a nav bar whose every item silently did nothing.
 * This keeps the two things a stranger on a profile page or a 404 actually
 * needs — a way home and a way in.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-cream-50/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="tap-target py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
        >
          <Wordmark size="md" className="text-navy-900" />
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-navy-900 transition-colors font-medium py-3 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-accent text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-accent-hover active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
