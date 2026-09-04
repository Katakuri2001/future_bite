import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, generateToken, sanitizeUser } from "@/lib/mock-db";

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase();

  const db = await readDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const user = {
    id: `user-${generateToken().slice(0, 8)}`,
    email: normalizedEmail,
    name: (name || normalizedEmail.split("@")[0])
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    role: "customer" as const,
    password: String(password),
    phone: "+95 9 000 000 000",
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  const token = generateToken();
  db.sessions[token] = user.id;
  await writeDB(db);

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