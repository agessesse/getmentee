import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Every first path segment under app/(protected)/ EXCEPT /people, which is
// public by design. These had drifted: /goals, /impact, /mentee, /mentees,
// /network and /opportunities were in the route group but missing here, so they
// served 200 to anonymous visitors instead of redirecting.
// scripts/check-protected-routes.ts fails the build if they diverge again.
// /mentee and /mentor are public marketing pages, but the protected route
// group also owns /mentee/[id] and /mentor/[id]. So those two segments are
// guarded BELOW the segment only: /mentee/<id> needs a session, /mentee itself
// does not. Verified that neither segment has a bare page under (protected),
// so opening them exposes nothing. Every other entry below is guarded at the
// segment and everything under it, unchanged.
const PROTECTED_SUBPATHS_ONLY = new Set(['/mentee', '/mentor']);

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
    PROTECTED_SUBPATHS_ONLY.has(p)
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
