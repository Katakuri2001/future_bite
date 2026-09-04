import { NextRequest, NextResponse } from "next/server";

let reservations: Record<string, any> = {};
let resCounter = 1;

// Seed initial data
const seedData = [
  { customerName: "Sarah Chen", date: "2026-09-04", time: "19:30", partySize: 2, tableNumber: 1 },
  { customerName: "James Patel", date: "2026-09-04", time: "20:00", partySize: 4, tableNumber: 4 },
  { customerName: "Lin Wei", date: "2026-09-05", time: "19:00", partySize: 6, tableNumber: 5 },
];

seedData.forEach((s) => {
  const id = `res-${resCounter++}`;
  reservations[id] = {
    id,
    confirmationCode: `FB-2026-${String(resCounter).padStart(4, "0")}`,
    customerName: s.customerName,
    customerEmail: `${s.customerName.toLowerCase().replace(" ", "")}@email.com`,
    customerPhone: "+95 9 000 000 000",
    date: s.date,
    time: s.time,
    partySize: s.partySize,
    tableNumber: s.tableNumber,
    experience: "main",
    specialRequests: "",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
});

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

  const available = tables.filter((t) => t.status === "available" && t.capacity >= guests);

  return NextResponse.json({ date, time, guests, availableTables: available, total: available.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, time, partySize, experience, name, email, phone, specialRequests } = body;

  const confirmationCode = `FB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
  const id = `res-${Date.now()}`;

  const reservation = {
    id,
    confirmationCode,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    date,
    time,
    partySize,
    tableNumber: Math.floor(Math.random() * 10) + 1,
    experience,
    specialRequests,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  reservations[id] = reservation;

  return NextResponse.json({ success: true, data: reservation });
}
