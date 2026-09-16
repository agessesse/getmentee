'use client';

import { ChevronDown } from 'lucide-react';

/**
 * The cue at the bottom of the pinned hero.
 *
 * A hero that fills the viewport and does not move when you start scrolling
 * needs to say that scrolling works, or it reads as a landing screen waiting
 * for a click. It fades in after six tenths of a second, then drifts eight
 * pixels and back on a loop, which is the reference's own timing.
 *
 * It is the one perpetual animation on the page and it earns that by being the
 * only instruction the pinned hero gives. Decorative, so aria-hidden, and it
 * disappears entirely under reduced motion rather than sitting there static.
 */
export default function ScrollCue() {
  return (
    <div
      aria-hidden="true"
      className="scroll-cue pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 motion-reduce:hidden"
    >
      <ChevronDown className="w-[22px] h-[22px] text-halo-mist-strong" strokeWidth={1.75} />
    </div>
  );
}
