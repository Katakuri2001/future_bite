/**
 * The session decision the route guard makes, separated from Next's request and
 * response objects so the fail-open regression cannot come back silently.
 *
 * `proxy.ts` previously caught its session-lookup error and returned
 * `NextResponse.next()`, which rendered every staff page to an unauthenticated
 * visitor whenever KV or D1 was unhappy. An outage must not become an open door:
 * when the guard cannot confirm a session, it denies.
 */

export interface GateInput {
  pathname: string;
  /** A token was presented on the request. */
  hasToken: boolean;
  /** The session the lookup resolved to, if any. */
  session: unknown | null;
  /** The lookup threw — an outage, or a malformed token. */
  lookupFailed: boolean;
}

export type GateDecision =
  | { action: "allow" }
  | { action: "deny"; redirect: string };

/** Prefixes the guard protects. Anything else is public. */
const GUARDED_PREFIXES = [
  "/admin",
  "/kitchen",
  "/pos",
  "/waiter",
  "/account",
  "/order",
  "/receipts",
];

/**
 * `/receipts` itself is staff-only, but `/receipts/[id]` is a guest's e-receipt
 * link and must stay reachable without a session — the id is the capability.
 */
export function isGuardedPath(pathname: string): boolean {
  if (/^\/receipts\/[^/]+$/.test(pathname)) return false;
  return GUARDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function decideSessionGate(input: GateInput): GateDecision {
  if (!isGuardedPath(input.pathname)) {
    return { action: "allow" };
  }

  // Fail closed. An unresolved session is treated as no session, whether the
  // cause was a missing token, an expired one, or an outage mid-lookup.
  if (input.lookupFailed || !input.hasToken || !input.session) {
    return { action: "deny", redirect: "/login" };
  }

  return { action: "allow" };
}