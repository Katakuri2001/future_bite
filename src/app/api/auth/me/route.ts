import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { findUserById, sanitizeUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const user = await findUserById(auth.session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      success: true,
      data: { user: sanitizeUser(user) },
    });
  } catch (e) {
    console.error("auth/me error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load your session" },
      { status: 500 }
    );
  }
}