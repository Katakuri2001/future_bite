import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// In-memory "database" for mock API
const users: Record<string, any> = {};
const sessions: Record<string, any> = {};
const reservations: Record<string, any> = {};
const orders: Record<string, any> = {};

function generateToken(): string {
  return randomUUID().replace(/-/g, "");
}

function getAuthUser(request: NextRequest): { user: any; token: string } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const session = sessions[token];
  if (!session) return null;
  const user = users[session.userId];
  if (!user) return null;
  return { user, token };
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  // Check if user exists
  const existingUser = Object.values(users).find(
    (u) => u.email === email
  );

  if (existingUser) {
    // Login
    const token = generateToken();
    const existingUserId = existingUser.id;
    sessions[token] = { userId: existingUserId, createdAt: new Date().toISOString() };

    const res = NextResponse.json({
      success: true,
      data: { user: { id: existingUserId, email, name: existingUser.name, role: existingUser.role }, token },
    });
    res.cookies.set("token", token, { httpOnly: true, maxAge: 60 * 60 * 24, path: "/" });
    return res;
  }

  // Register (for demo, auto-create)
  const userId = `user-${randomUUID().slice(0, 8)}`;
  const name = email.split("@")[0];
  users[userId] = {
    id: userId,
    email,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    role: "customer",
    phone: "+95 9 000 000 000",
    createdAt: new Date().toISOString(),
  };

  const token = generateToken();
  sessions[token] = { userId, createdAt: new Date().toISOString() };

  const res = NextResponse.json({
    success: true,
    data: { user: users[userId], token },
  });
  res.cookies.set("token", token, { httpOnly: true, maxAge: 60 * 60 * 24, path: "/" });
  return res;
}
