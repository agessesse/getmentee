import { MARK, MARK_SMALL } from '@/components/ui/mentable-mark-paths';

/**
 * The Mentable mark.
 *
 * Inlined rather than loaded as an image, for three reasons: it needs no
 * request, it can inherit `currentColor` where a surface already defines one,
 * and it can be hidden from assistive technology when it sits beside the word
 * "Mentable", which is the usual case here. A decorative mark next to the name
 * it stands for should not be announced twice.
 *
 * The brand guide ships two drawings and says to use the heavier one below
 * 40px. That is every placement on this site today, so the switch is automatic
 * from the rendered size rather than something a caller has to remember.
 *
 * Colours are the guide's and are never recomputed: mentor #4717CA, mentee
 * #785AF7; reversed #FBFAF8 and #D9CFFB for dark and purple grounds.
 */

export type MarkTone = 'default' | 'reversed' | 'current';

const TONES: Record<MarkTone, { mentor: string; mentee: string }> = {
  default:  { mentor: '#4717CA', mentee: '#785AF7' },
  reversed: { mentor: '#FBFAF8', mentee: '#D9CFFB' },
  current:  { mentor: 'currentColor', mentee: 'currentColor' },
};

export default function MentableMark({
  size = 24,
  tone = 'default',
  /** Set when the mark stands alone and carries the name. */
  labelled = false,
  className,
}: {
  size?: number;
  tone?: MarkTone;
  labelled?: boolean;
  className?: string;
}) {
  const art = size < 40 ? MARK_SMALL : MARK;
  const c = TONES[tone];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      {...(labelled
        ? { role: 'img' as const, 'aria-label': 'Mentable' }
        : { 'aria-hidden': true as const, focusable: 'false' as const })}
    >
      <path d={art.mentorArc} fill={c.mentor} />
      <circle cx={art.mentorDot.cx} cy={art.mentorDot.cy} r={art.mentorDot.r} fill={c.mentor} />
      <path d={art.menteeArc} fill={c.mentee} />
      <circle cx={art.menteeDot.cx} cy={art.menteeDot.cy} r={art.menteeDot.r} fill={c.mentee} />
    </svg>
  );
}
