import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession, type SessionRecord } from "@/lib/db";
import { decideSessionGate, isGuardedPath } from "@/lib/proxy-gate";

const ADMIN_ROLES = ["admin", "manager"];
const KITCHEN_ACCESS_ROLES = ["kitchen", "admin", "manager"];
const POS_ACCESS_ROLES = ["cashier", "admin", "manager", "waiter", "host"];
/** Customer-owned areas. Any signed-in role may read these. */
const CUSTOMER_ROLES = ["customer", "waiter", "host"];
const WAITER_ROLES = ["waiter", "admin", "manager"];
const RECEIPTS_ACCESS_ROLES = ["admin", "manager", "cashier"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname ?? "/";

  // `isGuardedPath` is the single source of truth for which areas are
  // protected. It used to be an inline list of `startsWith` checks that missed
  // `/receipts`, which is guarded here but whose matcher entry had no effect
  // because this function returned early before reaching any session check.
  if (!isGuardedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  let session: SessionRecord | null = null;
  let lookupFailed = false;
  try {
    // A missing token is handled by the gate below; there is nothing to look up.
    session = token ? await getSession(token) : null;
  } catch {
    // Fail CLOSED. This used to `return NextResponse.next()`, which meant a KV
    // or D1 outage — or a malformed token that made the lookup throw — rendered
    // every staff page to an anonymous visitor. The API handlers do still
    // enforce their own authz, so this leaked UI rather than data, but a guard
    // that admits when it cannot decide is not a guard.
    lookupFailed = true;
  }

  const decision = decideSessionGate({
    pathname,
    hasToken: Boolean(token),
    session,
    lookupFailed,
  });
  if (decision.action === "deny") {
    return NextResponse.redirect(new URL(decision.redirect, request.url));
  }
  // `decideSessionGate` only allows through when a session resolved; the cast
  // records that contract, which TypeScript cannot infer across the boundary.
  const activeSession = session as SessionRecord;

  const role = activeSession.role;
  const isAdminPage = pathname.startsWith("/admin");
  const isKitchenPage = pathname.startsWith("/kitchen");
  const isPOSPage = pathname.startsWith("/pos");
  const isAccountPage = pathname.startsWith("/account");
  const isOrderPage = pathname.startsWith("/order");
  const isWaiterPage = pathname.startsWith("/waiter");
  const isReceiptsPage = pathname.startsWith("/receipts");

  if (isAdminPage && !ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isKitchenPage && !KITCHEN_ACCESS_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPOSPage && !POS_ACCESS_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // The receipt register is for owners, managers and cashiers.
  if (isReceiptsPage && !RECEIPTS_ACCESS_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Staff use the POS/admin desks, not the customer account portal. A waiter
  // has their own station, so they are sent there rather than bounced.
  if ((isAccountPage || isOrderPage) && !CUSTOMER_ROLES.includes(role)) {
    const fallback =
      role === "kitchen"
        ? "/kitchen"
        : role === "waiter" || role === "host"
        ? "/waiter"
        : "/admin";
    return NextResponse.redirect(new URL(fallback, request.url));
  }
  if (isWaiterPage && !WAITER_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/kitchen/:path*",
    "/pos/:path*",
    "/waiter/:path*",
    "/account/:path*",
    "/order/:path*",
    // The receipt register was previously reachable without a session and
    // relied on a client-side role check alone. Guarding it here as well is
    // defence in depth; `/receipts/[id]` stays public so a guest can open
    // their own e-receipt link.
    "/receipts/:path*",
  ],
};