import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { resolveParticipantContext } from '@/lib/theme/resolve';
import type { TenantIdentity } from '@/lib/theme/identity';

/**
 * A person, as Mentable understands them.
 *
 * ONE SHAPE FOR BOTH ROLES. A mentor and a student answer different
 * questions, but they are both people on the same network and the product
 * should not fork into two profile systems. The role decides which fields
 * carry weight, not which component renders.
 *
 * NOT A RESUME. There is no work history, no endorsements, no skill
 * ratings. The two questions a Mentable profile exists to answer are "what
 * can I help with" and "what do I want help with", and everything else is
 * context for those.
 *
 * Reads through the caller's own client. public_profiles is the view that
 * deliberately excludes email; mentor_profiles and mentee_profiles are
 * participant-readable. Nothing here needs the service role, so it does not
 * get it.
 */

export interface ProfileView {
  id: string;
  isMe: boolean;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  role: 'mentor' | 'mentee';
  headline: string | null;
  location: string | null;
  linkedinUrl: string | null;
  university: string | null;
  graduationYear: number | null;
  bio: string | null;
  /** "Managing Director · Markets" for a mentor. */
  roleLine: string | null;
  company: string | null;
  /** What they can help with, or what they want help with. */
  helps: string[];
  wants: string[];
  /** Free-text ambition, from either role profile. */
  goals: string | null;
  yearsExperience: number | null;
  /** True once the role profile is filled in. */
  complete: boolean;
  /** Programme identity, when they are in one. */
  tenant: TenantIdentity | null;
  /** Relationship between the viewer and this person, if any. */
  sharedMentorshipId: string | null;
}

const asTags = (v: unknown): string[] =>
  Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

/** `null` means "no such person, or not visible to you". */
export async function loadProfile(targetId?: string): Promise<ProfileView | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const id = targetId ?? user.id;
  const isMe = id === user.id;

  const { data: base } = await supabase
    .from('public_profiles')
    .select('id, first_name, last_name, avatar_url, role, headline, location, linkedin_url, university, graduation_year')
    .eq('id', id)
    .maybeSingle();
  if (!base) return null;

  const role = (base.role as 'mentor' | 'mentee') ?? 'mentee';

  const [{ data: mentor }, { data: mentee }, { data: shared }] = await Promise.all([
    role === 'mentor'
      ? supabase.from('mentor_profiles')
          .select('bio, title, company, industry, expertise_tags, can_help_with, years_experience, profile_complete, goals')
          .eq('id', id).maybeSingle()
      : Promise.resolve({ data: null }),
    role === 'mentee'
      ? supabase.from('mentee_profiles')
          .select('bio, interest_tags, goals, career_interests, industries_of_interest, major, profile_complete')
          .eq('id', id).maybeSingle()
      : Promise.resolve({ data: null }),
    /*
      Do we already work together? RLS scopes mentorships to the two
      participants, so this returns a row only when the viewer is genuinely
      in a relationship with this person. It is what lets a profile link
      straight into the shared workspace instead of dead-ending.
    */
    isMe
      ? Promise.resolve({ data: null })
      : supabase.from('mentorships')
          .select('id, mentee_id, mentor_id, status')
          .or(`mentee_id.eq.${id},mentor_id.eq.${id}`)
          .eq('status', 'active')
          .limit(1).maybeSingle(),
  ]);

  const m = mentor as {
    bio: string | null; title: string | null; company: string | null; industry: string | null;
    expertise_tags: unknown; can_help_with: unknown; years_experience: number | null;
    profile_complete: boolean | null; goals: unknown;
  } | null;
  const e = mentee as {
    bio: string | null; interest_tags: unknown; goals: unknown;
    career_interests: unknown; industries_of_interest: unknown; major: string | null;
    profile_complete: boolean | null;
  } | null;

  /*
    A mentee's `goals` column is an array in some rows and prose in others,
    because it predates the current form. Normalised here rather than making
    every caller handle both.
  */
  const goalsText = (v: unknown): string | null => {
    if (typeof v === 'string') return v.trim() || null;
    const t = asTags(v);
    return t.length ? t.join(', ') : null;
  };

  return {
    id: base.id,
    isMe,
    firstName: base.first_name ?? '',
    lastName: base.last_name ?? '',
    fullName: [base.first_name, base.last_name].filter(Boolean).join(' ') || 'Unnamed',
    avatarUrl: base.avatar_url,
    role,
    headline: base.headline,
    location: base.location,
    linkedinUrl: base.linkedin_url,
    university: base.university,
    graduationYear: base.graduation_year,
    bio: m?.bio ?? e?.bio ?? null,
    roleLine: m ? [m.title, m.industry].filter(Boolean).join(' · ') || null : (e?.major ?? null),
    company: m?.company ?? null,
    helps: m ? (asTags(m.can_help_with).length ? asTags(m.can_help_with) : asTags(m.expertise_tags)) : [],
    wants: e ? (asTags(e.career_interests).length ? asTags(e.career_interests) : asTags(e.interest_tags)) : [],
    goals: goalsText(m?.goals ?? e?.goals),
    yearsExperience: m?.years_experience ?? null,
    complete: Boolean(m?.profile_complete ?? e?.profile_complete),
    tenant: isMe ? await resolveParticipantContext(user.id) : null,
    sharedMentorshipId: (shared as { id: string } | null)?.id ?? null,
  };
}
