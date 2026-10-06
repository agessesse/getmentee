'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Video, MapPin, CalendarDays, AlertTriangle } from 'lucide-react';
import PlanConversation from '@/components/workspace/PlanConversation';
import { cancelConversation } from '@/app/(protected)/mentorship/[id]/schedule-actions';
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
  partner,
  providers,
  readOnly = false,
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
  /** Who the conversation is with. Pre-selected; never typed. */
  partner?: { firstName: string; fullName: string; avatarUrl: string | null };
  /** Calendar providers the viewer has connected. */
  providers?: ('google' | 'microsoft')[];
  /** Preview renders the card but must not be able to schedule anything. */
  readOnly?: boolean;
}) {
  const [planning, setPlanning] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [cancelling, startCancel] = useTransition();
  /*
    Rendered in the zone the conversation was BOOKED in, not the reader's.
    Two people in different places must see the same agreed moment described
    the same way, or one of them turns up an hour out.
  */
  const zone = next?.timeZone ?? undefined;
  const when = next
    ? new Date(next.at).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', timeZone: zone,
      }) + ' · ' + new Date(next.at).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: zone,
      })
    : null;

  const meetingLabel = next?.meetingProvider === 'google_meet' ? 'Google Meet'
    : next?.meetingProvider === 'teams' ? 'Microsoft Teams'
    : next?.meetingProvider === 'in_person' ? 'In person'
    : null;

  const prepHref = next ? prepareHref ?? `/mentorship/${mentorshipId}/prepare/${next.id}` : null;

  if (planning && partner) {
    return (
      <section className="rounded-2xl bg-halo-veil border border-halo-rule p-5 sm:p-6">
        <PlanConversation
          mentorshipId={mentorshipId}
          partner={partner}
          providers={providers ?? []}
          onCancel={() => setPlanning(false)}
          onDone={(msg) => { setPlanning(false); setFlash(msg); }}
        />
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-halo-veil border border-halo-rule p-5 sm:p-6">
      <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
        What&rsquo;s next
      </p>

      {/* Lightweight confirmation, then the card below updates itself. */}
      {flash && (
        <p role="status" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-halo-ink">
          <Check className="h-4 w-4 text-halo-brand-text" aria-hidden="true" />
          {flash}
        </p>
      )}

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

          {/* How to actually get into it, once there is something to join. */}
          {(next.videoLink || meetingLabel || next.location) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {next.videoLink && (
                <a
                  href={next.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-halo-rule bg-white px-3 py-1.5 text-[13px] font-medium text-halo-ink hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
                >
                  <Video className="h-3.5 w-3.5 text-halo-brand-text" aria-hidden="true" />
                  Join meeting
                </a>
              )}
              {meetingLabel && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-halo-mist-body">
                  {next.meetingProvider === 'in_person'
                    ? <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    : <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                  {next.durationMinutes} min · {meetingLabel}
                  {next.location ? ` · ${next.location}` : ''}
                </span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => {
                    if (!window.confirm('Cancel this conversation? The other person will be notified through their calendar.')) return;
                    startCancel(async () => {
                      const r = await cancelConversation(mentorshipId, next.id);
                      setFlash(r.ok ? 'Conversation cancelled.' : r.error);
                    });
                  }}
                  className="text-[12.5px] text-halo-heather hover:text-halo-ink underline underline-offset-2 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {/*
            Honesty about the external event. "Scheduled" in Mentable and
            "the invitation actually moved" are different facts, and the
            second one can fail on its own.
          */}
          {next.syncStatus === 'stale' && (
            <p className="mt-3 inline-flex items-start gap-1.5 text-[12.5px] text-halo-heather">
              <AlertTriangle className="h-3.5 w-3.5 flex-none mt-0.5 text-amber-600" aria-hidden="true" />
              The calendar invitation still shows the old time.
            </p>
          )}
          {next.syncStatus === 'failed' && (
            <p className="mt-3 inline-flex items-start gap-1.5 text-[12.5px] text-halo-heather">
              <AlertTriangle className="h-3.5 w-3.5 flex-none mt-0.5 text-amber-600" aria-hidden="true" />
              Saved here, but the calendar invitation didn&rsquo;t go out.
            </p>
          )}

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
          {/*
            Opens in place. The old version linked to /schedule, which took
            you out of the relationship to a page that then asked you which
            relationship you meant.
          */}
          {partner && !readOnly ? (
            <button
              type="button"
              onClick={() => setPlanning(true)}
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Plan a conversation
              <ArrowRight className="h-4 w-4 arrow-slide group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          ) : (
            <Link
              href={planHref}
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Plan a conversation
              <ArrowRight className="h-4 w-4 arrow-slide group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </>
      )}
    </section>
  );
}
