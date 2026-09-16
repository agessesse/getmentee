import type { ReactNode } from 'react';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

/**
 * Shell for the three trust pages: privacy, terms and accessibility.
 *
 * They share a structure exactly, so they share a component: header, a title
 * block carrying the date the page was last changed, a single column of prose
 * at a reading measure, then the footer. Nothing here is a new design. It is
 * the same section padding, the same display face and the same rules the
 * marketing pages use, set narrower because these pages are read rather than
 * scanned.
 */
export default function LegalPage({
  eyebrow,
  title,
  lead,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  /** Human-readable date this page was last changed. */
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="py-16 sm:py-20 px-6 lg:px-10" aria-labelledby="legal-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-5">
                {eyebrow}
              </p>
              <h1
                id="legal-heading"
                className="font-display text-halo-ink leading-[1.06] mb-5"
                style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
              >
                {title}
              </h1>
              <p className="text-halo-mist-body text-[17px] font-light leading-relaxed mb-6">
                {lead}
              </p>
              <p className="text-[13px] text-halo-mist-body border-t border-halo-rule pt-5">
                Last updated {updated}
              </p>
            </div>
          </div>
        </section>

        <section className="pb-20 sm:pb-24 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">{children}</div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/** A titled block of prose. Keeps heading rhythm identical across the three. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-8 border-t border-halo-rule first:border-t-0 first:pt-0">
      <h2 className="font-display text-halo-ink text-[24px] leading-snug mb-4">{title}</h2>
      <div className="space-y-4 text-halo-heather text-[16px] leading-relaxed">{children}</div>
    </section>
  );
}

/** Bulleted facts. Used where a list is genuinely a list. */
export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="w-1 h-1 rounded-full bg-halo-mist-strong flex-none mt-[11px]"
          />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}
