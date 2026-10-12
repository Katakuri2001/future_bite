import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  verifyPassword,
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
  // A cross-site POST must never be able to drive a state change here.
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  // Throttle before any PBKDF2 work: each attempt costs 100,000 iterations, so
  // an unthrottled endpoint is a CPU amplifier as well as a guessing tool.
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

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  // The account itself is budgeted too, so rotating IPs cannot grind one guest.
  const perAccount = await enforceAuthRateLimit(request, String(email));
  if (perAccount) return perAccount;

  const user = await findUserByEmail(String(email));

  if (!user || !(await verifyPassword(String(password), user.password_hash))) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = await createSession(user);

  const res = NextResponse.json({
    success: true,
    data: { user: sanitizeUser(user), token },
  });
  res.cookies.set("token", token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));
  return res;
}