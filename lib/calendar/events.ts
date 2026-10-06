import 'server-only';
import { freshAccessToken, markRevoked, type Connection } from '@/lib/calendar/connections';

/**
 * Creating, moving and cancelling the real calendar event.
 *
 * TWO ADAPTERS, ONE SHAPE. Google Calendar and Microsoft Graph disagree about
 * almost everything -- field names, how a video link is requested, how a
 * cancellation is expressed -- so the differences are absorbed here and the
 * rest of the product sees one interface.
 *
 * PLAIN fetch RATHER THAN THE VENDOR SDKS. googleapis is a very large
 * dependency that exists to cover every Google API; we need three REST calls.
 * @azure/msal-node solves a token-caching problem we already solved in
 * connections.ts. Both would add weight and a second opinion about auth.
 *
 * THE RULE FOR EVERY FUNCTION HERE: return a discriminated result, never
 * throw and never half-succeed silently. Mentable must not show a meeting as
 * scheduled unless the provider confirmed it, so the only path that reports
 * success is one where the provider returned an event id.
 */

export interface EventInput {
  title: string;
  /** The agenda, if one was written. */
  description: string | null;
  startIso: string;
  endIso: string;
  /** IANA zone. Carried explicitly so daylight saving is the provider's job. */
  timeZone: string;
  /** The other participant's Mentable email. */
  attendeeEmail: string | null;
  attendeeName: string | null;
  /** Whether to ask the provider for a Meet / Teams link. */
  wantsOnlineMeeting: boolean;
  /** Physical location, for in-person. */
  location: string | null;
}

export type EventResult =
  | { ok: true; externalEventId: string; calendarId: string; meetingUrl: string | null; htmlLink: string | null }
  | { ok: false; error: string; needsReconnect?: boolean };

export type SimpleResult = { ok: true } | { ok: false; error: string; needsReconnect?: boolean };

const GOOGLE_API = 'https://www.googleapis.com/calendar/v3';
const GRAPH_API = 'https://graph.microsoft.com/v1.0';

/* Google wants a stable client-supplied token to make retries idempotent. */
const requestId = (seed: string) => seed.replace(/[^a-v0-9]/g, '').slice(0, 32) || 'mentable';

// ── Google ──────────────────────────────────────────────────────────────────

async function googleCreate(token: string, conn: Connection, input: EventInput, seed: string): Promise<EventResult> {
  const calendarId = conn.calendarId || 'primary';
  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description ?? undefined,
    start: { dateTime: input.startIso, timeZone: input.timeZone },
    end: { dateTime: input.endIso, timeZone: input.timeZone },
    attendees: input.attendeeEmail
      ? [{ email: input.attendeeEmail, displayName: input.attendeeName ?? undefined }]
      : undefined,
    location: input.location ?? undefined,
  };

  if (input.wantsOnlineMeeting) {
    body.conferenceData = {
      createRequest: { requestId: requestId(seed), conferenceSolutionKey: { type: 'hangoutsMeet' } },
    };
  }

  // sendUpdates=all is what actually emails the attendee. Without it the
  // event appears only in the organiser's calendar and nobody is invited.
  const url =
    `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events` +
    `?sendUpdates=all&conferenceDataVersion=${input.wantsOnlineMeeting ? 1 : 0}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) return { ok: false, error: await describe(res), needsReconnect: res.status === 401 };

  const json = (await res.json()) as {
    id: string; htmlLink?: string; hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  };

  const meetingUrl =
    json.hangoutLink ??
    json.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ??
    null;

  return { ok: true, externalEventId: json.id, calendarId, meetingUrl, htmlLink: json.htmlLink ?? null };
}

async function googleUpdate(token: string, conn: Connection, eventId: string, input: EventInput): Promise<EventResult> {
  const calendarId = conn.calendarId || 'primary';
  const res = await fetch(
    `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: input.title,
        description: input.description ?? undefined,
        start: { dateTime: input.startIso, timeZone: input.timeZone },
        end: { dateTime: input.endIso, timeZone: input.timeZone },
        location: input.location ?? undefined,
      }),
    },
  );
  if (!res.ok) return { ok: false, error: await describe(res), needsReconnect: res.status === 401 };
  const json = (await res.json()) as { id: string; htmlLink?: string; hangoutLink?: string };
  return { ok: true, externalEventId: json.id, calendarId, meetingUrl: json.hangoutLink ?? null, htmlLink: json.htmlLink ?? null };
}

