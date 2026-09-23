import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/service-key';
import { notifyAdmins } from '@/lib/notify';
import { CANONICAL_SITE } from '@/lib/site';

/**
 * POST /api/founding-cohort/apply
 *
 * The only writer to public.cohort_applications. The table grants nothing to
 * anon or authenticated and has RLS on with no policies, so a browser cannot
 * reach it directly; this route holds the service-role key and does the insert
 * on the applicant's behalf. That keeps a public write path out of the client
 * bundle and keeps other people's applications — names, emails, personal
 * answers — unreadable from the browser entirely.
 *
 * It validates rather than trusts: field lengths are checked here as well as
 * in the database, because the form is public and the constraint errors that
 * would otherwise surface are not written for people.
 */

const LIMITS = {
  full_name: 120,
  email: 320,
  school: 160,
  year: 40,
  essay: 2000,
} as const;

/*
  The three written answers, and which column each lands in.

  The form used to ask seven questions with six optional; it now asks three and
  requires all of them. The database columns keep their original names rather
  than being renamed by a migration, because renaming a column to match a
  question wording is a schema change in exchange for nothing. The mapping is
  recorded here so the two never drift apart silently.

    working_toward  ->  learning      what the student is working toward
    help_with       ->  why_mentor    what they want help thinking through
    already_done    ->  tried         what they have already done themselves

  thirty_min, good_use, field and worth_it are no longer collected. The columns
  remain, nullable and empty, so existing rows keep their answers.
*/
/*
  School and stage are required as well as the three answers. They are context
  for deciding what kind of mentorship would help, never selection criteria:
  nothing in review ranks a school, and the list below carries no prestige
  order. `year` is validated against a fixed list because the form offers a
  list; a value outside it means the request did not come from the form.
*/
const YEARS = [
  'First year',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate student',
  'Recent graduate',
  'Other',
] as const;

const ANSWERS = [
  { field: 'working_toward', column: 'learning', min: 80 },
  { field: 'help_with', column: 'why_mentor', min: 80 },
  { field: 'already_done', column: 'tried', min: 80 },
] as const;

type Body = Partial<Record<'full_name' | 'email' | 'school' | 'year' | (typeof ANSWERS)[number]['field'], unknown>>;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/*
  A small in-memory throttle. Not a security control — a process restart or a
  second instance clears it — but enough to stop one browser hammering submit,
  which is the realistic failure on launch day. Anything more would mean adding
  a dependency or a table for a problem we do not have yet.
*/
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;

function throttled(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5_000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const serviceKey = getServiceRoleKey();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    // Configuration problem, not the applicant's problem. Say so without
    // describing the server.
    return NextResponse.json(
      { error: 'Applications aren’t available right now. Please try again shortly.' },
      { status: 503 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'That’s a few submissions in a row. Give it a few minutes and try again.' },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'We couldn’t read that submission. Please try again.' }, { status: 400 });
  }

  const full_name = str(body.full_name);
  const email = str(body.email).toLowerCase();

  if (!full_name) return NextResponse.json({ error: 'Please add your name.' }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please add an email address we can reply to.' }, { status: 400 });
  }
  if (full_name.length > LIMITS.full_name || email.length > LIMITS.email) {
    return NextResponse.json({ error: 'That name or email is longer than we can store.' }, { status: 400 });
  }

  const school = str(body.school);
  const year = str(body.year);

  if (!school) {
    return NextResponse.json({ error: 'Please add where you study.' }, { status: 400 });
  }
  if (school.length > LIMITS.school) {
    return NextResponse.json({ error: 'That school name is longer than we can store.' }, { status: 400 });
  }
  if (!(YEARS as readonly string[]).includes(year)) {
    return NextResponse.json({ error: 'Please choose where you are right now.' }, { status: 400 });
  }

  const row: Record<string, string | null> = { full_name, email, school, year };

  // All three answers are required here as well as in the browser: the form is
  // public, and a client-side check is a courtesy rather than a control.
  for (const a of ANSWERS) {
    const value = str(body[a.field]);
    if (!value) {
      return NextResponse.json({ error: 'Please answer all three questions.' }, { status: 400 });
    }
    if (value.length < a.min) {
      return NextResponse.json(
        { error: 'Could you say a little more? A sentence or two for each answer is plenty.' },
        { status: 400 },
      );
    }
    if (value.length > LIMITS.essay) {
      return NextResponse.json({ error: 'One of your answers is longer than the form allows.' }, { status: 400 });
    }
    row[a.column] = value;
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.from('cohort_applications').insert(row);

  if (error) {
    /*
      23505 is the one-application-per-email index.

      The response is deliberately identical to a first-time success. Saying
      "you have already applied with this email" would turn this endpoint into
      an oracle: anyone could submit an address and learn from the answer
      whether that person had applied to Mentable, which is a fact about them
      that is not ours to disclose. A duplicate is logged for us and looks like
      a normal submission to whoever sent it.
    */
    if (error.code === '23505') {
      console.warn('[founding-cohort] duplicate application suppressed');
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    console.error('[founding-cohort] insert failed', error);
    return NextResponse.json(
      { error: 'We couldn’t save your application. Please try again in a moment.' },
      { status: 500 },
    );
  }

  /*
    Awaited, so a serverless instance cannot be frozen before the request goes
    out, but it can only ever resolve: notifyAdmins swallows its own failures.
    The message deliberately carries nothing about the applicant.
  */
  await notifyAdmins(
    'New founding cohort application. Review in Mentable Admin:',
    `${CANONICAL_SITE}/admin/applications`,
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
