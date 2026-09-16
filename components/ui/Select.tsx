import { clsx } from 'clsx';
import { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export default function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-halo-ink">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'rounded-xl border px-3.5 py-2.5 text-sm text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition-colors bg-white',
          error ? 'border-red-400 bg-red-50' : 'border-halo-rule',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
