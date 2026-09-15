import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Every first path segment under app/(protected)/. These had drifted: /goals,
// /impact, /mentee, /mentees, /network and /opportunities were in the route
// group but missing here, so they served 200 to anonymous visitors instead of
// redirecting. scripts/check-protected-routes.ts fails the build if they
// diverge again.
//
// /people was excluded as "public by design, linked from the marketing page".
// That stopped being true: the only links to it are in /discover, which is
// authenticated. Meanwhile the route is prerendered, so anonymous HTTP got a
// 200 carrying each person's name, employer, bio excerpt, headshot and
// LinkedIn URL in <title>, <meta> and the flight payload, while a browser was
// bounced to /login by the client-side layout guard. Twelve of the eighteen
// were students, who are not public marketing content at all. A client-side
// redirect is not access control; this is.
// /mentee and /mentor are the two public marketing pages, but the route group
// also owns /mentee/[id] and /mentor/[id], which are private. So these two
// segments are protected BELOW the segment only: /mentee/<id> needs a session,
// /mentee itself does not. Everything else in PROTECTED_PATHS is protected at
// the segment and below.
const PROTECTED_SUBPATHS_ONLY = ['/mentee', '/mentor'];

const PROTECTED_PATHS = [
  '/analytics',
  '/dashboard',
  '/discover',
  '/goals',
  '/impact',
  '/mentee',
  '/mentees',
  '/mentor',
  '/mentorships',
  '/messages',
  '/network',
  '/opportunities',
  '/people',
  '/profile',
  '/requests',
  '/schedule',
  '/sessions',
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Decide whether this path needs a session BEFORE building the client and
  // calling the auth server. getClaims() previously ran on every request, so
  // the marketing page and /people/* each paid for a round trip whose result
  // was then discarded.
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) =>
    PROTECTED_SUBPATHS_ONLY.includes(p)
      ? pathname.startsWith(p + '/')
      : pathname === p || pathname.startsWith(p + '/')
  );

  if (!isProtected) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims?.sub;

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
