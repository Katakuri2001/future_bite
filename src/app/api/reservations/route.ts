import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listTables, reservationsOn, createReservation } from "@/lib/db";

const reservationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  partySize: z.number().int().positive().max(20),
  experience: z.string().optional(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  preferences: z.array(z.string()).optional(),
  /** Preferred table. Accepts an id ("tbl-3") or a number (3). */
  tableId: z.union([z.string(), z.number()]).optional(),
  tableNumber: z.union([z.string(), z.number()]).optional(),
});

/** Resolve a caller-supplied table reference (id or number) to a table. */
async function resolveTable(ref: string | number | undefined) {
  if (ref === undefined || ref === "") return null;
  const tables = await listTables();
  const asNumber = Number(ref);
  if (Number.isFinite(asNumber)) {
    return tables.find((t) => Number(t.number) === asNumber) || null;
  }
  return tables.find((t) => t.id === String(ref)) || null;
}

/** First table that fits the party and is free for that slot. */
async function pickAvailableTable(
  partySize: number,
  experience: string,
  date: string,
  time: string
) {
  const tables = await listTables();
  const booked = await reservationsOn(date, time);
  const takenNumbers = new Set(booked.map((r) => Number(r.tableNumber)));

  const fits = (t: any) => t.capacity >= partySize;
  const free = (t: any) => !takenNumbers.has(Number(t.number));

  const preferred = tables
    .filter((t) => t.experience === experience)
    .filter(fits)
    .filter(free)
    // Smallest table that fits leaves larger ones free for bigger parties.
    .sort((a: any, b: any) => a.capacity - b.capacity);

  return preferred[0] || tables.filter(fits).filter(free)[0] || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const time = searchParams.get("time") || undefined;
  const guests = parseInt(searchParams.get("guests") || "2");

  const tables = await listTables();
  const activeReservations = date ? await reservationsOn(date, time) : [];
  const takenNumbers = new Set(activeReservations.map((r) => Number(r.tableNumber)));

  const availability = tables.map((t) => ({
    ...t,
    status: takenNumbers.has(Number(t.number)) ? "reserved" : t.status,
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid reservation details",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const {
    date,
    time,
    partySize,
    experience = "main",
    specialRequests,
    preferences,
    tableId,
    tableNumber,
  } = parsed.data;
  const customerName = parsed.data.customerName || parsed.data.name;
  const customerEmail = parsed.data.customerEmail || parsed.data.email;
  const customerPhone = parsed.data.customerPhone || parsed.data.phone;

  // Honour a guest's table choice when it exists and still fits the party.
  let chosen = await resolveTable(tableNumber ?? tableId);
  if (chosen && (chosen.capacity < partySize || chosen.experience !== experience)) {
    chosen = null;
  }

  // Double-booking prevention: if the requested table is taken for this slot,
  // fall back to any other table that fits rather than silently double-booking.
  const alreadyBooked = chosen
    ? (await reservationsOn(date, time)).some(
        (r) => Number(r.tableNumber) === Number(chosen!.number)
      )
    : false;

  if (!chosen || alreadyBooked) {
    chosen = await pickAvailableTable(partySize, experience, date, time);
  }

  if (!chosen) {
    return NextResponse.json(
      {
        success: false,
        error: `No tables available for ${partySize} guests at ${time} on ${date}.`,
      },
      { status: 409 }
    );
  }

  try {
    const reservation = await createReservation({
      date,
      time,
      partySize,
      experience,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
      preferences,
      tableNumber: Number(chosen.number),
      status: "confirmed",
    });

    return NextResponse.json({ success: true, data: reservation });
  } catch (e: any) {
    console.error("reservation POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not complete the reservation." },
      { status: 500 }
    );
  }
}