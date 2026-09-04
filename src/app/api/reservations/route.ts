import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, generateToken } from "@/lib/mock-db";

const experienceTableMap: Record<string, { number: number; capacity: number }[]> = {
  window: [
    { number: 1, capacity: 2 },
    { number: 2, capacity: 2 },
    { number: 3, capacity: 4 },
  ],
  bar: [
    { number: 7, capacity: 2 },
    { number: 8, capacity: 2 },
  ],
  private: [
    { number: 9, capacity: 10 },
    { number: 10, capacity: 12 },
  ],
  main: [
    { number: 4, capacity: 4 },
    { number: 5, capacity: 6 },
    { number: 6, capacity: 8 },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const guests = parseInt(searchParams.get("guests") || "2");

  const tables = [
    { number: 1, capacity: 2, experience: "window", status: "available" },
    { number: 2, capacity: 2, experience: "window", status: "available" },
    { number: 3, capacity: 4, experience: "window", status: "reserved" },
    { number: 4, capacity: 4, experience: "main", status: "available" },
    { number: 5, capacity: 6, experience: "main", status: "available" },
    { number: 6, capacity: 8, experience: "main", status: "reserved" },
    { number: 7, capacity: 2, experience: "bar", status: "available" },
    { number: 8, capacity: 2, experience: "bar", status: "seated" },
    { number: 9, capacity: 10, experience: "private", status: "available" },
    { number: 10, capacity: 12, experience: "private", status: "reserved" },
  ];

  const available = tables.filter(
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
  } = body;

  if (!date || !time || !partySize) {
    return NextResponse.json(
      { success: false, error: "Date, time and party size are required" },
      { status: 400 }
    );
  }

  const db = await readDB();
  const confirmationCode = `FB-${new Date().getFullYear()}-${String(db.resCounter++).padStart(4, "0")}`;
  const id = `res-${generateToken().slice(0, 8)}`;

  const experienceCandidates = experienceTableMap[experience as string] || experienceTableMap.main;
  const table = experienceCandidates
    .filter((t) => t.capacity >= partySize)
    .sort((a, b) => a.capacity - b.capacity)[0] || { number: Math.floor(Math.random() * 10) + 1, capacity: partySize };

  const reservation = {
    id,
    confirmationCode,
    customerName: customerName || name || "Guest",
    customerEmail: customerEmail || email || "",
    customerPhone: customerPhone || phone || "",
    date,
    time,
    partySize,
    tableNumber: table.number,
    experience: experience || "main",
    specialRequests: specialRequests || "",
    preferences: preferences || [],
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  db.reservations[id] = reservation;
  await writeDB(db);

  return NextResponse.json({ success: true, data: reservation });
}