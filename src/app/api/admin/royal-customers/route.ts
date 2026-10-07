import { NextRequest, NextResponse } from "next/server";
import { getRoyalCustomers } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const minSpend = searchParams.get("minSpend") ? Number(searchParams.get("minSpend")) : undefined;
  const minPoints = searchParams.get("minPoints") ? Number(searchParams.get("minPoints")) : undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const customers = await getRoyalCustomers({ minSpend, minPoints, search });
    return NextResponse.json({ success: true, data: customers });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to load royal customers" }, { status: 500 });
  }
}
