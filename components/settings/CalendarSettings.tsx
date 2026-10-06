'use client';

import { useEffect, useState } from 'react';
import CalendarConnections from '@/components/settings/CalendarConnections';
import type { Provider } from '@/lib/calendar/config';
import type { ConnectionSummary } from '@/lib/calendar/connections';

/**
 * The calendar section of the profile page.
 *
 * A thin client wrapper that asks /api/calendar/status what is configured
 * and what is connected. It exists because the profile page is a large
 * existing client component and this pass is not restructuring it to add one
 * section; the endpoint returns summaries only and never a token.
 */
export default function CalendarSettings() {
  const [state, setState] = useState<{ configured: Provider[]; connections: ConnectionSummary[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/calendar/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setState(d); })
      .catch(() => { /* the section simply stays absent */ });
    return () => { cancelled = true; };
  }, []);

  // Render nothing until we know. A flash of "Not connected" for somebody
  // who is connected is a small lie that makes people click Connect twice.
  if (!state) return null;

  return (
    <div className="mt-8 bg-white rounded-2xl border border-halo-rule p-6">
      <CalendarConnections configured={state.configured} connections={state.connections} />
    </div>
  );
}
