'use client';

import { useState, useTransition } from 'react';
import { Plus, Check, ChevronDown } from 'lucide-react';
import Section, { Empty } from '@/components/workspace/Section';
import GoalComposer from '@/components/workspace/GoalComposer';
import { addGoal, completeGoal, updateGoal } from '@/app/(protected)/mentorship/[id]/actions';
import { SMART_PROMPTS, fromStored } from '@/lib/mentorship/smart';
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
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const active = goals.filter((g) => g.status === 'active');
  const reached = goals.filter((g) => g.status === 'completed');

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
        <GoalComposer
          pending={pending}
          error={error}
          onCancel={() => { setAdding(false); setError(null); }}
          onSave={({ title, description, smart, targetDate }) => {
            setError(null);
            start(async () => {
              const r = await addGoal(mentorshipId, title, description, smart, targetDate);
              if (r.ok) setAdding(false); else setError(r.error);
            });
          }}
        />
      )}

      {readOnly && <PreviewOnly />}

      <ul className="space-y-3">
        {active.map((g) =>
          editing === g.id ? (
            <li key={g.id}>
              <GoalComposer
                mode="smart"
                initialTitle={g.title}
                initialDescription={g.description ?? ''}
                initialSmart={fromStored(g.smart)}
                pending={pending}
                error={error}
                onCancel={() => { setEditing(null); setError(null); }}
                onSave={({ title, description, smart, targetDate }) => {
                  setError(null);
                  start(async () => {
                    const r = await updateGoal(mentorshipId, g.id, title, description, smart, targetDate);
                    if (r.ok) setEditing(null); else setError(r.error);
                  });
                }}
              />
            </li>
          ) : (
            <li key={g.id} className="rounded-2xl border border-halo-rule p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-halo-ink leading-snug">{g.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                    <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text">
                      In progress
                    </span>
                    {/*
                      Subtle, as asked. A goal built with the framework is
                      worth marking; it is not worth a badge with an icon and
                      a colour fill competing with the goal itself.
                    */}
                    {g.smart && (
                      <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body border border-halo-rule rounded-full px-2 py-0.5">
                        SMART goal
                      </span>
                    )}
                    {g.targetDate && (
                      <span className="text-[12px] text-halo-mist-body">
                        by {new Date(g.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {g.description && (
                    <p className="text-[13.5px] text-halo-heather leading-relaxed mt-2">{g.description}</p>
                  )}
                  {g.relatedOpen > 0 && (
                    <p className="text-[12.5px] text-halo-mist-body mt-2">
                      {g.relatedOpen} open commitment{g.relatedOpen === 1 ? '' : 's'}
                    </p>
                  )}

                  {/*
                    The breakdown stays collapsed. The brief is explicit that
                    the workspace keeps showing a clean goal card rather than
                    five large fields; the thinking is kept so it can be
                    revisited, not so it can be re-read every visit.
                  */}
                  {g.smart && <SmartDetail smart={g.smart} />}

                  {!readOnly && g.mine && (
                    <button
                      onClick={() => { setEditing(g.id); setError(null); }}
                      className="mt-3 text-[12.5px] font-medium text-halo-brand-text hover:text-halo-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
                    >
                      Edit goal
                    </button>
                  )}
                </div>
                {!readOnly && <GoalDone mentorshipId={mentorshipId} goalId={g.id} />}
              </div>
            </li>
          ),
        )}

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

/** The five answers, folded away until asked for. */
function SmartDetail({ smart }: { smart: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const filled = SMART_PROMPTS.filter((p) => smart[p.key]?.trim());
  if (filled.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[12.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        {open ? 'Hide the thinking' : 'See the thinking'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <dl className="mt-3 space-y-2.5 border-l-2 border-halo-rule pl-3.5">
          {filled.map((p) => (
            <div key={p.key}>
              <dt className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body">
                {p.label}
              </dt>
              <dd className="text-[13.5px] text-halo-ink leading-relaxed mt-0.5">
                {p.kind === 'date'
                  ? new Date(smart[p.key] + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : smart[p.key]}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
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
