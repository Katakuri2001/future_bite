import { NextRequest, NextResponse } from "next/server";
import { listReservations, createReservation } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const data = await listReservations();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("admin/reservations GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load reservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const reservation = await createReservation(body);
    return NextResponse.json({ success: true, data: reservation });
  } catch (e) {
    console.error("admin/reservations POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not create that reservation" },
      { status: 400 }
    );
  }
}