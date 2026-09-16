'use client';

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react';

/**
 * Content that settles into place the first time it is scrolled into view.
 *
 * THE DETAIL THAT MATTERS: opacity never changes. Both the hidden and the
 * visible state are fully opaque, and only translate moves. The generic version
 * of this effect fades content in from nothing, which reads as a page still
 * loading; holding opacity at 1 and moving the element a few dozen pixels reads
 * as the layout settling, which is a different and much quieter impression. It
 * also means nothing on the page is ever invisible, so a screenshot, a printed
 * page, or a visitor who scrolls faster than the observer fires still sees
 * everything.
 *
 * Distances and curves come straight from the reference implementation:
 *
 *   28px  generic block reveal        0.85s  cubic-bezier(.2,1,.3,1)
 *   44px  eyebrows, headings, cards   0.95s  cubic-bezier(.2,1,.3,1)
 *   52px  list rows, from the left    0.85s  cubic-bezier(.2,1,.3,1)
 *   64px  the one big statement       1.30s  cubic-bezier(.16,1,.3,1)
 *
 * Fires once per element and then detaches its observer, because this is an
 * arrival, not a scrubbed animation. The scroll-progress work elsewhere on this
 * page is the opposite case and uses lib/useScrollProgress instead.
 */

const EASE_OUT_SOFT = 'cubic-bezier(0.2, 1, 0.3, 1)';
const EASE_OUT_LONG = 'cubic-bezier(0.16, 1, 0.3, 1)';

export type RiseKind = 'block' | 'heading' | 'row' | 'statement';

const KIND: Record<RiseKind, { y: number; x: number; ms: number; ease: string; amount: number }> = {
  block:     { y: 28, x: 0,   ms: 850,  ease: EASE_OUT_SOFT, amount: 0.12 },
  heading:   { y: 44, x: 0,   ms: 950,  ease: EASE_OUT_SOFT, amount: 0.3 },
  row:       { y: 0,  x: -52, ms: 850,  ease: EASE_OUT_SOFT, amount: 0.25 },
  statement: { y: 64, x: 0,   ms: 1300, ease: EASE_OUT_LONG, amount: 0.4 },
};

export default function Rise({
  children,
  kind = 'block',
  delay = 0,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode;
  kind?: RiseKind;
  /** Seconds, matching the reference's stagger values (0.08, 0.09, 0.11, 0.12). */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const cfg = KIND[kind];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEnabled(false);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { threshold: cfg.amount },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cfg.amount]);

  const resting = !enabled || shown;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        transform: resting ? 'none' : `translate3d(${cfg.x}px, ${cfg.y}px, 0)`,
        transition: enabled ? `transform ${cfg.ms}ms ${cfg.ease} ${delay}s` : undefined,
        willChange: resting ? undefined : 'transform',
      }}
    >
      {children}
    </Tag>
  );
}
