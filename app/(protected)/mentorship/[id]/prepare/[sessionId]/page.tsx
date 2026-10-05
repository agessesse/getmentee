import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { loadWorkspace } from '@/lib/mentorship/workspace-data';
import PrepareMentee from '@/components/workspace/PrepareMentee';
import PrepareMentor from '@/components/workspace/PrepareMentor';

export const metadata: Metadata = { title: 'Prepare', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Preparing for one conversation.
 *
 * Its own route rather than a modal on the workspace, for two reasons that
 * both matter on a phone: preparing is a several-minute task that should
 * survive a lock screen and a back button, and a modal with four text areas
 * on a 390px viewport is a scrolling box inside a scrolling page.
 *
 * Both sides share this route and the authorization that comes with it; the
 * content differs because the two people are doing genuinely different
 * things. A mentee is working out what to ask. A mentor is finding out what
 * is needed. Forcing those into one component would serve neither.
 */
export default async function PreparePage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const w = await loadWorkspace(id);
  if (!w.ok) notFound();

  // The session must belong to this mentorship AND be the one coming up.
  // loadWorkspace only ever returns the next conversation, so an id for a
  // past or foreign session simply does not match.
  if (!w.next || w.next.id !== sessionId) notFound();

  const when = new Date(w.next.at);
  const dayLabel = when.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeLabel = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  /*
    What the mentee said they would do at the last conversation. Commitments
    assigned to the mentee that already existed before the upcoming session
    was created; completed or not, both are worth seeing.
  */
  const menteeCommitments = w.commitments
    .filter((c) => c.ownerId === (w.viewerRole === 'mentee' ? w.viewerId : w.partner.id))
    .slice(-5)
    .map((c) => ({ id: c.id, title: c.title, done: Boolean(c.completedAt) }));

  /*
    "Since you last spoke", for the mentor. Only things both people agreed
    to: commitments completed, and goals reached. Not activity, not logins,
    not anything the mentee did not choose to record.
  */
  const since = [
    ...w.relationship.finishedSinceLastSession.map((c) => ({
      id: c.id,
      label: `Completed “${c.title}”`,
    })),
    ...w.goals
      .filter((g) => g.completedAt && (!w.relationship.lastSession || g.completedAt > w.relationship.lastSession.at))
      .map((g) => ({ id: g.id, label: `Reached ${g.title.toLowerCase()}` })),
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/mentorship/${w.mentorshipId}`}
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {w.partner.firstName}
      </Link>

      <header className="mt-5 mb-8">
        <p className="text-[13px] font-medium text-halo-brand-text">
          {dayLabel} · {timeLabel}
        </p>
        <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mt-1">
          {w.viewerRole === 'mentee'
            ? 'Make this conversation count.'
            : `Know what ${w.partner.firstName} needs before you meet.`}
        </h1>
        <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2 max-w-md">
          {w.viewerRole === 'mentee'
            ? `Whatever you write here, ${w.partner.firstName} sees before you talk. Nothing is required.`
            : 'Everything below is what they chose to share with you.'}
        </p>
      </header>

      {w.viewerRole === 'mentee' ? (
        <PrepareMentee
          mentorshipId={w.mentorshipId}
          sessionId={w.next.id}
          initial={w.next.menteePrep}
          mentorFirstName={w.partner.firstName}
          lastCommitments={menteeCommitments}
        />
      ) : (
        <PrepareMentor
          mentorshipId={w.mentorshipId}
          sessionId={w.next.id}
          menteeFirstName={w.partner.firstName}
          menteePrep={w.next.menteePrep}
          initialNotes={w.next.mentorNotes}
          since={since}
        />
      )}
    </div>
  );
}
