import Link from 'next/link';
import Wordmark from '@/components/ui/Wordmark';

/**
 * The public footer, lifted out of the landing page so every page a stranger
 * can reach carries it.
 *
 * The profile pages and the 404 had no footer at all, which meant the six
 * URLs search engines actually index ended in a dead stop: no sign-up link,
 * no sign-in, nothing but the browser back button.
 */
export default function SiteFooter() {
  return (
    <footer className="py-14 px-6 lg:px-10 bg-halo-black">
      <div className="max-w-6xl mx-auto">
        <div className="mb-9">
          <Wordmark size="lg" className="text-white" />
          <p className="text-halo-lavender font-light mt-2 max-w-xs text-sm leading-relaxed">
            Find someone worth learning from. Become someone worth mentoring.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pt-7 border-t border-halo-deep-rule">
          {/*
            Privacy, Terms and Accessibility join the two auth links rather than
            forming a second row or a column block. Six short items wrap
            naturally on a phone and sit on one line from sm up, so the footer
            keeps its existing two-part shape instead of becoming a sitemap.
          */}
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-halo-lavender">
            <Link href="/login" className="tap-target hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="tap-target hover:text-white transition-colors">
              Create account
            </Link>
            <Link href="/privacy" className="tap-target hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="tap-target hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/accessibility" className="tap-target hover:text-white transition-colors">
              Accessibility
            </Link>
          </div>
          <p className="text-sm text-halo-lavender">&copy; 2026 Mentable. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
