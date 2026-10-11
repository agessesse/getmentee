import 'server-only';

/**
 * Transactional email.
 *
 * THE BLOCKER THIS ADDRESSES. Supabase's shared sender is capped at roughly
 * two messages an hour project-wide. Cohort 001 needs twenty invitations,
 * twenty selection decisions, twenty match introductions and a stream of
 * reminders. Two an hour is not a rate limit, it is an outage.
 *
 * WHY RESEND, AND WHY NO SDK. One POST to one endpoint with an API key. The
 * official SDK adds a dependency to wrap a single fetch, and this file is
 * the whole integration. Swapping provider later means changing the URL and
 * the body shape in one function.
 *
 * THIS IS NOT MARKETING AUTOMATION. No lists, no campaigns, no tracking
 * pixels, no open rates. Every message here is a direct consequence of
 * something a person did or something an operator decided about them.
 *
 * ── THE SAFETY RAIL, which matters more than the feature ──────────────────
 *
 * An email integration under development is one typo away from mailing
 * twenty real students a test message. So sending is refused unless the
 * recipient passes an explicit guard:
 *
 *   production + MENTABLE_EMAIL_LIVE=true   send to anyone
 *   anything else                            send ONLY to addresses in
 *                                            MENTABLE_EMAIL_ALLOWLIST
 *
 * The default state of this module is therefore "cannot mail a real user".
 * Turning it on is a deliberate, named environment change, not something
 * that happens because a key appeared.
 */

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'not_configured' | 'blocked' | 'failed'; detail?: string };

const ENDPOINT = 'https://api.resend.com/emails';

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MENTABLE_EMAIL_FROM);
}

/** Live sending to arbitrary recipients, as opposed to the allowlist only. */
export function emailLive(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.MENTABLE_EMAIL_LIVE === 'true';
}

function allowlist(): string[] {
  return (process.env.MENTABLE_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * May we mail this address right now?
 *
 * Exported so a caller can tell an operator "this would not have been sent"
 * BEFORE performing the action that implies it, rather than discovering it
 * afterwards in a log.
 */
export function maySendTo(email: string): boolean {
  if (!emailConfigured()) return false;
  if (emailLive()) return true;
  return allowlist().includes(email.trim().toLowerCase());
}

export interface Email {
  to: string;
  subject: string;
  /** Plain text. Every Mentable email is readable without HTML. */
  text: string;
  replyTo?: string;
}

export async function sendEmail(email: Email): Promise<EmailResult> {
  if (!emailConfigured()) return { ok: false, reason: 'not_configured' };

  if (!maySendTo(email.to)) {
    /*
      Logged, never thrown. A blocked send is the system working: during
      development every address that is not on the allowlist lands here.
    */
    console.warn(`[email] blocked, not an allowed recipient: ${email.to}`);
    return { ok: false, reason: 'blocked' };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MENTABLE_EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, reason: 'failed', detail: `${res.status} ${detail.slice(0, 200)}` };
    }

    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id ?? 'sent' };
  } catch (e) {
    // Never let a mail outage fail the action that triggered it. A student
    // whose application saved must not see an error because email is down.
    return { ok: false, reason: 'failed', detail: e instanceof Error ? e.message : 'network' };
  }
}
