import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const stats = await getAnalytics();
  return NextResponse.json({ success: true, data: stats });
}