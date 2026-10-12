import { NextResponse } from "next/server";
import { isSameOrigin } from "./auth-security";

/**
 * CSRF guard for cookie-authenticated mutations.
 *
 * The session cookie now carries `sameSite: "lax"`, which already stops it
 * riding a cross-site form POST. This is the belt to that braces: any mutating
 * request that carries an Origin from another host is refused outright.
 *
 * A request with no Origin is allowed through — browsers always send one on a
 * cross-site POST, so its absence means a server-side fetch or a CLI, neither
 * of which can be a forged form submission.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (isSameOrigin(origin, host)) return null;

  return NextResponse.json(
    { success: false, error: "Cross-origin request rejected" },
    { status: 403 }
  );
}