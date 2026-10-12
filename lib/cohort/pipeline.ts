import 'server-only';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { STAGE_LABEL, PRIMARY_STAGES, type Stage, type PipelinePerson, type Funnel } from '@/lib/cohort/stages';

export { STAGE_LABEL, PRIMARY_STAGES };
export type { Stage, PipelinePerson, Funnel };

/**
 * The cohort pipeline, in the operator's language.
 *
 * TRANSLATING DATABASE STATE INTO HUMAN CONCEPTS is the whole job of this
 * file. An operator should never read "status = accepted" or "mentorship
 * row exists"; they should read "Selected" and "Abel and Drew are matched".
 *
 * WHERE EACH STAGE COMES FROM, and why it is not all one column:
 *
 *   Applied    cohort_applications.status = 'submitted'
 *   Reviewing  'reviewing'
 *   Selected   'accepted'          -- chosen, not yet paired
 *   Hold       'hold'
 *   Declined   'declined'
 *   Matching   selected AND no mentorship yet  (derived)
 *   Matched    a mentorship exists             (derived)
 *   Activated  mentorships.activated_at is set (derived)
 *
 * The last three are DERIVED FROM THE RELATIONSHIP, deliberately. Copying
 * them into the application row would create two places that both claim to
 * know whether somebody is matched, and they would disagree within a week.
 * The application says how far somebody got through selection; the
 * relationship says what happened after.
 */

export interface PipelineView {
  cohort: { id: string; name: string; slug: string; term: string | null; activationWindowDays: number } | null;
  people: PipelinePerson[];
  funnels: { student: Funnel; mentor: Funnel };
  /** Mentors with capacity, for the matching workspace. */
  eligibleMentorCount: number;
}

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

/** Human sentence for what the operator is waiting on. */
function waiting(stage: Stage, role: 'mentee' | 'mentor', partner: string | null): string | null {
  switch (stage) {
    case 'applied': return 'Needs a first read.';
    case 'reviewing': return 'Decide: select, hold or decline.';
    case 'selected': return role === 'mentee' ? 'Ready to match with a mentor.' : 'Waiting on their commitment.';
    case 'matching': return role === 'mentee' ? 'Ready to match with a mentor.' : 'Available to be matched.';
    case 'matched': return partner ? `Waiting for the first conversation with ${partner}.` : 'Waiting for the first conversation.';
    case 'activated': return null;
    case 'hold': return 'On hold — revisit before matching closes.';
    case 'declined': return null;
  }
}

