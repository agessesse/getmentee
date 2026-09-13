'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Shared physics for the landing-page people carousels.
 *
 * Desktop: the pointer acts as a window onto a wider horizontal world. Moving
 * the cursor right pushes content LEFT, revealing people hidden off the right
 * edge — inverse mapping, so it reads as looking around rather than dragging.
 *
 * Touch: no synthetic physics. The track becomes a native overflow-x scroller
 * with snap points, which already has momentum and is what thumbs expect.
 */

// The middle third is a rest zone: motion stops there so cards can be read and
// clicked. The outer bands drive navigation. Position alone governs motion —
// coupling it to card hover as well made the two fight, since cards tile the
// entire strip and left every card permanently creeping under the cursor.
const DEAD_ZONE = 0.34;
const MAX_VELOCITY = 520; // px/sec at the outer edge — slow enough to read names
const IDLE_VELOCITY = 20; // px/sec ambient drift when pointer is away
const DAMPING = 5.5;      // higher = velocity converges on target faster
const MAX_FRAME_MS = 50;  // clamp dt so tab-switches don't teleport the track

export interface CarouselPhysics {
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  trackRef: React.MutableRefObject<HTMLDivElement | null>;
  /** True once we know the device wants native scrolling instead of pointer physics. */
  isTouch: boolean;
  /** True when the user's OS asks for reduced motion. */
  reducedMotion: boolean;
  /** -1 while revealing people to the left, 1 to the right, 0 at rest. */
  driveDirection: number;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
  /** Hard stop — used while a modal is open. */
  setFrozen: (frozen: boolean) => void;
}

export function useCarouselPhysics(idleDirection: -1 | 1 = -1): CarouselPhysics {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [isTouch, setIsTouch] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [driveDirection, setDriveDirection] = useState(0);

  const state = useRef({
    pos: 0,
    velocity: 0,
    targetVelocity: idleDirection * IDLE_VELOCITY,
    halfWidth: 0,
    lastTs: 0,
    frozen: false,
    visible: true,
  });

  const setFrozen = useCallback((frozen: boolean) => {
    state.current.frozen = frozen;
  }, []);

  // Capability detection runs client-side only, so SSR markup stays identical
  // for every visitor and hydration cannot mismatch.
  useEffect(() => {
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setIsTouch(coarse.matches);
      setReducedMotion(motion.matches);
    };
    sync();
    coarse.addEventListener('change', sync);
    motion.addEventListener('change', sync);
    return () => {
      coarse.removeEventListener('change', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);

  // Skip work entirely while the carousel is scrolled out of view.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const io = new IntersectionObserver(
      ([entry]) => { state.current.visible = entry.isIntersecting; },
      { rootMargin: '120px' }
    );
    io.observe(viewport);
    return () => io.disconnect();
  }, []);

  // The animation loop. Never touches React state — position is written
  // straight to the transform so pointer movement cannot cause re-renders.
  useEffect(() => {
    if (isTouch || reducedMotion) return;
    const track = trackRef.current;
    if (!track) return;

    const s = state.current;
    s.halfWidth = track.scrollWidth / 2;
    if (s.halfWidth <= 0) return;

    const measure = () => {
      const next = track.scrollWidth / 2;
      if (next > 0) s.halfWidth = next;
    };
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    let raf = 0;
    const step = (ts: number) => {
      const dt = s.lastTs > 0 ? Math.min(ts - s.lastTs, MAX_FRAME_MS) : 0;
      s.lastTs = ts;

      if (s.visible && dt > 0) {
        const target = s.frozen ? 0 : s.targetVelocity;
        // Exponential approach — frame-rate independent, so the feel is the
        // same at 60Hz and 120Hz and never overshoots into a spring wobble.
        s.velocity += (target - s.velocity) * (1 - Math.exp(-DAMPING * (dt / 1000)));

        if (Math.abs(s.velocity) > 0.01) {
          s.pos += s.velocity * (dt / 1000);
          if (s.pos <= -s.halfWidth) s.pos += s.halfWidth;
          if (s.pos > 0) s.pos -= s.halfWidth;
          track.style.transform = `translate3d(${s.pos}px, 0, 0)`;
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      s.lastTs = 0;
    };
  }, [isTouch, reducedMotion]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    // -1 at the left edge, +1 at the right edge.
    const offset = ((e.clientX - left) / width) * 2 - 1;
    const s = state.current;

    if (Math.abs(offset) < DEAD_ZONE) {
      s.targetVelocity = 0;
      setDriveDirection(0);
      return;
    }

    // Rescale past the dead zone so drive starts at zero rather than jumping.
    const scaled = (Math.abs(offset) - DEAD_ZONE) / (1 - DEAD_ZONE);
    const magnitude = scaled * scaled * MAX_VELOCITY; // eased: gentle near center

    // Inverse: cursor right (offset > 0) drives content left (negative).
    s.targetVelocity = -Math.sign(offset) * magnitude;
    setDriveDirection(Math.sign(offset));
  }, []);

  const onPointerLeave = useCallback(() => {
    // Ease back into ambient drift rather than snapping to a stop.
    state.current.targetVelocity = idleDirection * IDLE_VELOCITY;
    setDriveDirection(0);
  }, [idleDirection]);

  return {
    viewportRef,
    trackRef,
    isTouch,
    reducedMotion,
    driveDirection,
    onPointerMove,
    onPointerLeave,
    setFrozen,
  };
}
