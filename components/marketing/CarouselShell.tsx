'use client';

import { useEffect, useState } from 'react';
import { useCarouselPhysics } from '@/lib/useCarouselPhysics';

interface Props<T> {
  items: T[];
  keyOf: (item: T, index: number) => string;
  renderItem: (
    item: T,
    opts: {
      hovered: boolean;
      onHoverChange: (h: boolean) => void;
      /** False for loop-duplicate cards: they must not be focusable or announced. */
      interactive: boolean;
    }
  ) => React.ReactNode;
  /** Ambient drift direction. Alternating between rows creates rhythm. */
  idleDirection?: -1 | 1;
  /** Pause motion while a modal is open. */
  frozen?: boolean;
  label: string;
}

/**
 * Owns the physics, the loop-boundary masking, and — importantly — the
 * accessible and touch fallbacks. The previous carousels marked their track
 * aria-hidden and clipped overflow with no touch handler, which left the whole
 * people section unreachable by screen readers, thumbs, and reduced-motion users.
 */
export default function CarouselShell<T>({
  items,
  keyOf,
  renderItem,
  idleDirection = -1,
  frozen = false,
  label,
}: Props<T>) {
  const {
    viewportRef, trackRef, isTouch, reducedMotion,
    driveDirection, onPointerMove, onPointerLeave, setFrozen,
  } = useCarouselPhysics(idleDirection);

  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => { setFrozen(frozen); }, [frozen, setFrozen]);

  // Pointer physics duplicate the list to loop seamlessly. Native scrolling
  // does not, so a single pass avoids showing every person twice.
  const nativeScroll = isTouch || reducedMotion;
  const rendered = nativeScroll ? items : [...items, ...items];

  return (
    <div className="relative">
      {/* Edge masks — hide the loop seam and imply the row continues past view */}
      {!nativeScroll && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 z-10 bg-gradient-to-r from-cream-50 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 z-10 bg-gradient-to-l from-cream-50 to-transparent" aria-hidden="true" />
        </>
      )}

      <div
        ref={viewportRef}
        role="group"
        aria-label={label}
        className={
          nativeScroll
            ? 'flex gap-0 overflow-x-auto snap-x snap-mandatory scroll-px-6 px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'relative py-4'
        }
        style={nativeScroll ? { WebkitOverflowScrolling: 'touch' } : { overflowX: 'clip' }}
        onPointerMove={nativeScroll ? undefined : onPointerMove}
        onPointerLeave={nativeScroll ? undefined : onPointerLeave}
      >
        <div
          ref={trackRef}
          className={nativeScroll ? 'flex' : 'flex'}
          style={{ width: 'max-content' }}
        >
          {rendered.map((item, i) => {
            const key = keyOf(item, i);
            // Only the first pass is exposed to assistive tech; the duplicate
            // exists purely so the loop has something to scroll into.
            const isDuplicate = !nativeScroll && i >= items.length;
            return (
              <div
                key={`${key}-${i}`}
                className={nativeScroll ? 'snap-start' : undefined}
                aria-hidden={isDuplicate || undefined}
              >
                {renderItem(item, {
                  hovered: hovered === `${key}-${i}`,
                  onHoverChange: (h) => setHovered(h ? `${key}-${i}` : null),
                  interactive: !isDuplicate,
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Directional affordance — tells the user what their cursor is doing */}
      {!nativeScroll && (
        <div
          className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 transition-opacity duration-300"
          style={{ opacity: driveDirection === 0 ? 0 : 0.65 }}
          aria-hidden="true"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-navy-600">
            {driveDirection > 0 ? 'more →' : '← more'}
          </span>
        </div>
      )}

      {nativeScroll && (
        <p className="text-center text-[11px] text-gray-500 font-light mt-1">
          Swipe to explore
        </p>
      )}
    </div>
  );
}
