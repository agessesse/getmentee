import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { carolinaWorkspace } from '@/lib/preview/carolina-fixture';
import RelationshipHeader from '@/components/workspace/RelationshipHeader';
import WhatsNext from '@/components/workspace/WhatsNext';
import WorkingToward from '@/components/workspace/WorkingToward';
import Commitments from '@/components/workspace/Commitments';
import Conversations, { History } from '@/components/workspace/Conversations';
import PrepareMentee from '@/components/workspace/PrepareMentee';
import PrepareMentor from '@/components/workspace/PrepareMentor';

export const metadata = { title: 'Carolina preview', robots: { index: false, follow: false } };

/**
 * The previewed workspace.
 *
 * It renders the SAME components the real route renders, with fixture props.
 * That is the point: a preview built from a separate set of mock screens
 * stops matching the product within a sprint and then actively misleads.
 * Here, changing the workspace changes the preview.
 *
 * Interactive sections are passed readOnly, so every control is inert and
 * explains why. The prepare panels below are shown as a static illustration
 * for the same reason -- they would otherwise autosave into a session id
 * that does not exist.
 */
export default async function CarolinaRolePreview({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { role } = await params;
  const { view } = await searchParams;

  if (role !== 'student' && role !== 'mentor') notFound();
  const viewerRole = role === 'student' ? 'mentee' : 'mentor';
  const w = carolinaWorkspace(viewerRole);

  if (view === 'prepare') {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/preview/carolina/${role}`}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {w.partner.firstName}
        </Link>

        <header className="mt-5 mb-8">
          <p className="text-[13px] font-medium text-halo-brand-text">
            {new Date(w.next!.at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}
            {new Date(w.next!.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
          <h1 className="font-display text-[1.75rem] leading-tight text-halo-ink mt-1">
            {viewerRole === 'mentee'
              ? 'Make this conversation count.'
              : `Know what ${w.partner.firstName} needs before you meet.`}
          </h1>
        </header>

        {/* Inert: a preview must not write, and there is no session to write to. */}
        <div className="pointer-events-none select-none" aria-hidden="true">
          {viewerRole === 'mentee' ? (
            <PrepareMentee
              mentorshipId="preview"
              sessionId="preview-session"
              initial={w.next!.menteePrep}
              mentorFirstName={w.partner.firstName}
              lastCommitments={w.commitments
                .filter((c) => c.ownerFirstName === 'Maya')
                .map((c) => ({ id: c.id, title: c.title, done: Boolean(c.completedAt) }))}
            />
          ) : (
            <PrepareMentor
              mentorshipId="preview"
              sessionId="preview-session"
              menteeFirstName={w.partner.firstName}
              menteePrep={w.next!.menteePrep}
              initialNotes={w.next!.mentorNotes}
              since={[{ id: 'c3', label: 'Completed “Reach out to two people on the markets desk”' }]}
            />
          )}
        </div>
        <p className="mt-6 rounded-xl border border-dashed border-halo-rule px-4 py-2.5 text-[12.5px] text-halo-mist-body">
          <span className="font-semibold text-halo-heather">Preview only.</span> This action is
          available to participants.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto lg:max-w-3xl">
      <Link
        href="/preview/carolina"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Carolina preview
      </Link>

      <RelationshipHeader
        partner={w.partner}
        viewerName={w.viewerFullName}
        tenant={w.tenant}
        startedAt={w.startedAt}
      />

      {/* The real card, pointed at the preview's own prepare view. */}
      <WhatsNext
        next={w.next}
        action={null}
        mentorshipId="preview"
        viewerRole={w.viewerRole}
        partnerFirstName={w.partner.firstName}
        prepareHref={`/preview/carolina/${role}?view=prepare`}
        planHref={`/preview/carolina/${role}`}
      />

      <div className="mt-8 space-y-7">
        <WorkingToward mentorshipId="preview" goals={w.goals} readOnly />
        <Commitments
          mentorshipId="preview"
          commitments={w.commitments}
          viewerId={w.viewerId}
          viewerFirstName={w.viewerFirstName}
          partnerId={w.partner.id}
          partnerFirstName={w.partner.firstName}
          readOnly
        />
        <Conversations conversations={w.conversations} hasUpcoming />
        <History events={w.timeline} />
      </div>
    </div>
  );
}
