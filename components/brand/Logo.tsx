/**
 * The official Mentable logo ("Halo Orbit").
 *
 * A mentor (large dot, purple-700) and a mentee (small dot, purple-500) orbit
 * a shared centre; the ring closes the cycle, because today's mentee becomes
 * tomorrow's mentor. The files in /public/brand are the source of truth and
 * are never recoloured, rotated, stretched or retyped — the wordmark is
 * outlined, so it needs no font.
 *
 * Variants follow the brand handoff exactly:
 *   lockup          mark + wordmark, light grounds
 *   lockup-reversed mark + wordmark, on purple-700/900/950 grounds
 *   mark            mark alone at 40px and up
 *   mark-small      mark alone below 40px (heavier strokes to stay legible)
 *   mark-reversed   mark alone on dark grounds
 *
 * Sizing is driven by height, and width follows the asset's true aspect ratio
 * (lockup 403:100, mark 1:1) so nothing is ever distorted.
 */

const LOCKUP_RATIO = 403 / 100;

type Variant = 'lockup' | 'mark';
type Tone = 'default' | 'reversed';

interface LogoProps {
  variant?: Variant;
  tone?: Tone;
  /** Rendered height in px. The mark swaps to its -small file below 40. */
  height?: number;
  className?: string;
  priority?: boolean;
}

function fileFor(variant: Variant, tone: Tone, height: number): string {
  if (variant === 'lockup') {
    return tone === 'reversed'
      ? '/brand/mentable-lockup-reversed.svg'
      : '/brand/mentable-lockup.svg';
  }
  if (tone === 'reversed') return '/brand/mentable-mark-reversed.svg';
  // Below 40px the standard mark's strokes thin out; the -small file is drawn
  // heavier for exactly this case.
  return height < 40 ? '/brand/mentable-mark-small.svg' : '/brand/mentable-mark.svg';
}

export default function Logo({
  variant = 'lockup',
  tone = 'default',
  height = 32,
  className = '',
  priority = false,
}: LogoProps) {
  const src = fileFor(variant, tone, height);
  const width = variant === 'lockup' ? Math.round(height * LOCKUP_RATIO) : height;

  return (
    // A plain <img>, deliberately. next/image refuses SVG unless
    // dangerouslyAllowSVG is enabled, and that flag loosens handling for every
    // image on the site to gain nothing here: these files are already vector,
    // already tiny, and the optimizer has no work to do. Width and height are
    // both set from the asset's true ratio, so there is no layout shift.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Mentable"
      width={width}
      height={height}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={{ height, width: 'auto' }}
    />
  );
}
