import { clsx } from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'navy' | 'green' | 'red' | 'blue' | 'gray' | 'yellow';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  navy: 'bg-navy-100 text-navy-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
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
