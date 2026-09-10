// ─────────────────────────────────────────────────────────────────────────────
// Fixed-window rate limiter, keyed per user.
//
// The three /api/voice/* handlers each cost money per call. Authentication stops
// anonymous abuse but not a logged-in user looping a request, so these routes
// need a ceiling as well as a session.
//
// LIMITATION, read before relying on this: the counter lives in the module
// scope of a single server instance. On a serverless platform each instance
// keeps its own map and cold starts reset it, so the effective limit is
// (limit x number of warm instances). That is a meaningful reduction in abuse
// and it is not a guarantee. Before this carries real traffic, move the store
// to Vercel KV or Upstash Redis behind the same `checkRateLimit` signature —
// only the body of this function should need to change.
// ─────────────────────────────────────────────────────────────────────────────

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

// Keep the map from growing without bound on a long-lived instance.
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the current window resets. Send as Retry-After. */
  retryAfter: number;
}

/**
 * @param key       Caller identity. Use the Supabase user id, never the IP —
 *                  these routes are authenticated, and IPs are shared.
 * @param limit     Requests permitted per window.
 * @param windowMs  Window length in milliseconds.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED_KEYS) {
      // Drop expired entries before admitting a new key.
      for (const [k, w] of windows) {
        if (now >= w.resetAt) windows.delete(k);
      }
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfter: 0 };
}

/** 429 with the headers a client needs to back off correctly. */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait and try again.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}
