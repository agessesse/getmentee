import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * The people actually on Mentable.
 *
 * THE ROSTER GATE, AND WHY IT MATTERS MORE THAN THE PAGE AROUND IT.
 *
 * Every mentor row in the database today is a fixture from
 * scripts/seed-demo.ts -- invented people at Goldman, Bain and Blackstone,
 * written with is_demo = false, indistinguishable from a real account.
 * Listing them would be fabricated liquidity: a student would browse a
 * network of twenty-five professionals, none of whom exist, and send a
 * genuine request into nothing.
 *
 * So the gate is mentor_profiles.is_founding_mentor, which is the
 * convention /discover already established and which is false for every
 * fixture. Onboarding a real mentor is one flag.
 *
 * TODAY THAT RETURNS ZERO PEOPLE, and the page says so plainly rather than
 * padding itself. An empty network that admits it is worth more than a full
 * one that lies, because the first can be fixed by recruiting and the
 * second cannot be fixed at all.
 */

export interface NetworkPerson {
  id: string;
  fullName: string;
  firstName: string;
  avatarUrl: string | null;
  role: 'mentor' | 'mentee';
  headline: string | null;
  location: string | null;
  university: string | null;
  graduationYear: number | null;
  roleLine: string | null;
  company: string | null;
  /** What they can help with, or what they want help with. */
  tags: string[];
}

const asTags = (v: unknown): string[] =>
  Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

export async function loadNetwork(): Promise<{ people: NetworkPerson[]; viewerRole: 'mentor' | 'mentee' } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: self } = await supabase
    .from('public_profiles').select('role').eq('id', user.id).maybeSingle();
  const viewerRole = ((self?.role as 'mentor' | 'mentee') ?? 'mentee');

  /*
    Mentors who are genuinely on the platform. public_profiles is the view
    that excludes email; mentor_profiles is participant-readable. No service
    role is needed, so none is used.
  */
  const { data: mentors } = await supabase
    .from('public_profiles')
    .select('id, first_name, last_name, avatar_url, role, headline, location, university, graduation_year, mentor_profiles!inner(title, company, industry, can_help_with, expertise_tags, is_founding_mentor)')
    .eq('role', 'mentor')
    .eq('mentor_profiles.is_founding_mentor', true);

  const people: NetworkPerson[] = ((mentors ?? []) as unknown as Array<{
    id: string; first_name: string; last_name: string; avatar_url: string | null;
    role: string; headline: string | null; location: string | null;
    university: string | null; graduation_year: number | null;
    mentor_profiles: { title: string | null; company: string | null; industry: string | null; can_help_with: unknown; expertise_tags: unknown };
  }>)
    .filter((m) => m.id !== user.id)
    .map((m) => {
      const mp = m.mentor_profiles;
      const tags = asTags(mp?.can_help_with).length ? asTags(mp?.can_help_with) : asTags(mp?.expertise_tags);
      return {
        id: m.id,
        fullName: [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Unnamed',
        firstName: m.first_name ?? '',
        avatarUrl: m.avatar_url,
        role: 'mentor' as const,
        headline: m.headline,
        location: m.location,
        university: m.university,
        graduationYear: m.graduation_year,
        roleLine: [mp?.title, mp?.industry].filter(Boolean).join(' · ') || null,
        company: mp?.company ?? null,
        tags: tags.slice(0, 5),
      };
    });

  return { people, viewerRole };
}
