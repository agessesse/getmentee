'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/supabase/admin';
import { send, EMAILS } from '@/lib/email/messages';
import { maySendTo, emailConfigured } from '@/lib/email/send';

/**
 * Operator actions: moving people through the pipeline and making matches.
 *
 * EVERY ONE GOES THROUGH requireAdmin(), which resolves the caller from
 * their verified session and only then hands back a service-role client.
 * Nothing here takes an actor id from the request.
 *
 * These are operator writes on operator data. Participants have no path to
 * any of it: cohort_applications has no grant to authenticated at all, and
 * match rationale is never rendered in the participant product.
 */

/** Whether the person was actually told, and honestly which. */
export type EmailOutcome = 'sent' | 'blocked' | 'unconfigured';

export type ActionResult =
  | { ok: true; message: string; emailed?: EmailOutcome }
  | { ok: false; error: string };

const STATUSES = new Set(['submitted', 'reviewing', 'accepted', 'hold', 'declined', 'withdrawn']);

/**
 * Move one applicant.
 *
 * Email is attempted where the transition genuinely warrants telling
 * somebody, and its failure never fails the transition: an operator's
 * decision must not be lost because a mail provider is down or unconfigured.
 */
export async function setStage(
  applicationId: string,
  status: string,
): Promise<ActionResult> {
  if (!STATUSES.has(status)) return { ok: false, error: 'Unknown stage.' };

  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: 'Not permitted.' };

  const { data: app } = await gate.db
    .from('cohort_applications')
    .select('id, full_name, email, role, status')
    .eq('id', applicationId)
    .maybeSingle();
  if (!app) return { ok: false, error: 'No such application.' };

  const { error } = await gate.db
    .from('cohort_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) {
    /*
      'hold' only exists once migration 0038 has run. Say so in words an
      operator can act on rather than surfacing a constraint name.
    */
    if (status === 'hold' && /constraint/i.test(error.message)) {
      return { ok: false, error: 'Hold needs migration 0038. Everything else works without it.' };
    }
    return { ok: false, error: error.message };
  }

  let emailed: EmailOutcome | undefined;
  const name = (app.full_name as string)?.split(' ')[0] ?? 'there';
  const to = app.email as string;
  const message =
    status === 'accepted' && app.role === 'mentee' ? EMAILS.studentSelected(name)
    : status === 'declined' && app.role === 'mentee' ? EMAILS.studentNotSelected(name)
    : null;

  if (message) {
    if (!emailConfigured()) emailed = 'unconfigured';
    else if (!maySendTo(to)) emailed = 'blocked';
    else emailed = (await send(to, message)).ok ? 'sent' : 'blocked';
  }

  revalidatePath('/admin/cohort');
  const label = status === 'accepted' ? 'Selected' : status === 'hold' ? 'On hold' : status === 'declined' ? 'Declined' : 'Reviewing';
  return { ok: true, message: `${app.full_name} — ${label}.`, emailed };
}

/** The operator's own notes on an applicant. Never shown to participants. */
export async function saveNotes(applicationId: string, notes: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: 'Not permitted.' };

  const { error } = await gate.db
    .from('cohort_applications')
    .update({ notes: notes.trim().slice(0, 4000) || null, updated_at: new Date().toISOString() })
    .eq('id', applicationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/cohort');
  return { ok: true, message: 'Saved.' };
}

/**
 * Create the pairing.
 *
 * EXACTLY ONCE. Checked three ways, because a duplicate relationship is the
 * worst thing this function could do: two workspaces for one pair, split
 * goals, split history, and no obvious way to merge them.
 *
 *   1. neither person may already be in a cohort mentorship
 *   2. this exact pair may not already exist
 *   3. the insert itself is the only write path
 */
