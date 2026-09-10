/**
 * Fails the build if app/(protected)/ and PROTECTED_PATHS have drifted.
 *
 * This drift is what caused F6: /goals, /impact, /mentees, /network and
 * /opportunities were in the route group but missing from the middleware list,
 * so they served 200 to anonymous visitors instead of redirecting.
 *
 * Middleware runs in the Edge runtime and cannot read the filesystem, so the
 * list cannot be derived at request time. Checking it at build time gets the
 * same guarantee without codegen.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Public by design: prerendered and linked from the marketing page.
const INTENTIONALLY_PUBLIC = new Set(['people']);

const groupDir = join(process.cwd(), 'app', '(protected)');
const segments = readdirSync(groupDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('['))
  .map((e) => e.name)
  .filter((n) => !INTENTIONALLY_PUBLIC.has(n));

const middlewareSrc = readFileSync(
  join(process.cwd(), 'lib', 'supabase', 'middleware.ts'),
  'utf8'
);
const listMatch = middlewareSrc.match(/const PROTECTED_PATHS = \[([\s\S]*?)\];/);
if (!listMatch) {
  console.error('check-protected-routes: PROTECTED_PATHS not found in middleware');
  process.exit(1);
}
const declared = new Set(
  [...listMatch[1].matchAll(/'\/([^']+)'/g)].map((m) => m[1])
);

const missing = segments.filter((s) => !declared.has(s));
const stale = [...declared].filter(
  (d) => !segments.includes(d) && !INTENTIONALLY_PUBLIC.has(d)
);

if (missing.length || stale.length) {
  console.error('\ncheck-protected-routes FAILED\n');
  if (missing.length) {
    console.error(
      `  In app/(protected)/ but NOT guarded by middleware: ${missing
        .map((m) => '/' + m)
        .join(', ')}`
    );
    console.error('  These routes would serve 200 to anonymous visitors.\n');
  }
  if (stale.length) {
    console.error(
      `  Guarded by middleware but no longer a route: ${stale
        .map((s) => '/' + s)
        .join(', ')}\n`
    );
  }
  console.error('  Fix lib/supabase/middleware.ts, or add the segment to');
  console.error('  INTENTIONALLY_PUBLIC in this script if it is meant to be public.\n');
  process.exit(1);
}

console.log(
  `check-protected-routes: ok (${segments.length} guarded, ` +
    `${INTENTIONALLY_PUBLIC.size} intentionally public)`
);
