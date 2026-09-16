'use client';

import { useRef, type ReactNode } from 'react';
import { useScrollProgress, useReducedMotion, useWideViewport } from '@/lib/useScrollProgress';

/**
 * One section receding as the next one climbs over it.
 *
 * The home page was a stack of rectangles: each section ended, the next began,
 * and nothing connected them. This makes the boundary a handoff. The outgoing
 * section sticks to the top and drifts back in space, very slightly smaller and
 * a little dimmer, while whatever follows slides over it. The effect is closer
 * to pages of a book than to blocks in a column, and at no point does it take
 * the scroll away from anyone.
 *
 * The numbers are deliberately small. Scale bottoms out at 0.96 and opacity at
 * 0.55, which is enough to read as depth and not enough to look like the page
 * is collapsing. Only transform and opacity animate, so it stays on the
 * compositor.
 *
 * It is off below 1024px, where a sticky full-height section fights the shorter
 * viewport, and off under reduced motion, where the children simply render in
 * normal flow with no wrapper behaviour at all.
 */
export default function ScrollHandoff({
  children,
  minScale = 0.96,
  minOpacity = 0.55,
}: {
  children: ReactNode;
  minScale?: number;
  minOpacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const wide = useWideViewport(1024);
  const active = wide && !prefersReduced;
  const progress = useScrollProgress(ref, active);

  if (!active) return <>{children}</>;

  // Hold still for the first third, then recede. Receding immediately makes the
  // section feel like it is falling away while you are still reading it.
  const t = Math.max(0, (progress - 0.33) / 0.67);

  return (
    <div ref={ref} className="relative">
      <div
        className="sticky top-0"
        style={{
          transform: `scale(${1 - (1 - minScale) * t})`,
          opacity: 1 - (1 - minOpacity) * t,
          transformOrigin: 'center top',
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </div>
    </div>
  );
}