export async function createMatch(input: {
  cohortId: string;
  menteeProfileId: string;
  mentorProfileId: string;
  rationale: string;
  concerns: string;
}): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: 'Not permitted.' };

  const rationale = input.rationale.trim();
  if (rationale.length < 20) {
    return { ok: false, error: 'Write a sentence on why these two belong together first.' };
  }
  if (input.menteeProfileId === input.mentorProfileId) {
    return { ok: false, error: 'That is the same person.' };
  }

  const { data: existing } = await gate.db
    .from('mentorships')
    .select('id, mentee_id, mentor_id')
    .eq('cohort_id', input.cohortId)
    .or(`mentee_id.eq.${input.menteeProfileId},mentor_id.eq.${input.mentorProfileId}`);

  if ((existing ?? []).length > 0) {
    const samePair = (existing ?? []).some(
      (m) => m.mentee_id === input.menteeProfileId && m.mentor_id === input.mentorProfileId,
    );
    return {
      ok: false,
      error: samePair
        ? 'These two are already matched.'
        : 'One of them is already in a relationship in this cohort.',
    };
  }

  const row: Record<string, unknown> = {
    mentee_id: input.menteeProfileId,
    mentor_id: input.mentorProfileId,
    cohort_id: input.cohortId,
    // The existing vocabulary for "an operator paired them" (migration 0030).
    origin: 'admin_created',
    status: 'active',
    started_at: new Date().toISOString(),
    match_rationale: rationale,
    match_concerns: input.concerns.trim() || null,
    matched_by: gate.userId,
  };

  let { data: created, error } = await gate.db.from('mentorships').insert(row).select('id').single();

  /*
    If 0038 has not been applied the four new columns do not exist and
    PostgREST rejects the whole insert. Rather than lose the match, retry
    without them and tell the operator plainly that the reasoning was not
    saved. A match with no rationale is recoverable; a lost match is not.
  */
  let rationaleSaved = true;
  if (error && /match_rationale|match_concerns|matched_by|column/i.test(error.message)) {
    rationaleSaved = false;
    for (const k of ['match_rationale', 'match_concerns', 'matched_by']) delete row[k];
    ({ data: created, error } = await gate.db.from('mentorships').insert(row).select('id').single());
  }

  /*
    request_id is NOT NULL until 0038 relaxes it, and an operator match has
    no request. Without the migration no match can be created at all, so
    say that in words rather than surfacing a constraint name.
  */
  if (error && /request_id/.test(error.message)) {
    return {
      ok: false,
      error: 'Matching needs migration 0038 — mentorships.request_id is still required, and an operator match has no student request.',
    };
  }
  if (error || !created) return { ok: false, error: error?.message ?? 'Could not create the match.' };

  // Both sides belong to the cohort now, and their lifecycle says so.
  for (const [profileId, role] of [[input.menteeProfileId, 'mentee'], [input.mentorProfileId, 'mentor']] as const) {
    await gate.db.from('cohort_memberships').upsert(
      { cohort_id: input.cohortId, profile_id: profileId, role, state: 'matched', updated_at: new Date().toISOString() },
      { onConflict: 'cohort_id,profile_id' },
    );
  }

  const { data: people } = await gate.db
    .from('profiles').select('id, first_name, last_name, email')
    .in('id', [input.menteeProfileId, input.mentorProfileId]);
  const who = (id: string) => (people ?? []).find((p) => p.id === id);
  const nameOf = (id: string) => [who(id)?.first_name, who(id)?.last_name].filter(Boolean).join(' ') || 'your match';

  // Introduce them. Blocked or unconfigured mail is reported, never fatal.
  let emailed: EmailOutcome = emailConfigured() ? 'sent' : 'unconfigured';
  for (const [id, partnerId] of [
    [input.menteeProfileId, input.mentorProfileId],
    [input.mentorProfileId, input.menteeProfileId],
  ] as const) {
    const addr = who(id)?.email as string | undefined;
    if (!addr) continue;
    if (!emailConfigured() || !maySendTo(addr)) { emailed = emailConfigured() ? 'blocked' : 'unconfigured'; continue; }
    const r = await send(addr, EMAILS.matchIntroduction(
      who(id)?.first_name ?? 'there', nameOf(partnerId), rationale, `/mentorship/${created.id}`,
    ));
    if (!r.ok) emailed = 'blocked';
  }

  revalidatePath('/admin/cohort');
  return {
    ok: true,
    message: `${nameOf(input.menteeProfileId)} and ${nameOf(input.mentorProfileId)} are matched.${
      rationaleSaved ? '' : ' Rationale was NOT saved — run migration 0038.'
    }`,
    emailed,
  };
}
