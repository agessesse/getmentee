'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { notificationHref } from '@/lib/notifications';

/**
 * What changed while they were away.
 *
 * This is not a notification centre — the bell already is one. It is the first
 * line of the dashboard answering the question someone actually arrives with:
 * "did anything happen?" It reads only unread notification rows, which are
 * written by database triggers when something real occurs, so it cannot show
 * an event that did not happen.
 *
 * When nothing is unread the band renders nothing at all. A person with a
 * quiet week should see a quiet page, not an empty box explaining its own
 * emptiness.
 */

interface Row {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  data: Record<string, string> | null;
}

export default function SinceYouWereHere({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let live = true;
    const supabase = createClient();
    // Unread but ancient is not "since you were here": an unread row from
    // three weeks ago is a notification someone chose to ignore, and leading
    // the page with it makes the product look stuck. Two weeks is the window.
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
    supabase
      .from('notifications')
      .select('id, type, title, body, created_at, data')
      .eq('user_id', userId)
      .eq('is_read', false)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (!live) return;
        // One line per thing that changed. Five unread messages from the same
        // person is one piece of news, and repeating the sentence five times
        // reads like a bug.
        const seen = new Set<string>();
        const deduped: Row[] = [];
        for (const n of (data as Row[]) ?? []) {
          const key = `${n.type}:${n.data?.mentorship_id ?? n.data?.request_id ?? n.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(n);
          if (deduped.length === 4) break;
        }
        setRows(deduped);
      });
    return () => { live = false; };
  }, [userId]);

  if (!rows || rows.length === 0) return null;

  return (
    <section aria-labelledby="since-heading">
      <h2 id="since-heading" className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-2">
        Since you were here
      </h2>
      <ul className="bg-white rounded-2xl border border-halo-rule divide-y divide-halo-rule overflow-hidden">
        {rows.map((n) => (
          <li key={n.id}>
            <Link
              href={notificationHref(n.type, n.data ?? undefined)}
              className="flex items-baseline gap-3 px-4 sm:px-5 py-3 hover:bg-halo-veil/50 transition-colors focus-visible:outline-none focus-visible:bg-halo-veil"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-halo-purple flex-shrink-0 translate-y-[-1px]" aria-hidden="true" />
              <span className="flex-1 min-w-0 text-sm text-halo-ink leading-snug">
                {n.title}
                {n.body && <span className="text-halo-mist-body"> · {n.body}</span>}
              </span>
              <span className="text-xs text-halo-mist-body flex-shrink-0 whitespace-nowrap">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
