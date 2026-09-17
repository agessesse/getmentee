'use client';

import { useEffect, useState } from 'react';
import { MousePointerClick, MoveHorizontal } from 'lucide-react';

/**
 * The one way the landing page says "this responds to you".
 *
 * Several sections react to hover, clicks and cursor position, and nothing
 * about a photo, a quote or a curve says so. Each of those now carries this
 * cue, worded for the device in hand: "hover" and "click" for a mouse, "tap"
 * and "swipe" for a finger, because telling a phone user to hover is a
 * dead end.
 *
 * It is visible at rest, so nobody has to discover the instruction before
 * they can discover the interaction. Once the visitor has used the thing it
 * describes, the caller passes `retired` and it fades: it has done its job and
 * would only be clutter afterwards.
 *
 * Decorative to assistive tech. Every control it describes is a real button or
 * link with its own label and a visible focus state, and the hover wording
 * would be wrong for a keyboard or screen reader anyway.
 */
export default function InteractionCue({
  hover,
  touch,
  icon = 'click',
  tone = 'light',
  retired = false,
  durationMs = 500,
  className = '',
}: {
  /** Wording for a device with a mouse or trackpad. */
  hover: React.ReactNode;
  /** Wording for a touch screen. Falls back to `hover`. */
  touch?: React.ReactNode;
  icon?: 'click' | 'browse';
  /** `deep` for the purple band, where the lavender-wash chip would vanish. */
  tone?: 'light' | 'deep';
  retired?: boolean;
  /** Fade length. Shorter where the cue trades places with other text. */
  durationMs?: number;
  className?: string;
}) {
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  const Icon = icon === 'browse' ? MoveHorizontal : MousePointerClick;
  const toneClass =
    tone === 'deep'
      ? 'text-halo-ivory bg-halo-deep-panel border-halo-deep-rule'
      : 'text-halo-purple-d bg-halo-lav-wash border-halo-purple/25';

  return (
    <p
      aria-hidden="true"
      className={`inline-flex items-center gap-2 text-[12px] font-semibold leading-snug border rounded-xl px-3 py-2 motion-safe:transition-opacity ${toneClass} ${className}`}
      style={{ opacity: retired ? 0 : 1, pointerEvents: 'none', transitionDuration: `${durationMs}ms` }}
    >
      <Icon className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
      <span>{canHover || touch === undefined ? hover : touch}</span>
    </p>
  );
}
