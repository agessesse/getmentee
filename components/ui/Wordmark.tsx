import MentableMark from '@/components/ui/MentableMark';

// The brand name resolves from here so a future rename touches one file
// instead of every navbar, footer, and auth screen.
export const BRAND = 'Mentable';
export const BRAND_PRONUNCIATION = '/men-tə-bəl/';
export const BRAND_DEFINITION = 'Teachable. Coachable. Ready to grow.';

const SIZES = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
} as const;

/**
 * Mark size per text size. The brand guide sets the nav lockup at 28px on
 * mobile and 32px on desktop; these sit just under that, matched to the cap
 * height of the word beside them so the two read as one object rather than an
 * icon with a label stuck to it. All are under 40px, so MentableMark uses the
 * heavier small drawing automatically.
 */
const MARK_PX: Record<keyof typeof SIZES, number> = { sm: 22, md: 26, lg: 30 };

/**
 * The lockup: the mark, then the name.
 *
 * Every public surface that shows the brand renders this one component, so the
 * mark arrives in the header, the auth header and the footer together and
 * cannot drift between them.
 *
 * The mark is aria-hidden. It sits immediately beside the word it stands for,
 * and a screen reader announcing "Mentable Mentable" is worse than one
 * announcing it once.
 *
 * Gap is 0.5em of the word's own size, which clears the guide's minimum of one
 * mentor-dot diameter at every size here and scales with the text rather than
 * being pinned to a pixel value.
 *
 * `tone` picks the mark's palette. It is separate from `className`, which
 * colours the text: on the black footer the word is white while the mark keeps
 * its own reversed ivory and lavender, and merging the two would flatten the
 * mark to a single colour.
 */
export default function Wordmark({
  size = 'md',
  tone = 'default',
  className = '',
}: {
  size?: keyof typeof SIZES;
  tone?: 'default' | 'reversed';
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-[0.5em] ${SIZES[size]} ${className}`}>
      <MentableMark size={MARK_PX[size]} tone={tone} className="flex-none" />
      <span className="font-bold tracking-tight">{BRAND}</span>
    </span>
  );
}
