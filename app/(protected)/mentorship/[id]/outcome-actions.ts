'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { schemaCapabilities } from '@/lib/schema-capabilities';
import type { Usefulness, ContinueIntent } from '@/lib/mentorship/outcomes';

/**
 * Recording what one side thought of a conversation.
 *
 * WHY SERVICE ROLE, AND WHY THAT IS NOT A HOLE. relationship_outcomes has
 * RLS on with zero policies and zero grants, which is deliberate: these
 * are candid answers about a named other person, and a participant must
 * never be able to read what their counterpart said. A SELECT policy
 * wide enough for someone to write their own row is wide enough to get
 * the shape of the table wrong later; no policy at all cannot be.
 *
 * The protection is the same arrangement cohort/actions.ts uses, and it
 * is stronger than a grant: the caller is resolved from their OWN
 * session, the mentorship is read through their OWN RLS-scoped client
 * (so a non-participant finds nothing), and the respondent id is taken
 * from the session rather than from any argument. There is no parameter
 * that can be pointed at somebody else's relationship or signed with
 * somebody else's name.
 *
 * The only caller-supplied values are the two answers and an optional
 * note, every one of which is validated against a fixed set below and
 * again by a CHECK constraint in the database.
 */

type Result = { ok: true } | { ok: false; error: string };

function svc(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const USEFULNESS: Usefulness[] = ['high', 'some', 'low'];
const CONTINUE: ContinueIntent[] = ['yes', 'maybe', 'no'];

export async function recordOutcome(
  mentorshipId: string,
  sessionId: string,
  answer: { usefulness: string; continueIntent: string; note?: string },
): Promise<Result> {
  if (!USEFULNESS.includes(answer.usefulness as Usefulness)) return { ok: false, error: 'Invalid answer.' };
  if (!CONTINUE.includes(answer.continueIntent as ContinueIntent)) return { ok: false, error: 'Invalid answer.' };

  const caps = await schemaCapabilities();
  if (!caps.relationshipOutcomes) return { ok: false, error: 'Not available yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  /*
    Read through the CALLER'S client, not the service one. RLS on
    mentorships is scoped to the two participants, so a non-participant
    gets no row and falls into the same answer as a mentorship that does
    not exist — the authorization check and the lookup are one step, which
    is harder to forget than two.
  */
  const { data: m } = await supabase
    .from('mentorships')
    .select('id, mentor_id, mentee_id')
    .eq('id', mentorshipId)
    .maybeSingle();
  if (!m) return { ok: false, error: 'Not found.' };

  const role = m.mentor_id === user.id ? 'mentor' : m.mentee_id === user.id ? 'mentee' : null;
  if (!role) return { ok: false, error: 'Not found.' };

  /* The session must belong to THIS relationship and be finished. Checked
     rather than trusted: sessionId arrives from the client. */
  const { data: s } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('mentorship_id', mentorshipId)
    .maybeSingle();
  if (!s || s.status !== 'completed') return { ok: false, error: 'Not found.' };

  const db = svc();
  if (!db) return { ok: false, error: 'Not configured.' };

  const { error } = await db.from('relationship_outcomes').insert({
    mentorship_id: mentorshipId,
    session_id: sessionId,
    respondent_id: user.id,
    role,
    usefulness: answer.usefulness,
    continue_intent: answer.continueIntent,
    note: answer.note?.trim().slice(0, 1000) || null,
  });

  /*
    A unique index covers (mentorship, respondent, session), so a double
    submit answers 23505. That is the constraint doing its job, not a
    failure the person needs to hear about — they already answered.
  */
  if (error && error.code !== '23505') return { ok: false, error: error.message };

  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}
