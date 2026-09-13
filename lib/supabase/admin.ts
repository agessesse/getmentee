import 'server-only';

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Admin authorization and data access.
 *
 * Two separate concerns, deliberately not collapsed into one:
 *
 *   1. WHO is asking. Established from the verified session via getUser(),
 *      which validates the JWT against Supabase. getSession() only decodes
 *      the cookie and would trust a forged one.
 *
 *   2. WHAT they can read. Admin views need cross-user aggregates that RLS
 *      correctly denies to every authenticated role (pilot_events, for one,
 *      is scoped to auth.uid() = user_id). Migration 0015 anticipated this:
 *      "admin reads all via service-role API". So reads run through the
 *      service-role key, which is server-only and never reaches the browser.
 *
 * The service-role client is only ever handed out AFTER is_admin has been
 * confirmed, so the elevated key cannot be reached through a non-admin path.
 * is_admin itself is not user-writable: migration 0015 revokes table-level
 * UPDATE on profiles and re-grants a column allowlist that excludes it, so a
 * user cannot promote themselves.
 */

/** Untyped: no generated Database types in this project. Use `rows`/`row`. */
export type AdminDB = SupabaseClient;

export type AdminGate =
  | { ok: true; userId: string; db: AdminDB }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' | 'misconfigured' };

function serviceClient(): AdminDB | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolve the caller and, if they are an admin, return a service-role client.
 * Every admin page and route calls this itself rather than relying on the
 * layout, so a page can never render without its own check having run.
 */
export async function requireAdmin(): Promise<AdminGate> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  // First pass through the caller's own client. RLS lets a user read their own
  // profile row, and is_admin is not user-writable, so this is trustworthy and
  // it fails a non-admin closed even when the service key is absent. Without
  // this ordering a non-admin would see the misconfiguration notice instead of
  // being turned away.
  const { data: self } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!self?.is_admin) return { ok: false, reason: 'forbidden' };

  const db = serviceClient();
  if (!db) return { ok: false, reason: 'misconfigured' };

  // Second pass with service-role. The elevated client is only returned after
  // the flag is confirmed against the source of truth, so a stale or spoofed
  // client-side read cannot hand out cross-user access.
  const { data, error } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (error || !data?.is_admin) return { ok: false, reason: 'forbidden' };

  return { ok: true, userId: user.id, db };
}

/**
 * The service client is created without generated Database types, so
 * `.select()` infers `never[]`. Call sites declare the shape they asked for
 * and this narrows to it, keeping the assertion in one reviewed place.
 */
export async function rows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>
): Promise<T[]> {
  const { data, error } = await query;
  if (error || !data) return [];
  return data as T[];
}

/** Single-row variant of `rows`. */
export async function row<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>
): Promise<T | null> {
  const { data, error } = await query;
  if (error || !data) return null;
  return data as T;
}
