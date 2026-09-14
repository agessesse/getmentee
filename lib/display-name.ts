/**
 * One place that turns a profile record into something a person can read.
 *
 * The app previously fell back to the literal string "Unknown" in twelve
 * places, which reads like a bug and tells the user nothing.
 *
 * The replacement was briefly "Former member", on the reasoning that profiles
 * cascade-delete with the auth user and the profiles SELECT policy is
 * permissive, so a missing row must mean a deleted account. That reasoning came
 * from reading migration 0016 rather than querying the database, and it was
 * wrong: 0016 is not applied in production, the restrictive
 * `auth.uid() = id` policy is still in force, and the `public_profiles` view
 * that twelve pages read does not exist at all. A lookup therefore fails for
 * live, active users, and the label was telling people their mentor had left.
 *
 * "Name unavailable" states only what is actually known: we could not resolve
 * the name. It does not invent a cause. See supabase/MIGRATION_RECOVERY.md.
 *
 * No fabricated stand-in name is ever substituted for a real user record. A
 * fake identity attached to a real mentorship is worse than an honest gap.
 */

export const NAME_UNAVAILABLE = 'Name unavailable';

export interface NameParts {
  first_name?: string | null;
  last_name?: string | null;
}

/** Full display name, or an honest fallback when the profile is gone. */
export function displayName(p: NameParts | null | undefined): string {
  if (!p) return NAME_UNAVAILABLE;
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return name || NAME_UNAVAILABLE;
}

/** First name only, for conversational copy such as "Message Peter". */
export function firstName(p: NameParts | null | undefined): string {
  if (!p) return NAME_UNAVAILABLE;
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
