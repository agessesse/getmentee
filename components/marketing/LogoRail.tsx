'use client';

import { useState } from 'react';

export interface RailItem {
  /** Full name. Used as alt text and in the screen-reader summary. */
  name: string;
  /** Domain passed to the favicon service. */
  domain: string;
  /**
   * Shorter label shown beside the logo in the rail. Falls back to `name`.
   * "University of North Carolina at Chapel Hill" is correct in the alt text
   * and far too wide to scroll past.
   */
  label?: string;
}

/**
 * Logo-only marquee.
 *
 * Logos are requested at sz=128 and rendered at 40px so they stay crisp on 2x
 * displays (40 x 2 = 80px, well inside the source). The previous rail asked for
 * sz=64, rendered at 20px and dimmed to 70% opacity, which is why the logos
 * read as grey smudges.
 *
 * Because there is no text label beside the logo any more, two things matter:
 * the alt text carries the name for assistive tech, and a failed load falls back
 * to the name rather than collapsing to empty space.
 *
 * NOTE: these come from Google's favicon service, so logo quality is outside our
 * control and varies by domain. Entries whose favicon is 16px or a generic
 * placeholder are excluded at the call site rather than rendered badly. The
 * durable fix is self-hosted SVG logos in /public, which would also remove the
 * per-visitor requests to Google.
 */
function Logo({ item }: { item: RailItem }) {
  const [failed, setFailed] = useState(false);
  const label = item.label ?? item.name;

  return (
    <span className="flex-none px-7 flex items-center gap-3">
      {/*
        Every logo gets the same 40px tile. Without it the row looks ragged:
        the favicons are square canvases but the mark inside varies wildly, so
        object-contain rendered Wells Fargo at a full 40px and McColl's "D." at
        8px. Fixing the tile makes the footprint identical whatever the mark
        does, which is how logo walls normally handle mixed sources.
      */}
      {!failed && (
        <span className="flex-none h-10 w-10 flex items-center justify-center rounded-xl border border-halo-rule bg-white p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=128`}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            className="max-h-full max-w-full object-contain"
            onError={() => setFailed(true)}
          />
        </span>
      )}
      <span className="text-[14px] font-medium text-halo-ink whitespace-nowrap leading-none">
        {label}
      </span>
    </span>
  );
}

export default function LogoRail({
  eyebrow,
  items,
  direction = 'left',
  srLabel,
}: {
  eyebrow: string;
  items: RailItem[];
  /** Which way the marquee drifts. Alternate between rails for rhythm. */
  direction?: 'left' | 'right';
  /** Sentence read by screen readers in place of the animation. */
  srLabel: string;
}) {
  // The animation translates the track by -50%, so it loops seamlessly only if
  // the track is exactly two identical copies. With a short list those two
  // copies are narrower than the viewport, so the logos bunch up on the left
  // and the row looks half empty. Repeat the list until ONE copy comfortably
  // exceeds a wide viewport, then render that copy twice.
  // Items are now logo + label, so their width varies with the label. Estimate
  // per item rather than assuming a fixed one: 40px logo + 12px gap + 56px
  // horizontal padding + roughly 7.6px per character at 14px medium.
  const TARGET_COPY_WIDTH = 1800;
  const copyWidth = items.reduce(
    (w, i) => w + 108 + (i.label ?? i.name).length * 7.6,
    0
  );
  const reps = Math.max(2, Math.ceil(TARGET_COPY_WIDTH / Math.max(1, copyWidth)));
  const oneCopy = Array.from({ length: reps }, () => items).flat();
  const track = [...oneCopy, ...oneCopy];

  return (
    <div className="py-9 border-y border-halo-rule bg-halo-ivory overflow-hidden">
      <p className="font-ui text-[10px] font-semibold text-halo-mist-body uppercase tracking-[0.18em] text-center mb-6 px-6">
        {eyebrow}
      </p>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-halo-ivory to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-halo-ivory to-transparent" />
        <div
          className={
            direction === 'right'
              ? 'flex items-center animate-rail-right'
              : 'flex items-center animate-rail-left'
          }
          style={{ width: 'max-content' }}
          aria-hidden="true"
        >
          {track.map((item, i) => (
            <Logo key={`${item.domain}-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Static, readable equivalent for screen readers and reduced motion */}
      <p className="sr-only">
        {srLabel} {items.map((i) => i.name).join(', ')}. Not endorsements of Mentable.
      </p>
    </div>
  );
}