async function googleCancel(token: string, conn: Connection, eventId: string): Promise<SimpleResult> {
  const calendarId = conn.calendarId || 'primary';
  const res = await fetch(
    `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  // 404/410 means it is already gone from the provider, which is the state
  // we were trying to reach. Treating that as an error would leave Mentable
  // permanently out of sync with a calendar that is already correct.
  if (res.ok || res.status === 404 || res.status === 410) return { ok: true };
  return { ok: false, error: await describe(res), needsReconnect: res.status === 401 };
}

// ── Microsoft ───────────────────────────────────────────────────────────────

async function msCreate(token: string, input: EventInput): Promise<EventResult> {
  const body: Record<string, unknown> = {
    subject: input.title,
    body: { contentType: 'text', content: input.description ?? '' },
    start: { dateTime: stripZone(input.startIso), timeZone: input.timeZone },
    end: { dateTime: stripZone(input.endIso), timeZone: input.timeZone },
    attendees: input.attendeeEmail
      ? [{ emailAddress: { address: input.attendeeEmail, name: input.attendeeName ?? undefined }, type: 'required' }]
      : [],
    ...(input.wantsOnlineMeeting
      ? { isOnlineMeeting: true, onlineMeetingProvider: 'teamsForBusiness' }
      : {}),
    ...(input.location ? { location: { displayName: input.location } } : {}),
  };

  const res = await fetch(`${GRAPH_API}/me/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) return { ok: false, error: await describe(res), needsReconnect: res.status === 401 };

  const json = (await res.json()) as {
    id: string; webLink?: string; onlineMeeting?: { joinUrl?: string };
  };
  return {
    ok: true,
    externalEventId: json.id,
    calendarId: 'primary',
    meetingUrl: json.onlineMeeting?.joinUrl ?? null,
    htmlLink: json.webLink ?? null,
  };
}

async function msUpdate(token: string, eventId: string, input: EventInput): Promise<EventResult> {
  const res = await fetch(`${GRAPH_API}/me/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: input.title,
      body: { contentType: 'text', content: input.description ?? '' },
      start: { dateTime: stripZone(input.startIso), timeZone: input.timeZone },
      end: { dateTime: stripZone(input.endIso), timeZone: input.timeZone },
      ...(input.location ? { location: { displayName: input.location } } : {}),
    }),
  });
  if (!res.ok) return { ok: false, error: await describe(res), needsReconnect: res.status === 401 };
  const json = (await res.json()) as { id: string; webLink?: string; onlineMeeting?: { joinUrl?: string } };
  return {
    ok: true, externalEventId: json.id, calendarId: 'primary',
    meetingUrl: json.onlineMeeting?.joinUrl ?? null, htmlLink: json.webLink ?? null,
  };
}

async function msCancel(token: string, eventId: string): Promise<SimpleResult> {
  /*
    /cancel, not DELETE. Graph's cancel sends a cancellation notice to the
    attendees; a delete removes it from the organiser's calendar and leaves
    the other person with a meeting that no longer exists. The brief asks
    that attendees be notified through the provider, so cancel it is.
  */
  const res = await fetch(`${GRAPH_API}/me/events/${encodeURIComponent(eventId)}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'This conversation was cancelled in Mentable.' }),
  });
  if (res.ok || res.status === 404) return { ok: true };

  // A single-attendee event the organiser owns can refuse /cancel in some
  // tenants; falling back to delete still reaches the intended state.
  const del = await fetch(`${GRAPH_API}/me/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
  if (del.ok || del.status === 404) return { ok: true };
  return { ok: false, error: await describe(del), needsReconnect: del.status === 401 };
}

/* Graph rejects an offset on dateTime when timeZone is supplied separately. */
const stripZone = (iso: string) => iso.replace(/(\.\d+)?(Z|[+-]\d{2}:\d{2})$/, '');

async function describe(res: Response): Promise<string> {
  try {
    const j = await res.json() as { error?: { message?: string } | string };
    const m = typeof j.error === 'string' ? j.error : j.error?.message;
    return m ? `${res.status}: ${m}` : `${res.status}`;
  } catch {
    return `${res.status}`;
  }
}

// ── The interface the product uses ──────────────────────────────────────────

export async function createCalendarEvent(
  conn: Connection, input: EventInput, seed: string,
): Promise<EventResult> {
  const token = await freshAccessToken(conn);
  if (!token) return { ok: false, error: 'Calendar access needs reconnecting.', needsReconnect: true };
  const r = conn.provider === 'google'
    ? await googleCreate(token, conn, input, seed)
    : await msCreate(token, input);
  if (!r.ok && r.needsReconnect) await markRevoked(conn.profileId, conn.provider);
  return r;
}

export async function updateCalendarEvent(
  conn: Connection, eventId: string, input: EventInput,
): Promise<EventResult> {
  const token = await freshAccessToken(conn);
  if (!token) return { ok: false, error: 'Calendar access needs reconnecting.', needsReconnect: true };
  const r = conn.provider === 'google'
    ? await googleUpdate(token, conn, eventId, input)
    : await msUpdate(token, eventId, input);
  if (!r.ok && r.needsReconnect) await markRevoked(conn.profileId, conn.provider);
  return r;
}

export async function cancelCalendarEvent(conn: Connection, eventId: string): Promise<SimpleResult> {
  const token = await freshAccessToken(conn);
  if (!token) return { ok: false, error: 'Calendar access needs reconnecting.', needsReconnect: true };
  const r = conn.provider === 'google'
    ? await googleCancel(token, conn, eventId)
    : await msCancel(token, eventId);
  if (!r.ok && r.needsReconnect) await markRevoked(conn.profileId, conn.provider);
  return r;
}
