import { NextRequest, NextResponse } from "next/server";
import { listReservations, createReservation } from "@/lib/db";

export async function GET() {
  const data = await listReservations();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const reservation = await createReservation(body);
  return NextResponse.json({ success: true, data: reservation });
}