export async function loadPipeline(cohortSlug = 'cohort-001'): Promise<PipelineView | null> {
  const c = db();
  if (!c) return null;

  const { data: cohort } = await c
    .from('cohorts')
    .select('id, name, slug, term, activation_window_days')
    .eq('slug', cohortSlug)
    .maybeSingle();

  const [{ data: apps }, { data: mentorships }, { data: memberships }] = await Promise.all([
    c.from('cohort_applications')
      /*
        EVERY COLUMN HERE EXISTS. career_interests was in an earlier draft
        and lives on mentee_profiles, not on the application; PostgREST
        rejects the whole select for one unknown column, so the pipeline
        would have rendered empty rather than wrong. Caught by running it
        against production rather than by reading it.
      */
      .select('id, role, full_name, email, school, year, major, finance_paths, field, hardest, tried, title, organization, expertise, learning, who_help, why_mentoring, involvement, timely, linkedin_url, status, user_id, notes, access_signals, created_at, cohort_id')
      .order('created_at', { ascending: false }),
    cohort
      ? c.from('mentorships').select('id, mentee_id, mentor_id, status, started_at').eq('cohort_id', cohort.id)
      : Promise.resolve({ data: [] }),
    cohort
      ? c.from('cohort_memberships').select('profile_id, role, state').eq('cohort_id', cohort.id)
      : Promise.resolve({ data: [] }),
  ]);

  const msRows = (mentorships ?? []) as Array<{
    id: string; mentee_id: string; mentor_id: string; status: string; started_at: string | null;
  }>;

  /*
    ACTIVATION IS DERIVED FROM CONVERSATIONS, NOT FROM A FLAG.

    The brief's suggested rule was "both participants completed an
    acceptance action". I am deviating, and here is why.

    Two people clicking Accept is not a relationship starting; it is two
    people agreeing to start one. A pair who both accepted and never spoke
    is not activated in any sense an operator cares about, and counting
    them as such would make the activation metric measure enthusiasm at
    the moment of introduction rather than whether anything happened.

    "Activated = they have actually had their first conversation" is also
    the definition the Activation metric already uses and is already tested
    against, so the pipeline stage and the metric now mean the same thing.
    One word, one meaning.

    Derived rather than read from a column so the pipeline works whether or
    not migration 0038 has been applied; 0038's activated_at exists to make
    the moment durable and indexable for measurement.
  */
  const { data: firstSessions } = msRows.length
    ? await c.from('sessions')
        .select('mentorship_id, scheduled_at, status')
        .in('mentorship_id', msRows.map((m) => m.id))
        .eq('status', 'completed')
    : { data: [] };
  const activatedIds = new Set((firstSessions ?? []).map((s) => s.mentorship_id as string));

  // Names for anybody who appears in a relationship.
  const ids = [...new Set(msRows.flatMap((m) => [m.mentee_id, m.mentor_id]))];
  const { data: people } = ids.length
    ? await c.from('profiles').select('id, first_name, last_name').in('id', ids)
    : { data: [] };
  const nameOf = (id: string) => {
    const p = (people ?? []).find((x) => x.id === id);
    return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Unnamed';
  };

  const byProfile = new Map<string, { id: string; partner: string; activated: boolean }>();
  for (const m of msRows) {
    const activated = activatedIds.has(m.id);
    byProfile.set(m.mentee_id, { id: m.id, partner: nameOf(m.mentor_id), activated });
    byProfile.set(m.mentor_id, { id: m.id, partner: nameOf(m.mentee_id), activated });
  }
  const committed = new Set(
    (memberships ?? []).filter((m) => ['committed', 'matched', 'active', 'completed'].includes(m.state as string))
      .map((m) => m.profile_id as string),
  );

  const rows = (apps ?? []) as Array<Record<string, unknown>>;

  const persons: PipelinePerson[] = rows.map((a) => {
    const role = (a.role as 'mentee' | 'mentor') ?? 'mentee';
    const profileId = (a.user_id as string | null) ?? null;
    const rel = profileId ? byProfile.get(profileId) : undefined;
    const status = a.status as string;

    let stage: Stage;
    if (status === 'declined') stage = 'declined';
    else if (status === 'withdrawn') stage = 'declined';
    else if (status === 'hold') stage = 'hold';
    else if (rel?.activated) stage = 'activated';
    else if (rel) stage = 'matched';
    else if (status === 'accepted') {
      /*
        A selected person is "ready to match" only once they can actually be
        matched: a student needs an account, a mentor needs to have accepted
        the commitment. Showing somebody as matchable before that produces
        matches that cannot be delivered.
      */
      const ready = role === 'mentee' ? Boolean(profileId) : committed.has(profileId ?? '');
      stage = ready ? 'matching' : 'selected';
    }
    else if (status === 'reviewing') stage = 'reviewing';
    else stage = 'applied';

    return {
      applicationId: a.id as string,
      profileId,
      role,
      stage,
      fullName: (a.full_name as string) ?? 'Unnamed',
      email: (a.email as string) ?? '',
      appliedAt: a.created_at as string,
      school: (a.school as string) ?? null,
      year: (a.year as string) ?? null,
      major: (a.major as string) ?? null,
      careerInterests: arr(a.finance_paths).length ? arr(a.finance_paths) : (a.field ? [a.field as string] : []),
      title: (a.title as string) ?? null,
      organization: (a.organization as string) ?? null,
      expertise: (a.expertise as string) ?? null,
      // The student's own account of where they are stuck, and the mentor's
      // of why they are here. The two sentences matching actually turns on.
      context: ((role === 'mentee' ? a.hardest : a.why_mentoring) as string) ?? null,
      tried: ((role === 'mentee' ? a.tried : a.involvement) as string) ?? null,
      wants: ((role === 'mentee' ? a.learning : a.who_help) as string) ?? null,
      linkedinUrl: (a.linkedin_url as string) ?? null,
      accessSignals: arr(a.access_signals),
      operatorNotes: (a.notes as string) ?? null,
      partnerName: rel?.partner ?? null,
      mentorshipId: rel?.id ?? null,
      waitingOn: waiting(stage, role, rel?.partner ?? null),
    };
  });

  const countFor = (role: 'mentee' | 'mentor'): Funnel => {
    const mine = persons.filter((p) => p.role === role);
    const at = (s: Stage) => mine.filter((p) => p.stage === s).length;
    /*
      CUMULATIVE, not bucketed. "Selected" means everybody who got at least
      that far, including those now matched, because a funnel that empties
      as people progress reads as people dropping out.
    */
    const matched = at('matched') + at('activated');
    const selected = at('selected') + at('matching') + matched;
    const reviewing = at('reviewing') + selected + at('hold');
    return {
      role,
      applied: mine.length,
      reviewing,
      selected,
      matched,
      activated: at('activated'),
      hold: at('hold'),
      declined: at('declined'),
    };
  };

  return {
    cohort: cohort
      ? { id: cohort.id, name: cohort.name, slug: cohort.slug, term: cohort.term, activationWindowDays: cohort.activation_window_days }
      : null,
    people: persons,
    funnels: { student: countFor('mentee'), mentor: countFor('mentor') },
    eligibleMentorCount: persons.filter((p) => p.role === 'mentor' && (p.stage === 'matching' || p.stage === 'selected')).length,
  };
}
