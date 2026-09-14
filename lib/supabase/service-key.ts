import 'server-only';

/**
 * Resolves the Supabase service-role secret.
 *
 * The repo drifted into two names for the same secret:
 *   SUPABASE_SERVICE_KEY       used by scripts/seed-demo.ts, and the name
 *                              actually present in .env.local
 *   SUPABASE_SERVICE_ROLE_KEY  used by app/api/account/delete and the admin
 *                              dashboard
 *
 * Nothing read both, so whichever name an environment happened to define, the
 * other consumer silently degraded: locally the admin dashboard reported
 * itself unconfigured, and account deletion would answer 503 in any
 * environment that only defined the shorter name.
 *
 * Accepting both removes the failure mode without requiring a coordinated
 * environment change. SUPABASE_SERVICE_ROLE_KEY is canonical because it
 * matches Supabase's own dashboard label; the shorter name is a fallback.
 *
 * server-only: importing this from a client component is a build error, so the
 * secret cannot be pulled into a browser bundle.
 */
export function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
}
