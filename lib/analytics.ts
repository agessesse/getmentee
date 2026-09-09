import { createClient } from '@/lib/supabase/client';

export async function trackEvent(
  eventName: string,
  role: 'mentor' | 'mentee',
  options?: {
    entityId?: string;
    metadata?: Record<string, string | number | boolean>;
  }
): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('pilot_events').insert({
      user_id: session.user.id,
      role,
      event_name: eventName,
      entity_id: options?.entityId ?? null,
      metadata: options?.metadata ?? {},
    });
  } catch {
    // Analytics must never interrupt primary actions.
  }
}
