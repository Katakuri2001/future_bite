import { NextResponse } from "next/server";

export async function GET() {
  const reservations = [
    { id: "res-001", confirmationCode: "FB-2026-0001", customerName: "Sarah Chen", customerEmail: "sarah@email.com", customerPhone: "+95 9 111 111 111", date: "2026-09-04", time: "19:30", partySize: 2, tableNumber: 1, experience: "window", status: "confirmed" },
    { id: "res-002", confirmationCode: "FB-2026-0002", customerName: "James Patel", customerEmail: "james@email.com", customerPhone: "+95 9 222 222 222", date: "2026-09-04", time: "20:00", partySize: 4, tableNumber: 4, experience: "main", status: "confirmed" },
    { id: "res-003", confirmationCode: "FB-2026-0003", customerName: "Lin Wei", customerEmail: "lin@email.com", customerPhone: "+95 9 333 333 333", date: "2026-09-05", time: "19:00", partySize: 6, tableNumber: 5, experience: "main", status: "confirmed" },
  ];

  return NextResponse.json({ success: true, data: reservations });
}
