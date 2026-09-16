import type { ReactNode } from 'react';

/**
 * Eyebrow + section heading + optional lead paragraph.
 *
 * These three lines are written out longhand six times on the landing page and
 * in four of its section components, always with the same class strings. That
 * was survivable while there was one marketing page. It is not survivable once
 * /mentee, /mentor and /about each repeat them again, because the divergence
 * only shows up when you put two pages side by side.
 *
 * The class strings here are lifted verbatim from the landing page. This is a
 * container for Will's typography, not a new scale: nothing about the sizes,
 * weights or tracking is decided here.
 *
 * The landing page is deliberately NOT retrofitted onto this. It is frozen, and
 * a no-op refactor of a frozen file is the kind of change that quietly turns
 * into a redesign.
 */

/** Which ground the heading sits on. Selects the text colours. */
type Tone = 'light' | 'deep';

export default function SectionIntro({
  eyebrow,
  heading,
  id,
  lead,
  tone = 'light',
  className = '',
  headingClassName = '',
}: {
  eyebrow: string;
  heading: ReactNode;
  /** Wire this to the section's aria-labelledby. */
  id: string;
  lead?: ReactNode;
  tone?: Tone;
  /** Layout only (widths, margins). Never colour or type scale. */
  className?: string;
  headingClassName?: string;
}) {
  const deep = tone === 'deep';

  return (
    <div className={className}>
      <p
        className={`font-ui text-[11px] font-semibold uppercase tracking-[0.14em] mb-5 ${
          deep ? 'text-halo-lavender' : 'text-halo-purple-d'
        }`}
      >
        {eyebrow}
      </p>

      <h2
        id={id}
        className={`font-display leading-[1.05] ${deep ? 'text-white' : 'text-halo-ink'} ${headingClassName}`}
        style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
      >
        {heading}
      </h2>

      {lead && (
        <p
          className={`mt-5 leading-relaxed ${
            deep ? 'text-halo-lavender font-light text-[15px]' : 'text-halo-mist-body text-[16px]'
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
