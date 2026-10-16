/**
 * Small text helpers shared by anything that drops a person's own words
 * into the middle of a sentence Mentable wrote.
 *
 * Isomorphic and dependency-free: the matching engine imports this, and
 * the matching engine runs in the browser demo as well as on the server.
 */

/**
 * Lowercase the first letter so a phrase can continue a sentence.
 *
 * THREE THINGS ARE LEFT ALONE, and the first was a real bug caught by the
 * test suite:
 *
 *   "I"        the pronoun. "when i can explain the difference" is wrong
 *              English, and it is the single most likely way a free-text
 *              answer begins.
 *   acronyms   "UNC recruiting" must not become "uNC recruiting".
 *   proper nouns, by the same test: a capital in the second position means
 *              the word is not an ordinary sentence opener.
 *
 * FOR FREE TEXT ONLY. Do not run it over tag values: a Title Case label
 * like "Private Equity" has a lowercase second letter, so it passes every
 * guard above and comes out as "private Equity". Tags are proper labels
 * and read correctly mid-sentence exactly as they were stored.
 */
export function lowerFirst(v: string): string {
  if (!v) return v;
  // The pronoun I, alone or contracted (I'm, I've, I'll).
  if (/^I(\s|’|'|$)/.test(v)) return v;
  if (v.length > 1 && /[A-Z]/.test(v[1])) return v;
  return v[0].toLowerCase() + v.slice(1);
}
