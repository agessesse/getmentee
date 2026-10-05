import Link from 'next/link';
import Section, { Empty } from '@/components/workspace/Section';
import type { Conversation, TimelineEvent } from '@/lib/mentorship/workspace-data';

/**
 * "Conversations", never "Sessions".
 *
 * A session is a database row. A conversation is a thing two people had. The
 * list shows the date, which number it was, what it was about, and what came
 * out of it, which is the shape a person actually remembers a relationship
 * in. Raw fields -- duration_minutes, session_type, status -- are not
 * surfaced; they exist to run the product, not to be read.
 */
export default function Conversations({
  conversations,
  hasUpcoming,
}: {
  conversations: Conversation[];
  hasUpcoming: boolean;
}) {
  return (
    <Section title="Conversations">
      {conversations.length === 0 ? (
        <Empty line="Your first conversation is where this starts. Come in with something specific you want to understand.">
          {!hasUpcoming && (
            <Link
              href="/schedule"
              className="text-[13.5px] font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
            >
              Plan your first conversation
            </Link>
          )}
        </Empty>
      ) : (
        <ol className="space-y-5">
          {conversations.map((c) => (
            <li key={c.id} className="flex gap-4">
              <div className="flex-none w-[52px] pt-0.5">
                <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.1em] text-halo-mist-body leading-tight">
                  {new Date(c.at).toLocaleDateString('en-US', { month: 'short' })}
                </p>
                <p className="font-display text-[1.1rem] leading-none text-halo-ink">
                  {new Date(c.at).getDate()}
                </p>
              </div>
              <div className="min-w-0 flex-1 pb-5 border-b border-halo-rule last:border-b-0 last:pb-0">
                <p className="text-[14.5px] font-medium text-halo-ink">
                  {c.ordinal === 1 ? 'First conversation' : `Conversation ${c.ordinal}`}
                  {c.status === 'scheduled' && (
                    <span className="ml-2 text-[11.5px] font-normal text-halo-mist-body">needs closing out</span>
                  )}
                </p>
                {(c.recap || c.notes) && (
                  <p className="text-[13.5px] text-halo-heather leading-relaxed mt-1">
                    {c.recap ?? c.notes}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {c.commitmentsCreated > 0 && (
                    <span className="text-[12.5px] text-halo-mist-body">
                      {c.commitmentsCreated} commitment{c.commitmentsCreated === 1 ? '' : 's'} created
                    </span>
                  )}
                  {/*
                    The existing session page is preserved and linked, not
                    replaced. Deep links people already hold keep working.
                  */}
                  <Link
                    href={`/sessions/${c.id}`}
                    className="text-[12.5px] font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
                  >
                    {c.recap ? 'View recap' : 'Open'}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

/**
 * The quiet history.
 *
 * DERIVED ENTIRELY FROM TIMESTAMPS THAT ALREADY EXIST. No events table, no
 * schema, no write path: started_at, goal created_at and completed_at,
 * session scheduled_at, action item completed_at. The brief said not to
 * invent infrastructure for a pretty timeline, and nothing here is invented.
 *
 * It renders only when there is a story to tell. Two entries is not a story,
 * it is the header repeated, so below four events the section is omitted
 * entirely rather than shown half-empty.
 */
export function History({ events }: { events: TimelineEvent[] }) {
  if (events.length < 4) return null;

  return (
    <Section title="How this has gone">
      <ol className="space-y-0">
        {events.map((e, i) => (
          <li key={`${e.at}-${i}`} className="flex gap-4 group">
            <div className="flex-none w-[46px] pt-[3px]">
              <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.1em] text-halo-mist-body">
                {new Date(e.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            {/* A hairline spine, not a row of dots and connectors. */}
            <div className="flex-none w-px bg-halo-rule relative">
              <span className="absolute -left-[3px] top-[7px] h-[7px] w-[7px] rounded-full bg-halo-brand-line" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 pb-5 pl-1">
              <p className="text-[13.5px] text-halo-ink leading-snug">{e.label}</p>
              {e.detail && <p className="text-[12.5px] text-halo-mist-body mt-0.5">{e.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
