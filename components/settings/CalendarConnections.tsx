import Link from 'next/link';
import { Check, CalendarDays } from 'lucide-react';
import type { Provider } from '@/lib/calendar/config';
import type { ConnectionSummary } from '@/lib/calendar/connections';

/**
 * Connect a calendar once, use it everywhere.
 *
 * ACCOUNT LEVEL, NOT PER MENTORSHIP, which matters most for a mentor with
 * six mentees: they authorise Google once and every relationship can
 * schedule. Nothing about calendar setup appears in the mentorship
 * workspace, where it would be clutter in the middle of a relationship.
 *
 * WHAT IS NOT RENDERED WHEN THERE ARE NO CREDENTIALS. If this deployment has
 * no OAuth client for a provider, its row does not appear as a button that
 * cannot work. A placeholder that looks connected is worse than an honest
 * absence, and a dead "Connect" button is the same lie one click later.
 */
export default function CalendarConnections({
  configured,
  connections,
}: {
  /** Providers this deployment actually has OAuth credentials for. */
  configured: Provider[];
  connections: ConnectionSummary[];
}) {
  const byProvider = new Map(connections.map((c) => [c.provider, c]));
  const bothConnected = connections.length > 1;

  const LABEL: Record<Provider, string> = {
    google: 'Google Calendar',
    microsoft: 'Microsoft Outlook',
  };

  return (
    <section id="calendar" className="scroll-mt-24">
      <h2 className="font-display text-[1.25rem] leading-tight text-halo-ink">Calendar</h2>
      <p className="text-[14px] text-halo-heather leading-relaxed mt-1 mb-5 max-w-md">
        Connect once and you can plan conversations from inside any mentorship, with a
        real invitation and a meeting link.
      </p>

      {configured.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-halo-rule px-5 py-5">
          <p className="text-[14px] text-halo-heather leading-relaxed max-w-md">
            Calendar connections aren&rsquo;t available on this deployment yet. You can
            still plan conversations in Mentable, including in person, and the time will
            show up for both of you.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {configured.map((p) => {
            const conn = byProvider.get(p);
            return (
              <li
                key={p}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-halo-rule px-4 py-3.5"
              >
                <CalendarDays className="h-4 w-4 flex-none text-halo-mist-strong" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium text-halo-ink">{LABEL[p]}</span>
                  {conn ? (
                    <span className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-halo-mist-body mt-0.5">
                      <span className="inline-flex items-center gap-1 text-halo-brand-text font-medium">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Connected
                      </span>
                      {/*
                        The address that was actually authorised, which is
                        routinely not the Mentable login. Without it, "which
                        calendar are my events going into" is unanswerable.
                      */}
                      {conn.accountEmail && <span className="truncate">{conn.accountEmail}</span>}
                      {bothConnected && conn.isPreferred && <span>· default</span>}
                    </span>
                  ) : (
                    <span className="block text-[12.5px] text-halo-mist-body mt-0.5">Not connected</span>
                  )}
                </span>

                <span className="flex items-center gap-3">
                  {bothConnected && conn && !conn.isPreferred && (
                    <form action={`/api/calendar/prefer?provider=${p}`} method="post">
                      <button
                        type="submit"
                        className="text-[12.5px] font-medium text-halo-brand-text hover:text-halo-ink transition-colors"
                      >
                        Make default
                      </button>
                    </form>
                  )}
                  {conn ? (
                    <form action={`/api/calendar/disconnect?provider=${p}`} method="post">
                      <button
                        type="submit"
                        className="text-[12.5px] font-medium text-halo-heather hover:text-halo-ink transition-colors"
                      >
                        Disconnect
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/api/calendar/${p}/connect`}
                      className="rounded-xl border border-halo-rule px-3 py-1.5 text-[13px] font-medium text-halo-ink hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
                    >
                      Connect
                    </Link>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {bothConnected && (
        <p className="text-[12.5px] text-halo-mist-body mt-3 max-w-md leading-relaxed">
          New conversations are created in your default calendar. The person you invite
          doesn&rsquo;t need to connect anything.
        </p>
      )}
    </section>
  );
}
