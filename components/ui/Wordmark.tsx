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

export default function Wordmark({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span className={`${SIZES[size]} font-bold tracking-tight ${className}`}>
      {BRAND}
    </span>
  );
}
