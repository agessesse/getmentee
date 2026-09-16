import { clsx } from 'clsx';
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-halo-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'rounded-xl border px-3.5 py-2.5 text-sm text-halo-ink placeholder-halo-mist-body focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition-colors',
          error ? 'border-red-400 bg-red-50' : 'border-halo-rule bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
