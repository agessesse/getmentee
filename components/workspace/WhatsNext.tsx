import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { NextConversation } from '@/lib/mentorship/workspace-data';
import type { NextAction } from '@/lib/mentorship/next-action';

/**
 * The one dominant thing, and the only filled surface on the page.
 *
 * TWO SOURCES, DELIBERATELY RANKED. If next-action.ts says something is more
 * urgent than the upcoming conversation -- an overdue commitment, a past
 * conversation nobody closed out -- that wins and is rendered as the
 * headline. The scheduled conversation then appears underneath as context
 * rather than as a competing call to action. next-action.ts is not
 * reimplemented here; it is called with this one relationship and its answer
 * is obeyed.
 *
 * Three states, all of which are real: a conversation to prepare for, a
 * conversation already prepared for, and nothing scheduled. The third is not
 * an error, and it says what to do about it.
 */
export default function WhatsNext({
  next,
  action,
  mentorshipId,
  viewerRole,
  partnerFirstName,
  prepareHref,
  planHref = '/schedule',
}: {
  next: NextConversation | null;
  action: NextAction | null;
  mentorshipId: string;
  viewerRole: 'mentor' | 'mentee';
  partnerFirstName: string;
  /*
    Where "Prepare" goes. Defaults to the real prepare route; the Carolina
    preview overrides it so the link stays inside the preview instead of
    pointing at a mentorship that does not exist. An explicit prop, rather
    than the component guessing from context, because a preview that quietly
    links into live routes is exactly the failure mode to avoid.
  */
  prepareHref?: string;
  planHref?: string;
}) {
  const when = next
    ? new Date(next.at).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      }) + ' · ' + new Date(next.at).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      })
    : null;

  const prepHref = next ? prepareHref ?? `/mentorship/${mentorshipId}/prepare/${next.id}` : null;

  return (
    <section className="rounded-2xl bg-halo-veil border border-halo-rule p-5 sm:p-6">
      <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
        What&rsquo;s next
      </p>

      {next ? (
        <>
          <p className="mt-3 text-[13px] font-medium text-halo-brand-text">{when}</p>
          <p className="mt-1 font-display text-[1.35rem] leading-tight text-halo-ink">
            Conversation with {partnerFirstName}
          </p>

          {/*
            The mentee's focus, shown to BOTH. For the mentor this is the
            single most useful sentence on the page: it is what the person
            they are helping actually wants help with.
          */}
          {next.menteePrep.focus && (
            <div className="mt-3.5">
              <p className="text-[12.5px] text-halo-mist-body">
                {viewerRole === 'mentor' ? `${partnerFirstName} wants to discuss` : 'You want to discuss'}
              </p>
              <p className="text-[15px] text-halo-ink leading-relaxed mt-0.5">{next.menteePrep.focus}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {next.viewerPrepared ? (
              <>
                <span className="inline-flex items-center gap-2 text-[14px] font-medium text-halo-ink">
                  <Check className="h-4 w-4 text-halo-brand-text" aria-hidden="true" />
                  You&rsquo;re ready for{' '}
                  {new Date(next.at).toLocaleDateString('en-US', { weekday: 'long' })}.
                </span>
                <Link
                  href={prepHref!}
                  className="text-[13.5px] font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
                >
                  Review what you wrote
                </Link>
              </>
            ) : (
              <Link
                href={prepHref!}
                className="group inline-flex items-center gap-2 rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
              >
                Prepare
                <ArrowRight className="h-4 w-4 arrow-slide group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}
          </div>

          {/*
            Something more urgent than the meeting. Shown beneath it, not
            instead of it, so the person still knows the meeting exists.
          */}
          {action && action.href !== prepHref && (
            <p className="mt-4 pt-4 border-t border-halo-rule text-[13.5px] text-halo-heather">
              {action.headline}{' '}
              <Link href={action.href} className="font-medium text-halo-brand-text underline underline-offset-2">
                {action.cta}
              </Link>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 font-display text-[1.35rem] leading-tight text-halo-ink">
            Nothing scheduled yet.
          </p>
          <p className="mt-1.5 text-[14.5px] text-halo-heather leading-relaxed max-w-md">
            Plan your next conversation when you&rsquo;re ready.
          </p>
          <Link
            href={planHref}
            className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            Plan conversation
            <ArrowRight className="h-4 w-4 arrow-slide group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}
