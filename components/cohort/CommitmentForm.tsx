'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { acceptCommitment } from '@/app/(protected)/cohort/actions';

/**
 * The commitment, stated plainly before it is accepted.
 *
 * NO SMALL PRINT AND NO PERSUASION. A mentor should be able to read what
 * they are agreeing to in about fifteen seconds and decline without
 * friction. A commitment extracted by enthusiasm is the kind that goes
 * quiet in week three, which is the failure mode this whole screen exists
 * to reduce.
 *
 * The two questions after it are the ones Mentable cannot answer any other
 * way: where this mentor came from, and why they said yes. Both feed the
 * supply question directly.
 */

const SOURCES: { value: string; label: string }[] = [
  { value: 'founder_network', label: 'I know Abel or Pablo' },
  { value: 'mentor_referral', label: 'Another mentor told me' },
  { value: 'alumni_network', label: 'Through an alumni network' },
  { value: 'employer', label: 'Through my employer' },
  { value: 'university', label: 'Through a university' },
  { value: 'professional_org', label: 'Through a professional organisation' },
  { value: 'former_mentee', label: 'I was mentored myself' },
  { value: 'inbound', label: 'I found Mentable myself' },
  { value: 'other', label: 'Somewhere else' },
];

export default function CommitmentForm({
  cohortName, cadenceDays, expectedSessions, alreadyCommitted,
}: {
  cohortName: string;
  cadenceDays: number;
  expectedSessions: number;
  alreadyCommitted: boolean;
}) {
  const [source, setSource] = useState('');
  const [motivation, setMotivation] = useState('');
  const [preferred, setPreferred] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const terms = [
    'One student, for one semester.',
    `A conversation roughly every ${Math.round(cadenceDays / 7)} weeks — about ${expectedSessions} in total.`,
    '30 to 45 minutes each.',
    'A few minutes of preparation beforehand.',
    'Agree what happens next, and keep it in Mentable.',
  ];

  if (alreadyCommitted || done) {
    return (
      <div className="rounded-2xl border border-halo-rule p-6">
        <p className="inline-flex items-center gap-2 font-display text-[1.2rem] text-halo-ink">
          <Check className="h-5 w-5 text-halo-brand-text" aria-hidden="true" />
          Committed to {cohortName}.
        </p>
        <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2 max-w-md">
          We will introduce you to your student and you will see them on your home page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ul className="rounded-2xl bg-halo-veil border border-halo-rule p-5 space-y-2.5">
        {terms.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-[14.5px] text-halo-ink leading-relaxed">
            <Check className="h-4 w-4 flex-none mt-0.5 text-halo-brand-text" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>

      <div>
        <label htmlFor="source" className="block text-[14.5px] font-medium text-halo-ink mb-2">
          How did you hear about Mentable?
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[15px] text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-purple"
        >
          <option value="">Choose one</option>
          {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="motivation" className="block text-[14.5px] font-medium text-halo-ink mb-2">
          Why did you say yes?
        </label>
        <textarea
          id="motivation"
          rows={3}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Nobody did this for me and I would have taken it."
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed placeholder:text-halo-mist-strong resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />
      </div>

      <div>
        <label htmlFor="preferred" className="block text-[14.5px] font-medium text-halo-ink mb-2">
          Who would you be most useful to?
          <span className="font-normal text-halo-mist-body"> Optional.</span>
        </label>
        <textarea
          id="preferred"
          rows={2}
          value={preferred}
          onChange={(e) => setPreferred(e.target.value)}
          placeholder="Someone deciding between banking and markets, or anyone who has not met a trader before."
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed placeholder:text-halo-mist-strong resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />
      </div>

      {error && <p role="alert" className="text-[13.5px] text-red-600">{error}</p>}

      <button
        type="button"
        disabled={pending || !source}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await acceptCommitment({
              acquisitionSource: source,
              motivation,
              preferredProfile: preferred,
              terms: { students: 1, weeks: 16, cadenceDays, minutesPerConversation: 45 },
            });
            if (r.ok) setDone(true); else setError(r.error);
          });
        }}
        className="rounded-xl bg-halo-purple px-5 py-2.5 text-[14.5px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
      >
        {pending ? 'Saving' : 'I’m in'}
      </button>
    </div>
  );
}
