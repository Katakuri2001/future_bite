import { NextRequest, NextResponse } from "next/server";

// Mock login - same endpoint as signup but returns token for existing or new user
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const name = email.split("@")[0];
  const userId = `user-${Date.now()}`;
  const token = `mock-jwt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: userId,
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role: "customer",
        phone: "+95 9 000 000 000",
      },
      token,
    },
  });
}
