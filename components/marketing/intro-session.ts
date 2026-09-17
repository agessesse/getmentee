/**
 * Shared between the intro, the pre-paint cover script in the root layout, and
 * the hero card demo, which all need to agree on whether the intro will play.
 *
 * A plain module on purpose. The root layout is a server component, and
 * importing a constant from a 'use client' file there yields a client reference
 * rather than the string.
 */
export const INTRO_SESSION_KEY = 'mentable_intro_v7';

/** Set on <html> before first paint while the intro is about to play. */
export const INTRO_COVER_CLASS = 'intro-cover';
