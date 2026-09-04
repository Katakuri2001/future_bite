import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/mock-db";

export async function GET() {
  const db = await readDB();
  const reservations = Object.values(db.reservations).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ success: true, data: reservations });
}

export async function POST(request: NextRequest) {
  const db = await readDB();
  const body = await request.json();
  const { confirmationCode, customerName, date, time, partySize } = body;
  const id = `res-${Date.now()}`;
  const reservation = {
    id,
    confirmationCode:
      confirmationCode ||
      `FB-${new Date().getFullYear()}-${String(db.resCounter++).padStart(4, "0")}`,
    customerName,
    customerEmail: body.customerEmail || "",
    customerPhone: body.customerPhone || "",
    date,
    time,
    partySize,
    tableNumber: body.tableNumber || 1,
    experience: body.experience || "main",
    specialRequests: body.specialRequests || "",
    status: body.status || "pending",
    createdAt: new Date().toISOString(),
  };
  db.reservations[id] = reservation;
  return NextResponse.json({ success: true, data: reservation });
}