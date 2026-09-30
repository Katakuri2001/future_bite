import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession, type SessionRecord, type UserRole } from "@/lib/db";

/**
 * Extract the session token from a request.
 * Priority: `token` cookie (set by login) → `Authorization: Bearer …` → `x-auth-token` header.
 */
export function getToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("token")?.value;
  if (cookie) return cookie;
  const auth = request.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7);
  return request.headers.get("x-auth-token");
}

export type AuthResult = { session: SessionRecord } | NextResponse;

const UNAUTHORIZED = () =>
  NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
const FORBIDDEN = () =>
  NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });

/**
 * Require a valid session (and optionally a role from `roles`).
 * Returns `{ session }` on success, or a 401/403 NextResponse to return from the route handler.
 *
 * Usage:
 *   const auth = await requireAuth(request, ["admin", "manager"]);
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(
  request: NextRequest,
  roles?: UserRole[]
): Promise<AuthResult> {
  const token = getToken(request);
  if (!token) return UNAUTHORIZED();

  let session: SessionRecord | null = null;
  try {
    session = await getSession(token);
  } catch {
    return UNAUTHORIZED();
  }
  if (!session) return UNAUTHORIZED();

  if (roles && roles.length > 0 && !roles.includes(session.role as UserRole)) {
    return FORBIDDEN();
  }
  return { session };
}

/** Any valid session (e.g. customers placing an order). */
export async function requireSession(
  request: NextRequest
): Promise<AuthResult> {
  return requireAuth(request);
}

/** Admin dashboard APIs — admins and managers. */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthResult> {
  return requireAuth(request, ["admin", "manager"]);
}

/** Kitchen APIs — kitchen staff plus admins and managers. */
export async function requireKitchen(
  request: NextRequest
): Promise<AuthResult> {
  return requireAuth(request, ["kitchen", "admin", "manager"]);
}

/** Menu management — admins, managers and kitchen (kitchen can add dishes). */
export async function requireMenuAccess(
  request: NextRequest
): Promise<AuthResult> {
  return requireAuth(request, ["admin", "manager", "kitchen"]);
}

/** POS cashier desk — cashiers plus floor staff and managers/admins. */
export async function requirePOS(
  request: NextRequest
): Promise<AuthResult> {
  return requireAuth(request, ["cashier", "admin", "manager", "waiter", "host"]);
}

/** Cashier-only actions (e.g. closing shift reports). */
export async function requireCashier(
  request: NextRequest
): Promise<AuthResult> {
  return requireAuth(request, ["cashier"]);
}

/** Staff-level data (e.g. order listing) — all staff roles except customers. */
export async function requireStaff(
  request: NextRequest
): Promise<AuthResult> {
  return requireAuth(request, [
    "admin",
    "manager",
    "kitchen",
    "waiter",
    "host",
    "cashier",
  ]);
}