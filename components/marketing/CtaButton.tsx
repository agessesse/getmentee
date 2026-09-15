import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The marketing call to action.
 *
 * These class strings were duplicated across ten sites, in three padding
 * scales, with three of them carrying a dark-band ring offset and seven
 * carrying plain `ring-offset-2`. That divergence is invisible until you put
 * them side by side, and it is exactly the kind of thing that gets silently
 * normalised away during a redesign.
 *
 * Deliberately NOT covered here, because they are different components wearing
 * the same paint:
 *   - the three auth submit buttons: type="submit", disabled, spinner
 *   - the two <span> pseudo-buttons inside the signup role cards, which are
 *     driven by the parent card's group-hover and would nest interactive
 *     elements if they became real buttons
 *   - the icon badge on the forgot-password success screen
 */

type Variant = 'primary' | 'secondary' | 'outline';
type Size = 'lg' | 'md' | 'sm';
/** Which ground the button sits on. Selects the focus ring offset colour. */
type Ground = 'light' | 'deep';

/*
 * The primary button inverts on the deep-purple band. A purple fill on a
 * purple ground measures 2.05:1, well under the 3:1 a control needs to be
 * distinguishable from its background, so the button all but disappeared.
 * Ivory on deep purple is 8.97:1 both ways: the fill separates from the band
 * and the label separates from the fill.
 *
 * The label on the light-ground button stays pure white deliberately. White on
 * #785AF7 is 4.56:1; halo-ivory on the same fill is about 4.45:1, under AA.
 */
const PRIMARY_LIGHT =
  'bg-halo-purple text-white hover:bg-halo-purple-d focus-visible:ring-halo-purple focus-visible:ring-offset-2';

const PRIMARY_DEEP =
  'bg-halo-ivory text-halo-purple-d hover:bg-halo-lavender focus-visible:ring-halo-lavender focus-visible:ring-offset-halo-deep';

const PRIMARY_BASE =
  'group inline-flex items-center font-semibold transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2';

const PRIMARY_SIZE: Record<Size, string> = {
  lg: 'gap-2.5 px-8 py-4 text-[15px] shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  md: 'gap-2.5 px-7 py-3.5 text-[15px] shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  sm: 'gap-2 px-5 py-3 text-sm active:scale-[0.97]',
};

const SECONDARY_LIGHT =
  'text-halo-heather hover:text-halo-ink border-halo-rule hover:border-halo-purple focus-visible:ring-halo-purple';

const SECONDARY_DEEP =
  'text-halo-ivory hover:text-halo-lavender border-halo-deep-rule hover:border-halo-lavender focus-visible:ring-halo-lavender';

const SECONDARY_BASE =
  'group tap-target inline-flex items-center gap-2 font-medium transition-colors border-b focus-visible:outline-none focus-visible:ring-2 rounded-sm';

/*
 * The third tier, for section-level asks.
 *
 * "Become a mentor" and "Create your profile" are real asks, so an underlined
 * text link undersells them. But promoting them to filled purple would put six
 * identical primary buttons on one page, and six primaries is the same as none:
 * nothing leads. An outline reads as a button at a glance while still yielding
 * to the filled ones.
 *
 * Contrast: purple-d label is 8.97:1 on ivory and 8.18:1 on veil; the purple
 * border is 4.37:1 and 3.99:1 against the same grounds, both clear of the 3:1
 * a non-text boundary needs.
 */
const OUTLINE_LIGHT =
  'border border-halo-purple text-halo-purple-d hover:bg-halo-purple hover:text-white hover:border-halo-purple focus-visible:ring-halo-purple focus-visible:ring-offset-2';

const OUTLINE_DEEP =
  'border border-halo-lavender text-halo-ivory hover:bg-halo-ivory hover:text-halo-purple-d focus-visible:ring-halo-lavender focus-visible:ring-offset-halo-deep';

const OUTLINE_BASE =
  'group inline-flex items-center font-semibold transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2';

const OUTLINE_SIZE: Record<Size, string> = {
  lg: 'gap-2.5 px-8 py-4 text-[15px]',
  md: 'gap-2.5 px-6 py-3 text-[15px]',
  sm: 'gap-2 px-5 py-2.5 text-sm',
};

const SECONDARY_SIZE: Record<Size, string> = {
  lg: 'py-4 text-[15px]',
  md: 'pb-0.5 text-[15px]',
  sm: 'pb-0.5 text-sm',
};

export default function CtaButton({
  href,
  children,
  variant = 'primary',
  size = 'lg',
  ground = 'light',
  className = '',
  onClick,
  prefetch,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  ground?: Ground;
  /** Layout only (margins). Never colour: that is what variant is for. */
  className?: string;
  onClick?: () => void;
  prefetch?: false;
}) {
  const deep = ground === 'deep';

  const classes =
    variant === 'primary'
      ? `${PRIMARY_BASE} ${deep ? PRIMARY_DEEP : PRIMARY_LIGHT} ${PRIMARY_SIZE[size]} ${className}`
      : variant === 'outline'
        ? `${OUTLINE_BASE} ${deep ? OUTLINE_DEEP : OUTLINE_LIGHT} ${OUTLINE_SIZE[size]} ${className}`
        : `${SECONDARY_BASE} ${deep ? SECONDARY_DEEP : SECONDARY_LIGHT} ${SECONDARY_SIZE[size]} ${className}`;

  return (
    <Link href={href} onClick={onClick} prefetch={prefetch} className={classes.trim()}>
      {children}
      <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
    </Link>
  );
}
