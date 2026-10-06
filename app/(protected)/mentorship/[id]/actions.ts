'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * The workspace's writes.
 *
 * EVERY ONE USES THE USER-SCOPED CLIENT. The service role is never
 * constructed in this file, so RLS applies to all of it: "Parties can update
 * action items in their mentorship", "Parties can insert mentorship goals",
 * "Parties can update their sessions". An administrator who is not in the
 * relationship cannot write to it, and nothing here has to remember to check
 * that, because the privileged path does not exist.
 *
 * Each action re-reads the mentorship first. That is not the security check
 * (RLS is), it is how a caller gets a clean failure instead of a silent
 * no-op: an UPDATE that matches no rows under RLS succeeds with zero rows
 * affected, which looks identical to success from the client.
 */

type Result = { ok: true } | { ok: false; error: string };

async function assertParticipant(mentorshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, ok: false as const };

  const { data } = await supabase
    .from('mentorships')
    .select('id, mentee_id, mentor_id')
    .eq('id', mentorshipId)
    .maybeSingle();

  const ok = Boolean(data && (data.mentee_id === user.id || data.mentor_id === user.id));
  return { supabase, user, ok, mentorship: data };
}

/** Tick or untick a commitment. Either party may, for either owner. */
export async function setCommitmentDone(
  mentorshipId: string,
  itemId: string,
  done: boolean,
): Promise<Result> {
  const { supabase, ok } = await assertParticipant(mentorshipId);
  if (!ok) return { ok: false, error: 'Not found.' };

  const { error } = await supabase
    .from('action_items')
    .update({ is_completed: done, completed_at: done ? new Date().toISOString() : null })
    .eq('id', itemId)
    .eq('mentorship_id', mentorshipId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}

/**
 * Add something the two of them are working toward.
 *
 * `smart` is the optional breakdown, stored alongside the composed goal
 * rather than instead of it, so the mentee can come back and edit the
 * thinking and not only the summary. NULL for an ordinary goal, which is
 * still the default path.
 */
export async function addGoal(
  mentorshipId: string,
  title: string,
  description: string,
  smart: Record<string, string> | null = null,
  targetDate: string | null = null,
): Promise<Result> {
  const clean = title.trim();
  if (!clean) return { ok: false, error: 'Give it a name first.' };
  if (clean.length > 160) return { ok: false, error: 'Keep it under 160 characters.' };

  const { supabase, user, ok } = await assertParticipant(mentorshipId);
  if (!ok || !user) return { ok: false, error: 'Not found.' };

  const { error } = await supabase.from('mentorship_goals').insert({
    mentorship_id: mentorshipId,
    created_by: user.id,
    title: clean,
    description: description.trim() || null,
    status: 'active',
    smart: smart && Object.keys(smart).length ? smart : null,
    target_date: targetDate || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}

/**
 * Edit a goal's SMART breakdown and composed text.
 *
 * THE OWNERSHIP RULE, and it is enforced by the database, not here. RLS on
 * mentorship_goals is "Goal creator can update their goals"
 * (auth.uid() = created_by). A mentor can read their mentee's goal and talk
 * about it; they cannot silently rewrite it, because the UPDATE matches no
 * rows for them. The brief asks that mentors never overwrite a mentee's
 * goal, and that was already true before this pass.
 */
export async function updateGoal(
  mentorshipId: string,
  goalId: string,
  title: string,
  description: string,
  smart: Record<string, string> | null,
  targetDate: string | null,
): Promise<Result> {
  const clean = title.trim();
  if (!clean) return { ok: false, error: 'Give it a name first.' };
  if (clean.length > 160) return { ok: false, error: 'Keep it under 160 characters.' };

  const { supabase, ok } = await assertParticipant(mentorshipId);
  if (!ok) return { ok: false, error: 'Not found.' };

  const { data, error } = await supabase
    .from('mentorship_goals')
    .update({
      title: clean,
      description: description.trim() || null,
      smart: smart && Object.keys(smart).length ? smart : null,
      target_date: targetDate || null,
    })
    .eq('id', goalId)
    .eq('mentorship_id', mentorshipId)
    .select('id');

  if (error) return { ok: false, error: error.message };
  // Zero rows under RLS means the caller does not own this goal. Say so,
  // rather than reporting a success that changed nothing.
  if (!data || data.length === 0) {
    return { ok: false, error: 'This is your mentee’s goal. You can suggest changes, but only they can edit it.' };
  }

  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}

/** Mark something reached. */
export async function completeGoal(mentorshipId: string, goalId: string): Promise<Result> {
  const { supabase, ok } = await assertParticipant(mentorshipId);
  if (!ok) return { ok: false, error: 'Not found.' };

  const { error } = await supabase
    .from('mentorship_goals')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('mentorship_id', mentorshipId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}

/** Add a commitment, owned by either party. */
export async function addCommitment(
  mentorshipId: string,
  title: string,
  ownerId: string,
  dueDate: string | null,
): Promise<Result> {
  const clean = title.trim();
  if (!clean) return { ok: false, error: 'Say what was promised.' };
  if (clean.length > 200) return { ok: false, error: 'Keep it under 200 characters.' };

  const { supabase, user, ok, mentorship } = await assertParticipant(mentorshipId);
  if (!ok || !user || !mentorship) return { ok: false, error: 'Not found.' };

  // The owner must be one of the two people. Without this, a participant
  // could assign a commitment to an arbitrary profile id.
  if (ownerId !== mentorship.mentee_id && ownerId !== mentorship.mentor_id) {
    return { ok: false, error: 'That person is not in this mentorship.' };
  }

  const { error } = await supabase.from('action_items').insert({
    mentorship_id: mentorshipId,
    created_by: user.id,
    assigned_to: ownerId,
    title: clean,
    due_date: dueDate || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}

/**
 * Save preparation.
 *
 * Progressive: the form calls this per field as the person types and stops,
 * so nothing is lost and there is no giant submit button at the end. The
 * whole prep object is rewritten each time, with the OTHER party's half read
 * back and preserved, because this column holds both halves.
 */
export async function savePrep(
  mentorshipId: string,
  sessionId: string,
  fields: { focus?: string; changed?: string; questions?: string[]; notes?: string },
): Promise<Result> {
  const { supabase, user, ok, mentorship } = await assertParticipant(mentorshipId);
  if (!ok || !user || !mentorship) return { ok: false, error: 'Not found.' };

  const isMentor = mentorship.mentor_id === user.id;

  const { data: row } = await supabase
    .from('sessions')
    .select('prep')
    .eq('id', sessionId)
    .eq('mentorship_id', mentorshipId)
    .maybeSingle();

  if (!row) return { ok: false, error: 'Not found.' };

  const current = (row.prep ?? {}) as { mentee?: unknown; mentor?: unknown };

  /*
    Each side writes only its own half. A mentee cannot write the mentor's
    notes and a mentor cannot rewrite the mentee's questions, even though RLS
    lets both update the row: the half they are not allowed to touch is
    copied forward from what was already stored.
  */
  const next = isMentor
    ? { ...current, mentor: { notes: (fields.notes ?? '').slice(0, 4000) } }
    : {
        ...current,
        mentee: {
          focus: (fields.focus ?? '').slice(0, 500),
          changed: (fields.changed ?? '').slice(0, 1000),
          questions: (fields.questions ?? [])
            .map((q) => q.slice(0, 300))
            .filter((q) => q.trim() !== '')
            .slice(0, 8),
        },
      };

  const { error } = await supabase
    .from('sessions')
    .update({ prep: next })
    .eq('id', sessionId)
    .eq('mentorship_id', mentorshipId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/mentorship/${mentorshipId}`);
  return { ok: true };
}
