'use client';

import { useId, useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

/**
 * A multi-select that stays small when the vocabulary is long.
 *
 * THE PROBLEM THIS SOLVES. The existing TagPicker renders every option as
 * a button, which worked at thirteen industries and falls apart at
 * twenty-two situations and fifty companies: a wall of chips is something
 * people scroll past, and the field that mattered most in onboarding —
 * can_help_with — was empty for 25 of 25 mentors.
 *
 * So: the selected values are always visible, a short list of suggestions
 * sits underneath, and the rest arrives through typing. Nothing is hidden
 * behind a disclosure the person has to discover; the box is the
 * disclosure.
 *
 * CUSTOM VALUES ARE ALLOWED, and shown as such. A closed vocabulary that
 * cannot express your situation is worse than a messy one. The cost is
 * real and is stated in the hint where it matters: a custom value will not
 * match anybody until someone on the other side writes it too, which is
 * why the suggestions come first and are phrased the way both sides of the
 * network are asked to phrase them.
 *
 * Keyboard: the input takes Enter to add and Backspace-on-empty to remove
 * the last value, which is what anyone who has used a tag field expects.
 */
export default function ChipPicker({
  options,
  value,
  onChange,
  max = 8,
  placeholder = 'Type to search, or add your own',
  allowCustom = true,
  suggestionCount = 8,
  label,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  placeholder?: string;
  /** Companies are open-ended; cadence-like lists are not. */
  allowCustom?: boolean;
  suggestionCount?: number;
  /** For screen readers, since the visible label sits on the Field wrapper. */
  label: string;
}) {
  const [query, setQuery] = useState('');
  const listId = useId();
  const full = value.length >= max;

  const norm = (s: string) => s.toLowerCase().trim();

  const matches = useMemo(() => {
    const q = norm(query);
    const unpicked = options.filter((o) => !value.some((v) => norm(v) === norm(o)));
    if (!q) return unpicked.slice(0, suggestionCount);
    /* Prefix matches first: typing "pri" should offer "Private equity
       recruiting" before "Investment banking recruiting" merely because
       the second contains "pri" nowhere. */
    const starts = unpicked.filter((o) => norm(o).startsWith(q));
    const contains = unpicked.filter((o) => !norm(o).startsWith(q) && norm(o).includes(q));
    return [...starts, ...contains].slice(0, suggestionCount);
  }, [query, options, value, suggestionCount]);

  /* Only when it is genuinely new — offering "Add Private Equity" next to
     the existing "Private Equity" is how a vocabulary quietly forks. */
  const canAddCustom =
    allowCustom &&
    query.trim().length > 1 &&
    !options.some((o) => norm(o) === norm(query)) &&
    !value.some((v) => norm(v) === norm(query));

  const add = (v: string) => {
    const t = v.trim();
    if (!t || full || value.some((x) => norm(x) === norm(t))) return;
    onChange([...value, t]);
    setQuery('');
  };

  return (
    <div>
      {/* What they have chosen, always visible and always removable. */}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2.5">
          {value.map((v) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="group inline-flex items-center gap-1.5 rounded-full bg-halo-purple px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-halo-purple-d focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-1"
              >
                {v}
                <X className="h-3 w-3 opacity-70 group-hover:opacity-100" aria-hidden="true" />
                <span className="sr-only">Remove</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        type="text"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-label={label}
        autoComplete="off"
        value={query}
        disabled={full}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            /* Enter takes the top suggestion when there is one, so the
               common path never requires reaching for the mouse. */
            add(matches[0] ?? (canAddCustom ? query : ''));
          } else if (e.key === 'Backspace' && !query && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={full ? `That's ${max} — remove one to add another` : placeholder}
        className="w-full px-3.5 py-2.5 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple bg-white placeholder-halo-mist-body disabled:bg-halo-veil disabled:text-halo-mist-body"
      />

      {!full && (matches.length > 0 || canAddCustom) && (
        <ul id={listId} className="flex flex-wrap gap-2 mt-2.5">
          {matches.map((o) => (
            <li key={o}>
              <button
                type="button"
                onClick={() => add(o)}
                className="inline-flex items-center gap-1.5 rounded-full border border-halo-rule bg-white px-3 py-1.5 text-xs font-medium text-halo-heather transition-colors hover:border-halo-purple hover:text-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                <Check className="h-3 w-3 text-halo-mist-body" aria-hidden="true" />
                {o}
              </button>
            </li>
          ))}
          {canAddCustom && (
            <li>
              <button
                type="button"
                onClick={() => add(query)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-halo-purple bg-white px-3 py-1.5 text-xs font-medium text-halo-brand-text transition-colors hover:bg-halo-veil focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                Add &ldquo;{query.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
