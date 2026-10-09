'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';

/**
 * Cohort participation: accepting the commitment, and the two check-ins.
 *
 * WHY SERVICE ROLE, AND WHY THAT IS NOT A HOLE. cohort_memberships and
 * cohort_measures have RLS on with zero policies and zero grants: they are
 * operator data and candid self-reports, not participant-queryable tables.
 * So these writes need the elevated client.
 *
 * The protection is that every function below resolves the caller from
 * their own session FIRST, finds THEIR OWN membership row, and writes only
 * to that row. No function accepts a profile id, a membership id or a
 * cohort id from the caller. There is no parameter that could be pointed at
 * somebody else's record.
 */

type Result = { ok: true } | { ok: false; error: string };

function svc(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The caller's own membership, or null. Never takes an id. */
async function myMembership() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = svc();
  if (!db) return null;

  const { data } = await db
    .from('cohort_memberships')
    .select('id, cohort_id, profile_id, role, state, cohorts(id, name, term, expected_cadence_days, expected_sessions, programs(name, organizations(name, display_name)))')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? { db, userId: user.id, membership: data } : null;
}

export interface CommitmentTerms {
  students: number;
  weeks: number;
  cadenceDays: number;
  minutesPerConversation: number;
}

/**
 * A mentor accepts the terms.
 *
 * The terms are SNAPSHOTTED onto the membership. A cohort's settings can be
 * edited later; what this person agreed to on this date cannot, and a
 * commitment that silently rewrites itself is not a commitment.
 */
