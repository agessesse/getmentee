/**
 * Where Mentable lives, in one place.
 *
 * THE PROBLEM THIS SOLVES. NEXT_PUBLIC_APP_URL is set to
 * https://getmentee.vercel.app in production (verified against the live site:
 * the canonical tag, the Open Graph image and the invite message all carry
 * that host). Every one of those is something a stranger sees or copies, so
 * the brand domain we are about to promote was absent from its own share
 * surface, and search engines were being pointed at the deployment alias
 * rather than at mentable.co.
 *
 * TWO DIFFERENT QUESTIONS. "Which origin is this build served from" and "which
 * address should a human be given" are not the same question, and conflating
 * them is what produced the bug:
 *
 *   originForMetadata()  the deployment's own origin, so preview builds
 *                        generate working absolute URLs for their own assets.
 *
 *   CANONICAL_SITE       the address Mentable is known by. Anything a person
 *                        reads, copies or pastes uses this and nothing else,
 *                        on every deployment.
 *
 * The production environment variable should still be corrected to
 * https://mentable.co — that is the real fix for canonical and Open Graph, and
 * it is a dashboard change rather than a code one. This makes the share path
 * correct in the meantime and keeps it correct afterwards.
 */

/** The address Mentable is known by. Never a deployment alias. */
export const CANONICAL_SITE = 'https://mentable.co';

/**
 * The origin to build absolute asset and canonical URLs from. Falls back to
 * the canonical site rather than to localhost, so a missing variable in a real
 * deployment degrades to the right domain instead of an unreachable one.
 */
export function originForMetadata(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return CANONICAL_SITE;
  // Local development is the one case where the deployment's own origin is
  // genuinely what we want, because nothing else resolves.
  return configured;
}
