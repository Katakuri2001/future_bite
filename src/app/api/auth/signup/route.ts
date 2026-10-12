import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  createSession,
  sanitizeUser,
} from "@/lib/db";
import {
  sessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-security";
import { enforceAuthRateLimit } from "@/lib/auth-throttle";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  // Signup is an unauthenticated write plus a full PBKDF2, so it is throttled
  // exactly like login.
  const limited = await enforceAuthRateLimit(request, null);
  if (limited) return limited;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const email = body?.email;
  const password = body?.password;
  const name = body?.name;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase();

  const perAccount = await enforceAuthRateLimit(request, normalizedEmail);
  if (perAccount) return perAccount;

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const displayName = (name || normalizedEmail.split("@")[0])
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const user = await createUser({
    email: normalizedEmail,
    password: String(password),
    name: displayName,
    role: "customer",
    phone: "+95 9 000 000 000",
  });

  const token = await createSession(user);

  const res = NextResponse.json({
    success: true,
    data: { user: sanitizeUser(user), token },
  });
  res.cookies.set("token", token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));
  return res;
}