import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession, type SessionRecord } from "@/lib/db";

const ADMIN_ROLES = ["admin", "manager"];
const KITCHEN_ACCESS_ROLES = ["kitchen", "admin", "manager"];
const POS_ACCESS_ROLES = ["cashier", "admin", "manager", "waiter", "host"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isKitchenPage = pathname.startsWith("/kitchen");
  const isPOSPage = pathname.startsWith("/pos");
  if (!isAdminPage && !isKitchenPage && !isPOSPage) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let session: SessionRecord | null = null;
  try {
    session = await getSession(token);
  } catch {
    // Bindings unavailable in this proxy environment — fall back to the
    // token-presence check. The API route handlers remain the authoritative
    // enforcement layer (they return 401/403 without a valid session).
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.role;
  if (isAdminPage && !ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isKitchenPage && !KITCHEN_ACCESS_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPOSPage && !POS_ACCESS_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*", "/pos/:path*"],
};