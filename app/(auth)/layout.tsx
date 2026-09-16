import Link from 'next/link';
import AuthHeader from '@/components/auth/AuthHeader';

/**
 * Shell for sign in, create account and password reset.
 *
 * The header moved out to AuthHeader, which documents the wordmark alignment
 * bug it fixes. Two things changed here as a result.
 *
 * The ground is now veil with the form on an ivory card, rather than a form
 * floating on flat ivory. That is the one relationship the marketing pages use
 * everywhere and authentication was the only public surface not using it, which
 * is most of why it read as a different, emptier product. It adds no colour, no
 * illustration and no second object: the card is Will's existing rounded-xl on
 * halo-rule, and the form is still the only thing on the page.
 *
 * The old `pt-24` is gone. It existed to clear a `fixed` nav; the header is
 * sticky now, so it sits in flow and the padding would double-count.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-body min-h-screen bg-halo-veil flex flex-col">
      <AuthHeader />

      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-6 py-14 sm:py-20"
      >
        <div className="w-full max-w-lg">
          <div className="bg-halo-ivory border border-halo-rule rounded-xl shadow-sm px-6 py-9 sm:px-9 sm:py-11">
            {children}
          </div>

          {/*
            Not the full site footer, which would bury a short form under a
            black band. Just the three trust pages, because an authentication
            screen was previously the one public surface with no route to them
            at all, and "where is the privacy policy" is the first question an
            institution asks.
          */}
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-7">
            {[
              ['/privacy', 'Privacy'],
              ['/terms', 'Terms'],
              ['/accessibility', 'Accessibility'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="tap-target text-[13px] text-halo-mist-body hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
    </div>
  );
}
