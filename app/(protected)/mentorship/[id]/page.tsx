import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadWorkspace } from '@/lib/mentorship/workspace-data';
import { listConnectionSummaries } from '@/lib/calendar/connections';
import { menteeNextAction, mentorNextAction } from '@/lib/mentorship/next-action';
import RelationshipHeader from '@/components/workspace/RelationshipHeader';
import WhatsNext from '@/components/workspace/WhatsNext';
import WorkingToward from '@/components/workspace/WorkingToward';
import Commitments from '@/components/workspace/Commitments';
import Conversations, { History } from '@/components/workspace/Conversations';

export const metadata: Metadata = { title: 'Mentorship', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * The relationship workspace. The centre of gravity of the product.
 *
 * WHAT IT IS NOT: six database tables behind six tabs. There are no tabs.
 * The page is one column, read top to bottom, and its order is the order the
 * five questions actually occur to a person:
 *
 *   Who are we?                 the header
 *   What's happening next?      the only filled surface on the page
 *   What are we working toward?  shared direction
 *   What did we agree to?        commitments, grouped by person
 *   Where have we been?          conversations, then a quiet history
 *
 * "What's next" comes second rather than after the goals because it is the
 * only part of the page that is time-sensitive. Everything below it is
 * context you read when you have a minute; the conversation on Tuesday is
 * the thing you came here for.
 *
 * ONE IMPLEMENTATION, TWO PERSPECTIVES. There is no mentee workspace and no
 * mentor workspace. The same sections render for both, and the role changes
 * emphasis rather than structure: the mentor sees what the mentee wants help
 * with as the headline fact, the mentee sees their own preparation as the
 * thing to finish. Two implementations would drift within a month.
 *
 * AUTHORIZATION: see lib/mentorship/workspace-data.ts. The short version is
 * that this page reads through the user's own session, every table it
 * touches is RLS-scoped to the two participants, and administering the
 * programme that created the relationship grants nothing here.
 */
export default async function MentorshipWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const w = await loadWorkspace(id);

  /*
    A non-participant gets the same 404 as a mentorship that does not exist.
    Distinguishing them would turn this route into a way to test whether a
    given id is real, which is how you enumerate a database one guess at a
    time.
  */
  if (!w.ok) notFound();

  /*
    Which calendars the VIEWER has connected, which decides whether Google
    Meet and Teams are offered at all. Resolved from their own account, not
    guessed from anybody's email domain: a .edu address is Google Workspace
    at one university and Microsoft 365 at the next.
  */
  const providers = (await listConnectionSummaries(w.viewerId)).map((c) => c.provider);

  // The dominant action comes from the same function the dashboard uses, with
  // a state containing this one relationship. Not a second opinion written
  // next to it: the same 36-state logic, asked a narrower question.
  const action =
    w.viewerRole === 'mentee'
      ? menteeNextAction({
          relationships: [w.relationship],
          pendingRequests: [],
          savedMentors: 0,
          contactableMentors: 0,
        })
      : mentorNextAction({
          mentorId: w.viewerId,
          relationships: [w.relationship],
          pendingRequests: [],
          hasAvailability: true,
          isNew: false,
        });

  return (
    <div className="max-w-2xl mx-auto lg:max-w-3xl">
      <RelationshipHeader
        partner={w.partner}
        viewerName={w.viewerFullName}
        tenant={w.tenant}
        startedAt={w.startedAt}
      />

      <WhatsNext
        next={w.next}
        action={action}
        mentorshipId={w.mentorshipId}
        viewerRole={w.viewerRole}
        partnerFirstName={w.partner.firstName}
        partner={{
          firstName: w.partner.firstName,
          fullName: w.partner.fullName,
          avatarUrl: w.partner.avatarUrl,
        }}
        providers={providers}
      />

      <div className="mt-8 space-y-7">
        <WorkingToward mentorshipId={w.mentorshipId} goals={w.goals} />

        <Commitments
          mentorshipId={w.mentorshipId}
          commitments={w.commitments}
          viewerId={w.viewerId}
          viewerFirstName={w.viewerFirstName}
          partnerId={w.partner.id}
          partnerFirstName={w.partner.firstName}
        />

        <Conversations conversations={w.conversations} hasUpcoming={Boolean(w.next)} />

        <History events={w.timeline} />
      </div>
    </div>
  );
}
