import { NextRequest, NextResponse } from "next/server";
import { listTables, reservationsOn, createReservation } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const guests = parseInt(searchParams.get("guests") || "2");

  const tables = await listTables();
  const activeReservations = date ? await reservationsOn(date) : [];

  const availability = tables.map((t) => ({
    ...t,
    status: activeReservations.some((r) => r.tableNumber === Number(t.number))
      ? "reserved"
      : t.status,
  }));

  const available = availability.filter(
    (t) => t.status === "available" && t.capacity >= guests
  );

  return NextResponse.json({
    success: true,
    date,
    time,
    guests,
    availableTables: available,
    total: available.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    date,
    time,
    partySize,
    experience,
    customerName,
    customerEmail,
    customerPhone,
    name,
    email,
    phone,
    specialRequests,
    preferences,
    tableNumber,
  } = body;

  if (!date || !time || !partySize) {
    return NextResponse.json(
      { success: false, error: "Date, time and party size are required" },
      { status: 400 }
    );
  }

  let chosenTable = tableNumber;
  if (chosenTable === undefined) {
    const tables = await listTables();
    const candidates = tables
      .filter((t) => t.experience === (experience || "main"))
      .filter((t) => t.capacity >= partySize)
      .sort((a, b) => a.capacity - b.capacity);
    chosenTable = (candidates[0] || tables[0])?.number ?? 1;
  }

  const reservation = await createReservation({
    date,
    time,
    partySize,
    experience: experience || "main",
    customerName: customerName || name,
    customerEmail: customerEmail || email,
    customerPhone: customerPhone || phone,
    specialRequests,
    preferences,
    tableNumber: Number(chosenTable),
    status: "confirmed",
  });

  return NextResponse.json({ success: true, data: reservation });
}