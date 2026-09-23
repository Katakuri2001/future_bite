import { NextRequest, NextResponse } from "next/server";
import { listStaff, createStaff } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const data = await listStaff();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const newStaff = await createStaff(body);
  return NextResponse.json({ success: true, data: newStaff });
}