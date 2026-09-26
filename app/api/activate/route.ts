import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { resolveActivation, consumeActivation, profileFromApplication } from '@/lib/activation';

/**
 * POST /api/activate — exchange an activation token for a Mentable account.
 *
 * The only path to membership. /signup no longer creates accounts, so every
 * member arrives through an application we approved.
 *
 * WHAT THE CALLER CONTROLS. The token and a password. Nothing else. The email
 * comes off the token row, never the request body, so a valid link cannot be
 * used to create an account under a different address — which is the whole
 * reason the email is stored alongside the token rather than read back from a
 * form field.
 *
 * ORDER OF OPERATIONS, AND WHY. Create the auth user, write the profile
 * fields the application already answered, link the application to the user,
 * then burn the token. The token is consumed last so a failure halfway leaves
 * a link that still works rather than an applicant locked out with no account.
 * The reverse order would turn a transient database error into a support
 * request we cannot resolve without minting a new link by hand.
 */

const MIN_PASSWORD = 8;

export async function POST(req: NextRequest) {
  const serviceKey = getServiceRoleKey();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: 'Activation isn’t available right now. Please try again shortly.' },
      { status: 503 },
    );
  }

  let body: { token?: unknown; password?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'We couldn’t read that. Please try again.' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `Please choose a password of at least ${MIN_PASSWORD} characters.` },
      { status: 400 },
    );
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const resolved = await resolveActivation(admin, token);
  if ('problem' in resolved) {
    // The page already renders a specific explanation for each of these before
    // showing the form; this is the race where it changed underneath someone.
    const message =
      resolved.problem === 'already'
        ? 'This application already has an account. Try signing in instead.'
        : resolved.problem === 'used'
          ? 'This activation link has already been used. Try signing in instead.'
          : resolved.problem === 'expired'
            ? 'This activation link has expired. Reply to your approval email and we’ll send a new one.'
            : 'This activation link isn’t valid.';
    return NextResponse.json({ error: message, problem: resolved.problem }, { status: 400 });
  }

  const { data: app } = await admin
    .from('cohort_applications')
    .select('full_name, school, title, location, linkedin_url')
    .eq('id', resolved.applicationId)
    .maybeSingle();

  const fields = profileFromApplication({ ...(app ?? {}), full_name: resolved.fullName });

  /*
    email_confirm: the applicant proved they hold the address by following a
    link we sent to it, so a second confirmation email would be ceremony for
    something already established — and Supabase transactional email is not
    configured on this project, so that mail would never arrive.
  */
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: resolved.email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: fields.first_name,
      last_name: fields.last_name,
      role: resolved.role,
    },
  });

  if (createError || !created?.user) {
    const already = /already|registered|exists/i.test(createError?.message ?? '');
    console.error('[activate] createUser failed', createError?.message);
    return NextResponse.json(
      {
        error: already
          ? 'There is already an account for this email. Try signing in instead.'
          : 'We couldn’t finish setting up your account. Please try again in a moment.',
      },
      { status: already ? 409 : 500 },
    );
  }

  const userId = created.user.id;

  // handle_new_user() has already created the profile row from the metadata
  // above; this fills in what only the application knew.
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      headline: fields.headline,
      location: fields.location,
      linkedin_url: fields.linkedin_url,
      university: fields.university,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (profileError) console.error('[activate] profile enrich failed', profileError.message);

  const { error: linkError } = await admin
    .from('cohort_applications')
    .update({ user_id: userId, status: 'activated', updated_at: new Date().toISOString() })
    .eq('id', resolved.applicationId);
  if (linkError) console.error('[activate] application link failed', linkError.message);

  await consumeActivation(admin, token);

  // The client signs in with these; the server never holds a session for them.
  return NextResponse.json({ ok: true, email: resolved.email, role: resolved.role }, { status: 201 });
}
