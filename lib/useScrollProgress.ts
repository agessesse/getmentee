'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Scroll progress for one element, as a number from 0 to 1.
 *
 * WHY A SHARED ENGINE AND NOT A HOOK PER SECTION. Three sections on the home
 * page want scroll progress. Three independent scroll listeners, each doing its
 * own getBoundingClientRect on every event, is the classic way to make a page
 * feel heavy: the listener fires far more often than the screen refreshes, and
 * every rect read forces a synchronous layout. So there is one passive listener
 * for the whole page, it only schedules a frame, and inside that frame every
 * subscriber's rect is read together in a single batch.
 *
 * WHY VISIBILITY GATES IT. An IntersectionObserver marks each subscriber active
 * only while it is on screen. A section at the bottom of the page costs exactly
 * nothing while you are reading the hero.
 *
 * THE MEASUREMENT. Written for the sticky-pin pattern: a tall outer element
 * with a `sticky` child inside it. Progress is 0 when the outer element's top
 * reaches the top of the viewport and 1 when its bottom does, which is exactly
 * the range over which the sticky child is held in place. It is a pure function
 * of scroll position, so stopping halfway stops the animation halfway and
 * scrolling back up reverses it cleanly. Nothing fires once and detaches.
 *
 * REDUCED MOTION. Returns 1 immediately and never subscribes, so a section that
 * builds itself up over a scroll range is simply already built.
 */

type Sub = {
  el: HTMLElement;
  cb: (p: number) => void;
  visible: boolean;
};

const subs = new Set<Sub>();
let frameId = 0;
let bound = false;
let io: IntersectionObserver | null = null;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function measure() {
  frameId = 0;
  const vh = window.innerHeight;
  for (const s of subs) {
    if (!s.visible) continue;
    const r = s.el.getBoundingClientRect();
    const travel = r.height - vh;
    // A wrapper shorter than the viewport has no pin range; treat it as done
    // once its top passes the fold rather than dividing by zero.
    s.cb(travel <= 0 ? (r.top <= 0 ? 1 : 0) : clamp01(-r.top / travel));
  }
}

function schedule() {
  if (frameId) return;
  frameId = requestAnimationFrame(measure);
}

function bind() {
  if (bound) return;
  bound = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        for (const s of subs) {
          if (s.el === e.target) s.visible = e.isIntersecting;
        }
      }
      schedule();
    },
    // A generous margin so a section is already being measured by the time any
    // of it is on screen, which avoids a visible jump on fast scrolls.
    { rootMargin: '25% 0px 25% 0px' },
  );
}

function unbindIfIdle() {
  if (subs.size > 0 || !bound) return;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  io?.disconnect();
  io = null;
  bound = false;
  if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
}

export function useScrollProgress(ref: RefObject<HTMLElement | null>, enabled = true): number {
  const [progress, setProgress] = useState(0);
  // The callback identity must be stable for the whole subscription.
  const cbRef = useRef((p: number) => setProgress(p));

  useEffect(() => {
    if (!enabled) { setProgress(1); return; }
    const el = ref.current;
    if (!el) return;

    bind();
    const sub: Sub = { el, cb: cbRef.current, visible: false };
    subs.add(sub);
    io?.observe(el);
    schedule();

    return () => {
      io?.unobserve(el);
      subs.delete(sub);
      unbindIfIdle();
    };
  }, [ref, enabled]);

  return progress;
}

/** True when the visitor has asked for less motion. Re-evaluates on change. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

/** True on viewports wide enough to hold a pinned composition comfortably. */
export function useWideViewport(min = 1024): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [min]);
  return wide;
}
