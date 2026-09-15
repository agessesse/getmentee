'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/brand/Logo';

/**
 * Branded two-panel route transition for the public marketing pages.
 *
 * The old page is covered BEFORE the destination is requested, which is the
 * whole point: a transition that reacts after the route has already changed
 * just draws a curtain over a page the visitor has already seen.
 *
 * Runs only between the four marketing routes. Authenticated product
 * navigation, auth screens, browser back/forward, and reduced-motion users all
 * navigate normally, because a full-screen wipe on a back button reads as
 * latency rather than as brand.
 */

const COVER_MS = 420;    // lead 320 + follow's 100ms stagger
const MIN_HOLD_MS = 200; // the brand beat, even when the destination is instant
const REVEAL_MS = 480;   // follow 360 + lead's 80ms stagger + margin
const MAX_WAIT_MS = 2500; // backstop: a stalled route must never trap anyone

const MARKETING_ROUTES = ['/', '/mentee', '/mentor', '/about'];
const isMarketingRoute = (path: string) => MARKETING_ROUTES.includes(path);

type Phase = 'idle' | 'cover' | 'reveal';

export default function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pending = useRef<string | null>(null);   // destination we are covering for
  const coveredAt = useRef<number>(0);           // when cover finished
  const navId = useRef(0);                       // guards against overlapping navigations

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const finish = useCallback(() => {
    const held = Date.now() - coveredAt.current;
    const wait = Math.max(0, MIN_HOLD_MS - held);
    after(wait, () => {
      setPhase('reveal');
      after(REVEAL_MS, () => {
        setPhase('idle');
        pending.current = null;
      });
    });
  }, [after]);

  // The destination has rendered when the pathname becomes what we navigated
  // to. That is the readiness signal; Next has already streamed the new page by
  // the time this fires.
  useEffect(() => {
    if (!pending.current) return;
    if (pathname !== pending.current) return;
    clearTimers();
    finish();
  }, [pathname, clearTimers, finish]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const start = useCallback(
    (href: string) => {
      const id = ++navId.current;
      clearTimers();
      pending.current = href;
      setPhase('cover');

      after(COVER_MS, () => {
        if (navId.current !== id) return;
        coveredAt.current = Date.now();
        router.push(href);

        // Backstop. If the route never resolves we reveal anyway rather than
        // leaving someone staring at a purple screen.
        after(MAX_WAIT_MS, () => {
          if (navId.current !== id) return;
          if (pending.current !== href) return;
          finish();
        });
      });
    },
    [after, clearTimers, finish, router]
  );

  useEffect(() => {
    // prefers-reduced-motion is read at click time, not mount, so a visitor who
    // changes the OS setting mid-session is respected immediately.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;
      if (anchor.hasAttribute('download')) return;
      const target = anchor.getAttribute('target');
      if (target && target !== '_self') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let url: URL;
      try { url = new URL(anchor.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      // Both ends must be marketing routes. Leaving for /signup or /login gets
      // ordinary navigation, because the product should feel instant.
      if (!isMarketingRoute(window.location.pathname)) return;
      if (!isMarketingRoute(url.pathname)) return;

      // Stop the event here, in the capture phase, so Next's Link never sees
      // it. We are taking over the navigation entirely: cover first, push
      // after.
      e.preventDefault();
      e.stopPropagation();
      start(url.pathname);
    };

    // Capture phase, deliberately. React attaches Link's handler at the root
    // and it calls preventDefault to do its own client-side navigation, so a
    // bubble-phase listener always arrives to find defaultPrevented already
    // true and declines every click.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [start]);

  // Browser back/forward must not play the wipe. Nothing here starts a cover,
  // so POP is already inert; this only cancels a cover that is mid-flight when
  // someone hits back, so the overlay cannot be left stranded on screen.
  useEffect(() => {
    const onPop = () => {
      if (!pending.current) return;
      navId.current++;
      clearTimers();
      pending.current = null;
      setPhase('idle');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [clearTimers]);

  return (
    <div className="rt" data-phase={phase} aria-hidden="true">
      <div className="rt__panel rt__panel--lead" />
      <div className="rt__panel rt__panel--follow" />
      <div className="rt__logo">
        <Logo variant="lockup" tone="reversed" height={38} />
      </div>
    </div>
  );
}
