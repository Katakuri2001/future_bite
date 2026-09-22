import { NextRequest, NextResponse } from "next/server";
import { listStaff, createStaff } from "@/lib/db";

export async function GET() {
  const data = await listStaff();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newStaff = await createStaff(body);
  return NextResponse.json({ success: true, data: newStaff });
}