export async function acceptCommitment(input: {
  acquisitionSource: string;
  motivation: string;
  preferredProfile: string;
  terms: CommitmentTerms;
}): Promise<Result> {
  const ctx = await myMembership();
  if (!ctx) return { ok: false, error: 'No cohort membership found for your account.' };
  const { db, membership } = ctx;

  const SOURCES = new Set([
    'founder_network','mentor_referral','alumni_network','employer',
    'university','professional_org','former_mentee','inbound','other',
  ]);
  if (!SOURCES.has(input.acquisitionSource)) return { ok: false, error: 'Pick how you heard about Mentable.' };

  const { error } = await db
    .from('cohort_memberships')
    .update({
      state: 'committed',
      acquisition_source: input.acquisitionSource,
      motivation: input.motivation.trim().slice(0, 2000) || null,
      preferred_profile: input.preferredProfile.trim().slice(0, 1000) || null,
      commitment_accepted_at: new Date().toISOString(),
      commitment_terms: input.terms,
      updated_at: new Date().toISOString(),
    })
    .eq('id', membership.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard');
  return { ok: true };
}

export interface MeasureInput {
  phase: 'baseline' | 'endline';
  scales: Partial<Record<'career_clarity' | 'recruiting_knowledge' | 'preparation' | 'confidence', number>>;
  counts: Partial<Record<'reachable_contacts' | 'applications_count' | 'interviews_count' | 'offers_count' | 'introductions_count', number>>;
  open: Partial<Record<'what_changed' | 'mentor_helped_with' | 'would_not_have_happened' | 'most_valuable' | 'should_change', string>>;
  sharePermission: boolean;
  /** Endline only, and only ever written by a mentor. */
  wouldAgain?: boolean;
  wouldRefer?: boolean;
}

/** Submit a baseline or endline for yourself. */
export async function submitMeasures(input: MeasureInput): Promise<Result> {
  const ctx = await myMembership();
  if (!ctx) return { ok: false, error: 'No cohort membership found for your account.' };
  const { db, userId, membership } = ctx;

  if (input.phase !== 'baseline' && input.phase !== 'endline') {
    return { ok: false, error: 'Unknown phase.' };
  }

  // Clamp rather than reject: a stray value should not lose somebody's
  // whole answer set. The database CHECKs are the real boundary.
  const scale = (v: number | undefined) =>
    v === undefined || Number.isNaN(v) ? null : Math.min(5, Math.max(1, Math.round(v)));
  const count = (v: number | undefined, max = 500) =>
    v === undefined || Number.isNaN(v) ? null : Math.min(max, Math.max(0, Math.round(v)));
  const text = (v: string | undefined) => (v ?? '').trim().slice(0, 4000) || null;

  const row = {
    cohort_id: membership.cohort_id,
    profile_id: userId,
    role: membership.role,
    phase: input.phase,
    career_clarity: scale(input.scales.career_clarity),
    recruiting_knowledge: scale(input.scales.recruiting_knowledge),
    preparation: scale(input.scales.preparation),
    confidence: scale(input.scales.confidence),
    reachable_contacts: count(input.counts.reachable_contacts),
    applications_count: count(input.counts.applications_count),
    interviews_count: count(input.counts.interviews_count),
    offers_count: count(input.counts.offers_count, 100),
    introductions_count: count(input.counts.introductions_count),
    what_changed: text(input.open.what_changed),
    mentor_helped_with: text(input.open.mentor_helped_with),
    would_not_have_happened: text(input.open.would_not_have_happened),
    most_valuable: text(input.open.most_valuable),
    should_change: text(input.open.should_change),
    /*
      Default false. Nothing a participant wrote may ever appear in a case
      study, a deck or a report unless they ticked this box.
    */
    share_permission: Boolean(input.sharePermission),
    updated_at: new Date().toISOString(),
  };

  const { error } = await db
    .from('cohort_measures')
    .upsert(row, { onConflict: 'cohort_id,profile_id,phase' });
  if (error) return { ok: false, error: error.message };

  // Retention answers belong on the membership, not on a measure row: they
  // are facts about the person's relationship with Mentable, not about this
  // semester's numbers.
  if (input.phase === 'endline' && membership.role === 'mentor') {
    await db.from('cohort_memberships').update({
      would_again: input.wouldAgain ?? null,
      would_refer: input.wouldRefer ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', membership.id);
  }

  revalidatePath('/dashboard');
  return { ok: true };
}

/** What the check-in page needs to render, for the caller only. */
export async function myCohortContext() {
  const ctx = await myMembership();
  if (!ctx) return null;
  const { db, userId, membership } = ctx;

  const { data: existing } = await db
    .from('cohort_measures')
    .select('phase')
    .eq('cohort_id', membership.cohort_id)
    .eq('profile_id', userId);

  const cohort = membership.cohorts as unknown as {
    name: string; term: string | null; expected_cadence_days: number; expected_sessions: number;
    programs: { name: string; organizations: { name: string; display_name: string | null } | null } | null;
  } | null;

  return {
    role: membership.role as 'mentee' | 'mentor',
    state: membership.state as string,
    cohortName: cohort?.name ?? 'Cohort',
    term: cohort?.term ?? null,
    programName: cohort?.programs?.name ?? null,
    organizationName: cohort?.programs?.organizations?.display_name ?? cohort?.programs?.organizations?.name ?? null,
    cadenceDays: cohort?.expected_cadence_days ?? 21,
    expectedSessions: cohort?.expected_sessions ?? 6,
    submitted: new Set((existing ?? []).map((e) => e.phase as string)),
  };
}

/**
 * What changed because of a conversation.
 *
 * WRITTEN WITH THE SERVICE ROLE, AFTER VERIFYING PARTICIPATION, and not
 * through the participant's own client. sessions has no table-level UPDATE
 * grant — migration 0017 replaced it with a per-column allowlist — so a
 * direct write to a newly added column is rejected silently, which is
 * exactly the defect that broke the calendar write-back last pass.
 *
 * Rather than add another column grant and another chance to forget one,
 * this takes the same shape as the other cohort writes: resolve the caller
 * from their session, confirm they are actually in this mentorship, then
 * write. The caller supplies a session id, which is checked against their
 * own mentorships; it is never trusted on its own.
 */
const INTERVENTIONS = new Set([
  'career_clarity', 'recruiting_strategy', 'resume', 'technical_prep',
  'behavioral_prep', 'interview_prep', 'introduction', 'opportunity',
  'decision', 'accountability', 'other',
]);

export async function saveIntervention(sessionId: string, categories: string[]): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  // RLS on sessions is participation-scoped, so this read proves the caller
  // is one of the two people before anything elevated happens.
  const { data: session } = await supabase
    .from('sessions')
    .select('id, mentor_id, mentee_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return { ok: false, error: 'Not found.' };
  if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
    return { ok: false, error: 'Not found.' };
  }

  const clean = [...new Set(categories.filter((c) => INTERVENTIONS.has(c)))].slice(0, 11);

  const db = svc();
  if (!db) return { ok: false, error: 'Not configured.' };

  const { error } = await db.from('sessions').update({ intervention: clean }).eq('id', sessionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
