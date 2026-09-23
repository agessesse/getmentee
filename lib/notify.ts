import 'server-only';

/**
 * A one-line ping when something needs a human.
 *
 * WHY THIS SHAPE. Slack and Discord incoming webhooks are both a single POST
 * of a JSON body to a secret URL, and neither needs an SDK, an API key or a
 * dependency. They differ only in which key holds the message: Slack reads
 * `text`, Discord reads `content`. Sending both means one environment variable
 * works with either service and the choice can change later without code.
 *
 * WHAT IT NEVER CARRIES. No name, email, school, stage, answers or writing
 * signal. A webhook URL is a bearer secret that lives in someone's chat
 * history, and applicant essays are not something to scatter into a channel.
 * The message says that something arrived and where to read it; reading it
 * requires signing in to the admin.
 *
 * WHAT IT NEVER DOES. Fail loudly. Every call is wrapped and awaited with a
 * timeout, and any error is logged and swallowed, because a chat outage must
 * never turn a student's successful application into an error message.
 *
 * MENTABLE_ALERT_WEBHOOK is server-only. It has no NEXT_PUBLIC_ prefix, so it
 * cannot reach the browser bundle, and 'server-only' above makes importing
 * this from a client component a build error.
 */
export async function notifyAdmins(message: string, url: string): Promise<void> {
  const webhook = process.env.MENTABLE_ALERT_WEBHOOK;
  if (!webhook) return; // not configured is a valid state, not an error

  const body = JSON.stringify({ text: `${message} ${url}`, content: `${message} ${url}` });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) console.error('[notify] webhook responded', res.status);
  } catch (e) {
    console.error('[notify] webhook failed', e instanceof Error ? e.message : e);
  }
}
