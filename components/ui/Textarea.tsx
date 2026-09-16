import { clsx } from 'clsx';
import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-halo-ink">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'rounded-xl border px-3.5 py-2.5 text-sm text-halo-ink placeholder-halo-mist-body focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent transition-colors resize-none',
          error ? 'border-red-400 bg-red-50' : 'border-halo-rule bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
