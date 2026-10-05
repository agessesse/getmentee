'use client';

import { useState, useTransition } from 'react';
import { Plus, Check } from 'lucide-react';
import Section, { Empty } from '@/components/workspace/Section';
import { addGoal, completeGoal } from '@/app/(protected)/mentorship/[id]/actions';
import type { WorkspaceGoal } from '@/lib/mentorship/workspace-data';

/**
 * "What we're working toward", not "Goals".
 *
 * NO PERCENTAGES. The obvious design puts a progress bar on each goal, and
 * there is nothing in the database to compute one from: a goal is active or
 * completed, and anything between those two is invented. A fabricated 40%
 * is worse than no number, because people believe numbers. So progress is
 * shown as the two states that are true, plus the count of open commitments
 * where that association is unambiguous.
 *
 * Shared direction, not tickets: no assignee, no priority, no status
 * dropdown. Two people decide what would make this mentorship useful, and
 * either of them can say when it has been reached.
 */
export default function WorkingToward({
  mentorshipId,
  goals,
  readOnly = false,
}: {
  mentorshipId: string;
  goals: WorkspaceGoal[];
  /*
    Preview mode. Everything renders, nothing writes. Set only by the
    Carolina preview, which has no participant authorization and must not
    be able to acquire any: see app/(protected)/preview.
  */
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const active = goals.filter((g) => g.status === 'active');
  const reached = goals.filter((g) => g.status === 'completed');

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await addGoal(mentorshipId, title, description);
      if (r.ok) { setTitle(''); setDescription(''); setAdding(false); }
      else setError(r.error);
    });
  };

  return (
    <Section
      title="What we’re working toward"
      action={
        goals.length > 0 && !adding && !readOnly ? (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-halo-brand-text hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </button>
        ) : null
      }
    >
      {goals.length === 0 && !adding && !readOnly && (
        <Empty line="Nothing yet. Start by deciding what would make this mentorship useful.">
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Set your first goal
          </button>
        </Empty>
      )}

      {adding && (
        <div className="rounded-2xl border border-halo-rule p-4 mb-4">
          <label htmlFor="goal-title" className="sr-only">What are you working toward?</label>
          <input
            id="goal-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Understand Markets recruiting"
            className="w-full bg-transparent text-[15px] text-halo-ink placeholder:text-halo-mist-strong focus:outline-none"
          />
          <label htmlFor="goal-desc" className="sr-only">Why does it matter?</label>
          <textarea
            id="goal-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What would it mean to get there?"
            className="mt-2 w-full bg-transparent text-[13.5px] text-halo-heather placeholder:text-halo-mist-strong focus:outline-none resize-none"
          />
          {error && <p className="text-[12.5px] text-red-600 mt-1">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={pending || !title.trim()}
              className="rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              {pending ? 'Saving' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setError(null); }}
              className="text-[13.5px] text-halo-heather hover:text-halo-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {readOnly && <PreviewOnly />}

      <ul className="space-y-3">
        {active.map((g) => (
          <li key={g.id} className="rounded-2xl border border-halo-rule p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-halo-ink leading-snug">{g.title}</p>
                <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mt-1.5">
                  In progress
                </p>
                {g.description && (
                  <p className="text-[13.5px] text-halo-heather leading-relaxed mt-2">{g.description}</p>
                )}
                {g.relatedOpen > 0 && (
                  <p className="text-[12.5px] text-halo-mist-body mt-2">
                    {g.relatedOpen} open commitment{g.relatedOpen === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              {!readOnly && <GoalDone mentorshipId={mentorshipId} goalId={g.id} />}
            </div>
          </li>
        ))}

        {reached.map((g) => (
          <li key={g.id} className="flex items-start gap-2.5 px-1">
            <Check className="h-4 w-4 flex-none text-halo-brand-text mt-0.5" aria-hidden="true" />
            <span className="text-[14px] text-halo-mist-body line-through decoration-halo-rule">{g.title}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function GoalDone({ mentorshipId, goalId }: { mentorshipId: string; goalId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => { void completeGoal(mentorshipId, goalId); })}
      disabled={pending}
      /*
        "Reached" alone sat directly opposite the words "IN PROGRESS" and
        read as a second status rather than as the control that changes the
        first one. A verb fixes it, and the border makes it look pressable.
      */
      className="flex-none rounded-lg border border-halo-rule px-2.5 py-1 text-[12.5px] font-medium text-halo-heather hover:border-halo-brand-line hover:text-halo-brand-text transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
    >
      Mark reached
    </button>
  );
}

/** Shown where a control would be, in preview. */
export function PreviewOnly({ label = 'Preview only' }: { label?: string }) {
  return (
    <p className="mb-4 rounded-xl border border-dashed border-halo-rule px-4 py-2.5 text-[12.5px] text-halo-mist-body">
      <span className="font-semibold text-halo-heather">{label}.</span>{' '}
      This action is available to participants.
    </p>
  );
}
