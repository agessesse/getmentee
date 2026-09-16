'use client';

import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'bg-halo-purple text-white shadow-sm hover:bg-halo-purple-d hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus:ring-halo-purple',
  secondary: 'border border-halo-purple text-halo-purple-d hover:bg-halo-purple hover:text-white focus:ring-halo-purple',
  // An outline, not a fill: declining or cancelling is a considered choice, and
  // a solid red block beside the purple primary out-shouted it. Final,
  // irreversible confirmations elsewhere keep a solid red fill.
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 hover:border-red-300 focus:ring-red-500',
  ghost: 'text-halo-purple-d hover:bg-halo-veil focus:ring-halo-purple',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-halo-ivory disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
