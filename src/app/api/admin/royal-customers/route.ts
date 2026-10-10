import { NextRequest, NextResponse } from "next/server";
import { getRoyalCustomers } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Customer emails and revenue are admin-only — never expose them publicly.
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const minSpend = searchParams.get("minSpend") ? Number(searchParams.get("minSpend")) : undefined;
  const minPoints = searchParams.get("minPoints") ? Number(searchParams.get("minPoints")) : undefined;
  const search = searchParams.get("search") || undefined;
  const tier = searchParams.get("tier") || undefined;

  try {
    const customers = await getRoyalCustomers({ minSpend, minPoints, search, tier });
    return NextResponse.json({ success: true, data: customers });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to load royal customers" }, { status: 500 });
  }
}
