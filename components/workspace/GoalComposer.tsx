'use client';

import { useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import {
  SMART_PROMPTS, EMPTY_SMART, consolidate, isSmartStarted, toStored,
  type SmartFields,
} from '@/lib/mentorship/smart';

/**
 * Adding something to work toward.
 *
 * THE DEFAULT PATH IS UNCHANGED: one question, one line, Add. That is what
 * most goals need and it is what existed before this pass. SMART is an
 * opt-in beside it, never a step on the way.
 *
 * THREE STATES, and the third is the one that keeps this from feeling like a
 * form:
 *
 *   simple    "What are you working toward?" plus an optional link
 *   smart     five short prompts, all optional, nothing blocking
 *   review    the consolidated goal, EDITABLE, before anything is saved
 *
 * The review step matters. Mentable composing a sentence out of somebody's
 * five answers and saving it without showing them would be putting words in
 * their mouth in their own goal. They see it, they change it, then it saves.
 *
 * The five answers are stored separately from the composed goal, so the
 * mentee can come back and edit the thinking rather than only the summary.
 */
export default function GoalComposer({
  onSave,
  onCancel,
  pending,
  error,
  initialSmart,
  initialTitle = '',
  initialDescription = '',
  mode: startMode = 'simple',
}: {
  onSave: (v: { title: string; description: string; smart: Record<string, string> | null; targetDate: string | null }) => void;
  onCancel: () => void;
  pending: boolean;
  error: string | null;
  initialSmart?: SmartFields;
  initialTitle?: string;
  initialDescription?: string;
  mode?: 'simple' | 'smart';
}) {
  const [mode, setMode] = useState<'simple' | 'smart' | 'review'>(startMode);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [smart, setSmart] = useState<SmartFields>(initialSmart ?? { ...EMPTY_SMART });

  const set = (k: keyof SmartFields, v: string) => setSmart((s) => ({ ...s, [k]: v }));

  const toReview = () => {
    const c = consolidate(smart);
    setTitle(c.title || title);
    setDescription(c.description || description);
    setMode('review');
  };

  const save = () =>
    onSave({
      title,
      description,
      smart: isSmartStarted(smart) ? toStored(smart) : null,
      targetDate: smart.timebound || null,
    });

  // ── Simple ────────────────────────────────────────────────────────────────
  if (mode === 'simple') {
    return (
      <Frame>
        <label htmlFor="goal-title" className="block text-[15px] font-medium text-halo-ink mb-2.5">
          What are you working toward?
        </label>
        <input
          id="goal-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Understand Markets recruiting"
          className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[15px] text-halo-ink placeholder:text-halo-mist-strong focus:outline-none focus:ring-2 focus:ring-halo-purple"
        />

        {/*
          Opt-in, stated as a benefit rather than as a framework. "Build this
          as a SMART goal" is the brief's wording and it is right: it says
          what you get, not what form you are about to fill in.
        */}
        <button
          type="button"
          onClick={() => { setSmart((s) => ({ ...s, specific: s.specific || title })); setMode('smart'); }}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-halo-brand-text hover:text-halo-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Build this as a SMART goal
        </button>

        {error && <p className="text-[12.5px] text-red-600 mt-2">{error}</p>}
        <Actions
          primary="Add"
          onPrimary={() => onSave({ title, description: '', smart: null, targetDate: null })}
          disabled={pending || !title.trim()}
          pending={pending}
          onCancel={onCancel}
        />
      </Frame>
    );
  }

  // ── SMART ─────────────────────────────────────────────────────────────────
  if (mode === 'smart') {
    return (
      <Frame>
        <button
          type="button"
          onClick={() => setMode('simple')}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors mb-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Keep it simple instead
        </button>

        <p className="text-[13px] text-halo-mist-body leading-relaxed mb-5 max-w-sm">
          Answer what&rsquo;s useful. Anything you skip is fine.
        </p>

        <div className="space-y-5">
          {SMART_PROMPTS.map(({ key, label, prompt, placeholder, kind }) => (
            <div key={key}>
              <label htmlFor={`smart-${key}`} className="block">
                <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text">
                  {label}
                </span>
                <span className="block text-[14px] text-halo-ink mt-0.5 mb-2">{prompt}</span>
              </label>
              {kind === 'date' ? (
                <input
                  id={`smart-${key}`}
                  type="date"
                  value={smart[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-purple"
                />
              ) : (
                <textarea
                  id={`smart-${key}`}
                  rows={2}
                  value={smart[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed placeholder:text-halo-mist-strong resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-[12.5px] text-red-600 mt-3">{error}</p>}
        <Actions
          primary="Review goal"
          onPrimary={toReview}
          disabled={!smart.specific.trim() && !title.trim()}
          pending={false}
          onCancel={onCancel}
        />
      </Frame>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  return (
    <Frame>
      <button
        type="button"
        onClick={() => setMode('smart')}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors mb-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to your answers
      </button>

      <p className="text-[13px] text-halo-mist-body leading-relaxed mb-4 max-w-sm">
        Here&rsquo;s your goal, put together. Change anything that doesn&rsquo;t sound like you.
      </p>

      <label htmlFor="review-title" className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
        Goal
      </label>
      <input
        id="review-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[15px] font-medium text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-purple"
      />

      <label htmlFor="review-desc" className="block mt-4 font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
        What it means
      </label>
      <textarea
        id="review-desc"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14.5px] text-halo-ink leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
      />

      {smart.timebound && (
        <p className="text-[12.5px] text-halo-mist-body mt-2.5">
          Target:{' '}
          {new Date(smart.timebound + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
          })}
        </p>
      )}

      {error && <p className="text-[12.5px] text-red-600 mt-3">{error}</p>}
      <Actions
        primary="Save goal"
        onPrimary={save}
        disabled={pending || !title.trim()}
        pending={pending}
        onCancel={onCancel}
      />
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-halo-rule p-4 sm:p-5 mb-4">{children}</div>;
}

function Actions({
  primary, onPrimary, disabled, pending, onCancel,
}: {
  primary: string; onPrimary: () => void; disabled: boolean; pending: boolean; onCancel: () => void;
}) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <button
        type="button"
        onClick={onPrimary}
        disabled={disabled}
        className="rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
      >
        {pending ? 'Saving' : primary}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[13.5px] text-halo-heather hover:text-halo-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        Cancel
      </button>
    </div>
  );
}
