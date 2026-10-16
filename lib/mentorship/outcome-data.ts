import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { schemaCapabilities } from '@/lib/schema-capabilities';

/**
 * Whether to ask this viewer for an outcome, and about which conversation.
 *
 * Asked only about the FIRST completed conversation in a relationship.
 * Prompting after every call turns a relationship into something being
 * administered, and the marginal value of the fifth survey is close to
 * zero while its cost to the relationship is not.
 */
export interface PendingOutcome {
  sessionId: string;
}

export async function pendingOutcome(
  mentorshipId: string,
  viewerId: string,
): Promise<PendingOutcome | null> {
  const caps = await schemaCapabilities();
  if (!caps.relationshipOutcomes) return null;

  const supabase = await createClient();

  /*
    Earliest completed conversation, read through the caller's own client:
    sessions is RLS-scoped to the two participants, so a non-participant
    finds nothing here without a separate authorization step.
  */
  const { data: s } = await supabase
    .from('sessions')
    .select('id')
    .eq('mentorship_id', mentorshipId)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!s) return null;

  /*
    Has this viewer already answered? Service role, because the table has
    no SELECT policy by design — a policy wide enough to read your own row
    is one edit away from being wide enough to read your counterpart's.

    The query is pinned to viewerId, which the CALLER of this function
    resolved from the session, not from a URL. Nothing here can be pointed
    at another person's answer, and the only thing returned is whether a
    row exists.
  */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  const db = createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { count } = await db
    .from('relationship_outcomes')
    .select('id', { count: 'exact', head: true })
    .eq('mentorship_id', mentorshipId)
    .eq('respondent_id', viewerId)
    .eq('session_id', s.id);

  return (count ?? 0) > 0 ? null : { sessionId: s.id as string };
}
