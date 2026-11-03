import { NextRequest, NextResponse } from "next/server";
import { listStaff, createStaff } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const data = await listStaff();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("admin/staff GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const newStaff = await createStaff(body);
    return NextResponse.json({ success: true, data: newStaff });
  } catch (e) {
    console.error("admin/staff POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not create that staff member" },
      { status: 400 }
    );
  }
}