'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Introductions: a recommendation becoming a relationship.
 *
 * NO NEW TABLE, AND THAT IS THE POINT OF THE AUDIT.
 *
 * mentorship_requests already models "person A asked person B", and
 * mentorships.request_id already points back at it — all ten production
 * relationships were created this way. An introduction IS a request. A
 * second parallel "introductions" table would have duplicated the concept
 * and orphaned the ten that exist.
 *
 * So the lifecycle maps onto what is already there:
 *
 *   RECOMMENDED   computed by the engine, never stored
 *   REQUESTED     mentorship_requests.status = 'pending'
 *   ACCEPTED      status = 'approved' AND a mentorship row exists
 *   DECLINED      status = 'declined'
 *
 * All writes go through the caller's own client. RLS already says a mentee
 * may insert a request, only the addressed mentor may update it, and a
 * mentorship may only be inserted by that mentor against an approved
 * request. None of that is loosened here.
 */

export type IntroResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Ask to meet someone.
 *
 * The message is the requester's own words. Mentable may suggest an
 * opening line from the recommendation's evidence, but the suggestion is
 * pre-filled into an editable field and the person sends what they send —
 * nothing is written on their behalf.
 */
export async function requestIntroduction(
  mentorId: string,
  message: string,
): Promise<IntroResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in first.' };

  const text = message.trim();
  if (text.length < 10) return { ok: false, error: 'Say a sentence about why you would like to talk.' };
  if (text.length > 1500) return { ok: false, error: 'Keep it under 1500 characters.' };
  if (mentorId === user.id) return { ok: false, error: 'That is you.' };

  /*
    One request per pair, which the UNIQUE(mentee_id, mentor_id) index also
    enforces. Checked here so a second attempt reads as "already asked"
    rather than a constraint error.
  */
  const { data: existing } = await supabase
    .from('mentorship_requests')
    .select('id, status')
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error:
        existing.status === 'pending' ? 'You have already asked. They have not replied yet.'
        : existing.status === 'approved' ? 'You are already connected.'
        : 'You asked before and they passed.',
    };
  }

  const { error } = await supabase.from('mentorship_requests').insert({
    mentee_id: user.id,
    mentor_id: mentorId,
    message: text,
    // `goals` is NOT NULL on this table and predates the introduction flow.
    // The requester's words serve both until onboarding collects goals
    // properly; duplicating is better than inventing a second sentence.
    goals: text,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/network');
  revalidatePath('/requests');
  return { ok: true, message: 'Asked. You will hear back here.' };
}

/**
 * Accept or pass, as the person who was asked.
 *
 * ACCEPTING IS ONE TRANSACTION AGAIN.
 *
 * This used to be a status flip, then a mentorship insert, then a
 * compensating revert if the insert failed. That shape was forced on it:
 * migration 0018 defines approve_mentorship_request() but had only
 * partially applied in production, so the function did not exist and the
 * page calling it got "could not find the function" every time. The
 * work-around was correct in outcome and not atomic — between the flip
 * and the insert there was a real window containing an approved request
 * with no relationship behind it, and the revert was a best-effort
 * apology for it.
 *
 * 0039 installed the function. The three writes collapse back into one
 * call, and the window is gone: the function takes FOR UPDATE on the
 * request row, so a second concurrent approval waits and then fails the
 * status check rather than producing two mentorships.
 *
 * EVERYTHING THAT MATTERS IS DECIDED INSIDE THE FUNCTION, not here.
 * It re-reads the request, checks the caller IS the mentor it was
 * addressed to, checks it is still pending, and checks capacity — all
 * from the row, never from an argument. The only thing crossing this
 * boundary is a request id. The checks that used to live in this file
 * are not duplicated below, because a second copy of an authorization
 * rule is a second copy to get wrong.
 */

/*
  The function raises its own exceptions, and those strings are written
  for a developer reading a log. Mapped to something a person can act on;
  anything unrecognised becomes the generic line rather than leaking
  Postgres text to the screen, which this codebase has done before.
*/
function approvalMessage(raw: string): string {
  if (/No longer pending/i.test(raw))  return 'You already answered this one.';
  if (/Capacity reached/i.test(raw))   return 'You are at your limit. Raise it in your profile if you want more.';
  /* Not authorised and Request not found are the same answer on purpose:
     distinguishing them tells a caller whether an id is real. */
  if (/Not authorised|Request not found/i.test(raw)) return 'Not found.';
  return 'Could not start the relationship. Nothing was changed — try again.';
}

export async function respondToIntroduction(
  requestId: string,
  accept: boolean,
): Promise<IntroResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in first.' };

  if (!accept) {
    /*
      Declining creates nothing, so it stays a plain status update. The
      mentor check is still needed here because, unlike the accept path,
      there is no SECURITY DEFINER function doing it.

      STATUS ONLY, NEVER updated_at: mentorship_requests has had a
      set_updated_at trigger since 0002, and 0018 re-grants UPDATE on the
      status column alone. Sending updated_at would fail with 42501 the
      day the rest of 0018 lands.
    */
    const { data: req } = await supabase
      .from('mentorship_requests')
      .select('id, mentor_id, status')
      .eq('id', requestId)
      .maybeSingle();
    if (!req || req.mentor_id !== user.id) return { ok: false, error: 'Not found.' };
    if (req.status !== 'pending') return { ok: false, error: 'You already answered this one.' };

    const { error } = await supabase
      .from('mentorship_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);
    if (error) {
      console.error('[introductions] decline failed', error);
      return { ok: false, error: 'Something went wrong. Please try again.' };
    }
    revalidatePath('/requests');
    return { ok: true, message: 'Passed. They are told, without a reason.' };
  }

  const { data: mentorshipId, error } = await supabase
    .rpc('approve_mentorship_request', { p_request_id: requestId });

  if (error) {
    console.error('[introductions] approve failed', error);
    return { ok: false, error: approvalMessage(error.message ?? '') };
  }
  /*
    The function RETURNS the new mentorship id, so a null here means it
    somehow succeeded without creating one. Treated as a failure rather
    than reported as success — the whole point of this path is that the
    relationship exists when the caller is told it does.
  */
  if (!mentorshipId) {
    console.error('[introductions] approve returned no mentorship id');
    return { ok: false, error: 'Could not start the relationship. Nothing was changed — try again.' };
  }

  revalidatePath('/requests');
  revalidatePath('/mentorships');
  revalidatePath('/network');
  return { ok: true, message: 'Accepted. Your relationship is open.' };
}
