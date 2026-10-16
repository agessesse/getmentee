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
 * WHY THIS IS NOT A SINGLE RPC CALL. Migration 0018 defines
 * approve_mentorship_request(), which does the status flip and the
 * mentorship insert atomically. That function IS NOT PRESENT in the
 * production database — verified by calling it as an authenticated mentor,
 * which answers "could not find the function". The /requests page has been
 * calling it, so accepting a request has been failing in production.
 *
 * Creating the function needs DDL, which this environment cannot execute.
 * So the accept is done here instead, in the only order RLS permits: the
 * mentorships INSERT policy requires the request to ALREADY be approved,
 * so the status must flip first.
 *
 * That order has a failure mode — approved request, no mentorship — which
 * is exactly what 0018 existed to prevent. It is handled by reverting the
 * status when the insert fails, so the worst case is a request that is
 * pending again and can be retried, rather than one that is permanently
 * approved with nothing behind it.
 *
 * The atomic function is still the right answer and the SQL is in the
 * report. This makes the loop work in the meantime without pretending.
 */
export async function respondToIntroduction(
  requestId: string,
  accept: boolean,
): Promise<IntroResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in first.' };

  const { data: req } = await supabase
    .from('mentorship_requests')
    .select('id, mentee_id, mentor_id, status')
    .eq('id', requestId)
    .maybeSingle();

  if (!req) return { ok: false, error: 'Not found.' };
  if (req.mentor_id !== user.id) return { ok: false, error: 'Not found.' };
  if (req.status !== 'pending') return { ok: false, error: 'You already answered this one.' };

  if (!accept) {
    const { error } = await supabase
      .from('mentorship_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/requests');
    return { ok: true, message: 'Passed. They are told, without a reason.' };
  }

  // Capacity, checked before anything is written.
  const [{ data: profile }, { count: active }] = await Promise.all([
    supabase.from('mentor_profiles').select('max_mentees').eq('id', user.id).maybeSingle(),
    supabase.from('mentorships').select('*', { count: 'exact', head: true })
      .eq('mentor_id', user.id).eq('status', 'active'),
  ]);
  const max = (profile as { max_mentees: number | null } | null)?.max_mentees ?? null;
  if (max !== null && (active ?? 0) >= max) {
    return { ok: false, error: 'You are at your limit. Raise it in your profile if you want more.' };
  }

  const { error: flipError } = await supabase
    .from('mentorship_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending');            // nobody else answered in between
  if (flipError) return { ok: false, error: flipError.message };

  const { data: created, error: insertError } = await supabase
    .from('mentorships')
    .insert({
      request_id: req.id,
      mentee_id: req.mentee_id,
      mentor_id: req.mentor_id,
      status: 'active',
    })
    .select('id')
    .single();

  if (insertError || !created) {
    // Compensating revert, so a failure here is retryable rather than a
    // dead request with no relationship behind it.
    await supabase
      .from('mentorship_requests')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    return { ok: false, error: 'Could not start the relationship. Nothing was changed — try again.' };
  }

  revalidatePath('/requests');
  revalidatePath('/mentorships');
  revalidatePath('/network');
  return { ok: true, message: 'Accepted. Your relationship is open.' };
}
