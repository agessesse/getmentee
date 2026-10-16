import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { schemaCapabilities } from '@/lib/schema-capabilities';
import {
  recommend, emptyReason,
  type Candidate, type Seeker, type Recommendation,
} from '@/lib/matching/engine';

/**
 * Discover: who this person should know, computed per request.
 *
 * RECOMMENDATIONS ARE NOT STORED. They are a function of two profiles and
 * change the moment either person edits theirs. Persisting them would mean
 * a stale recommendation outliving the reason it existed, and a cache to
 * invalidate for no benefit at this size. When the community is large
 * enough that this is slow, the fix is pagination and a candidate
 * pre-filter, not a table of yesterday's answers.
 *
 * THE ROSTER GATE IS THE SAME ONE /network USES. Every mentor row in
 * production is a fixture from seed-demo.ts with is_demo = false, so
 * is_founding_mentor is what separates a real member from an invented one.
 * Recommending a fixture would be the worst possible failure of this
 * surface: a person reads a thoughtful explanation of why they should meet
 * someone who does not exist.
 *
 * Reads through the caller's own client. public_profiles excludes email;
 * mentor_profiles is participant-readable. No service role.
 */

export interface DiscoverView {
  seekerName: string;
  recommendations: Recommendation[];
  /** Existing introduction state per candidate, so nobody asks twice. */
  askedByCandidate: Record<string, 'pending' | 'approved' | 'declined'>;
  /** Why there is nothing, when there is nothing. */
  empty: 'no_members' | 'thin_profile' | 'no_overlap' | null;
  /** Real members considered, before scoring. Shown in the empty state. */
  candidatePool: number;
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

export async function loadDiscover(): Promise<DiscoverView | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: me }, { data: menteeProfile }, { data: connections }, { data: asked }] = await Promise.all([
    supabase.from('public_profiles')
      .select('id, first_name, role, university, location').eq('id', user.id).maybeSingle(),
    supabase.from('mentee_profiles')
      .select('interest_tags, career_interests, industries_of_interest, goals, major').eq('id', user.id).maybeSingle(),
    // RLS scopes this to the caller's own relationships.
    supabase.from('mentorships').select('mentee_id, mentor_id').eq('status', 'active'),
    // RLS scopes this to requests the caller is part of.
    supabase.from('mentorship_requests').select('mentor_id, mentee_id, status'),
  ]);

  if (!me) return null;

  /*
    WHAT MIGRATION 0039 ADDED, AND WHY IT IS A SEPARATE QUERY.

    PostgREST rejects the WHOLE select when one named column does not
    exist, so folding these into the queries above would blank Discover
    entirely for every user until the migration is applied. That exact
    failure already shipped once in this codebase, when an unknown
    career_interests column would have rendered the cohort pipeline empty.
    The capability is asked for instead, and the engine simply produces
    fewer reasons until the columns are there.
  */
  const caps = await schemaCapabilities();

  let extra: Record<string, unknown> | null = null;
  let intent: Seeker['intent'] = null;
  if (caps.intelligenceInputs) {
    const [{ data: ex }, { data: it }] = await Promise.all([
      supabase.from('mentee_profiles')
        .select('functions_exploring, transitions_navigating, communities, target_companies')
        .eq('id', user.id).maybeSingle(),
      /* One active intent per person, enforced by a partial unique index.
         A closed one is deliberately NOT read: an expired need must stop
         producing recommendations, which is the entire point of dating it. */
      supabase.from('member_intent')
        .select('objective, questions, looking_for, by_date')
        .eq('profile_id', user.id).eq('status', 'active').maybeSingle(),
    ]);
    extra = ex ?? null;
    intent = it?.objective
      ? {
          objective: it.objective as string,
          questions: arr(it.questions),
          lookingFor: arr(it.looking_for),
          byDate: (it.by_date as string | null) ?? null,
        }
      : null;
  }

  const goalsRaw = (menteeProfile as { goals?: unknown } | null)?.goals;
  const seeker: Seeker = {
    id: user.id,
    firstName: me.first_name ?? '',
    interests: [
      ...arr((menteeProfile as { interest_tags?: unknown } | null)?.interest_tags),
      ...arr((menteeProfile as { career_interests?: unknown } | null)?.career_interests),
    ],
    industries: arr((menteeProfile as { industries_of_interest?: unknown } | null)?.industries_of_interest),
    goals: typeof goalsRaw === 'string' ? [goalsRaw] : arr(goalsRaw),
    major: (menteeProfile as { major?: string } | null)?.major ?? null,
    university: me.university ?? null,
    location: me.location ?? null,
    functionsExploring: arr(extra?.functions_exploring),
    transitionsNavigating: arr(extra?.transitions_navigating),
    communities: arr(extra?.communities),
    targetCompanies: arr(extra?.target_companies),
    intent,
  };

  const alreadyConnected = new Set<string>();
  for (const m of connections ?? []) {
    if (m.mentee_id === user.id) alreadyConnected.add(m.mentor_id as string);
    if (m.mentor_id === user.id) alreadyConnected.add(m.mentee_id as string);
  }

  const MENTOR_BASE = 'title, company, industry, expertise_tags, can_help_with, years_experience, is_available, max_mentees, is_founding_mentor';
  const MENTOR_0039 = 'companies_known, functions, transitions_made, topics_enjoyed, useful_to, affiliations';
  const mentorCols = caps.intelligenceInputs ? `${MENTOR_BASE}, ${MENTOR_0039}` : MENTOR_BASE;

  const { data: rows } = await supabase
    .from('public_profiles')
    .select(`id, first_name, last_name, avatar_url, headline, university, graduation_year, location, mentor_profiles!inner(${mentorCols})`)
    .eq('role', 'mentor')
    .eq('mentor_profiles.is_founding_mentor', true);

  type Row = {
    id: string; first_name: string; last_name: string; avatar_url: string | null;
    headline: string | null; university: string | null; graduation_year: number | null; location: string | null;
    mentor_profiles: {
      title: string | null; company: string | null; industry: string | null;
      expertise_tags: unknown; can_help_with: unknown; years_experience: number | null;
      is_available: boolean | null; max_mentees: number | null;
      companies_known?: unknown; functions?: unknown; transitions_made?: unknown;
      topics_enjoyed?: unknown; useful_to?: unknown; affiliations?: unknown;
    };
  };

  // How many relationships each candidate already holds, for the capacity
  // constraint. Counted from the rows RLS lets this caller see, which is a
  // known undercount; capacity is a soft floor here, not an authority.
  const loads = new Map<string, number>();
  for (const m of connections ?? []) {
    loads.set(m.mentor_id as string, (loads.get(m.mentor_id as string) ?? 0) + 1);
  }

  const candidates: Candidate[] = ((rows ?? []) as unknown as Row[]).map((r) => {
    const mp = r.mentor_profiles;
    /*
      can_help_with USED TO SUBSTITUTE FOR expertise here, because the
      engine had one field to put them in and can_help_with was the better
      of the two. It now has its own signal, weighted above subject
      overlap, so the two are passed separately and the fallback is gone.

      The fallback could not have been doing anything anyway: measured in
      production, can_help_with was empty for 25 of 25 mentors, so every
      candidate took the expertise_tags branch every time.
    */
    const expertise = arr(mp?.expertise_tags);
    return {
      id: r.id,
      firstName: r.first_name ?? '',
      fullName: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unnamed',
      avatarUrl: r.avatar_url,
      headline: r.headline,
      title: mp?.title ?? null,
      company: mp?.company ?? null,
      industry: mp?.industry ?? null,
      location: r.location,
      university: r.university,
      graduationYear: r.graduation_year,
      expertise,
      currentLoad: loads.get(r.id) ?? 0,
      maxLoad: mp?.max_mentees ?? 0,
      available: mp?.is_available !== false,
      yearsExperience: mp?.years_experience ?? null,
      canHelpWith: arr(mp?.can_help_with),
      companiesKnown: arr(mp?.companies_known),
      functions: arr(mp?.functions),
      transitionsMade: arr(mp?.transitions_made),
      topicsEnjoyed: arr(mp?.topics_enjoyed),
      usefulTo: arr(mp?.useful_to),
      affiliations: arr(mp?.affiliations),
    };
  });

  const recommendations = recommend(seeker, candidates, alreadyConnected);

  const askedByCandidate: Record<string, 'pending' | 'approved' | 'declined'> = {};
  for (const r of asked ?? []) {
    if (r.mentee_id !== user.id) continue;
    askedByCandidate[r.mentor_id as string] = r.status as 'pending' | 'approved' | 'declined';
  }

  return {
    seekerName: seeker.firstName,
    recommendations,
    askedByCandidate,
    empty: recommendations.length === 0 ? emptyReason(seeker, candidates.length) : null,
    candidatePool: candidates.length,
  };
}
