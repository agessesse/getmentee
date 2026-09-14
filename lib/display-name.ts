/**
 * One place that turns a profile record into something a person can read.
 *
 * The app previously fell back to the literal string "Unknown" in twelve
 * places, which reads like a bug to the user and tells them nothing.
 *
 * A missing profile is not ambiguous in this schema: profiles cascade-delete
 * with the auth user (migration 0019), and the SELECT policy on profiles is
 * USING (true) for authenticated readers (migration 0016), so a partner whose
 * row cannot be found has almost certainly deleted their account rather than
 * being hidden by RLS. "Former member" says that honestly.
 *
 * Deliberately NOT doing what a demo would do here: no fabricated stand-in
 * name is ever substituted for a real user record, because a fake identity
 * attached to a real mentorship is worse than an honest gap.
 */

export const FORMER_MEMBER = 'Former member';

export interface NameParts {
  first_name?: string | null;
  last_name?: string | null;
}

/** Full display name, or an honest fallback when the profile is gone. */
export function displayName(p: NameParts | null | undefined): string {
  if (!p) return FORMER_MEMBER;
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return name || FORMER_MEMBER;
}

/** First name only, for conversational copy such as "Message Peter". */
export function firstName(p: NameParts | null | undefined): string {
  if (!p) return FORMER_MEMBER;
  return (p.first_name ?? '').trim() || displayName(p);
}

/**
 * Initials for avatar fallbacks. Returns null when there is no real name, so
 * callers can render a neutral icon instead of stamping a letter on someone
 * who no longer exists.
 */
export function initials(p: NameParts | null | undefined): string | null {
  const f = (p?.first_name ?? '').trim();
  const l = (p?.last_name ?? '').trim();
  if (!f && !l) return null;
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || null;
}
