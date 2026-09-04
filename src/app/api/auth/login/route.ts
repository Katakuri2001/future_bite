import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, generateToken, sanitizeUser } from "@/lib/mock-db";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const db = await readDB();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user || user.password !== password) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

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