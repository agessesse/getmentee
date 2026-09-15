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
          <div className="flex gap-7 text-sm text-halo-lavender">
            <Link href="/login" className="tap-target hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="tap-target hover:text-white transition-colors">
              Create account
            </Link>
          </div>
          <p className="text-sm text-halo-lavender">&copy; 2026 Mentable. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
