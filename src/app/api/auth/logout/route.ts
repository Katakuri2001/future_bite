import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { deleteSession } from "@/lib/db";
import { sessionCookieOptions } from "@/lib/auth-security";

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (token) {
    try {
      await deleteSession(token);
    } catch {
      // Ignore — best effort; the cookie is still cleared below.
    }
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { ...sessionCookieOptions(0), httpOnly: true });
  return res;
}