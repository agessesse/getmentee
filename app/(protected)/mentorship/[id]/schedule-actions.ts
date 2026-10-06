'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { listConnections, pickProvider } from '@/lib/calendar/connections';
import { createCalendarEvent, updateCalendarEvent, cancelCalendarEvent, type EventInput } from '@/lib/calendar/events';

/**
 * Planning, moving and cancelling a conversation.
 *
 * NO MEETINGS TABLE. A planned conversation is a row in `sessions`, which is
 * why it becomes part of "Where have we been" by simply ageing past its own
 * start time. Nothing has to move it there.
 *
 * THE HONESTY RULE, which shapes every branch below: Mentable must never
 * show a meeting as scheduled unless the provider confirmed it.
 *
 *   in person / other      no calendar is required. The conversation exists
 *                          in Mentable whether or not anybody connected
 *                          Google or Microsoft. If a calendar IS connected
 *                          we mirror it there as a convenience, and a
 *                          failure is reported but does not undo the plan.
 *   Google Meet / Teams    the calendar IS the mechanism; the join link only
 *                          exists because the provider made one. If the
 *                          provider fails, the session row is removed and an
 *                          error is returned. No conversation with a missing
 *                          link, no half-state.
 */

export type ScheduleResult =
  | { ok: true; sessionId: string; meetingUrl: string | null; invited: boolean; warning?: string }
  | { ok: false; error: string; needsReconnect?: boolean };

export type SimpleResult = { ok: true } | { ok: false; error: string };

const ONLINE = new Set(['google_meet', 'teams']);

async function participantContext(mentorshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: m } = await supabase
    .from('mentorships')
    .select('id, mentee_id, mentor_id, status')
    .eq('id', mentorshipId)
    .maybeSingle();

  if (!m || (m.mentee_id !== user.id && m.mentor_id !== user.id)) return null;
  return { supabase, user, mentorship: m, partnerId: m.mentor_id === user.id ? m.mentee_id : m.mentor_id };
}

/**
 * The attendee's address, resolved server-side.
 *
 * WHY THIS NEEDS THE SERVICE ROLE, narrowly and only here. Migration 0018
 * revoked column-level SELECT on profiles.email precisely so one member
 * cannot read another's address through the API. That protection is correct
 * and stays. But a calendar invitation needs an address, so it is read here,
 * on the server, AFTER participation has been verified, and it is used only
 * as the attendee field of the provider call.
 *
 * It is never returned to the browser. The brief suggests showing the
 * address in the invite dialog; this does not, because the mentee's name and
 * avatar already identify who is being invited, and putting their address on
 * screen would be a new exposure of the exact field 0018 locked down in
 * exchange for nothing the user needs.
 */
async function attendeeEmail(profileId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  const svc = createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await svc.from('profiles').select('email').eq('id', profileId).maybeSingle();
  return (data?.email as string | undefined) ?? null;
}

function buildInput(opts: {
  title: string; agenda: string | null; startIso: string; durationMinutes: number;
  timeZone: string; attendee: { email: string | null; name: string | null };
  meetingProvider: string; location: string | null;
}): EventInput {
  const end = new Date(new Date(opts.startIso).getTime() + opts.durationMinutes * 60_000).toISOString();
  return {
    title: opts.title,
    description: opts.agenda,
    startIso: opts.startIso,
    endIso: end,
    timeZone: opts.timeZone,
    attendeeEmail: opts.attendee.email,
    attendeeName: opts.attendee.name,
    wantsOnlineMeeting: ONLINE.has(opts.meetingProvider),
    location: opts.location,
  };
}

