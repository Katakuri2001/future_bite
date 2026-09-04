import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "All fields required" },
        { status: 400 }
      );
    }

    // In production: create user in database, hash password
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: `user-${Date.now()}`,
          email,
          name,
          role: "customer",
        },
        token: "mock-jwt-token",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
