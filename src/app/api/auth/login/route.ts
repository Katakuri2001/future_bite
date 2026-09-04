import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    // In production: validate against database, create session
    // For now, return mock response

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: "user-001",
          email,
          name: "Guest User",
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
