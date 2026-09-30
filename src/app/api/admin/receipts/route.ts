import { NextRequest, NextResponse } from "next/server";
import { listReceipts } from "@/lib/db";
import { requireReceipts } from "@/lib/auth";

/** Receipt register — owners, managers and cashiers only. */
export async function GET(request: NextRequest) {
  const auth = await requireReceipts(request);
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const from = searchParams.get("from") || undefined;
  const data = await listReceipts({ limit, from });
  return NextResponse.json({ success: true, data });
}