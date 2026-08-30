'use client';

import { clsx } from 'clsx';

interface TagSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  max?: number;
  className?: string;
}

export default function TagSelect({ options, value, onChange, label, max, className }: TagSelectProps) {
  const toggle = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else if (!max || value.length < max) {
      onChange([...value, tag]);
    }
  };

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {label && (
        <span className="text-sm font-medium text-navy-900">
          {label}
          {max && <span className="text-gray-400 font-normal"> (up to {max})</span>}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const selected = value.includes(tag);
          const disabled = !selected && !!max && value.length >= max;
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggle(tag)}
              className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                selected
                  ? 'bg-navy-600 text-white border-navy-600'
                  : 'bg-white text-navy-700 border-gray-300 hover:border-navy-400',
                disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
