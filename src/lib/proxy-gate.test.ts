import { describe, it, expect } from "vitest";
import { decideSessionGate } from "./proxy-gate";

/**
 * `proxy.ts` gates every staff page. When its session lookup threw — a KV/D1
 * outage, or a malformed token — it returned `NextResponse.next()`, rendering
 * `/admin`, `/pos`, `/kitchen`, `/waiter` and `/account` to an unauthenticated
 * visitor. A guard that admits when it cannot decide is not a guard.
 *
 * These tests pin the decision table separately from Next's request/response
 * objects so it can be exercised without a runtime.
 */

describe("decideSessionGate", () => {
  it("allows a page through when the user has a valid session", () => {
    expect(
      decideSessionGate({ pathname: "/admin", hasToken: true, session: { id: "s1" }, lookupFailed: false })
    ).toEqual({ action: "allow" });
  });

  it("denies a staff page when there is no token at all", () => {
    expect(
      decideSessionGate({ pathname: "/admin", hasToken: false, session: null, lookupFailed: false })
    ).toEqual({ action: "deny", redirect: "/login" });
  });

  it("denies a staff page when the token is present but no session matches", () => {
    expect(
      decideSessionGate({ pathname: "/pos", hasToken: true, session: null, lookupFailed: false })
    ).toEqual({ action: "deny", redirect: "/login" });
  });

  it("FAILS CLOSED when the session lookup throws", () => {
    // This is the regression: an outage must not become an open door.
    expect(
      decideSessionGate({ pathname: "/admin", hasToken: true, session: null, lookupFailed: true })
    ).toEqual({ action: "deny", redirect: "/login" });
  });

  it("lets public pages through regardless of session state", () => {
    expect(
      decideSessionGate({ pathname: "/menu", hasToken: false, session: null, lookupFailed: true })
    ).toEqual({ action: "allow" });
  });

  it("still lets a valid session through public pages", () => {
    expect(
      decideSessionGate({ pathname: "/", hasToken: true, session: { id: "s1" }, lookupFailed: false })
    ).toEqual({ action: "allow" });
  });
});