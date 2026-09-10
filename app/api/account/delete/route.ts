import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// DELETE /api/account/delete
// Permanently deletes the authenticated user's account and all data via ON DELETE CASCADE.
// Requires SUPABASE_SERVICE_ROLE_KEY (server-only, never exposed to client).
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* ignore in server component context */ }
        },
      },
    }
  );

  // 1. Authenticate first, so an unauthenticated caller learns nothing about
  //    server configuration or the confirmation protocol.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // 2. Require the confirmation the client already collects. The client
  //    prompts the user to type DELETE, but the server accepted a bare
  //    request, so that prompt was decorative. This is confirmation, not
  //    re-authentication — a password re-prompt would need new UI.
  let body: { confirm?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no/invalid body falls through to the check below
  }
  if (body.confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'Account deletion requires explicit confirmation.' },
      { status: 400 }
    );
  }

  // 3. Only then does the service-role key matter.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Account deletion is currently unavailable.' },
      { status: 503 }
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account]', deleteError);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
