import 'server-only';

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getServiceRoleKey } from '@/lib/supabase/service-key';

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
  const key = getServiceRoleKey();
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

  /*
    THE FLAG IS READ WITH THE SERVICE ROLE, and it has to be.

    This used to do a first pass through the caller's own client, on the
    assumption that "RLS lets a user read their own profile row". It does
    let them read the ROW -- but migration 0015 revoked the column-level
    SELECT grant on profiles.is_admin, and PostgREST answers a query that
    touches an ungranted column with "permission denied for table profiles"
    rather than returning the row without that field.

    So the first pass returned null for everybody, every admin was refused,
    and the whole /admin surface was unreachable in production. Verified
    against the live database: select('id, first_name') succeeds for the
    same user and session, select('is_admin') does not.

    The security property is unchanged. The user id still comes from
    getUser(), which verifies the session against the auth server rather
    than trusting a cookie, and is_admin is still read server-side from the
    source of truth. What is lost is only the ability to refuse a non-admin
    before discovering the service key is missing, and that case is still
    handled: no key means 'misconfigured', which renders a notice and grants
    nothing.
  */
  const db = serviceClient();
  if (!db) return { ok: false, reason: 'misconfigured' };
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

/**
 * Like `rows`, but distinguishes "the query failed" from "there is nothing".
 *
 * The plain `rows` helper returns [] for both, which let the admin Reports
 * page render "No reports filed" while user_reports was in fact unreachable.
 * A confidently wrong zero is worse than an error, so anything whose count
 * drives a decision should use this and show the failure.
 */
export async function rowsOrError<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>
): Promise<{ ok: true; data: T[] } | { ok: false; message: string }> {
  const { data, error } = await query;
  if (error) {
    const e = error as { message?: string; code?: string };
    return { ok: false, message: e.code ? `${e.code}: ${e.message ?? 'query failed'}` : (e.message ?? 'query failed') };
  }
  return { ok: true, data: (data ?? []) as T[] };
}

/**
 * Exact row count, or null when the table cannot be read. Callers must render
 * null as unavailable rather than zero.
 *
 * Note: PostgREST does not surface a missing-table error on a head:true count,
 * it returns a null count with no error, so both signals are treated as
 * unavailable here.
 */
export async function countOrNull(
  db: AdminDB,
  table: string,
  opts: { eq?: Record<string, string>; since?: string } = {}
): Promise<number | null> {
  let q = db.from(table).select('*', { count: 'exact', head: true });
  for (const [col, val] of Object.entries(opts.eq ?? {})) q = q.eq(col, val);
  if (opts.since) q = q.gte('created_at', opts.since);
  const { count, error } = await q;
  if (error || count === null || count === undefined) return null;
  return count;
}

/** Single-row variant of `rows`. */
export async function row<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>
): Promise<T | null> {
  const { data, error } = await query;
  if (error || !data) return null;
  return data as T;
}
