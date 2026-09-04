import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const sessions: Record<string, any> = {};

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const token = randomUUID().replace(/-/g, "");
  const userId = `user-${randomUUID().slice(0, 8)}`;
  const name = email.split("@")[0];

  sessions[token] = { userId, email, name, role: "admin", createdAt: new Date().toISOString() };

  const res = NextResponse.json({
    success: true,
    data: {
      user: { id: userId, email, name: name.charAt(0).toUpperCase() + name.slice(1), role: "admin" },
      token,
    },
  });

  res.cookies.set("token", token, { httpOnly: true, maxAge: 60 * 60 * 24, path: "/" });
  return res;
}