export async function planConversation(
  mentorshipId: string,
  input: {
    startIso: string;
    durationMinutes: number;
    timeZone: string;
    meetingProvider: 'google_meet' | 'teams' | 'in_person' | 'other';
    agenda: string | null;
    location: string | null;
  },
): Promise<ScheduleResult> {
  const ctx = await participantContext(mentorshipId);
  if (!ctx) return { ok: false, error: 'Not found.' };
  const { supabase, user, mentorship, partnerId } = ctx;

  const start = new Date(input.startIso);
  if (Number.isNaN(start.getTime())) return { ok: false, error: 'That date and time didn’t parse.' };
  if (start.getTime() < Date.now() - 60_000) return { ok: false, error: 'Pick a time in the future.' };
  if (input.durationMinutes < 10 || input.durationMinutes > 480) {
    return { ok: false, error: 'Choose a length between 10 minutes and 8 hours.' };
  }

  const needsCalendar = ONLINE.has(input.meetingProvider);
  const connections = await listConnections(user.id);
  const conn = pickProvider(connections);

  if (needsCalendar && !conn) {
    return {
      ok: false,
      error: 'Connect Google Calendar or Microsoft Outlook first, or choose In person.',
    };
  }

  // Names for the invite. public_profiles is readable and carries no address.
  const { data: people } = await supabase
    .from('public_profiles').select('id, first_name, last_name').in('id', [user.id, partnerId]);
  const nameOf = (id: string) => {
    const p = (people ?? []).find((x) => x.id === id);
    return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Mentable';
  };
  const title = `${nameOf(user.id)} and ${nameOf(partnerId)}`;

  // The Mentable row first, so the agreed time is never lost to an API blip.
  const { data: created, error: insertError } = await supabase
    .from('sessions')
    .insert({
      mentorship_id: mentorshipId,
      mentor_id: mentorship.mentor_id,
      mentee_id: mentorship.mentee_id,
      organizer_id: user.id,
      scheduled_at: start.toISOString(),
      duration_minutes: input.durationMinutes,
      time_zone: input.timeZone,
      session_type: 'video',
      meeting_provider: input.meetingProvider,
      location: input.location,
      notes: input.agenda,
      status: 'scheduled',
    })
    .select('id')
    .single();

  if (insertError || !created) {
    return { ok: false, error: insertError?.message ?? 'Could not save the conversation.' };
  }

  // No calendar connected and none needed: a complete, honest outcome.
  if (!conn) {
    revalidatePath(`/mentorship/${mentorshipId}`);
    return { ok: true, sessionId: created.id, meetingUrl: null, invited: false };
  }

  const event = buildInput({
    title, agenda: input.agenda, startIso: start.toISOString(),
    durationMinutes: input.durationMinutes, timeZone: input.timeZone,
    attendee: { email: await attendeeEmail(partnerId), name: nameOf(partnerId) },
    meetingProvider: input.meetingProvider, location: input.location,
  });

  const result = await createCalendarEvent(conn, event, created.id);

  if (!result.ok) {
    if (needsCalendar) {
      /*
        The link was the point. Undo rather than leave a conversation that
        claims to be on Google Meet with nowhere to join.

        AND VERIFY THE UNDO. A delete that matches no rows under RLS is not
        an error in PostgREST, it is a successful statement affecting
        nothing. That is exactly how this failed in production before 0034:
        the policy did not exist, the delete reported success, and an
        unjoinable conversation survived as "What's next".

        .select() makes the outcome observable. If the row is somehow still
        there, it is cancelled instead, which keeps it out of What's next
        and out of history. Never leave a Meet or Teams conversation with no
        way to join it.
      */
      const { data: removed } = await supabase
        .from('sessions').delete().eq('id', created.id).select('id');

      if (!removed || removed.length === 0) {
        await supabase.from('sessions').update({
          status: 'cancelled',
          invite_status: 'failed',
          sync_status: 'failed',
          sync_error: `Rollback could not delete the session: ${result.error}`,
        }).eq('id', created.id);
      }

      return { ok: false, error: result.error, needsReconnect: result.needsReconnect };
    }
    await supabase.from('sessions').update({
      sync_status: 'failed', invite_status: 'failed', sync_error: result.error,
    }).eq('id', created.id);
    revalidatePath(`/mentorship/${mentorshipId}`);
    return {
      ok: true, sessionId: created.id, meetingUrl: null, invited: false,
      warning: 'Saved in Mentable, but the calendar invite could not be sent.',
    };
  }

  await supabase.from('sessions').update({
    calendar_provider: conn.provider,
    external_calendar_id: result.calendarId,
    external_event_id: result.externalEventId,
    video_link: result.meetingUrl,
    invite_status: 'sent',
    sync_status: 'synced',
    sync_error: null,
  }).eq('id', created.id);

  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true, sessionId: created.id, meetingUrl: result.meetingUrl, invited: true };
}

/**
 * Move an existing conversation.
 *
 * Updates the external event in place. Never creates a second one: that is
 * the difference between rescheduling and double-booking, and the attendee
 * sees an update rather than a new invitation plus an orphan.
 */
