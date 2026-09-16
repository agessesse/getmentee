/**
 * Mentable's motion vocabulary. Two moments share it: the entrance animation
 * and navigation between the four marketing pages. They are defined here once
 * so they cannot drift into looking like two unrelated animations, which is
 * exactly what they were before.
 *
 * The shape is a two-panel horizontal wipe. A lighter lavender panel leads, the
 * deep purple panel follows a beat behind, the wordmark resolves on the deep
 * panel, and both sweep off to the right to reveal what is underneath. The
 * entrance ends on the same sweep, so the first thing a visitor ever sees the
 * site do is the thing it will keep doing.
 */

/** One curve for every phase, so cover and reveal feel like one gesture. */
export const EASE = 'cubic-bezier(.65,0,.35,1)';

/** Lead panel travel. */
export const COVER_PANEL_MS = 320;
/** How far behind the lead the follow panel runs, on the way in. */
export const COVER_FOLLOW_DELAY_MS = 100;
/**
 * Wordmark. It does not fade in any more, it writes itself on: the outlines
 * draw, then the solid fill arrives behind them. That is the entrance's opening
 * beat, compressed from 800ms to 220ms so the whole wipe still lands near one
 * second. A flat fade was the dull part.
 */
/*
 * These delays are measured from the moment the overlay mounts, which is about
 * 170ms after the click: React has to render, and the draw is released two
 * painted frames later so the browser has a start value to animate from. The
 * numbers below are therefore smaller than the beats they produce. Measured on
 * the running build, the word is solid ivory around 460ms after the click and
 * the reveal begins at 620ms, which leaves the finished wordmark on screen for
 * roughly 160ms. Raise these and it washes out; the reveal catches it mid-fade.
 */
export const WORDMARK_DRAW_MS = 170;
export const WORDMARK_DRAW_DELAY_MS = 20;
export const WORDMARK_FILL_MS = 140;
export const WORDMARK_FILL_DELAY_MS = 150;
/** Per-subpath stagger. Twelve subpaths, so this is the tail of the draw. */
export const WORDMARK_STAGGER_MS = 6;

/** Reveal panel travel. */
export const REVEAL_PANEL_MS = 360;
/** On the way out the lead trails the follow, so the sweep reads as one object. */
export const REVEAL_LEAD_DELAY_MS = 80;
export const WORDMARK_OUT_MS = 160;

/** Phase budgets used by the state machine. */
export const COVER_MS = 420;
export const MIN_HOLD_MS = 200;
export const REVEAL_MS = 480;
/** Longest we will wait for a destination before revealing anyway. */
export const MAX_WAIT_MS = 2500;

/**
 * Panel colours, taken from the existing Halo tokens rather than invented.
 *
 *   lead   halo-lavender  #D9CFFB  the light purple already used for text and
 *                                  panels on the deep band.
 *   follow halo-deep      #4717CA  the brand's dark purple surface, the same
 *                                  ground the deep section of every marketing
 *                                  page sits on. White on it measures 8.97:1,
 *                                  so the wordmark is legible at any size.
 */
export const LEAD_BG = 'bg-halo-lavender';
export const FOLLOW_BG = 'bg-halo-deep';

/** True when the visitor has asked for less motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
