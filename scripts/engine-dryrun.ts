/**
 * A dry run of the matching engine against real production profiles.
 *
 * NOT a user-facing surface and not a seed: it reads, scores and prints.
 * Run against the seeded mentor roster deliberately — it is the only
 * population with populated expertise tags, and the question being asked
 * is whether the ENGINE produces sensible reasons, which does not require
 * the people to be real.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { recommend, type Candidate, type Seeker } from '../lib/matching/engine';

const env: Record<string, string> = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

async function main() {
  const { data: mentors } = await db
    .from('mentor_profiles')
    .select('id, title, company, industry, expertise_tags, years_experience, is_available, max_mentees, profiles(first_name, last_name)');

  const candidates: Candidate[] = (mentors ?? []).map((m) => {
    const p = m.profiles as unknown as { first_name: string; last_name: string } | null;
    return {
      id: m.id as string,
      firstName: p?.first_name ?? '?',
      fullName: [p?.first_name, p?.last_name].filter(Boolean).join(' ') || '?',
      avatarUrl: null, headline: null,
      title: m.title as string | null, company: m.company as string | null,
      industry: m.industry as string | null,
      location: null, university: null, graduationYear: null,
      expertise: arr(m.expertise_tags),
      currentLoad: 0, maxLoad: (m.max_mentees as number) ?? 0,
      available: m.is_available !== false,
      yearsExperience: m.years_experience as number | null,
    };
  });

  const { data: mentees } = await db
    .from('mentee_profiles')
    .select('id, interest_tags, career_interests, industries_of_interest, goals, major, profiles(first_name)')
    .limit(3);

  console.log(`candidate pool: ${candidates.length} mentor profiles\n`);

  for (const e of mentees ?? []) {
    const p = e.profiles as unknown as { first_name: string } | null;
    const goals = e.goals;
    const seeker: Seeker = {
      id: e.id as string,
      firstName: p?.first_name ?? '?',
      interests: [...arr(e.interest_tags), ...arr(e.career_interests)],
      industries: arr(e.industries_of_interest),
      goals: typeof goals === 'string' ? [goals] : arr(goals),
      major: e.major as string | null, university: null, location: null,
    };

    const recs = recommend(seeker, candidates, new Set(), 3);
    console.log(`── ${seeker.firstName} — wants: ${seeker.interests.slice(0, 4).join(', ') || '(nothing stated)'}`);
    if (recs.length === 0) { console.log('   no recommendation (engine declined to pad)\n'); continue; }
    for (const r of recs) {
      console.log(`   ${r.candidate.fullName} · ${r.candidate.title} at ${r.candidate.company}`);
      for (const reason of r.reasons.slice(0, 2)) console.log(`      - ${reason.text}`);
      console.log(`      opener: ${r.opener}`);
    }
    console.log('');
  }
}
void main();
