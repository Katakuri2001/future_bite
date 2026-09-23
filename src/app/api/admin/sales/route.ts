import { NextRequest, NextResponse } from "next/server";
import { getSalesReport, type SalesPeriod } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period");
  const period: SalesPeriod =
    periodParam === "weekly" || periodParam === "monthly"
      ? periodParam
      : "daily";
  const report = await getSalesReport(period);
  return NextResponse.json({ success: true, data: report });
}