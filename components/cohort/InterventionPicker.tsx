'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { saveIntervention } from '@/app/(protected)/cohort/actions';

/**
 * What changed because of this conversation.
 *
 * THE ONE QUESTION THAT MAKES CONTRIBUTION ANSWERABLE. Mentable can already
 * see that a meeting happened; it could not see what the mentor actually
 * did. "Twelve conversations occurred" and "four of them produced an
 * introduction and two changed a recruiting plan" are very different claims,
 * and only the second one survives a sceptical reader.
 *
 * NOT A FORM, AND NOT A SEPARATE STEP. It appears at the moment somebody
 * marks a conversation complete, which is the only moment they already have
 * the answer in their head. Everything is optional, it saves on tap, and
 * skipping it costs nothing: a half-filled record is better than an
 * abandoned one, and a mandatory field here would quietly turn into noise.
 *
 * The narrative already lives in the recap. This is the countable half.
 */

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'career_clarity', label: 'Career clarity' },
  { key: 'recruiting_strategy', label: 'Recruiting strategy' },
  { key: 'resume', label: 'Resume' },
  { key: 'technical_prep', label: 'Technical prep' },
  { key: 'behavioral_prep', label: 'Behavioural prep' },
  { key: 'interview_prep', label: 'Interview prep' },
  { key: 'introduction', label: 'Made an introduction' },
  { key: 'opportunity', label: 'Surfaced an opportunity' },
  { key: 'decision', label: 'Helped a decision' },
  { key: 'accountability', label: 'Follow-up' },
  { key: 'other', label: 'Something else' },
];

export default function InterventionPicker({
  sessionId,
  initial = [],
}: {
  sessionId: string;
  initial?: string[];
}) {
  const [chosen, setChosen] = useState<string[]>(initial);
  const [saved, setSaved] = useState(false);
  const [, start] = useTransition();

  const toggle = (key: string) => {
    const next = chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key];
    setChosen(next);
    setSaved(false);
    // Saves as you tap. No submit button, because there is nothing to submit
    // to: this is a note about a conversation, not a return.
    start(async () => {
      const r = await saveIntervention(sessionId, next);
      if (r.ok) setSaved(true);
    });
  };

  return (
    <div className="rounded-2xl border border-halo-rule p-5">
      <p className="text-[14.5px] font-medium text-halo-ink">
        What changed because of this conversation?
      </p>
      <p className="text-[12.5px] text-halo-mist-body mt-0.5 mb-3.5">
        Tap any that apply. Optional, and it helps us see what mentorship actually does.
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const on = chosen.includes(c.key);
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                on
                  ? 'border-halo-brand-line bg-halo-veil text-halo-ink font-medium'
                  : 'border-halo-rule text-halo-heather hover:text-halo-ink'
              }`}
            >
              {on && <Check className="h-3.5 w-3.5 text-halo-brand-text" aria-hidden="true" />}
              {c.label}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="h-4 mt-2.5 text-[12px] text-halo-mist-body">
        {saved ? 'Saved' : ''}
      </p>
    </div>
  );
}
