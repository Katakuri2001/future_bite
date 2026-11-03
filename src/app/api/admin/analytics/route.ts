import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const stats = await getAnalytics();
    return NextResponse.json({ success: true, data: stats });
  } catch (e) {
    console.error("admin/analytics error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load analytics" },
      { status: 500 }
    );
  }
}