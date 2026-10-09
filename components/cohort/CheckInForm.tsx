'use client';

import { useState, useTransition } from 'react';
import { SCALES, COUNTS, OPEN } from '@/lib/cohort/measures';
import { submitMeasures } from '@/app/(protected)/cohort/actions';

/**
 * The baseline and the endline, same component.
 *
 * They ask the same questions on purpose: a baseline you cannot compare
 * against is just a form. The endline adds the open questions and, for a
 * mentor, whether they would do it again.
 *
 * HONEST ABOUT WHAT IT IS. The scales say out loud that they are self-
 * reports. The counts are asked separately because they are the half a
 * sceptical reader should trust, and presenting a 1-5 feeling as the same
 * kind of evidence as "three interviews" would be exactly the quiet
 * dishonesty this product is trying to avoid.
 */
export default function CheckInForm({
  phase, role,
}: {
  phase: 'baseline' | 'endline';
  role: 'mentee' | 'mentor';
}) {
  const [scales, setScales] = useState<Record<string, number>>({});
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, string>>({});
  const [share, setShare] = useState(false);
  const [again, setAgain] = useState<boolean | null>(null);
  const [refer, setRefer] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const isEnd = phase === 'endline';
  const countQs = COUNTS.filter((q) => !q.endlineOnly || isEnd);

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await submitMeasures({
        phase,
        scales: scales as never,
        counts: Object.fromEntries(
          Object.entries(counts).map(([k, v]) => [k, v === '' ? undefined : Number(v)]),
        ) as never,
        open: isEnd ? (open as never) : {},
        sharePermission: share,
        ...(isEnd && role === 'mentor' ? { wouldAgain: again ?? undefined, wouldRefer: refer ?? undefined } : {}),
      });
      if (r.ok) setDone(true); else setError(r.error);
    });
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-halo-rule p-6">
        <p className="font-display text-[1.25rem] text-halo-ink">Thank you.</p>
        <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2 max-w-md">
          {isEnd
            ? 'That closes out your cohort. We compare this against what you told us at the start.'
            : 'We will ask the same questions at the end of the semester, so we can see what moved.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-9">
      <section>
        <h2 className="font-display text-[1.2rem] text-halo-ink">Where you are now</h2>
        <p className="text-[13px] text-halo-mist-body mt-1 mb-5">
          Your own read on it. There is no right answer and nobody is marked on this.
        </p>
        <div className="space-y-6">
          {SCALES.map((q) => (
            <fieldset key={q.key}>
              <legend className="text-[14.5px] font-medium text-halo-ink">{q.prompt}</legend>
              <div className="mt-3 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={scales[q.key] === n}
                    onClick={() => setScales((s) => ({ ...s, [q.key]: n }))}
                    className={`h-10 w-10 flex-none rounded-xl border text-[14px] font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                      scales[q.key] === n
                        ? 'border-halo-brand-line bg-halo-veil text-halo-ink'
                        : 'border-halo-rule text-halo-heather hover:text-halo-ink'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1.5 max-w-[16rem]">
                <span className="text-[11.5px] text-halo-mist-body">{q.low}</span>
                <span className="text-[11.5px] text-halo-mist-body text-right">{q.high}</span>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-[1.2rem] text-halo-ink">A few numbers</h2>
        <p className="text-[13px] text-halo-mist-body mt-1 mb-5">
          Rough is fine. Leave anything blank that does not apply.
        </p>
        <div className="space-y-4">
          {countQs.map((q) => (
            <div key={q.key}>
              <label htmlFor={q.key} className="block text-[14.5px] text-halo-ink">{q.prompt}</label>
              <input
                id={q.key}
                type="number"
                min={0}
                inputMode="numeric"
                value={counts[q.key] ?? ''}
                onChange={(e) => setCounts((c) => ({ ...c, [q.key]: e.target.value }))}
                className="mt-2 w-28 rounded-xl border border-halo-rule bg-white px-3 py-2 text-[15px] text-halo-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-halo-purple"
              />
            </div>
          ))}
        </div>
      </section>

      {isEnd && (
        <section>
          <h2 className="font-display text-[1.2rem] text-halo-ink">What happened</h2>
          <p className="text-[13px] text-halo-mist-body mt-1 mb-5">
            The part we learn most from. A sentence each is plenty.
          </p>
          <div className="space-y-5">
            {OPEN.map((q) => (
              <div key={q.key}>
                <label htmlFor={q.key} className="block text-[14.5px] text-halo-ink mb-2">
                  {role === 'mentor' && q.mentorPrompt ? q.mentorPrompt : q.prompt}
                </label>
                <textarea
                  id={q.key}
                  rows={2}
                  value={open[q.key] ?? ''}
                  onChange={(e) => setOpen((o) => ({ ...o, [q.key]: e.target.value }))}
                  className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
                />
              </div>
            ))}
          </div>

          {role === 'mentor' && (
            <div className="mt-7 space-y-4">
              <YesNo label="Would you mentor again?" value={again} onChange={setAgain} />
              <YesNo label="Would you recommend another mentor?" value={refer} onChange={setRefer} />
            </div>
          )}

          {/*
            Permission, off by default. Nothing written above can appear in
            a case study, a report or a deck unless this is ticked.
          */}
          <label className="mt-7 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
              className="mt-0.5 h-[18px] w-[18px] flex-none rounded-md border-halo-rule accent-halo-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            />
            <span className="text-[13.5px] text-halo-heather leading-relaxed">
              Mentable may quote this when describing the programme. We will ask again before
              using your name.
            </span>
          </label>
        </section>
      )}

      {error && <p role="alert" className="text-[13.5px] text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="rounded-xl bg-halo-purple px-5 py-2.5 text-[14.5px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
      >
        {pending ? 'Saving' : isEnd ? 'Finish' : 'Save'}
      </button>
    </div>
  );
}

function YesNo({
  label, value, onChange,
}: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <fieldset>
      <legend className="text-[14.5px] text-halo-ink mb-2">{label}</legend>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`rounded-xl border px-4 py-2 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
              value === v
                ? 'border-halo-brand-line bg-halo-veil text-halo-ink font-medium'
                : 'border-halo-rule text-halo-heather hover:text-halo-ink'
            }`}
          >
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
