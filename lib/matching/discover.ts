import 'server-only';
import { createClient } from '@/lib/supabase/server';
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

  const [{ data: me }, { data: menteeProfile }, { data: connections }] = await Promise.all([
    supabase.from('public_profiles')
      .select('id, first_name, role, university, location').eq('id', user.id).maybeSingle(),
    supabase.from('mentee_profiles')
      .select('interest_tags, career_interests, industries_of_interest, goals, major').eq('id', user.id).maybeSingle(),
    // RLS scopes this to the caller's own relationships.
    supabase.from('mentorships').select('mentee_id, mentor_id').eq('status', 'active'),
  ]);

  if (!me) return null;

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
  };

  const alreadyConnected = new Set<string>();
  for (const m of connections ?? []) {
    if (m.mentee_id === user.id) alreadyConnected.add(m.mentor_id as string);
    if (m.mentor_id === user.id) alreadyConnected.add(m.mentee_id as string);
  }

  const { data: rows } = await supabase
    .from('public_profiles')
    .select('id, first_name, last_name, avatar_url, headline, university, graduation_year, location, mentor_profiles!inner(title, company, industry, expertise_tags, can_help_with, years_experience, is_available, max_mentees, is_founding_mentor)')
    .eq('role', 'mentor')
    .eq('mentor_profiles.is_founding_mentor', true);

  type Row = {
    id: string; first_name: string; last_name: string; avatar_url: string | null;
    headline: string | null; university: string | null; graduation_year: number | null; location: string | null;
    mentor_profiles: {
      title: string | null; company: string | null; industry: string | null;
      expertise_tags: unknown; can_help_with: unknown; years_experience: number | null;
      is_available: boolean | null; max_mentees: number | null;
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
    const expertise = arr(mp?.can_help_with).length ? arr(mp?.can_help_with) : arr(mp?.expertise_tags);
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
    };
  });

  const recommendations = recommend(seeker, candidates, alreadyConnected);

  return {
    seekerName: seeker.firstName,
    recommendations,
    empty: recommendations.length === 0 ? emptyReason(seeker, candidates.length) : null,
    candidatePool: candidates.length,
  };
}
