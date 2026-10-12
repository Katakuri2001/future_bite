/**
 * Session cookie hardening and CSRF origin checking.
 *
 * The app hands its session token to `localStorage` as well as the cookie, which
 * means the cookie is not the last line of defence it looks like. Giving it
 * `secure` and `sameSite` is the cheapest way to stop it being transmitted over
 * plaintext or attached to a cross-site form post, and the origin check below
 * backs that up for browsers that do send one.
 *
 * Pure functions, so the rules are testable without a request or a database.
 */

/** How long a session cookie and its server-side record stay valid. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: true,
    // `lax` blocks the cookie on cross-site POSTs, which is the CSRF vector
    // that matters. `strict` would also block it when a guest follows a link
    // in from an emailed receipt, costing a re-login for no security gain.
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Whether a mutating request came from this site.
 *
 * Returns false only when an Origin is present and belongs elsewhere. Browsers
 * send Origin on every cross-site POST, so an absent header means a non-browser
 * client (server-side fetch, curl) rather than a forged request.
 */
export function isSameOrigin(
  origin: string | null,
  host: string | null
): boolean {
  if (!origin) return true;
  if (!host) return false;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    // An unparseable Origin is not this site.
    return false;
  }

  return originHost.toLowerCase() === host.toLowerCase();
}

/** Origins are compared host-only, so this exposes just that comparison. */
export function requestHost(request: {
  headers: { get(name: string): string | null };
}): string | null {
  return request.headers.get("host");
}