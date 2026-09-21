import { createClient } from '@/lib/supabase/client';

/**
 * A person's private notebook for one session: what they prepared, what they
 * noted during the conversation, and what they took away from it.
 *
 * WHERE IT LIVES. public.session_summaries, one row per (session, author),
 * which the schema already enforces with UNIQUE (session_id, created_by). The
 * table's RLS lets only the author read or update a row whose visibility is
 * 'private', and every notebook row is written as private. So this is private
 * by database rule, not by hiding it in the UI: a mentor can never read a
 * mentee's notebook, or the reverse.
 *
 * WHY THIS TABLE. It was created for session intelligence (0010) and nothing
 * else in the app writes to it. The alternative columns — sessions.prep_mentee,
 * prep_mentor and mentor_recap — were unwritable when this was built, because
 * 0017 revoked UPDATE on sessions and left them out of the re-grant; 0023
 * restores that grant. They stay unused all the same: both prep columns are
 * readable by the other party, and these notes are private by design. A mentor
 * must be able to write "he freezes on technicals" without the student seeing
 * it. What either person chooses to share goes through the shared surfaces
 * below.
 *
 * SHAPE. The structured notebook is stored in the jsonb `action_items` column
 * under { kind: 'mentable-notebook', v: 1 }. The readable columns are filled
 * too (summary, topics_discussed, follow_up) so the row makes sense to anyone
 * inspecting the database. If AI summaries are ever persisted here, give them
 * their own row shape or table rather than overwriting this one.
 *
 * Anything a person chooses to SHARE goes through surfaces that are already
 * shared: the session agenda (sessions.notes), action items, and messages.
 */

export interface Notebook {
  prep: {
    objective: string;
    sinceThen: string;
    questions: string[];
    checklist: Record<string, boolean>;
    sharedToAgendaAt: string | null;
  };
  during: { notes: string };
  reflection: {
    learned: string;
    followUp: string;
    /** Mentor: what to remember next time. Mentee: what they'll update the mentor on. */
    rememberNext: string;
    /** First conversation only: how the two of them agreed to work together. */
    workingAgreement: string;
    savedAt: string | null;
  };
}

export const emptyNotebook = (): Notebook => ({
  prep: { objective: '', sinceThen: '', questions: ['', '', ''], checklist: {}, sharedToAgendaAt: null },
  during: { notes: '' },
  reflection: { learned: '', followUp: '', rememberNext: '', workingAgreement: '', savedAt: null },
});

const KIND = 'mentable-notebook';

function parse(raw: unknown): Notebook {
  const base = emptyNotebook();
  if (!raw || typeof raw !== 'object' || (raw as { kind?: string }).kind !== KIND) return base;
  const r = raw as Partial<Notebook>;
  return {
    prep: { ...base.prep, ...(r.prep ?? {}) },
    during: { ...base.during, ...(r.during ?? {}) },
    reflection: { ...base.reflection, ...(r.reflection ?? {}) },
  };
}

export async function loadNotebook(sessionId: string, userId: string): Promise<Notebook> {
  const supabase = createClient();
  const { data } = await supabase
    .from('session_summaries')
    .select('action_items')
    .eq('session_id', sessionId)
    .eq('created_by', userId)
    .maybeSingle();
  return parse(data?.action_items);
}

/** Notebooks for several sessions at once, keyed by session id. */
export async function loadNotebooks(sessionIds: string[], userId: string): Promise<Map<string, Notebook>> {
  const out = new Map<string, Notebook>();
  if (!sessionIds.length) return out;
  const supabase = createClient();
  const { data } = await supabase
    .from('session_summaries')
    .select('session_id, action_items')
    .eq('created_by', userId)
    .in('session_id', sessionIds);
  for (const row of data ?? []) out.set(row.session_id as string, parse(row.action_items));
  return out;
}

export async function saveNotebook(sessionId: string, userId: string, nb: Notebook): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const questions = nb.prep.questions.map((q) => q.trim()).filter(Boolean);
  const { error } = await supabase
    .from('session_summaries')
    .upsert(
      {
        session_id: sessionId,
        created_by: userId,
        visibility: 'private',
        action_items: { kind: KIND, v: 1, ...nb },
        summary: nb.reflection.learned || nb.reflection.rememberNext || null,
        topics_discussed: questions,
        follow_up: nb.reflection.followUp || null,
      },
      { onConflict: 'session_id,created_by' },
    );
  return { ok: !error };
}

/** True when someone has written anything worth calling "prepared". */
export const hasPrep = (nb: Notebook) =>
  !!nb.prep.objective.trim() || nb.prep.questions.some((q) => q.trim());

export const hasReflection = (nb: Notebook) =>
  !!(nb.reflection.learned.trim() || nb.reflection.rememberNext.trim() || nb.reflection.followUp.trim());
