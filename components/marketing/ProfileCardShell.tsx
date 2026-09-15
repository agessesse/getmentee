'use client';

import Link from 'next/link';

/**
 * Shared wrapper for the mentor and mentee carousel cards.
 *
 * The cards were <button> elements that opened the preview modal. Crawlers do
 * not follow click handlers, so the profile pages under /people/<slug> had no
 * inbound link from any crawlable page and were reachable only through
 * sitemap.xml. Search engines saw 18 orphaned URLs.
 *
 * When a profile page exists this renders a real <Link>:
 *   - the href is in the HTML, so the page is linked and crawlable
 *   - cmd-click, middle-click and the context menu behave like a normal link
 *   - a plain left click still opens the preview modal instead of navigating,
 *     so the interaction people already know is unchanged
 *
 * Cards without a profile page keep the original button.
 */
export default function ProfileCardShell({
  profileSlug,
  onPreview,
  interactive,
  onHoverChange,
  hovered,
  label,
  children,
}: {
  /** Slug at /people/<slug>. Omit when the person has no profile page. */
  profileSlug?: string;
  onPreview: () => void;
  interactive: boolean;
  onHoverChange: (h: boolean) => void;
  hovered: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const shared = {
    tabIndex: interactive ? 0 : -1,
    onFocus: () => interactive && onHoverChange(true),
    onBlur: () => interactive && onHoverChange(false),
    className:
      'block w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2 rounded-xl motion-safe:transition-transform motion-safe:duration-300',
    style: { transform: hovered ? 'translateY(-6px) scale(1.025)' : 'none' },
  };

  if (!profileSlug) {
    return (
      <button onClick={onPreview} aria-label={label} {...shared}>
        {children}
      </button>
    );
  }

  return (
    <Link
      href={`/people/${profileSlug}`}
      // A plain click opens the modal, so navigation almost never happens.
      // Leaving prefetch on made Next fetch all 18 profile payloads as the
      // carousels entered the viewport, which pushed landing TBT from 340ms to
      // 3.9s. The href is here for crawlers and modified clicks, not for speed.
      prefetch={false}
      onClick={(e) => {
        // Let modified clicks through so the profile can open in a new tab.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onPreview();
      }}
      {...shared}
    >
      {children}
    </Link>
  );
}
