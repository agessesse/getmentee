/**
 * The request path, forwarded from middleware to server components.
 *
 * A Next.js layout is not given the pathname. It does not need it for
 * rendering, which is the right default, but the protected layout has one
 * genuine use for it: the "finish your profile" gate has to redirect from
 * every authenticated route EXCEPT the setup page itself, and without
 * knowing where it is that rule cannot be expressed.
 *
 * Middleware already computes the path on every request, so it sets this
 * header on the forwarded request and the layout reads it back.
 *
 * ITS OWN MODULE, holding one string and no imports, because middleware runs
 * on the edge runtime and must not pull in next/headers, while the layout
 * must. Sharing a constant is the only coupling either side needs.
 *
 * NOT A SECURITY INPUT. It is set by our own middleware on the internal
 * request, but a header is a header: it decides which of two presentational
 * redirects runs and nothing else. Every access decision is made from the
 * session and from the database.
 */
export const PATH_HEADER = 'x-mentable-path';
