import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db";

export async function GET() {
  const stats = await getAnalytics();
  return NextResponse.json({ success: true, data: stats });
}