export async function rescheduleConversation(
  mentorshipId: string,
  sessionId: string,
  input: { startIso: string; durationMinutes: number; timeZone: string },
): Promise<ScheduleResult> {
  const ctx = await participantContext(mentorshipId);
  if (!ctx) return { ok: false, error: 'Not found.' };
  const { supabase, user, partnerId } = ctx;

  const start = new Date(input.startIso);
  if (Number.isNaN(start.getTime())) return { ok: false, error: 'That date and time didn’t parse.' };
  if (start.getTime() < Date.now() - 60_000) return { ok: false, error: 'Pick a time in the future.' };

  const { data: s } = await supabase
    .from('sessions')
    .select('id, organizer_id, calendar_provider, external_event_id, meeting_provider, notes, location, status')
    .eq('id', sessionId).eq('mentorship_id', mentorshipId).maybeSingle();
  if (!s) return { ok: false, error: 'Not found.' };
  if (s.status === 'cancelled') return { ok: false, error: 'That conversation was cancelled.' };

  const { error } = await supabase.from('sessions').update({
    scheduled_at: start.toISOString(),
    duration_minutes: input.durationMinutes,
    time_zone: input.timeZone,
  }).eq('id', sessionId);
  if (error) return { ok: false, error: error.message };

  if (!s.external_event_id || !s.calendar_provider) {
    revalidatePath(`/mentorship/${mentorshipId}`);
    return { ok: true, sessionId, meetingUrl: null, invited: false };
  }

  /*
    The external event belongs to whoever created it. If the OTHER person is
    rescheduling, Mentable has no credentials for the organiser's calendar
    and must not pretend the invitation moved. The Mentable time is updated
    and the mismatch is recorded as stale, which is the truth.
  */
  if (s.organizer_id !== user.id) {
    await supabase.from('sessions').update({ sync_status: 'stale' }).eq('id', sessionId);
    revalidatePath(`/mentorship/${mentorshipId}`);
    return {
      ok: true, sessionId, meetingUrl: null, invited: false,
      warning: 'Moved in Mentable. The calendar invite was created by the other person, so they will need to update it.',
    };
  }

  const conn = (await listConnections(user.id)).find((c) => c.provider === s.calendar_provider);
  if (!conn) {
    await supabase.from('sessions').update({ sync_status: 'stale' }).eq('id', sessionId);
    revalidatePath(`/mentorship/${mentorshipId}`);
    return { ok: true, sessionId, meetingUrl: null, invited: false, warning: 'Moved in Mentable, but that calendar is no longer connected.' };
  }

  const { data: people } = await supabase
    .from('public_profiles').select('id, first_name, last_name').in('id', [user.id, partnerId]);
  const nameOf = (id: string) => {
    const p = (people ?? []).find((x) => x.id === id);
    return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Mentable';
  };

  const result = await updateCalendarEvent(conn, s.external_event_id, buildInput({
    title: `${nameOf(user.id)} and ${nameOf(partnerId)}`,
    agenda: s.notes, startIso: start.toISOString(), durationMinutes: input.durationMinutes,
    timeZone: input.timeZone, attendee: { email: await attendeeEmail(partnerId), name: nameOf(partnerId) },
    meetingProvider: s.meeting_provider ?? 'other', location: s.location,
  }));

  if (!result.ok) {
    await supabase.from('sessions').update({ sync_status: 'failed', sync_error: result.error }).eq('id', sessionId);
    revalidatePath(`/mentorship/${mentorshipId}`);
    return { ok: true, sessionId, meetingUrl: null, invited: false, warning: 'Moved in Mentable, but the calendar event could not be updated.' };
  }

  await supabase.from('sessions').update({ sync_status: 'synced', sync_error: null }).eq('id', sessionId);
  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true, sessionId, meetingUrl: result.meetingUrl, invited: true };
}

/** Call it off, and tell the other person's calendar. */
export async function cancelConversation(
  mentorshipId: string,
  sessionId: string,
): Promise<SimpleResult> {
  const ctx = await participantContext(mentorshipId);
  if (!ctx) return { ok: false, error: 'Not found.' };
  const { supabase, user } = ctx;

  const { data: s } = await supabase
    .from('sessions')
    .select('id, organizer_id, calendar_provider, external_event_id')
    .eq('id', sessionId).eq('mentorship_id', mentorshipId).maybeSingle();
  if (!s) return { ok: false, error: 'Not found.' };

  if (s.external_event_id && s.calendar_provider && s.organizer_id === user.id) {
    const conn = (await listConnections(user.id)).find((c) => c.provider === s.calendar_provider);
    if (conn) {
      const r = await cancelCalendarEvent(conn, s.external_event_id);
      if (!r.ok) {
        // Do not mark it cancelled in Mentable while the invitation is still
        // live in somebody's calendar; that is the out-of-sync state the
        // brief asks to avoid.
        return { ok: false, error: 'Could not cancel the calendar invitation. Nothing was changed.' };
      }
    }
  }

  const { error } = await supabase.from('sessions').update({
    status: 'cancelled',
    invite_status: 'cancelled',
    sync_status: s.external_event_id ? 'synced' : 'none',
  }).eq('id', sessionId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}
