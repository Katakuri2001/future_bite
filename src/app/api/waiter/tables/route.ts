import { NextRequest, NextResponse } from "next/server";
import { requireWaiter } from "@/lib/auth";
import { getWaiterTables } from "@/lib/waiter";

/** The floor: every table, its state and its running tab. */
export async function GET(request: NextRequest) {
  const auth = await requireWaiter(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const tables = await getWaiterTables();
    return NextResponse.json({ success: true, data: tables });
  } catch (e: any) {
    console.error("waiter/tables error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load the floor" },
      { status: 500 }
    );
  }
}