import { clsx } from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'navy' | 'green' | 'red' | 'blue' | 'gray' | 'yellow';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  navy: 'bg-halo-lavender/50 text-halo-purple-d',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-halo-lavender/50 text-halo-purple-d',
  gray: 'bg-halo-bone text-halo-heather',
  yellow: 'bg-yellow-100 text-yellow-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ label, variant = 'navy', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {label}
    </span>
  );
}
