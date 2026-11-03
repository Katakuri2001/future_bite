import { NextRequest, NextResponse } from "next/server";
import { getReceipt } from "@/lib/db";

/**
 * Public, read-only E-receipt endpoint.
 * Receipt ids are unguessable UUIDs — the URL is shared with the customer
 * after checkout (mirrors how physical receipts are handed over in-store).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receipt = await getReceipt(id);
    if (!receipt) {
      return NextResponse.json(
        { success: false, error: "Receipt not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: receipt });
  } catch (e) {
    console.error("receipts/[id] error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load that receipt" },
      { status: 500 }
    );
  }
}