import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  createSession,
  sanitizeUser,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase();

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
  res.cookies.set("token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}