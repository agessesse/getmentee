import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─────────────────────────────────────────────────────────────────────────────
// Route-handler auth guard.
//
// Middleware only redirects the paths listed in PROTECTED_PATHS, and a redirect
// is the wrong response for a fetch() caller anyway — clients here expect JSON.
// So route handlers assert their own session, the same way
// app/api/account/delete/route.ts already does.
//
// Usage:
//   const auth = await requireUser();
//   if (!auth.ok) return auth.response;
//   // auth.user is available from here
// ─────────────────────────────────────────────────────────────────────────────

type RequireUserResult =
  | { ok: true; user: { id: string } }
  | { ok: false; response: NextResponse };

export async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }),
    };
  }

  return { ok: true, user: { id: user.id } };
}
