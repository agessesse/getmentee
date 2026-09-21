/**
 * Which paths belong to the signed-in app, for presentation only.
 *
 * This is NOT an access-control list and nothing here guards anything: the
 * session check lives in lib/supabase/middleware.ts and the protected layout.
 * It exists so the branded page wipe knows when a click is travelling within
 * the app, which should wipe, versus leaving it, which should not.
 *
 * Mirrors PROTECTED_PATHS in the middleware, plus /admin. /mentee and /mentor
 * count only below the segment, because the bare paths are public marketing
 * pages and the app owns just /mentee/[id] and /mentor/[id].
 */
const APP_SEGMENTS = [
  '/admin',
  '/dashboard',
  '/discover',
  '/goals',
  '/guide',
  '/impact',
  '/learn',
  '/mentorships',
  '/messages',
  '/networking',
  '/opportunities',
  '/profile',
  '/requests',
  '/schedule',
  '/sessions',
];
const APP_SUBPATHS_ONLY = ['/mentee', '/mentor'];

export function isAppRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (APP_SEGMENTS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
  return APP_SUBPATHS_ONLY.some((p) => pathname.startsWith(p + '/'));
}
