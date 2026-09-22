'use client';

import { PUBLIC_EVENTS, type PublicEvent } from '@/lib/public-events';

/**
 * Anonymous funnel measurement for logged-out visitors.
 *
 * WHY IT EXISTS. trackLandingEvent writes to pilot_events, whose RLS requires
 * auth.uid() = user_id, so every landing event from a signed-out visitor was
 * silently dropped. That is most of the traffic we are about to create.
 *
 * WHAT IT SENDS. An event name from a fixed list, the path, the referrer's
 * host, which CTA was used, and a random per-tab id. No email, no name, no
 * form content, no cookie, nothing that survives closing the tab.
 *
 * It is deliberately unable to fail loudly: sendBeacon where available so a
 * click that navigates away still records, a keepalive fetch otherwise, and
 * every error swallowed. Measurement must never break the thing it measures.
 */

const KEY = 'mentable.sid';

function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Private mode, or storage blocked. The event still sends without an id;
    // we lose the ability to group it, not the event itself.
    return undefined;
  }
}

function referrerHost(): string | undefined {
  try {
    return document.referrer ? new URL(document.referrer).host : undefined;
  } catch {
    return undefined;
  }
}

export function trackPublicEvent(event: PublicEvent, surface?: string): void {
  if (typeof window === 'undefined') return;
  if (!(PUBLIC_EVENTS as readonly string[]).includes(event)) return;

  const payload = JSON.stringify({
    event,
    surface,
    path: window.location.pathname,
    referrer_host: referrerHost(),
    session_id: sessionId(),
  });

  try {
    // sendBeacon survives the page unloading, which is exactly what a CTA
    // click does a few milliseconds later.
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }));
      return;
    }
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics never throws into the page */
  }
}
