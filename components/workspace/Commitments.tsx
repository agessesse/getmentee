'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import Section, { Empty } from '@/components/workspace/Section';
import { setCommitmentDone, addCommitment } from '@/app/(protected)/mentorship/[id]/actions';
import { PreviewOnly } from '@/components/workspace/WorkingToward';
import type { WorkspaceCommitment } from '@/lib/mentorship/workspace-data';

/**
 * What each person said they would do.
 *
 * GROUPED BY PERSON, not by due date or status. "Maya / Sarah" is how the
 * two of them actually hold this: you remember what YOU owe and what THEY
 * owe, and a merged list sorted by date hides exactly that. Each group is
 * headed by a first name.
 *
 * COMPLETION IS RESTRAINED. A checkbox, a strikethrough, and the row moves
 * to the bottom. No points, no badges, no confetti, no streak. The
 * satisfaction is that the thing is done and the other person can see it;
 * manufacturing a celebration on top of that makes an adult relationship
 * feel like a habit tracker.
 */
export default function Commitments({
  mentorshipId,
  commitments,
  viewerId,
  viewerFirstName,
  partnerId,
  partnerFirstName,
  readOnly = false,
}: {
  mentorshipId: string;
  commitments: WorkspaceCommitment[];
  viewerId: string;
  viewerFirstName: string;
  partnerId: string;
  partnerFirstName: string;
  /** Preview mode: renders, never writes. */
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState(viewerId);
  const [due, setDue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = commitments.filter((c) => !c.completedAt);
  const done = commitments.filter((c) => c.completedAt);

  const groups = [
    { id: viewerId, name: viewerFirstName || 'You', items: open.filter((c) => c.ownerId === viewerId) },
    { id: partnerId, name: partnerFirstName, items: open.filter((c) => c.ownerId === partnerId) },
  ].filter((g) => g.items.length > 0);

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await addCommitment(mentorshipId, title, owner, due || null);
      if (r.ok) { setTitle(''); setDue(''); setAdding(false); }
      else setError(r.error);
    });
  };

  return (
    <Section
      title="Commitments"
      action={
        commitments.length > 0 && !adding && !readOnly ? (
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
      {commitments.length === 0 && !adding && !readOnly && (
        <Empty line="Nothing promised yet. After you meet, keep the next steps here so they don’t disappear after the conversation.">
          <button
            onClick={() => setAdding(true)}
            className="text-[13.5px] font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
          >
            Add a commitment
          </button>
        </Empty>
      )}

      {adding && (
        <div className="rounded-2xl border border-halo-rule p-4 mb-4">
          <label htmlFor="c-title" className="sr-only">What was promised?</label>
          <input
            id="c-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Research three fixed-income desks"
            className="w-full bg-transparent text-[15px] text-halo-ink placeholder:text-halo-mist-strong focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="c-owner" className="text-[12.5px] text-halo-mist-body">Who</label>
              <select
                id="c-owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="rounded-lg border border-halo-rule bg-white px-2 py-1 text-[13px] text-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                <option value={viewerId}>{viewerFirstName || 'You'}</option>
                <option value={partnerId}>{partnerFirstName}</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="c-due" className="text-[12.5px] text-halo-mist-body">By</label>
              <input
                id="c-due"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="rounded-lg border border-halo-rule bg-white px-2 py-1 text-[13px] text-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              />
            </div>
          </div>
          {error && <p className="text-[12.5px] text-red-600 mt-2">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={pending || !title.trim()}
              className="rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              {pending ? 'Saving' : 'Add'}
            </button>
            <button onClick={() => { setAdding(false); setError(null); }} className="text-[13.5px] text-halo-heather hover:text-halo-ink transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {readOnly && <PreviewOnly />}

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.id}>
            <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-2">
              {g.name}
            </p>
            <ul className="space-y-1">
              {g.items.map((c) => (
                <Row key={c.id} mentorshipId={mentorshipId} item={c} readOnly={readOnly} />
              ))}
            </ul>
          </div>
        ))}

        {done.length > 0 && (
          <div>
            <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-2">
              Done
            </p>
            <ul className="space-y-1">
              {done.map((c) => (
                <Row key={c.id} mentorshipId={mentorshipId} item={c} readOnly={readOnly} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}

function Row({ mentorshipId, item, readOnly = false }: { mentorshipId: string; item: WorkspaceCommitment; readOnly?: boolean }) {
  const [pending, start] = useTransition();
  const done = Boolean(item.completedAt);
  const overdue = !done && item.dueDate && new Date(item.dueDate).getTime() < Date.now();

  const due = item.dueDate
    ? new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    : null;

  return (
    <li>
      <label className="group flex items-start gap-3 rounded-xl px-2 py-2 -mx-2 hover:bg-halo-veil/60 transition-colors cursor-pointer">
        <input
          type="checkbox"
          checked={done}
          disabled={pending || readOnly}
          onChange={(e) => {
            const nextDone = e.target.checked;
            start(() => { void setCommitmentDone(mentorshipId, item.id, nextDone); });
          }}
          className="mt-0.5 h-[18px] w-[18px] flex-none rounded-md border-halo-rule text-halo-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple accent-halo-purple"
        />
        <span className="min-w-0 flex-1">
          <span className={`block text-[14.5px] leading-snug ${done ? 'text-halo-mist-body line-through decoration-halo-rule' : 'text-halo-ink'}`}>
            {item.title}
          </span>
          {!done && due && (
            <span className={`block text-[12.5px] mt-0.5 ${overdue ? 'text-red-600' : 'text-halo-mist-body'}`}>
              {overdue ? 'Overdue · was due ' : 'Due '}{due}
            </span>
          )}
        </span>
      </label>
    </li>
  );
}
